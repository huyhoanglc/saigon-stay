import mongoose from "mongoose";
import Building from "./models/Building.js";
import Room from "./models/Room.js";

await mongoose.connect(process.env.MONGODB_URI);
console.log(" Đã kết nối MongoDB!");

await Room.deleteMany({});
await Building.deleteMany({});

// ===== 1. Tạo tòa nhà =====
const [btBuilding, q1Building] = await Building.insertMany([
  {
    name: "Tòa Điện Biên Phủ",
    address: {
      houseNumber: "123/4",
      street: "Điện Biên Phủ",
      ward: "Phường Thạnh Mỹ Tây",
      area: "Bình Thạnh",
    },
    location: { coordinates: [106.713, 10.803] }, // [kinh độ, vĩ độ]
    roadType: "car_alley",
    floors: 6,
    hasElevator: true,
    parking: "garage",
    hasSecurity: true,
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
    fees: {
      electricity: { pricing: "fixed", amount: 3800, unit: "kwh" },
      water: { pricing: "fixed", amount: 120000, unit: "person" },
      management: { pricing: "fixed", amount: 300000, unit: "room" },
    },
    contact: { managerName: "Anh Long", managerPhone: "0900000002" },
  },
]);

// ===== 2. Tạo phòng, gắn vào tòa nhà bằng _id =====
await Room.insertMany([
  {
    building: btBuilding._id,
    code: "201",
    floor: 2,
    layout: "studio",
    size: 25,
    price: 5500000,
    window: "outside",
    commission: 2750000,
  },
  {
    building: btBuilding._id,
    code: "302",
    floor: 3,
    layout: "1br",
    separateKitchen: true,
    size: 35,
    price: 7500000,
    window: "balcony",
    privateWasher: true,
  },
  {
    building: btBuilding._id,
    code: "501",
    floor: 5,
    layout: "duplex",
    size: 40,
    price: 8000000,
    status: "upcoming",
    availableFrom: new Date("2026-12-15"),
  },
  {
    building: q1Building._id,
    code: "401",
    floor: 4,
    layout: "1br",
    size: 38,
    price: 11000000,
    window: "balcony",
    privateWasher: true,
  },
  {
    building: q1Building._id,
    code: "702",
    floor: 7,
    layout: "2br",
    separateKitchen: true,
    size: 60,
    price: 16000000,
    maxOccupants: 4,
  },
]);

console.log("🌱 Đã tạo 2 tòa nhà và 5 phòng");

// ===== 3. Kiểm tra select: false =====
const asCustomer = await Building.findOne({ name: "Tòa Điện Biên Phủ" });
console.log("Khách thấy:", asCustomer.address, asCustomer.contact);

const asSale = await Building.findOne({ name: "Tòa Điện Biên Phủ" }).select(
  "+contact +address.houseNumber",
);
console.log("Sale thấy:", asSale.address, asSale.contact);

// ===== 4. Kiểm tra populate =====
const room = await Room.findOne({ code: "302" }).populate(
  "building",
  "name address.area",
);
console.log("Phòng 302 thuộc:", room.building);

await mongoose.disconnect();
