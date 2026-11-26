import {
  UPLOAD_FOLDER,
  getCloudinaryConfig,
  signParams,
  deleteUnusedImages,
} from "../utils/cloudinary.js";

const MAX_CLEANUP_URLS = 50;

function sendNotConfigured(res) {
  return res.status(503).json({
    code: "UPLOAD_NOT_CONFIGURED",
    message: "Chưa cấu hình Cloudinary",
  });
}

// POST /api/admin/uploads/signature
// Trình duyệt upload ảnh thẳng lên Cloudinary (không đi qua server, đỡ tốn băng thông Render).
// Server chỉ ký tên để Cloudinary biết request này được admin cho phép.
// API secret chỉ nằm ở server, không bao giờ gửi xuống trình duyệt.
export async function createUploadSignature(req, res) {
  const config = getCloudinaryConfig();
  if (!config) {
    return sendNotConfigured(res);
  }

  // Cloudinary chỉ chấp nhận chữ ký trong khoảng 1 giờ kể từ timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams(
    { folder: UPLOAD_FOLDER, timestamp: timestamp },
    config.apiSecret,
  );

  res.json({
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    folder: UPLOAD_FOLDER,
    timestamp: timestamp,
    signature: signature,
  });
}

// POST /api/admin/uploads/cleanup  body: { urls: [...] }
// Xoá các ảnh đã upload nhưng không được lưu (bấm Huỷ, hoặc upload rồi bỏ đi trước khi lưu).
// An toàn: chỉ xoá ảnh trong thư mục của mình và không còn tòa nhà / phòng nào dùng.
export async function cleanupUploads(req, res) {
  let urls = [];
  if (req.body && Array.isArray(req.body.urls)) {
    urls = req.body.urls;
  }

  if (urls.length > MAX_CLEANUP_URLS) {
    return res
      .status(400)
      .json({ code: "IMAGES_INVALID", message: "Quá nhiều ảnh" });
  }

  if (!getCloudinaryConfig()) {
    return sendNotConfigured(res);
  }

  const deleted = await deleteUnusedImages(urls);
  res.json({ deleted: deleted });
}
