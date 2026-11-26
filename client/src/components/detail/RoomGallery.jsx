import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "../Icons";

export default function RoomGallery({ images, title }) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  let imageList = [];
  if (images && images.length > 0) {
    imageList = images;
  }
  const total = imageList.length;

  function showPrev() {
    setActiveIndex(function (current) {
      if (current === 0) {
        return total - 1;
      }
      return current - 1;
    });
  }

  function showNext() {
    setActiveIndex(function (current) {
      if (current === total - 1) {
        return 0;
      }
      return current + 1;
    });
  }

  // Khi mở ảnh lớn: dùng bàn phím + khoá cuộn trang
  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setLightboxOpen(false);
      } else if (event.key === "ArrowLeft") {
        setActiveIndex(function (current) {
          if (current === 0) {
            return total - 1;
          }
          return current - 1;
        });
      } else if (event.key === "ArrowRight") {
        setActiveIndex(function (current) {
          if (current === total - 1) {
            return 0;
          }
          return current + 1;
        });
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, total]);

  function handleOpenLightbox() {
    setLightboxOpen(true);
  }

  function handleCloseLightbox() {
    setLightboxOpen(false);
  }

  function handlePrevClick(event) {
    event.stopPropagation();
    showPrev();
  }

  function handleNextClick(event) {
    event.stopPropagation();
    showNext();
  }

  function handleCloseClick(event) {
    event.stopPropagation();
    setLightboxOpen(false);
  }

  function handleImageClick(event) {
    event.stopPropagation();
  }

  // Không có ảnh
  if (total === 0) {
    return (
      <div className="aspect-4/3 rounded-2xl bg-slate-200 dark:bg-slate-800" />
    );
  }

  const arrowClass =
    "absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow transition hover:bg-white";

  // Nút trái phải trên ảnh chính
  let mainArrows = null;
  if (total > 1) {
    mainArrows = (
      <>
        <button
          type="button"
          onClick={showPrev}
          className={arrowClass + " left-3"}
          aria-label={t("common.prev")}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={showNext}
          className={arrowClass + " right-3"}
          aria-label={t("common.next")}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </>
    );
  }

  // Ảnh lớn toàn màn hình
  let lightbox = null;
  if (lightboxOpen) {
    let lightboxArrows = null;
    if (total > 1) {
      lightboxArrows = (
        <>
          <button
            type="button"
            onClick={handlePrevClick}
            className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            aria-label={t("common.prev")}
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={handleNextClick}
            className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            aria-label={t("common.next")}
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </>
      );
    }

    lightbox = (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={handleCloseLightbox}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      >
        <img
          src={imageList[activeIndex]}
          alt={title + " " + (activeIndex + 1)}
          onClick={handleImageClick}
          className="max-h-[85vh] max-w-full rounded-lg object-contain"
        />

        <button
          type="button"
          onClick={handleCloseClick}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
          aria-label={t("common.close")}
        >
          <CloseIcon className="h-6 w-6" />
        </button>

        {lightboxArrows}

        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
          {activeIndex + 1} / {total}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Ảnh chính */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800">
        <button
          type="button"
          onClick={handleOpenLightbox}
          className="block w-full cursor-zoom-in"
        >
          <img
            src={imageList[activeIndex]}
            alt={title}
            className="aspect-4/3 w-full object-cover"
          />
        </button>

        {mainArrows}

        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
          {activeIndex + 1} / {total}
        </span>
      </div>

      {/* Ảnh nhỏ */}
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {imageList.map((image, index) => {
          let thumbClass = "overflow-hidden rounded-lg transition";
          if (index === activeIndex) {
            thumbClass =
              thumbClass +
              " ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-950";
          } else {
            thumbClass = thumbClass + " opacity-70 hover:opacity-100";
          }

          return (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={thumbClass}
              aria-label={title + " " + (index + 1)}
            >
              <img
                src={image}
                alt=""
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            </button>
          );
        })}
      </div>

      {lightbox}
    </div>
  );
}
