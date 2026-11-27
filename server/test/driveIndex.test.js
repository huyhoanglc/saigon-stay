import { test } from "node:test";
import assert from "node:assert/strict";
import {
  projectKey,
  findRoomFolder,
  codesInFolderName,
  toWardName,
  buildProjectMap,
} from "../src/utils/driveIndex.js";

test("tên thư mục dự án thay / bằng _ vẫn khớp mã dự án", () => {
  assert.equal(projectKey("89/6.CMT8.Q1"), projectKey("89_6.CMT8.Q1"));
  assert.equal(projectKey("44- 45.TĐ.Q10"), projectKey("44-45.TĐ.Q10"));
  assert.equal(projectKey("7a/75.TT.Q10"), projectKey("7A_75.TT.Q10"));
  assert.notEqual(projectKey("7G.NTMK.Q1"), projectKey("7.NTMK.Q1"));
});

test("tìm thư mục phòng: theo cột LINK HÌNH ẢNH, rồi theo mã phòng", () => {
  const rooms = [
    { id: "a", name: "101" },
    { id: "b", name: "202,302,402,502.602" },
    { id: "c", name: "G01 3PN" },
    { id: "d", name: "103, 203" },
  ];
  assert.equal(findRoomFolder(rooms, "101", "101,201").id, "a");
  assert.equal(findRoomFolder(rooms, "201", "101,201"), null);
  assert.equal(findRoomFolder(rooms, "602", "202,302,402,502.602").id, "b");
  assert.equal(findRoomFolder(rooms, "G01", "G01 3PN").id, "c");
  assert.equal(findRoomFolder(rooms, "203", "103,203").id, "d");
  assert.equal(findRoomFolder(rooms, "g01", null).id, "c");
  assert.equal(findRoomFolder([], "101", "101"), null);
});

test("tách mã phòng trong tên thư mục", () => {
  assert.deepEqual(codesInFolderName("202,302.402 502"), ["202", "302", "402", "502"]);
});

test("tên phường", () => {
  assert.equal(toWardName("Bến Thành"), "Phường Bến Thành");
  assert.equal(toWardName("Phường Tân Định"), "Phường Tân Định");
  assert.equal(toWardName("P. Bảy Hiền"), "Phường Bảy Hiền");
  assert.equal(toWardName("12"), "Phường 12");
});

test("dựng bảng dự án từ cây Quận / Phường / Dự án / Phòng", () => {
  const folders = [
    { id: "q1", name: "QUẬN 1", parentId: "root", depth: 1 },
    { id: "bt", name: "Bến Thành", parentId: "q1", depth: 2 },
    { id: "p1", name: "7G.NTMK.Q1", parentId: "bt", depth: 3 },
    { id: "p2", name: "89_6.CMT8.Q1", parentId: "bt", depth: 3 },
    { id: "r1", name: "101", parentId: "p1", depth: 4 },
    { id: "r2", name: "G01", parentId: "p2", depth: 4 },
    // Dự án nằm thẳng trong quận (không có tầng phường) → không đoán phường
    { id: "p3", name: "1.ĐS9.Q11", parentId: "q1", depth: 2 },
    { id: "x", name: "Ảnh cũ", parentId: "q1", depth: 2 },
  ];
  const map = buildProjectMap(folders, ["7G.NTMK.Q1", "89/6.CMT8.Q1", "1.ĐS9.Q11", "KHONG.CO.Q1"]);

  assert.equal(map.size, 3);
  const project = map.get(projectKey("89/6.CMT8.Q1"));
  assert.equal(project.id, "p2");
  assert.equal(project.ward, "Phường Bến Thành");
  assert.deepEqual(project.path, ["QUẬN 1", "Bến Thành", "89_6.CMT8.Q1"]);
  assert.deepEqual(project.rooms, [{ id: "r2", name: "G01" }]);
  assert.equal(map.get(projectKey("1.ĐS9.Q11")).ward, null);
  assert.equal(map.has(projectKey("KHONG.CO.Q1")), false);
});
