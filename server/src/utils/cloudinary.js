import crypto from "node:crypto";
import Building from "../models/Building.js";
import Room from "../models/Room.js";

export const UPLOAD_FOLDER = "saigon-stay";

export function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }
  return { cloudName: cloudName, apiKey: apiKey, apiSecret: apiSecret };
}

// Cách ký của Cloudinary: xếp tham số theo thứ tự a-z, nối dạng key=value bằng &,
// thêm API secret vào cuối rồi băm SHA-1
export function signParams(params, apiSecret) {
  const keys = Object.keys(params).sort();
  const parts = [];
  for (const key of keys) {
    parts.push(key + "=" + params[key]);
  }
  return crypto
    .createHash("sha1")
    .update(parts.join("&") + apiSecret)
    .digest("hex");
}

// Lấy public_id từ link ảnh, ví dụ:
// https://res.cloudinary.com/<cloud>/image/upload/v1712345678/saigon-stay/abc123.jpg → "saigon-stay/abc123"
// Trả về null nếu không phải ảnh do mình upload (khác cloud, khác thư mục, link ngoài...)
export function getPublicIdFromUrl(url, cloudName) {
  if (typeof url !== "string") {
    return null;
  }

  const prefix = "https://res.cloudinary.com/" + cloudName + "/image/upload/";
  if (!url.startsWith(prefix)) {
    return null;
  }

  // Phần còn lại: "v1712345678/saigon-stay/abc123.jpg"
  let rest = url.slice(prefix.length);

  // Bỏ số phiên bản "v123.../" ở đầu nếu có
  const versionMatch = rest.match(/^v\d+\//);
  if (versionMatch) {
    rest = rest.slice(versionMatch[0].length);
  }

  // Chỉ xoá ảnh nằm trong thư mục của project này
  if (!rest.startsWith(UPLOAD_FOLDER + "/")) {
    return null;
  }

  // Bỏ đuôi file (.jpg, .png...)
  const dotIndex = rest.lastIndexOf(".");
  if (dotIndex === -1) {
    return null;
  }
  return rest.slice(0, dotIndex);
}

async function destroyImage(publicId, config) {
  const params = {
    invalidate: "true", // xoá luôn bản cache trên CDN
    public_id: publicId,
    timestamp: Math.floor(Date.now() / 1000),
  };
  const signature = signParams(params, config.apiSecret);

  const body = new URLSearchParams();
  body.append("public_id", params.public_id);
  body.append("invalidate", params.invalidate);
  body.append("timestamp", String(params.timestamp));
  body.append("api_key", config.apiKey);
  body.append("signature", signature);

  const url =
    "https://api.cloudinary.com/v1_1/" + config.cloudName + "/image/destroy";
  const response = await fetch(url, { method: "POST", body: body });
  const data = await response.json();

  // Cloudinary trả về { result: "ok" } hoặc { result: "not found" } (đã xoá trước đó)
  if (data.result !== "ok" && data.result !== "not found") {
    throw new Error("Cloudinary destroy lỗi: " + JSON.stringify(data));
  }
}

// Xoá các ảnh không còn tòa nhà / phòng nào dùng.
// Chỉ ghi log khi lỗi, không ném lỗi ra ngoài: xoá ảnh thất bại không được làm hỏng việc lưu dữ liệu.
export async function deleteUnusedImages(urls) {
  const config = getCloudinaryConfig();
  if (!config || !Array.isArray(urls) || urls.length === 0) {
    return 0;
  }

  let deletedCount = 0;

  for (const url of urls) {
    const publicId = getPublicIdFromUrl(url, config.cloudName);
    if (!publicId) {
      continue;
    }

    // Ảnh vẫn đang được dùng ở chỗ khác thì giữ lại
    const usedByBuilding = await Building.exists({ images: url });
    const usedByRoom = await Room.exists({ images: url });
    if (usedByBuilding || usedByRoom) {
      continue;
    }

    try {
      await destroyImage(publicId, config);
      deletedCount = deletedCount + 1;
    } catch (err) {
      console.error("Không xoá được ảnh " + publicId + ":", err.message);
    }
  }

  return deletedCount;
}

// Trả về các link có trong oldImages nhưng không còn trong newImages
export function findRemovedImages(oldImages, newImages) {
  const removed = [];
  if (!Array.isArray(oldImages)) {
    return removed;
  }
  for (const url of oldImages) {
    if (!newImages.includes(url)) {
      removed.push(url);
    }
  }
  return removed;
}

// Thu nhỏ ảnh ngay lúc upload (ảnh điện thoại thường 4000px, vài MB) và đổi sang JPG
// (ảnh HEIC của iPhone trình duyệt không hiện được).
const SERVER_UPLOAD_TRANSFORMATION = "c_limit,w_1920,h_1920,q_auto:good";

// Upload ảnh từ server lên Cloudinary (dùng khi lấy ảnh từ Google Drive).
// Trả về link ảnh https.
export async function uploadImageBuffer(buffer, mimeType) {
  const config = getCloudinaryConfig();
  if (!config) {
    const error = new Error("Chưa cấu hình Cloudinary");
    error.code = "UPLOAD_NOT_CONFIGURED";
    throw error;
  }

  const params = {
    folder: UPLOAD_FOLDER,
    format: "jpg",
    timestamp: Math.floor(Date.now() / 1000),
    transformation: SERVER_UPLOAD_TRANSFORMATION,
  };
  const signature = signParams(params, config.apiSecret);

  const body = new FormData();
  body.append("file", new Blob([buffer], { type: mimeType }));
  for (const key of Object.keys(params)) {
    body.append(key, String(params[key]));
  }
  body.append("api_key", config.apiKey);
  body.append("signature", signature);

  const url = "https://api.cloudinary.com/v1_1/" + config.cloudName + "/image/upload";
  const response = await fetch(url, { method: "POST", body: body });
  const data = await response.json();
  if (!response.ok || !data.secure_url) {
    const error = new Error("Cloudinary upload lỗi: " + JSON.stringify(data.error || data));
    error.code = "UPLOAD_FAILED";
    throw error;
  }
  return data.secure_url;
}
