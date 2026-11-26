import { useEffect, useRef } from "react";
import { cleanupUploads } from "../api/client";

// Ghi nhớ các ảnh đã upload trong lúc mở form để dọn ảnh thừa trên Cloudinary:
// - Rời form mà không lưu (bấm Huỷ, bấm sang trang khác) → xoá hết ảnh vừa upload
// - Lưu xong → xoá những ảnh vừa upload nhưng đã bị bỏ ra khỏi form trước khi lưu
// Đóng hẳn tab trình duyệt thì không kịp dọn, ảnh đó sẽ còn lại.
export function useUploadTracker() {
  // Dùng ref (không dùng state) vì thay đổi danh sách này không cần vẽ lại giao diện
  const trackerRef = useRef({ uploaded: [], saved: false });

  useEffect(() => {
    const tracker = trackerRef.current;

    // Chạy khi form bị đóng (component unmount)
    return () => {
      if (!tracker.saved && tracker.uploaded.length > 0) {
        // Dọn ảnh là việc phụ, lỗi thì bỏ qua
        cleanupUploads(tracker.uploaded).catch(() => {});
      }
    };
  }, []);

  function trackUpload(url) {
    trackerRef.current.uploaded.push(url);
  }

  // Gọi sau khi lưu thành công, finalImages là danh sách ảnh đã được lưu
  function finishSave(finalImages) {
    const tracker = trackerRef.current;
    tracker.saved = true;

    const leftovers = [];
    for (const url of tracker.uploaded) {
      if (!finalImages.includes(url)) {
        leftovers.push(url);
      }
    }

    if (leftovers.length > 0) {
      cleanupUploads(leftovers).catch(() => {});
    }
  }

  return { trackUpload: trackUpload, finishSave: finishSave };
}
