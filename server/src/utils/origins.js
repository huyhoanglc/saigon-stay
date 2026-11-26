// Danh sách domain frontend được phép gọi API và được dùng làm địa chỉ quay về sau khi đăng nhập Google/Zalo.
// localhost:5173 = web khách, localhost:5174 = web admin (lúc dev).
// Production khai báo trong CLIENT_URL, nhiều domain cách nhau bằng dấu phẩy.
export function getAllowedOrigins() {
  const origins = ["http://localhost:5173", "http://localhost:5174"];

  if (process.env.CLIENT_URL) {
    const urls = process.env.CLIENT_URL.split(",");
    for (const url of urls) {
      const trimmed = url.trim();
      if (trimmed !== "") {
        origins.push(trimmed);
      }
    }
  }

  return origins;
}

export function isAllowedOrigin(origin) {
  return getAllowedOrigins().includes(origin);
}

// Domain mặc định khi không biết quay về đâu: domain đầu tiên trong CLIENT_URL
export function getDefaultOrigin() {
  const origins = getAllowedOrigins();
  if (origins.length > 2) {
    return origins[2];
  }
  return origins[0];
}
