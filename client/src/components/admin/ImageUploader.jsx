import { useState } from "react";
import { useTranslation } from "react-i18next";
import { uploadImage } from "../../api/client";
import { UploadIcon, TrashIcon, ChevronLeftIcon } from "../Icons";

// images: mảng link ảnh. onChange(newImages) được gọi mỗi khi danh sách thay đổi.
// onUploaded(url): báo cho form biết vừa upload xong 1 ảnh (để dọn ảnh nếu không lưu).
export default function ImageUploader({ images, onChange, onUploaded }) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
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

  // Đổi chỗ với ảnh bên trái. Ảnh đầu tiên là ảnh bìa.
  function handleMoveLeft(index) {
    if (index === 0) {
      return;
    }
    const newImages = images.slice();
    const temp = newImages[index - 1];
    newImages[index - 1] = newImages[index];
    newImages[index] = temp;
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
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t("admin.images.hint")}
        </span>
      </div>

      {errorText}
      {emptyText}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {images.map((url, index) => (
          <li
            key={url}
            className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
          >
            <img
              src={url}
              alt={t("admin.images.alt", { number: index + 1 })}
              loading="lazy"
              className="aspect-4/3 w-full object-cover"
            />
            {index === 0 ? (
              <span className="absolute left-2 top-2 rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                {t("admin.images.cover")}
              </span>
            ) : null}
            <div className="absolute bottom-2 right-2 flex gap-1">
              {index > 0 ? (
                <button
                  type="button"
                  onClick={() => handleMoveLeft(index)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white dark:bg-slate-900/90 dark:text-slate-200"
                  aria-label={t("admin.images.moveLeft")}
                  title={t("admin.images.moveLeft")}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
              ) : null}
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
        ))}
      </ul>
    </div>
  );
}
