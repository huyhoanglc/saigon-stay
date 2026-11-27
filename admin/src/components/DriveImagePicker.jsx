import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { listDriveImages, listRoomDriveImages, importDriveImage } from "../api/client";
import { CheckIcon, CloseIcon, ExternalLinkIcon } from "./Icons";

// Số ảnh tải cùng lúc từ Drive lên Cloudinary (mỗi ảnh là 1 request riêng)
const PARALLEL_IMPORTS = 3;

// Popup lấy ảnh từ thư mục Google Drive:
// dán link → xem ảnh thu nhỏ → tick chọn ảnh muốn dùng → bấm Thêm.
// Ảnh được chọn sẽ được server tải từ Drive lên Cloudinary rồi trả link về.
//   onAdd(urls): danh sách link ảnh đã lên Cloudinary, đúng thứ tự trong thư mục
//   onUploaded(url): báo cho form từng ảnh vừa upload (để dọn nếu không lưu)
// Component chỉ được render khi popup đang mở (đóng là bỏ hẳn), mở lại sẽ tải lại danh sách.
// roomId: phòng đang sửa → server tự tìm thư mục ảnh theo cây Quận / Phường / Mã dự án / Phòng.
export default function DriveImagePicker({ roomId, onClose, onAdd, onUploaded }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const [link, setLink] = useState("");
  const [images, setImages] = useState(null);
  // Thư mục đang xem: { path: "QUẬN 1 / Bến Thành / 7G.NTMK.Q1 / 101", url }
  const [folder, setFolder] = useState(null);
  const [selected, setSelected] = useState([]);
  // Sửa phòng có sẵn thì vừa mở đã tự tìm thư mục
  const [loading, setLoading] = useState(Boolean(roomId));
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errorCode, setErrorCode] = useState("");

  const busy = loading || importing;

  useEffect(() => {
    dialogRef.current.showModal();
  }, []);

  useEffect(() => {
    if (!roomId) {
      return;
    }
    let ignore = false;
    listRoomDriveImages(roomId)
      .then((result) => {
        if (!ignore) {
          setImages(result.images);
          setFolder(result.folder);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setErrorCode(err.code);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [roomId]);

  async function loadImages(targetLink) {
    if (targetLink.trim() === "") {
      setErrorCode("DRIVE_LINK_INVALID");
      return;
    }
    setLoading(true);
    setErrorCode("");
    setImages(null);
    setFolder(null);
    setSelected([]);
    try {
      const result = await listDriveImages(targetLink.trim());
      setImages(result);
      setFolder({ path: null, url: targetLink.trim() });
    } catch (err) {
      setErrorCode(err.code);
    }
    setLoading(false);
  }

  function handleSubmitLink(event) {
    event.preventDefault();
    // Sự kiện React vẫn lan qua portal lên form phòng bên ngoài → chặn lại
    event.stopPropagation();
    loadImages(link);
  }

  function toggle(id) {
    if (selected.includes(id)) {
      setSelected(selected.filter((item) => item !== id));
    } else {
      setSelected(selected.concat([id]));
    }
  }

  function handleSelectAll() {
    setSelected(images.map((image) => image.id));
  }

  function handleClearSelection() {
    setSelected([]);
  }

  function handleClose() {
    if (!importing) {
      onClose();
    }
  }

  function handleCancelEvent(event) {
    event.preventDefault();
    handleClose();
  }

  function handleBackdropClick(event) {
    if (event.target === dialogRef.current) {
      handleClose();
    }
  }

  async function handleAdd() {
    // Giữ đúng thứ tự trong thư mục Drive, không theo thứ tự bấm chọn
    const ids = images.filter((image) => selected.includes(image.id)).map((image) => image.id);

    setImporting(true);
    setErrorCode("");
    setProgress({ done: 0, total: ids.length });

    const urls = new Array(ids.length).fill(null);
    let nextIndex = 0;
    let done = 0;
    let lastError = "";

    async function worker() {
      while (nextIndex < ids.length) {
        const index = nextIndex;
        nextIndex = nextIndex + 1;
        try {
          const url = await importDriveImage(ids[index]);
          urls[index] = url;
          if (onUploaded) {
            onUploaded(url);
          }
        } catch (err) {
          lastError = err.code;
        }
        done = done + 1;
        setProgress({ done: done, total: ids.length });
      }
    }

    const workers = [];
    for (let i = 0; i < Math.min(PARALLEL_IMPORTS, ids.length); i++) {
      workers.push(worker());
    }
    await Promise.all(workers);

    const uploaded = urls.filter((url) => url !== null);
    if (uploaded.length > 0) {
      onAdd(uploaded);
    }
    setImporting(false);

    if (lastError) {
      // Vẫn giữ popup để admin thấy lỗi, ảnh đã lấy được thì đã thêm vào form
      setErrorCode(lastError);
      setSelected([]);
    } else {
      setSelected([]);
      onClose();
    }
  }

  let errorText = null;
  if (errorCode) {
    errorText = (
      <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
        {t("errors." + errorCode)}
      </p>
    );
  }

  let body = null;
  if (loading) {
    body = <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">{t("admin.images.driveLoading")}</p>;
  } else if (images && images.length === 0) {
    body = <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">{t("admin.images.driveEmpty")}</p>;
  } else if (images) {
    body = (
      <>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-600 dark:text-slate-300">
            {t("admin.images.driveSelected", { count: selected.length, total: images.length })}
          </span>
          <button type="button" onClick={handleSelectAll} disabled={busy} className="text-emerald-700 hover:underline disabled:opacity-60 dark:text-emerald-400">
            {t("admin.images.driveSelectAll")}
          </button>
          <button type="button" onClick={handleClearSelection} disabled={busy} className="text-slate-500 hover:underline disabled:opacity-60 dark:text-slate-400">
            {t("admin.images.driveClear")}
          </button>
        </div>
        <ul className="grid max-h-[55vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => {
            const isSelected = selected.includes(image.id);
            let itemClass = "relative block w-full overflow-hidden rounded-lg border-2 transition";
            if (isSelected) {
              itemClass = itemClass + " border-emerald-500";
            } else {
              itemClass = itemClass + " border-transparent opacity-80 hover:opacity-100";
            }

            let mark = null;
            if (isSelected) {
              mark = (
                <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
                  <CheckIcon className="h-4 w-4" />
                </span>
              );
            }

            return (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => toggle(image.id)}
                  disabled={importing}
                  aria-pressed={isSelected}
                  title={image.name}
                  className={itemClass}
                >
                  <img
                    src={image.thumbnail}
                    alt={image.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="aspect-4/3 w-full bg-slate-100 object-cover dark:bg-slate-800"
                  />
                  {mark}
                </button>
              </li>
            );
          })}
        </ul>
      </>
    );
  }

  let addText = t("admin.images.driveAdd", { count: selected.length });
  if (importing) {
    addText = t("admin.images.driveImporting", { done: progress.done, total: progress.total });
  }

  const inputClass =
    "min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

  // Render ra ngoài <body>: popup nằm trong form phòng, mà form lồng form là HTML sai
  return createPortal(
    <dialog
      ref={dialogRef}
      onCancel={handleCancelEvent}
      onClick={handleBackdropClick}
      aria-labelledby="drive-picker-title"
      className="fixed inset-0 m-auto h-fit w-[calc(100%-2rem)] max-w-4xl rounded-2xl bg-white p-0 text-slate-800 shadow-xl backdrop:bg-slate-900/60 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="drive-picker-title" className="text-lg font-semibold">
              {t("admin.images.driveTitle")}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("admin.images.driveHint")}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={importing}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-slate-800"
            aria-label={t("admin.images.driveClose")}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form riêng trong popup: Enter để mở link, không submit form phòng bên ngoài */}
        <form onSubmit={handleSubmitLink} className="flex gap-2">
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            disabled={busy}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {t("admin.images.driveOpen")}
          </button>
        </form>

        {folder ? (
          <a
            href={folder.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 text-sm text-emerald-700 hover:underline dark:text-emerald-400"
          >
            <ExternalLinkIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{folder.path || t("admin.images.driveOpenFolder")}</span>
          </a>
        ) : null}
        {errorText}
        {body}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={importing}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {t("admin.images.driveClose")}
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={busy || selected.length === 0}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addText}
          </button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
