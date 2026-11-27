// Đọc ảnh từ thư mục Google Drive bằng API key.
// Thư mục (và ảnh bên trong) phải được chia sẻ "Bất kỳ ai có đường liên kết đều xem được",
// vì API key không đăng nhập bằng tài khoản nào cả.
// Khoá đặt trong biến môi trường GOOGLE_API_KEY (Google Cloud → bật Google Drive API → tạo API key).

const DRIVE_API = "https://www.googleapis.com/drive/v3/files";
const ID_PATTERN = /^[A-Za-z0-9_-]{10,200}$/;
const MAX_FILES = 300;

export class DriveError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function getDriveApiKey() {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    return null;
  }
  return key;
}

export function isValidDriveId(id) {
  return typeof id === "string" && ID_PATTERN.test(id);
}

// Lấy ID từ link Drive. Trả về { type: "folder" | "file", id } hoặc null nếu không phải link Drive.
//   https://drive.google.com/drive/folders/<id>?usp=sharing
//   https://drive.google.com/drive/u/0/folders/<id>
//   https://drive.google.com/file/d/<id>/view
//   https://drive.google.com/open?id=<id>
export function parseDriveUrl(text) {
  if (typeof text !== "string") {
    return null;
  }

  let url;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }
  if (url.hostname !== "drive.google.com" && url.hostname !== "docs.google.com") {
    return null;
  }

  const folderMatch = url.pathname.match(/\/folders\/([^/?#]+)/);
  if (folderMatch && isValidDriveId(folderMatch[1])) {
    return { type: "folder", id: folderMatch[1] };
  }

  const fileMatch = url.pathname.match(/\/file\/d\/([^/?#]+)/);
  if (fileMatch && isValidDriveId(fileMatch[1])) {
    return { type: "file", id: fileMatch[1] };
  }

  const idParam = url.searchParams.get("id");
  if (idParam && isValidDriveId(idParam)) {
    // Link dạng open?id=... không cho biết là thư mục hay file, hỏi API sau
    return { type: "unknown", id: idParam };
  }

  return null;
}

async function callDrive(path, params) {
  const key = getDriveApiKey();
  if (!key) {
    throw new DriveError("DRIVE_NOT_CONFIGURED", "Chưa cấu hình GOOGLE_API_KEY", 503);
  }

  const search = new URLSearchParams(params);
  search.set("key", key);
  search.set("supportsAllDrives", "true");

  const response = await fetch(DRIVE_API + path + "?" + search.toString());
  if (response.status === 403 || response.status === 404) {
    throw new DriveError(
      "DRIVE_NOT_ACCESSIBLE",
      "Không mở được trên Google Drive. Kiểm tra link và quyền chia sẻ \"Bất kỳ ai có đường liên kết\".",
      400,
    );
  }
  if (!response.ok) {
    throw new DriveError("DRIVE_FAILED", "Google Drive lỗi (" + response.status + ")", 502);
  }
  return response;
}

const FILE_FIELDS = "id,name,mimeType,size,thumbnailLink";

function toImageItem(file) {
  // thumbnailLink mặc định nhỏ (=s220), xin bản to hơn cho dễ chọn
  let thumbnail = "https://drive.google.com/thumbnail?id=" + file.id + "&sz=w400";
  if (file.thumbnailLink) {
    thumbnail = file.thumbnailLink.replace(/=s\d+$/, "=s400");
  }
  return {
    id: file.id,
    name: file.name,
    size: Number(file.size) || null,
    thumbnail: thumbnail,
  };
}

async function getFile(id) {
  const response = await callDrive("/" + id, { fields: FILE_FIELDS });
  return response.json();
}

// Danh sách ảnh trong thư mục (hoặc 1 ảnh nếu link là file), sắp theo tên
export async function listDriveImages(link) {
  const parsed = parseDriveUrl(link);
  if (!parsed) {
    throw new DriveError("DRIVE_LINK_INVALID", "Link Google Drive không hợp lệ", 400);
  }

  // Luôn hỏi thông tin thư mục/file trước: thư mục không có quyền xem thì lệnh liệt kê
  // bên dưới vẫn trả về danh sách rỗng (không báo lỗi), admin sẽ tưởng thư mục trống.
  // Hỏi trực tiếp thì Google trả 404 → báo đúng lỗi "không mở được".
  const file = await getFile(parsed.id);
  if (file.mimeType !== "application/vnd.google-apps.folder") {
    // Link 1 ảnh lẻ thì trả về đúng ảnh đó
    if (file.mimeType && file.mimeType.startsWith("image/")) {
      return [toImageItem(file)];
    }
    throw new DriveError("DRIVE_FILE_NOT_IMAGE", "Link không phải thư mục ảnh hay file ảnh", 400);
  }
  return listFolderImages(file.id);
}

// Danh sách ảnh trong 1 thư mục đã biết ID (đã chắc chắn truy cập được)
export async function listFolderImages(folderId) {
  const images = [];
  let pageToken = "";
  do {
    const params = {
      q: "'" + folderId + "' in parents and mimeType contains 'image/' and trashed = false",
      fields: "nextPageToken,files(" + FILE_FIELDS + ")",
      orderBy: "name_natural",
      pageSize: "200",
      includeItemsFromAllDrives: "true",
    };
    if (pageToken) {
      params.pageToken = pageToken;
    }
    const response = await callDrive("", params);
    const data = await response.json();
    for (const file of data.files || []) {
      images.push(toImageItem(file));
    }
    pageToken = data.nextPageToken || "";
  } while (pageToken && images.length < MAX_FILES);

  return images.slice(0, MAX_FILES);
}

const FOLDER_MIME = "application/vnd.google-apps.folder";
const PARENTS_PER_QUERY = 30;

// Thư mục con của nhiều thư mục cha cùng lúc (gom nhiều cha vào 1 truy vấn cho đỡ tốn lượt gọi API).
// Trả về [{ id, name, parentId }]
export async function listChildFolders(parentIds) {
  const folders = [];
  for (let i = 0; i < parentIds.length; i += PARENTS_PER_QUERY) {
    const chunk = parentIds.slice(i, i + PARENTS_PER_QUERY);
    const parentQuery = chunk.map((id) => "'" + id + "' in parents").join(" or ");
    let pageToken = "";
    do {
      const params = {
        q: "(" + parentQuery + ") and mimeType = '" + FOLDER_MIME + "' and trashed = false",
        fields: "nextPageToken,files(id,name,parents)",
        pageSize: "1000",
        includeItemsFromAllDrives: "true",
      };
      if (pageToken) {
        params.pageToken = pageToken;
      }
      const response = await callDrive("", params);
      const data = await response.json();
      for (const file of data.files || []) {
        let parentId = null;
        if (Array.isArray(file.parents)) {
          parentId = file.parents.find((id) => chunk.includes(id)) || file.parents[0];
        }
        folders.push({ id: file.id, name: file.name, parentId: parentId });
      }
      pageToken = data.nextPageToken || "";
    } while (pageToken);
  }
  return folders;
}

// Kiểm tra thư mục gốc có mở được không (thư mục không có quyền xem thì liệt kê con vẫn ra rỗng)
export async function checkFolderAccessible(folderId) {
  const file = await getFile(folderId);
  if (file.mimeType !== FOLDER_MIME) {
    throw new DriveError("DRIVE_LINK_INVALID", "Link không phải thư mục Google Drive", 400);
  }
  return file;
}

export function folderUrl(folderId) {
  return "https://drive.google.com/drive/folders/" + folderId;
}

const MAX_DOWNLOAD_SIZE = 25 * 1024 * 1024;

// Tải nội dung 1 ảnh về server. Trả về { buffer, mimeType, name }.
export async function downloadDriveImage(id) {
  if (!isValidDriveId(id)) {
    throw new DriveError("DRIVE_LINK_INVALID", "ID ảnh không hợp lệ", 400);
  }

  const file = await getFile(id);
  if (!file.mimeType || !file.mimeType.startsWith("image/")) {
    throw new DriveError("DRIVE_FILE_NOT_IMAGE", "File này không phải ảnh", 400);
  }
  if (Number(file.size) > MAX_DOWNLOAD_SIZE) {
    throw new DriveError("DRIVE_FILE_TOO_LARGE", "Ảnh quá lớn (tối đa 25MB)", 400);
  }

  const response = await callDrive("/" + id, { alt: "media" });
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_DOWNLOAD_SIZE) {
    throw new DriveError("DRIVE_FILE_TOO_LARGE", "Ảnh quá lớn (tối đa 25MB)", 400);
  }

  return { buffer: buffer, mimeType: file.mimeType, name: file.name };
}
