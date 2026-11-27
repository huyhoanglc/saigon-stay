import Building from "../models/Building.js";
import Room from "../models/Room.js";
import { toWindowType } from "./roHang.js";

// Ghi dữ liệu rổ hàng (kết quả của parseRoHang) vào DB.
//   - Tòa nhà: tìm theo projectCode, có rồi thì cập nhật, chưa có thì tạo mới.
//   - Phòng: mỗi mã phòng là 1 phòng, tìm theo (tòa nhà, mã phòng).
// Chỉ ghi đè các trường có trong Excel. Những gì admin tự nhập (tên tòa, phường, tọa độ, ảnh,
// diện tích, trạng thái...) được giữ nguyên khi nhập lại file.
// Phòng mới luôn ở trạng thái "hidden": admin bổ sung ảnh, diện tích, tọa độ rồi mới cho hiện.
//
// commit = false: chỉ đếm sẽ tạo / cập nhật bao nhiêu, không ghi gì (dùng cho bước xem trước).
export async function applyRoHang(projects, commit) {
  const projectCodes = projects.map((project) => project.projectCode);

  const existingBuildings = await Building.find({ projectCode: { $in: projectCodes } }).select(
    "_id projectCode",
  );
  const buildingIdByCode = {};
  for (const building of existingBuildings) {
    buildingIdByCode[building.projectCode] = building._id;
  }

  const existingRooms = await Room.find({
    building: { $in: existingBuildings.map((building) => building._id) },
  }).select("building code");
  const existingRoomKeys = new Set();
  for (const room of existingRooms) {
    existingRoomKeys.add(String(room.building) + "|" + room.code);
  }

  const summary = {
    buildingsCreated: 0,
    buildingsUpdated: 0,
    roomsCreated: 0,
    roomsUpdated: 0,
    // Số tòa có tên phường lấy được từ thư mục Drive (chỉ điền cho tòa đang trống phường)
    wardsFromDrive: projects.filter((project) => project.driveWard).length,
  };

  // Ghi luôn vào từng dự án / nhóm phòng để trang xem trước hiện được "mới" hay "cập nhật"
  for (const project of projects) {
    const buildingId = buildingIdByCode[project.projectCode];
    project.exists = Boolean(buildingId);
    if (buildingId) {
      summary.buildingsUpdated++;
    } else {
      summary.buildingsCreated++;
    }
    for (const group of project.rooms) {
      group.existingCodes = [];
      for (const code of group.roomCodes) {
        if (buildingId && existingRoomKeys.has(String(buildingId) + "|" + code)) {
          summary.roomsUpdated++;
          group.existingCodes.push(code);
        } else {
          summary.roomsCreated++;
        }
      }
    }
  }

  if (!commit || projects.length === 0) {
    return summary;
  }

  const importedAt = new Date();

  // ===== Tòa nhà =====
  const buildingOps = [];
  for (const project of projects) {
    const set = {
      "address.houseNumber": project.houseNumber,
      "address.street": project.street,
      "address.area": project.area,
      sourcing: {
        system: project.system || undefined,
        policy: project.policy || undefined,
        zaloGroupUrl: project.zaloGroupUrl || undefined,
        ownerReview: project.ownerReview || undefined,
        importedAt: importedAt,
      },
    };
    // Ô trống trong Excel → không đụng tới giá trị đang có
    setIfKnown(set, "hasElevator", project.hasElevator);
    setIfKnown(set, "roadType", project.roadType);
    setIfKnown(set, "petAllowed", project.petAllowed);
    setIfKnown(set, "shortTermRental", project.shortTermRental);
    setIfKnown(set, "foreignersAllowed", project.foreignersAllowed);
    setIfKnown(set, "contact.ownerPhone", project.ownerPhone);

    buildingOps.push({
      updateOne: {
        filter: { projectCode: project.projectCode },
        update: {
          $set: set,
          // Tên tòa chỉ đặt lúc tạo, sau đó admin đổi thoải mái. Không ghi số nhà vào tên vì tên hiện cho khách.
          $setOnInsert: { name: project.street + ", " + project.area },
        },
        upsert: true,
      },
    });
  }
  await Building.bulkWrite(buildingOps, { ordered: false });

  // Phường lấy từ thư mục Drive: chỉ điền khi tòa chưa có phường, không ghi đè phường admin đã nhập
  const wardOps = [];
  for (const project of projects) {
    if (project.driveWard) {
      wardOps.push({
        updateOne: {
          filter: { projectCode: project.projectCode, "address.ward": { $in: ["", null] } },
          update: { $set: { "address.ward": project.driveWard } },
        },
      });
    }
  }
  if (wardOps.length > 0) {
    const wardResult = await Building.bulkWrite(wardOps, { ordered: false });
    summary.wardsFilled = wardResult.modifiedCount;
  }

  const buildings = await Building.find({ projectCode: { $in: projectCodes } }).select(
    "_id projectCode",
  );
  for (const building of buildings) {
    buildingIdByCode[building.projectCode] = building._id;
  }

  // ===== Phòng =====
  const roomOps = [];
  for (const project of projects) {
    const buildingId = buildingIdByCode[project.projectCode];
    for (const group of project.rooms) {
      const set = {
        price: group.price,
        layout: group.layout,
      };
      setIfKnown(set, "window", toWindowType(group.balcony, group.window));
      setIfKnown(set, "privateWasher", group.privateWasher);
      setIfKnown(set, "imageRef", group.imageRef);

      for (const code of group.roomCodes) {
        roomOps.push({
          updateOne: {
            filter: { building: buildingId, code: code },
            update: {
              $set: set,
              $setOnInsert: { status: "hidden" },
            },
            upsert: true,
          },
        });
      }
    }
  }
  if (roomOps.length > 0) {
    await Room.bulkWrite(roomOps, { ordered: false });
  }

  return summary;
}

function setIfKnown(target, key, value) {
  if (value !== null && value !== undefined) {
    target[key] = value;
  }
}
