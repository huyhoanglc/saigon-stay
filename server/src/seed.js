import mongoose from "mongoose";
import Building from "./models/Building.js";
import Room from "./models/Room.js";
import Inquiry from "./models/Inquiry.js";

// Tạo danh sách ảnh tạm cho 1 phòng
function gallery(name, count) {
  const images = [];
  for (let i = 1; i <= count; i++) {
    images.push("https://picsum.photos/seed/" + name + "-" + i + "/1200/900");
  }
  return images;
}

await mongoose.connect(process.env.MONGODB_URI);
console.log("✅ Đã kết nối MongoDB");

await Inquiry.deleteMany({});
await Room.deleteMany({});
await Building.deleteMany({});

const [dbp, ltt, td] = await Building.insertMany([
  {
    name: "Tòa Điện Biên Phủ",
    address: {
      houseNumber: "123/4",
      street: "Điện Biên Phủ",
      ward: "Phường Thạnh Mỹ Tây",
      area: "Bình Thạnh",
    },
    location: { coordinates: [106.713, 10.803] },
    roadType: "car_alley",
    floors: 6,
    hasElevator: true,
    parking: "garage",
    hasSecurity: true,
    hasFireSafety: true,
    petAllowed: true,
    cleaningPerWeek: 2,
    fees: {
      electricity: { pricing: "state" },
      water: { pricing: "fixed", amount: 100000, unit: "person" },
      wifi: { pricing: "fixed", amount: 100000, unit: "room" },
      parking: { pricing: "fixed", amount: 150000, unit: "vehicle" },
    },
    contact: { ownerName: "Chú Tâm", ownerPhone: "0900000001" },
  },
  {
    name: "Tòa Lê Thánh Tôn",
    address: {
      houseNumber: "56",
      street: "Lê Thánh Tôn",
      ward: "Phường Bến Thành",
      area: "Quận 1",
    },
    location: { coordinates: [106.699, 10.775] },
    roadType: "street_front",
    floors: 8,
    hasElevator: true,
    parking: "basement",
    hasSecurity: true,
    hasFireSafety: true,
    freeHours: false,
    fees: {
      electricity: { pricing: "fixed", amount: 3800, unit: "kwh" },
      water: { pricing: "fixed", amount: 30000, unit: "m3" },
      management: { pricing: "fixed", amount: 300000, unit: "room" },
      parking: { pricing: "fixed", amount: 200000, unit: "vehicle" },
    },
    contact: { managerName: "Anh Long", managerPhone: "0900000002" },
  },
  {
    name: "Tòa Thảo Điền",
    address: {
      houseNumber: "18",
      street: "Đường số 10",
      ward: "Phường An Khánh",
      area: "Thủ Đức",
    },
    location: { coordinates: [106.7325, 10.803] },
    roadType: "car_alley",
    isDeadEnd: true,
    floors: 5,
    hasElevator: true,
    parking: "garage",
    hasSecurity: true,
    hasFireSafety: true,
    petAllowed: true,
    cleaningPerWeek: 1,
    isNewOpening: true,
    fees: {
      electricity: { pricing: "fixed", amount: 4000, unit: "kwh" },
      water: { pricing: "fixed", amount: 100000, unit: "person" },
      wifi: { pricing: "fixed", amount: 100000, unit: "room" },
      trash: { pricing: "fixed", amount: 30000, unit: "room" },
    },
    contact: { managerName: "Chị Hà", managerPhone: "0900000003" },
  },
]);

await Room.insertMany([
  // Tòa Điện Biên Phủ
  {
    building: dbp._id,
    code: "201",
    floor: 2,
    layout: "studio",
    size: 25,
    title: "Studio cửa sổ thoáng, gần chợ Bà Chiểu",
    description:
      "Studio 25m² có cửa sổ lớn đón gió, đầy đủ giường, tủ, bàn làm việc, máy lạnh, tủ lạnh.\nCách chợ Bà Chiểu 5 phút đi bộ, đi Quận 1 khoảng 15 phút.",
    price: 5500000,
    window: "outside",
    commission: 2750000,
    images: gallery("dbp201", 5),
  },
  {
    building: dbp._id,
    code: "302",
    floor: 3,
    layout: "1br",
    separateKitchen: true,
    size: 35,
    title: "Căn hộ 1PN tách bếp full công năng, ban công rộng",
    description:
      "Phòng ngủ riêng biệt, bếp tách khỏi khu ngủ nên không ám mùi.\nBan công rộng phơi đồ thoải mái, máy giặt riêng trong phòng.",
    price: 7500000,
    originalPrice: 8500000,
    isHot: true,
    window: "balcony",
    privateWasher: true,
    images: gallery("dbp302", 6),
  },
  {
    building: dbp._id,
    code: "401",
    floor: 4,
    layout: "studio",
    size: 22,
    title: "Studio giá tốt cho người đi làm, ở ngắn hạn",
    description:
      "Phòng nhỏ gọn, nội thất cơ bản, phù hợp người đi làm cần chỗ ở ngắn hạn 3 tháng.",
    price: 4800000,
    window: "hallway",
    furniture: "basic",
    minLeaseMonths: 3,
    images: gallery("dbp401", 4),
  },
  {
    building: dbp._id,
    code: "501",
    floor: 5,
    layout: "duplex",
    size: 40,
    title: "Duplex gác cao, phù hợp 2 người",
    description:
      "Gác cao 1m8 đứng thẳng lưng được, tầng dưới làm phòng khách và bếp.",
    price: 8000000,
    status: "upcoming",
    availableFrom: new Date("2026-12-15"),
    images: gallery("dbp501", 5),
  },

  // Tòa Lê Thánh Tôn
  {
    building: ltt._id,
    code: "401",
    floor: 4,
    layout: "1br",
    size: 38,
    title: "1PN ban công trung tâm Quận 1, đi bộ ra Bến Thành",
    description:
      "Vị trí trung tâm, đi bộ 5 phút ra chợ Bến Thành và phố đi bộ Nguyễn Huệ.\nTòa nhà có hầm xe, bảo vệ 24/7, giờ giấc đóng cửa 0h.",
    price: 11000000,
    window: "balcony",
    privateWasher: true,
    isHot: true,
    images: gallery("ltt401", 6),
  },
  {
    building: ltt._id,
    code: "702",
    floor: 7,
    layout: "2br",
    separateKitchen: true,
    size: 60,
    title: "2PN tách bếp tầng cao view thành phố",
    description:
      "2 phòng ngủ riêng, phòng khách rộng, view thành phố từ tầng 7.\nPhù hợp gia đình nhỏ hoặc 2–4 bạn ở ghép.",
    price: 16000000,
    maxOccupants: 4,
    minLeaseMonths: 12,
    images: gallery("ltt702", 6),
  },
  {
    building: ltt._id,
    code: "803",
    floor: 8,
    layout: "1br",
    size: 40,
    title: "1PN tầng 8 (đã cho thuê)",
    price: 12000000,
    status: "rented",
    images: gallery("ltt803", 3),
  },

  // Tòa Thảo Điền
  {
    building: td._id,
    code: "101",
    floor: 1,
    layout: "studio",
    size: 28,
    title: "Studio mới 100% khu Thảo Điền yên tĩnh",
    description:
      "Tòa nhà mới khai trương, nội thất mới 100%.\nHẻm xe hơi yên tĩnh, gần nhiều quán cà phê và siêu thị.",
    price: 6500000,
    window: "outside",
    privateWasher: true,
    images: gallery("td101", 5),
  },
  {
    building: td._id,
    code: "202",
    floor: 2,
    layout: "1br",
    separateKitchen: true,
    size: 40,
    title: "1PN tách bếp ban công xanh mát, mới khai trương",
    description:
      "Ban công nhiều cây xanh, bếp tách riêng, máy giặt riêng.\nƯu đãi giảm 1 triệu cho khách ký hợp đồng trong tháng khai trương.",
    price: 9500000,
    originalPrice: 10500000,
    isHot: true,
    window: "balcony",
    privateWasher: true,
    images: gallery("td202", 6),
  },
  {
    building: td._id,
    code: "301",
    floor: 3,
    layout: "duplex",
    size: 45,
    title: "Duplex trần cao, cửa sổ lớn đón nắng",
    description: "Trần cao thoáng, cửa sổ kính lớn, buổi sáng có nắng nhẹ.",
    price: 9000000,
    window: "outside",
    images: gallery("td301", 5),
  },
  {
    building: td._id,
    code: "402",
    floor: 4,
    layout: "2br",
    separateKitchen: true,
    size: 65,
    title: "2PN rộng rãi cho gia đình nhỏ, cho nuôi pet",
    description:
      "Căn góc 2 mặt thoáng, cho nuôi thú cưng có cam kết.\nPhù hợp gia đình nhỏ có con nhỏ hoặc nuôi chó mèo.",
    price: 15000000,
    maxOccupants: 4,
    status: "upcoming",
    availableFrom: new Date("2026-12-20"),
    window: "balcony",
    privateWasher: true,
    images: gallery("td402", 6),
  },
]);

const buildingCount = await Building.countDocuments();
const roomCount = await Room.countDocuments();
console.log(
  "🌱 Đã tạo " + buildingCount + " tòa nhà và " + roomCount + " phòng",
);

await mongoose.disconnect();
