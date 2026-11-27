// Dò cây thư mục ảnh trên Google Drive để tự tìm thư mục ảnh của từng phòng.
//
// Cấu trúc thư mục (thư mục gốc đặt trong biến GOOGLE_DRIVE_ROOT, là link thư mục "HÌNH ẢNH DỰ ÁN"):
//   HÌNH ẢNH DỰ ÁN / QUẬN 1 / Bến Thành / 89_6.CMT8.Q1 / 101 / *.jpg
//                    quận     phường      mã dự án        phòng (khớp cột LINK HÌNH ẢNH hoặc mã phòng)
// Tên thư mục dự án là mã dự án, dấu "/" được thay bằng "_" (vì 89/6 → 89_6).
// Không ép đúng số tầng: thư mục dự án được nhận ra theo tên, phường là thư mục cha của nó.

import {
  DriveError,
  parseDriveUrl,
  isValidDriveId,
  listChildFolders,
  checkFolderAccessible,
} from "./googleDrive.js";

const MAX_DEPTH = 5;
const CACHE_MS = 10 * 60 * 1000;

// ===== So khớp tên (hàm thuần, có test) =====

function baseKey(text) {
  return String(text).normalize("NFC").toUpperCase().replace(/\s+/g, "");
}

// "89/6.CMT8.Q1" và thư mục "89_6.CMT8.Q1" → cùng 1 khoá
export function projectKey(text) {
  return baseKey(text).replace(/\//g, "_");
}

// "101, 201" và "101,201" → cùng 1 khoá
export function roomFolderKey(text) {
  return baseKey(text);
}

// Các mã phòng có trong tên thư mục: "202,302,402,502.602" → ["202","302","402","502","602"]
export function codesInFolderName(name) {
  return String(name)
    .normalize("NFC")
    .toUpperCase()
    .split(/[,.;\s]+/)
    .filter((part) => part !== "");
}

// Tìm thư mục ảnh của 1 phòng trong các thư mục con của thư mục dự án.
// Ưu tiên: đúng tên ghi ở cột LINK HÌNH ẢNH → tên thư mục có chứa mã phòng → chỉ có 1 thư mục thì lấy luôn.
export function findRoomFolder(roomFolders, roomCode, imageRef) {
  if (!roomFolders || roomFolders.length === 0) {
    return null;
  }

  if (imageRef) {
    const wanted = roomFolderKey(imageRef);
    const exact = roomFolders.find((folder) => roomFolderKey(folder.name) === wanted);
    if (exact) {
      return exact;
    }
  }

  const code = String(roomCode).normalize("NFC").toUpperCase();
  const byCode = roomFolders.find((folder) => codesInFolderName(folder.name).includes(code));
  if (byCode) {
    return byCode;
  }

  return null;
}

// "Bến Thành" → "Phường Bến Thành" (giữ nguyên nếu đã có chữ Phường / P.)
export function toWardName(folderName) {
  const name = String(folderName).normalize("NFC").trim();
  if (/^phường\s/i.test(name)) {
    return name;
  }
  if (/^p\.\s*/i.test(name)) {
    return name.replace(/^p\.\s*/i, "Phường ");
  }
  return "Phường " + name;
}

// Từ danh sách mọi thư mục (đã dò), dựng bảng tra cứu theo mã dự án.
// folders: [{ id, name, parentId, depth }], depth 1 = con trực tiếp của thư mục gốc.
// Trả về Map(projectKey → { id, name, path, ward, rooms: [{ id, name }] })
export function buildProjectMap(folders, projectCodes) {
  const byId = new Map();
  for (const folder of folders) {
    byId.set(folder.id, folder);
  }

  const wantedKeys = new Set(projectCodes.map((code) => projectKey(code)));
  const projects = new Map();

  for (const folder of folders) {
    const key = projectKey(folder.name);
    if (!wantedKeys.has(key) || projects.has(key)) {
      continue;
    }

    // Đường dẫn từ thư mục gốc xuống, vd ["QUẬN 1", "Bến Thành", "89_6.CMT8.Q1"]
    const path = [];
    let current = folder;
    while (current) {
      path.unshift(current.name);
      current = byId.get(current.parentId);
    }

    // Phường = thư mục cha, nếu thư mục cha không phải là thư mục quận (tầng 1)
    let ward = null;
    const parent = byId.get(folder.parentId);
    if (parent && parent.depth >= 2) {
      ward = toWardName(parent.name);
    }

    const rooms = folders
      .filter((child) => child.parentId === folder.id)
      .map((child) => ({ id: child.id, name: child.name }));

    projects.set(key, { id: folder.id, name: folder.name, path: path, ward: ward, rooms: rooms });
  }

  return projects;
}

// ===== Dò Drive =====

export function getDriveRootId() {
  const value = process.env.GOOGLE_DRIVE_ROOT;
  if (!value) {
    return null;
  }
  if (isValidDriveId(value.trim())) {
    return value.trim();
  }
  const parsed = parseDriveUrl(value);
  if (parsed) {
    return parsed.id;
  }
  return null;
}

let cache = null;

// Dò toàn bộ cây thư mục (chỉ thư mục, không lấy ảnh). Mỗi tầng chỉ tốn vài lượt gọi API.
// Kết quả nhớ 10 phút, force = true để dò lại (vd lúc nhập Excel).
export async function crawlDriveFolders(force) {
  const rootId = getDriveRootId();
  if (!rootId) {
    throw new DriveError("DRIVE_ROOT_NOT_CONFIGURED", "Chưa cấu hình GOOGLE_DRIVE_ROOT", 503);
  }

  if (!force && cache && cache.rootId === rootId && Date.now() - cache.time < CACHE_MS) {
    return cache.folders;
  }

  await checkFolderAccessible(rootId);

  const folders = [];
  let parentIds = [rootId];
  for (let depth = 1; depth <= MAX_DEPTH && parentIds.length > 0; depth++) {
    const children = await listChildFolders(parentIds);
    for (const child of children) {
      folders.push({ ...child, depth: depth });
    }
    parentIds = children.map((child) => child.id);
  }

  cache = { rootId: rootId, time: Date.now(), folders: folders };
  return folders;
}

export async function getProjectMap(projectCodes, force) {
  const folders = await crawlDriveFolders(force);
  return buildProjectMap(folders, projectCodes);
}

export function isDriveIndexConfigured() {
  return Boolean(process.env.GOOGLE_API_KEY && getDriveRootId());
}
