import { useState } from "react";
import { useTranslation } from "react-i18next";
import { uploadImage } from "../api/client";
import {
  UploadIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LinkIcon,
  SparklesIcon,
} from "./Icons";
import DriveImagePicker from "./DriveImagePicker";

// Chuyển ảnh ở vị trí from sang vị trí to, các ảnh khác dồn lại
function moveImage(images, from, to) {
  const newImages = images.slice();
  const moved = newImages.splice(from, 1)[0];
  newImages.splice(to, 0, moved);
  return newImages;
}

const roundButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white dark:bg-slate-900/90 dark:text-slate-200";

// images: mảng link ảnh. onChange(newImages) được gọi mỗi khi danh sách thay đổi.
// onUploaded(url): báo cho form biết vừa upload xong 1 ảnh (để dọn ảnh nếu không lưu).
// driveRoomId: đang sửa phòng nào → popup Drive tự mở đúng thư mục ảnh của phòng đó.
// Ảnh đầu tiên là ảnh bìa (hiện trên card). Kéo thả hoặc bấm nút để đổi thứ tự.
export default function ImageUploader({ images, onChange, onUploaded, driveRoomId }) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errorCode, setErrorCode] = useState("");

  async function handleSelectFiles(event) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    // Copy ra mảng thường rồi xoá giá trị input, để chọn lại đúng file đó vẫn kích hoạt onChange
    const fileList = [];
    for (const file of files) {
      fileList.push(file);
    }
    event.target.value = "";

    setUploading(true);
    setErrorCode("");
    setProgress({ done: 0, total: fileList.length });

    // Upload lần lượt từng ảnh, ảnh nào lỗi thì bỏ qua và báo lỗi, ảnh khác vẫn tiếp tục
    let newImages = images.slice();
    let done = 0;
    for (const file of fileList) {
      try {
        const url = await uploadImage(file);
        if (onUploaded) {
          onUploaded(url);
        }
        newImages = newImages.concat([url]);
        onChange(newImages);
      } catch (err) {
        setErrorCode(err.code);
      }
      done = done + 1;
      setProgress({ done: done, total: fileList.length });
    }

    setUploading(false);
  }

  function handleRemove(index) {
    const newImages = [];
    for (let i = 0; i < images.length; i++) {
      if (i !== index) {
        newImages.push(images[i]);
      }
    }
    onChange(newImages);
  }

  function handleMoveLeft(index) {
    if (index > 0) {
      onChange(moveImage(images, index, index - 1));
    }
  }

  function handleMoveRight(index) {
    if (index < images.length - 1) {
      onChange(moveImage(images, index, index + 1));
    }
  }

  // Đưa ảnh lên đầu → thành ảnh bìa trên card
  function handleSetCover(index) {
    if (index > 0) {
      onChange(moveImage(images, index, 0));
    }
  }

  // ===== Kéo thả để sắp xếp (máy tính) =====
  function handleDragStart(event, index) {
    setDragIndex(index);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(event, index) {
    if (dragIndex === null) {
      return;
    }
    event.preventDefault();
    if (overIndex !== index) {
      setOverIndex(index);
    }
  }

  function handleDrop(event, index) {
    event.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      onChange(moveImage(images, dragIndex, index));
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  // ===== Google Drive =====
  function handleOpenDrive() {
    setDriveOpen(true);
  }

  function handleCloseDrive() {
    setDriveOpen(false);
  }

  function handleAddFromDrive(urls) {
    const newImages = images.slice();
    for (const url of urls) {
      if (!newImages.includes(url)) {
        newImages.push(url);
      }
    }
    onChange(newImages);
  }

  let uploadLabel = t("admin.images.upload");
  if (uploading) {
    uploadLabel = t("admin.images.uploading", {
      done: progress.done,
      total: progress.total,
    });
  }

  let uploadButtonClass =
    "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/30";
  if (uploading) {
    uploadButtonClass = uploadButtonClass + " pointer-events-none opacity-60";
  }

  let errorText = null;
  if (errorCode) {
    errorText = (
      <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
        {t("errors." + errorCode)}
      </p>
    );
  }

  let emptyText = null;
  if (images.length === 0) {
    emptyText = (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t("admin.images.empty")}
      </p>
    );
  }

  return (
    <div className="space-y-3 sm:col-span-2 lg:col-span-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className={uploadButtonClass}>
          <UploadIcon className="h-4 w-4" />
          {uploadLabel}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleSelectFiles}
            disabled={uploading}
            className="sr-only"
          />
        </label>
        <button
          type="button"
          onClick={handleOpenDrive}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <LinkIcon className="h-4 w-4" />
          {t("admin.images.fromDrive")}
        </button>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t("admin.images.hint")}
        </span>
      </div>

      {driveOpen ? (
        <DriveImagePicker
          roomId={driveRoomId}
          onClose={handleCloseDrive}
          onAdd={handleAddFromDrive}
          onUploaded={onUploaded}
        />
      ) : null}

      {errorText}
      {emptyText}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {images.map((url, index) => {
          let itemClass =
            "group relative cursor-grab overflow-hidden rounded-lg border-2 bg-slate-100 transition dark:bg-slate-800";
          if (overIndex === index && dragIndex !== index) {
            itemClass = itemClass + " border-emerald-500";
          } else {
            itemClass = itemClass + " border-transparent";
          }
          if (dragIndex === index) {
            itemClass = itemClass + " opacity-40";
          }

          let coverBadge = null;
          let coverButton = null;
          if (index === 0) {
            coverBadge = (
              <span className="absolute left-2 top-2 rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                {t("admin.images.cover")}
              </span>
            );
          } else {
            coverButton = (
              <button
                type="button"
                onClick={() => handleSetCover(index)}
                className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-emerald-700 shadow hover:bg-white dark:bg-slate-900/90 dark:text-emerald-400"
              >
                <SparklesIcon className="h-3 w-3" />
                {t("admin.images.setCover")}
              </button>
            );
          }

          let leftButton = null;
          if (index > 0) {
            leftButton = (
              <button
                type="button"
                onClick={() => handleMoveLeft(index)}
                className={roundButtonClass}
                aria-label={t("admin.images.moveLeft")}
                title={t("admin.images.moveLeft")}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
            );
          }
          let rightButton = null;
          if (index < images.length - 1) {
            rightButton = (
              <button
                type="button"
                onClick={() => handleMoveRight(index)}
                className={roundButtonClass}
                aria-label={t("admin.images.moveRight")}
                title={t("admin.images.moveRight")}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            );
          }

          return (
            <li
              key={url}
              draggable
              onDragStart={(event) => handleDragStart(event, index)}
              onDragOver={(event) => handleDragOver(event, index)}
              onDrop={(event) => handleDrop(event, index)}
              onDragEnd={handleDragEnd}
              className={itemClass}
            >
              <img
                src={url}
                alt={t("admin.images.alt", { number: index + 1 })}
                loading="lazy"
                draggable={false}
                className="aspect-4/3 w-full object-cover"
              />
              {coverBadge}
              {coverButton}
              <div className="absolute bottom-2 right-2 flex gap-1">
                {leftButton}
                {rightButton}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow hover:bg-white dark:bg-slate-900/90 dark:text-rose-400"
                  aria-label={t("admin.images.remove")}
                  title={t("admin.images.remove")}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
