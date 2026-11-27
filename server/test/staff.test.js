import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeStaffCode, nextStaffCode } from "../src/utils/staff.js";

test("mã nhân viên tự cấp tăng dần, đủ 3 chữ số", () => {
  assert.equal(nextStaffCode([]), "NV001");
  assert.equal(nextStaffCode(["NV001", "NV002"]), "NV003");
  // Lấy số lớn nhất, không lấp chỗ trống (mã đã xoá không cấp lại cho người khác)
  assert.equal(nextStaffCode(["NV001", "NV009"]), "NV010");
  assert.equal(nextStaffCode(["NV999"]), "NV1000");
  // Mã admin tự đặt không ảnh hưởng
  assert.equal(nextStaffCode(["SALE-AN", "NV004", "NVX"]), "NV005");
});

test("chuẩn hoá mã admin tự nhập", () => {
  assert.equal(normalizeStaffCode(" nv012 "), "NV012");
  assert.equal(normalizeStaffCode("sale-an"), "SALE-AN");
  assert.equal(normalizeStaffCode("A"), null);
  assert.equal(normalizeStaffCode("có dấu"), null);
  assert.equal(normalizeStaffCode("NV 01"), null);
  assert.equal(normalizeStaffCode(123), null);
});
