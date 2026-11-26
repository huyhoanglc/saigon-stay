import axios from "axios";

let baseURL = "/api";
if (import.meta.env.VITE_API_URL) {
  baseURL = import.meta.env.VITE_API_URL;
}

const api = axios.create({
  baseURL: baseURL,
  // Gửi kèm cookie đăng nhập (access_token, refresh_token) trong mọi request
  withCredentials: true,
});

// Các API auth này tự xử lý 401, không được tự refresh (tránh lặp vô hạn)
const NO_REFRESH_URLS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
];

// Nhiều request cùng hết hạn một lúc thì chỉ gọi refresh 1 lần, các request còn lại chờ chung
let refreshPromise = null;

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api.post("/auth/refresh").finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Gom mọi lỗi về dạng { code, status } để component dùng t("errors." + code)
function toAppError(err) {
  const response = err.response;

  if (!response) {
    return { code: "NETWORK_ERROR", status: undefined };
  }

  let code = "UNKNOWN";
  if (response.data && response.data.code) {
    code = response.data.code;
  }
  return { code: code, status: response.status };
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const appError = toAppError(err);
    const original = err.config;

    // Access token hết hạn (15 phút): xin token mới bằng refresh token rồi gọi lại request cũ 1 lần
    let canRetry = false;
    if (appError.status === 401 && original && !original.retried) {
      canRetry = true;
      if (NO_REFRESH_URLS.includes(original.url)) {
        canRetry = false;
      }
    }

    if (canRetry) {
      original.retried = true;
      try {
        await refreshSession();
      } catch {
        // Refresh cũng thất bại → thật sự chưa đăng nhập
        return Promise.reject(appError);
      }
      return api(original);
    }

    return Promise.reject(appError);
  },
);

// ===== Phòng (công khai) =====

export async function getRooms(params) {
  const response = await api.get("/rooms", { params: params });
  return response.data;
}

export async function getRoom(id) {
  const response = await api.get("/rooms/" + id);
  return response.data;
}

export async function createInquiry(data) {
  const response = await api.post("/inquiries", data);
  return response.data;
}

// ===== Đăng nhập =====

export async function login(email, password) {
  const response = await api.post("/auth/login", {
    email: email,
    password: password,
  });
  return response.data.user;
}

export async function register(name, email, password) {
  const response = await api.post("/auth/register", {
    name: name,
    email: email,
    password: password,
  });
  return response.data.user;
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function getMe() {
  const response = await api.get("/auth/me");
  return response.data.user;
}

// Link bắt đầu đăng nhập bằng Google / Zalo (mở bằng thẻ <a>, không gọi bằng axios).
// mode: "login" (đăng nhập) hoặc "link" (liên kết thêm vào tài khoản đang đăng nhập).
// Server dùng origin để biết đăng nhập xong thì quay về web nào.
export function getOAuthStartUrl(provider, mode, redirect) {
  const params = new URLSearchParams({
    origin: window.location.origin,
    mode: mode,
    redirect: redirect,
  });
  return baseURL + "/auth/" + provider + "/start?" + params.toString();
}

// ===== Trang cá nhân =====

// Sửa tên, số điện thoại, ảnh đại diện. Ví dụ: updateProfile({ name: "An" })
export async function updateProfile(changes) {
  const response = await api.patch("/profile", changes);
  return response.data.user;
}

// Đổi mật khẩu (hoặc đặt lần đầu nếu tài khoản tạo bằng Google/Zalo)
export async function changePassword(currentPassword, newPassword) {
  const response = await api.post("/profile/password", {
    currentPassword: currentPassword,
    newPassword: newPassword,
  });
  return response.data.user;
}

// Gỡ liên kết Google hoặc Zalo
export async function unlinkProvider(provider) {
  const response = await api.delete("/profile/providers/" + provider);
  return response.data.user;
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

// Upload ảnh đại diện lên Cloudinary, trả về link ảnh
export async function uploadAvatar(file) {
  if (!file.type.startsWith("image/")) {
    throw { code: "FILE_NOT_IMAGE" };
  }
  if (file.size > MAX_AVATAR_SIZE) {
    throw { code: "AVATAR_TOO_LARGE" };
  }

  // Bước 1: xin chữ ký từ server
  const signResponse = await api.post("/profile/avatar-signature");
  const sign = signResponse.data;

  // Bước 2: gửi ảnh thẳng lên Cloudinary kèm chữ ký
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sign.apiKey);
  formData.append("timestamp", sign.timestamp);
  formData.append("folder", sign.folder);
  formData.append("signature", sign.signature);

  const uploadUrl =
    "https://api.cloudinary.com/v1_1/" + sign.cloudName + "/image/upload";

  try {
    // Dùng axios gốc (không phải api) để không gửi cookie của mình sang Cloudinary
    const response = await axios.post(uploadUrl, formData);
    return response.data.secure_url;
  } catch {
    throw { code: "UPLOAD_FAILED" };
  }
}
