import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDriveUrl, isValidDriveId, classifyDriveError } from "../src/utils/googleDrive.js";

const ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz012345";

test("đọc ID từ các kiểu link Google Drive", () => {
  assert.deepEqual(parseDriveUrl("https://drive.google.com/drive/folders/" + ID + "?usp=sharing"), { type: "folder", id: ID });
  assert.deepEqual(parseDriveUrl(" https://drive.google.com/drive/u/0/folders/" + ID + " "), { type: "folder", id: ID });
  assert.deepEqual(parseDriveUrl("https://drive.google.com/file/d/" + ID + "/view?usp=drive_link"), { type: "file", id: ID });
  assert.deepEqual(parseDriveUrl("https://drive.google.com/open?id=" + ID), { type: "unknown", id: ID });
});

test("không nhận link lạ hoặc ID bất thường", () => {
  assert.equal(parseDriveUrl("https://evil.com/drive/folders/" + ID), null);
  assert.equal(parseDriveUrl("101,201"), null);
  assert.equal(parseDriveUrl(""), null);
  assert.equal(parseDriveUrl(undefined), null);
  assert.equal(parseDriveUrl("https://drive.google.com/drive/folders/abc"), null);
  assert.equal(isValidDriveId("../../etc"), false);
  assert.equal(isValidDriveId(ID), true);
});

// Dạng lỗi Google thật trả về cho từng trường hợp hay gặp khi dùng API key
function googleError(status, reasons, detailReasons) {
  const errors = [];
  for (const reason of reasons) {
    errors.push({ reason: reason });
  }
  const details = [];
  for (const reason of detailReasons) {
    details.push({ "@type": "type.googleapis.com/google.rpc.ErrorInfo", reason: reason });
  }
  return { error: { code: status, message: "...", errors: errors, details: details } };
}

test("phân loại lỗi Google Drive theo lý do thật", () => {
  assert.equal(classifyDriveError(400, googleError(400, ["badRequest"], ["API_KEY_INVALID"])).code, "DRIVE_KEY_INVALID");
  assert.equal(classifyDriveError(403, googleError(403, ["accessNotConfigured"], ["SERVICE_DISABLED"])).code, "DRIVE_API_DISABLED");
  assert.equal(classifyDriveError(403, googleError(403, ["forbidden"], ["API_KEY_HTTP_REFERRER_BLOCKED"])).code, "DRIVE_KEY_RESTRICTED");
  assert.equal(classifyDriveError(403, googleError(403, [], ["API_KEY_SERVICE_BLOCKED"])).code, "DRIVE_KEY_RESTRICTED");
  assert.equal(classifyDriveError(403, googleError(403, ["userRateLimitExceeded"], [])).code, "DRIVE_RATE_LIMITED");
  assert.equal(classifyDriveError(429, null).code, "DRIVE_RATE_LIMITED");
  // File riêng tư / không tồn tại: Google trả 404 notFound
  assert.equal(classifyDriveError(404, googleError(404, ["notFound"], [])).code, "DRIVE_NOT_ACCESSIBLE");
  assert.equal(classifyDriveError(403, googleError(403, ["forbidden"], [])).code, "DRIVE_NOT_ACCESSIBLE");
  // Không đọc được nội dung lỗi
  assert.equal(classifyDriveError(500, null).code, "DRIVE_FAILED");
});
