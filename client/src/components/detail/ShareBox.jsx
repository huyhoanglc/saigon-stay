import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPrice } from "../../utils/format";
import {
  FacebookLogo,
  WhatsappLogo,
  MessengerLogo,
  ZaloLogo,
} from "../BrandIcons";
import { DownloadIcon, ShareIcon, LinkIcon, CopyIcon } from "../Icons";

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Kiểm tra trình duyệt có cho chia sẻ file ảnh không
function checkCanShareFiles() {
  if (!navigator.canShare) {
    return false;
  }

  try {
    const testFile = new File([""], "test.jpg", { type: "image/jpeg" });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

async function fetchImageBlob(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Không tải được ảnh");
  }
  return await response.blob();
}

function getExtension(blob) {
  if (blob.type === "image/png") {
    return "png";
  }
  if (blob.type === "image/webp") {
    return "webp";
  }
  return "jpg";
}

export default function ShareBox({ room }) {
  const { t, i18n } = useTranslation();

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(null); // "download" | "sharePhotos" | null
  const [downloadDone, setDownloadDone] = useState(0);
  const [canShareFiles] = useState(checkCanShareFiles);

  // Lưu sẵn file ảnh đã tải, lần bấm sau gửi ngay
  const preparedFilesRef = useRef(null);

  const url = window.location.href;
  const building = room.building;

  let images = [];
  if (room.images) {
    images = room.images;
  }

  // Chưa có tiêu đề thì dùng "Tên tòa · Mã phòng" (giống trang chi tiết)
  let roomTitle = room.title;
  if (!roomTitle) {
    roomTitle = building.name + " · " + room.code;
  }

  const priceText = formatPrice(room.price, i18n.language);
  const shareText =
    roomTitle +
    "\n" +
    t("share.priceLine", { price: priceText }) +
    "\n" +
    building.address.area;

  const facebookUrl =
    "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
  const whatsappUrl =
    "https://wa.me/?text=" + encodeURIComponent(shareText + "\n" + url);

  let canNativeShare = false;
  if (navigator.share) {
    canNativeShare = true;
  }

  // Hiện thông báo nhỏ trong 3 giây
  function showMessage(text) {
    setMessage(text);
    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  async function handleCopyLink() {
    const ok = await copyText(url);
    if (ok) {
      showMessage(t("share.linkCopied"));
    }
  }

  async function handleCopyContent() {
    const ok = await copyText(shareText + "\n" + url);
    if (ok) {
      showMessage(t("share.contentCopied"));
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({
        title: roomTitle,
        text: shareText,
        url: url,
      });
    } catch {
      // Người dùng bấm huỷ
    }
  }

  // Zalo / Messenger: điện thoại thì mở menu chia sẻ, máy tính thì copy link + mở web
  async function shareToChatApp(appName, webUrl) {
    if (isMobileDevice() && canNativeShare) {
      await handleNativeShare();
      return;
    }

    const ok = await copyText(url);
    if (ok) {
      showMessage(t("share.pasteHint", { app: appName }));
    }
    window.open(webUrl, "_blank", "noopener");
  }

  function handleZalo() {
    shareToChatApp("Zalo", "https://chat.zalo.me/");
  }

  function handleMessenger() {
    shareToChatApp("Messenger", "https://www.messenger.com/");
  }

  // ===== Tải tất cả ảnh =====
  async function handleDownloadAll() {
    if (images.length === 0) {
      return;
    }

    setBusy("download");
    setDownloadDone(0);

    for (let i = 0; i < images.length; i++) {
      try {
        const blob = await fetchImageBlob(images[i]);
        const objectUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = objectUrl;
        link.download =
          "saigon-stay-" + room.code + "-" + (i + 1) + "." + getExtension(blob);
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 1000);
      } catch {
        // Không tải được thì mở ảnh ở tab mới
        window.open(images[i], "_blank", "noopener");
      }

      setDownloadDone(i + 1);
    }

    setBusy(null);
  }

  // ===== Gửi tất cả ảnh (điện thoại) =====
  async function handleSharePhotos() {
    if (images.length === 0) {
      return;
    }

    setBusy("sharePhotos");

    try {
      if (!preparedFilesRef.current) {
        const files = [];
        for (let i = 0; i < images.length; i++) {
          const blob = await fetchImageBlob(images[i]);
          const fileName =
            "saigon-stay-" +
            room.code +
            "-" +
            (i + 1) +
            "." +
            getExtension(blob);
          files.push(new File([blob], fileName, { type: blob.type }));
        }
        preparedFilesRef.current = files;
      }

      await navigator.share({
        files: preparedFilesRef.current,
        title: roomTitle,
        text: shareText + "\n" + url,
      });
    } catch (err) {
      // Tải ảnh lâu quá thì trình duyệt chặn, bấm lại lần nữa là gửi được
      if (err && err.name === "NotAllowedError") {
        showMessage(t("share.readyTapAgain"));
      }
    }

    setBusy(null);
  }

  // ===== Giao diện =====
  const appButtonClass =
    "flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800";

  let sharePhotosButton = null;
  if (canShareFiles && images.length > 0) {
    let sharePhotosText = t("share.sendPhotos");
    if (busy === "sharePhotos") {
      sharePhotosText = t("share.preparing");
    }

    sharePhotosButton = (
      <button
        type="button"
        onClick={handleSharePhotos}
        disabled={busy !== null}
        className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-700 dark:hover:bg-slate-600"
      >
        <ShareIcon className="h-4 w-4" />
        {sharePhotosText}
      </button>
    );
  }

  let downloadButton = null;
  if (images.length > 0) {
    let downloadText = t("share.downloadPhotos");
    if (busy === "download") {
      downloadText = t("share.downloading", {
        done: downloadDone,
        total: images.length,
      });
    }

    downloadButton = (
      <button
        type="button"
        onClick={handleDownloadAll}
        disabled={busy !== null}
        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
      >
        <DownloadIcon className="h-4 w-4" />
        {downloadText}
      </button>
    );
  }

  let messageBox = null;
  if (message !== "") {
    messageBox = (
      <p
        role="status"
        className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400"
      >
        ✓ {message}
      </p>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t("share.title")}
      </h2>

      {/* Ảnh */}
      <div className="mb-3 flex flex-wrap gap-2">
        {sharePhotosButton}
        {downloadButton}
      </div>

      {/* Mạng xã hội */}
      <div className="flex flex-wrap gap-2">
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={appButtonClass}
        >
          <FacebookLogo className="h-4 w-4" />
          Facebook
        </a>

        <button type="button" onClick={handleZalo} className={appButtonClass}>
          <ZaloLogo className="h-4 w-4" />
          Zalo
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={appButtonClass}
        >
          <WhatsappLogo className="h-4 w-4" />
          WhatsApp
        </a>

        <button
          type="button"
          onClick={handleMessenger}
          className={appButtonClass}
        >
          <MessengerLogo className="h-4 w-4" />
          Messenger
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className={appButtonClass}
        >
          <LinkIcon className="h-4 w-4" />
          {t("share.copyLink")}
        </button>

        <button
          type="button"
          onClick={handleCopyContent}
          className={appButtonClass}
        >
          <CopyIcon className="h-4 w-4" />
          {t("share.copyContent")}
        </button>
      </div>

      {messageBox}
    </section>
  );
}
