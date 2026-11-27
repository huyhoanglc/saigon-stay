import mongoose from "mongoose";
import Room from "../models/Room.js";
import Building from "../models/Building.js";
import {
  DriveError,
  listDriveImages,
  listFolderImages,
  downloadDriveImage,
  folderUrl,
} from "../utils/googleDrive.js";
import { getProjectMap, projectKey, findRoomFolder } from "../utils/driveIndex.js";
import { uploadImageBuffer } from "../utils/cloudinary.js";

function sendDriveError(res, err) {
  if (err instanceof DriveError) {
    return res.status(err.status).json({ code: err.code, message: err.message });
  }
  if (err.code === "UPLOAD_NOT_CONFIGURED") {
    return res.status(503).json({ code: err.code, message: err.message });
  }
  if (err.code === "UPLOAD_FAILED") {
    console.error(err.message);
    return res.status(502).json({ code: err.code, message: "Không upload được ảnh" });
  }
  throw err;
}

// GET /api/admin/drive/images?link=<link thư mục hoặc ảnh Google Drive>
// Trả về danh sách ảnh (kèm ảnh thu nhỏ) để admin chọn, chưa tải gì về.
export async function listImages(req, res) {
  try {
    const images = await listDriveImages(req.query.link);
    res.json({ images: images });
  } catch (err) {
    return sendDriveError(res, err);
  }
}

// GET /api/admin/drive/rooms/:id/images
// Tự tìm thư mục ảnh của phòng trên Drive theo cây Quận / Phường / Mã dự án / Phòng.
// Cột LINK HÌNH ẢNH là link Drive thì dùng thẳng link đó.
export async function listRoomImages(req, res) {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ code: "INVALID_ID", message: "ID không hợp lệ" });
  }

  const room = await Room.findById(id).select("building code +imageRef");
  if (!room) {
    return res.status(404).json({ code: "ROOM_NOT_FOUND", message: "Không tìm thấy phòng" });
  }

  try {
    if (room.imageRef && /^https?:\/\//i.test(room.imageRef)) {
      const images = await listDriveImages(room.imageRef);
      return res.json({ images: images, folder: { path: null, url: room.imageRef } });
    }

    const building = await Building.findById(room.building).select("projectCode");
    if (!building || !building.projectCode) {
      return res.status(404).json({
        code: "DRIVE_FOLDER_NOT_FOUND",
        message: "Tòa nhà này không có mã dự án nên không tự tìm được thư mục ảnh",
      });
    }

    const projects = await getProjectMap([building.projectCode], false);
    const project = projects.get(projectKey(building.projectCode));
    if (!project) {
      return res.status(404).json({
        code: "DRIVE_FOLDER_NOT_FOUND",
        message: "Không thấy thư mục dự án " + building.projectCode + " trên Drive",
      });
    }

    const roomFolder = findRoomFolder(project.rooms, room.code, room.imageRef);
    if (!roomFolder) {
      return res.status(404).json({
        code: "DRIVE_FOLDER_NOT_FOUND",
        message: "Thư mục dự án " + project.name + " không có thư mục cho phòng " + room.code,
        folder: { path: project.path.join(" / "), url: folderUrl(project.id) },
      });
    }

    const images = await listFolderImages(roomFolder.id);
    res.json({
      images: images,
      folder: { path: project.path.concat([roomFolder.name]).join(" / "), url: folderUrl(roomFolder.id) },
    });
  } catch (err) {
    return sendDriveError(res, err);
  }
}

// POST /api/admin/drive/images/:id/import
// Tải 1 ảnh từ Drive rồi đưa lên Cloudinary, trả về link ảnh để gắn vào form.
// Mỗi request 1 ảnh để không bị quá thời gian chờ khi thư mục có nhiều ảnh.
export async function importImage(req, res) {
  try {
    const file = await downloadDriveImage(req.params.id);
    const url = await uploadImageBuffer(file.buffer, file.mimeType);
    res.json({ url: url });
  } catch (err) {
    return sendDriveError(res, err);
  }
}
