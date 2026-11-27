import { readXlsx } from "../import/readXlsx.js";
import { parseRoHang } from "../import/roHang.js";
import { applyRoHang } from "../import/applyRoHang.js";
import { DriveError } from "../utils/googleDrive.js";
import {
  isDriveIndexConfigured,
  getProjectMap,
  projectKey,
  findRoomFolder,
} from "../utils/driveIndex.js";

// Đối chiếu với cây thư mục ảnh trên Drive (nếu đã cấu hình):
//   - lấy tên phường từ thư mục cha của thư mục dự án → project.driveWard
//   - cảnh báo dự án / phòng chưa có thư mục ảnh
async function matchDriveFolders(projects, issues) {
  if (!isDriveIndexConfigured() || projects.length === 0) {
    return { checked: false };
  }

  let projectMap;
  try {
    projectMap = await getProjectMap(projects.map((project) => project.projectCode), true);
  } catch (err) {
    if (!(err instanceof DriveError)) {
      throw err;
    }
    issues.push({ sheet: "GOOGLE DRIVE", row: null, column: null, level: "warning", message: "Không đọc được thư mục ảnh: " + err.message });
    return { checked: false };
  }

  for (const project of projects) {
    const folder = projectMap.get(projectKey(project.projectCode));
    if (!folder) {
      issues.push({ sheet: "DỰ ÁN", row: project.sourceRow, column: "MÃ DỰ ÁN", level: "warning", message: "Không thấy thư mục ảnh \"" + project.projectCode.replace(/\//g, "_") + "\" trên Drive" });
      continue;
    }
    project.driveWard = folder.ward;

    for (const group of project.rooms) {
      if (group.imageRef && /^https?:\/\//i.test(group.imageRef)) {
        continue;
      }
      const missing = group.roomCodes.filter((code) => !findRoomFolder(folder.rooms, code, group.imageRef));
      if (missing.length > 0) {
        issues.push({ sheet: "MÃ PHÒNG", row: group.sourceRow, column: "LINK HÌNH ẢNH", level: "warning", message: "Thư mục " + folder.name + " trên Drive chưa có ảnh cho phòng " + missing.join(", ") });
      }
    }
  }
  return { checked: true };
}

// POST /api/admin/import/rohang          → chỉ xem trước: đọc file, kiểm tra, đếm sẽ tạo/cập nhật bao nhiêu
// POST /api/admin/import/rohang?commit=1 → ghi thật vào DB
// Body là nội dung file .xlsx (Content-Type: application/octet-stream).
// Dòng lỗi bị bỏ qua, các dòng còn lại vẫn được nhập. Cảnh báo không chặn việc nhập.
export async function importRoHang(req, res) {
  const file = req.body;
  if (!Buffer.isBuffer(file) || file.length === 0) {
    return res.status(400).json({ code: "FILE_REQUIRED", message: "Chưa chọn file Excel" });
  }

  // File .xlsx thực chất là file zip, luôn bắt đầu bằng "PK"
  if (file[0] !== 0x50 || file[1] !== 0x4b) {
    return res.status(400).json({ code: "FILE_NOT_XLSX", message: "File không phải Excel (.xlsx)" });
  }

  let sheets;
  try {
    sheets = await readXlsx(file);
  } catch {
    return res.status(400).json({ code: "FILE_NOT_XLSX", message: "Không đọc được file Excel" });
  }

  const parsed = parseRoHang(sheets);
  const commit = req.query.commit === "1";

  let roomGroups = 0;
  let rooms = 0;
  for (const project of parsed.projects) {
    roomGroups = roomGroups + project.rooms.length;
    for (const group of project.rooms) {
      rooms = rooms + group.roomCodes.length;
    }
  }

  if (commit && parsed.projects.length === 0) {
    return res
      .status(400)
      .json({ code: "IMPORT_EMPTY", message: "Không có dự án hợp lệ nào để nhập", issues: parsed.issues });
  }

  const drive = await matchDriveFolders(parsed.projects, parsed.issues);
  const summary = await applyRoHang(parsed.projects, commit);

  res.json({
    committed: commit,
    totals: { projects: parsed.projects.length, roomGroups: roomGroups, rooms: rooms },
    summary: summary,
    driveChecked: drive.checked,
    issues: parsed.issues,
  });
}
