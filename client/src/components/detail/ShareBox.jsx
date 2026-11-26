import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPrice } from "../../utils/format";

export default function ShareBox({ room }) {
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = useState(null); // "link" | "content" | null

  const url = window.location.href;
  const building = room.building;

  const priceText = formatPrice(room.price, i18n.language);
  const shareText =
    room.title +
    "\n" +
    t("share.priceLine", { price: priceText }) +
    "\n" +
    building.address.area;

  const facebookUrl =
    "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
  const whatsappUrl =
    "https://wa.me/?text=" + encodeURIComponent(shareText + "\n" + url);

  // Điện thoại có menu chia sẻ riêng (có Zalo, Messenger...)
  let canNativeShare = false;
  if (typeof navigator !== "undefined" && navigator.share) {
    canNativeShare = true;
  }

  function showCopied(type) {
    setCopied(type);
    setTimeout(() => {
      setCopied(null);
    }, 2000);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      showCopied("link");
    } catch {
      // Trình duyệt không cho copy thì bỏ qua
    }
  }

  async function handleCopyContent() {
    try {
      await navigator.clipboard.writeText(shareText + "\n" + url);
      showCopied("content");
    } catch {
      // Trình duyệt không cho copy thì bỏ qua
    }
  }

  async function handleNativeShare() {
    try {
      await navigator.share({
        title: room.title,
        text: shareText,
        url: url,
      });
    } catch {
      // Người dùng bấm huỷ
    }
  }

  const buttonClass =
    "rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800";

  let copyLinkText = t("share.copyLink");
  if (copied === "link") {
    copyLinkText = "✓ " + t("share.copied");
  }

  let copyContentText = t("share.copyContent");
  if (copied === "content") {
    copyContentText = "✓ " + t("share.copied");
  }

  let nativeShareButton = null;
  if (canNativeShare) {
    nativeShareButton = (
      <button type="button" onClick={handleNativeShare} className={buttonClass}>
        {t("share.shareMore")}
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t("share.title")}
      </h2>

      <div className="flex flex-wrap gap-2">
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
        >
          Facebook
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
        >
          WhatsApp
        </a>
        {nativeShareButton}
        <button type="button" onClick={handleCopyLink} className={buttonClass}>
          {copyLinkText}
        </button>
        <button
          type="button"
          onClick={handleCopyContent}
          className={buttonClass}
        >
          {copyContentText}
        </button>
      </div>
    </section>
  );
}
