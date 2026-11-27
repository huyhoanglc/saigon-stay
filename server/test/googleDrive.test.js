import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDriveUrl, isValidDriveId } from "../src/utils/googleDrive.js";

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
