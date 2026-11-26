export function formatPrice(value, lng) {
  return new Intl.NumberFormat(lng === "en" ? "en-US" : "vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value, lng) {
  return new Date(value).toLocaleDateString(lng === "en" ? "en-US" : "vi-VN");
}
export function formatShort(value) {
  if (value >= 1000000) return `${+(value / 1000000).toFixed(1)}tr`;
  if (value >= 1000) return `${+(value / 1000).toFixed(1)}k`;
  return String(value);
}
