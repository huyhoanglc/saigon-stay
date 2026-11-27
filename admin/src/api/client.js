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

// ===== Admin =====

export async function getAdminStats() {
  const response = await api.get("/admin/stats");
  return response.data;
}

// Toàn bộ tòa nhà (dùng cho ô chọn tòa nhà)
export async function getAdminBuildings() {
  const response = await api.get("/admin/buildings");
  return response.data.items;
}

// Danh sách tòa nhà có lọc + phân trang. params: { q, area, roadType, needsInfo, page }
// Trả về { items, total, page, totalPages, areas }
export async function getAdminBuildingPage(params) {
  const response = await api.get("/admin/buildings", { params: params });
  return response.data;
}

export async function getAdminBuilding(id) {
  const response = await api.get("/admin/buildings/" + id);
  return response.data;
}

export async function createBuilding(data) {
  const response = await api.post("/admin/buildings", data);
  return response.data;
}

export async function updateBuilding(id, data) {
  const response = await api.put("/admin/buildings/" + id, data);
  return response.data;
}

// withRooms = true: xoá luôn mọi phòng của tòa (chỉ gọi sau khi admin đã xác nhận)
export async function deleteBuilding(id, withRooms) {
  let url = "/admin/buildings/" + id;
  if (withRooms) {
    url = url + "?withRooms=1";
  }
  const response = await api.delete(url);
  return response.data;
}

export async function getAdminRooms(params) {
  const response = await api.get("/admin/rooms", { params: params });
  return response.data;
}

export async function getAdminRoom(id) {
  const response = await api.get("/admin/rooms/" + id);
  return response.data;
}

export async function createRoom(data) {
  const response = await api.post("/admin/rooms", data);
  return response.data;
}

export async function updateRoom(id, data) {
  const response = await api.put("/admin/rooms/" + id, data);
  return response.data;
}

// Đổi nhanh trạng thái hoặc Hot, ví dụ: patchRoom(id, { isHot: true })
export async function patchRoom(id, changes) {
  const response = await api.patch("/admin/rooms/" + id, changes);
  return response.data;
}

export async function deleteRoom(id) {
  const response = await api.delete("/admin/rooms/" + id);
  return response.data;
}

export async function getAdminInquiries(params) {
  const response = await api.get("/admin/inquiries", { params: params });
  return response.data;
}

export async function updateInquiryStatus(id, status) {
  const response = await api.patch("/admin/inquiries/" + id, {
    status: status,
  });
  return response.data;
}

export async function getAdminUsers(params) {
  const response = await api.get("/admin/users", { params: params });
  return response.data;
}

// Đổi vai trò hoặc khoá/mở khoá, ví dụ: updateUser(id, { role: "sale" })
export async function updateUser(id, changes) {
  const response = await api.patch("/admin/users/" + id, changes);
  return response.data.user;
}

// Nhờ server xoá các ảnh đã upload nhưng không được lưu
export async function cleanupUploads(urls) {
  const response = await api.post("/admin/uploads/cleanup", { urls: urls });
  return response.data;
}

// ===== Lấy ảnh từ Google Drive =====

// Danh sách ảnh trong thư mục Drive: [{ id, name, size, thumbnail }]
export async function listDriveImages(link) {
  const response = await api.get("/admin/drive/images", { params: { link: link } });
  return response.data.images;
}

// Server tự tìm thư mục ảnh của phòng (Quận / Phường / Mã dự án / Phòng).
// Trả về { images, folder: { path, url } }
export async function listRoomDriveImages(roomId) {
  const response = await api.get("/admin/drive/rooms/" + roomId + "/images");
  return response.data;
}

// Server tải 1 ảnh từ Drive lên Cloudinary, trả về link ảnh
export async function importDriveImage(id) {
  const response = await api.post("/admin/drive/images/" + encodeURIComponent(id) + "/import");
  return response.data.url;
}

// ===== Nhập Excel rổ hàng =====

// Gửi nguyên file .xlsx lên server.
// commit = false: chỉ kiểm tra + xem trước. commit = true: ghi vào dữ liệu.
export async function importRoHang(file, commit) {
  let url = "/admin/import/rohang";
  if (commit) {
    url = url + "?commit=1";
  }
  const response = await api.post(url, file, {
    headers: { "Content-Type": "application/octet-stream" },
  });
  return response.data;
}

// ===== Upload ảnh lên Cloudinary =====

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // Gói free của Cloudinary giới hạn 10MB/ảnh

// Trả về link ảnh (https) sau khi upload xong
export async function uploadImage(file) {
  if (!file.type.startsWith("image/")) {
    throw { code: "FILE_NOT_IMAGE" };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw { code: "FILE_TOO_LARGE" };
  }

  // Bước 1: xin chữ ký từ server (chỉ admin mới xin được)
  const signResponse = await api.post("/admin/uploads/signature");
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
