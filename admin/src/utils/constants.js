// Danh sách mã dùng chung cho bộ lọc và form admin.
// Phải khớp với enum trong các model ở server.

export const AREAS = [
  "Quận 1",
  "Quận 3",
  "Quận 7",
  "Bình Thạnh",
  "Phú Nhuận",
  "Thủ Đức",
];

export const LAYOUTS = ["studio", "duplex", "1br", "2br"];
export const WINDOWS = ["balcony", "outside", "hallway", "none"];
export const FURNITURES = ["full", "basic", "empty"];
export const ROOM_STATUSES = ["available", "upcoming", "rented", "hidden"];

export const ROAD_TYPES = ["street_front", "car_alley", "motorbike_alley"];
export const PARKING_TYPES = ["basement", "garage", "none"];
export const FEE_KEYS = [
  "electricity",
  "water",
  "wifi",
  "trash",
  "parking",
  "management",
];
export const FEE_UNITS = ["kwh", "m3", "person", "room", "vehicle", "month"];

export const INQUIRY_STATUSES = ["new", "contacted", "viewed", "closed"];

export const USER_ROLES = ["guest", "sale", "admin"];
