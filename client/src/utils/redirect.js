// Chỉ cho chuyển tới đường dẫn trong web mình (bắt đầu bằng "/" nhưng không phải "//"),
// tránh bị lợi dụng ?redirect=https://trang-gia-mao.com
export function getSafeRedirect(value) {
  if (!value) {
    return "";
  }
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "";
}
