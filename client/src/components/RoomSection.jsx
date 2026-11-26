import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRooms } from "../hooks/useRooms";
import RoomCard from "./RoomCard";
import RoomCardSkeleton from "./RoomCardSkeleton";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

export default function RoomSection({ title, icon, params }) {
  const { t } = useTranslation();
  const { rooms, loading, error } = useRooms(params);

  const trackRef = useRef(null);
  const barRef = useRef(null);

  // Trạng thái khi kéo card
  const cardDragRef = useRef({
    isDown: false,
    moved: false,
    startX: 0,
    startScroll: 0,
    pointerId: null,
  });

  // Trạng thái khi kéo thanh bên dưới
  const thumbDragRef = useRef({
    isDown: false,
    startX: 0,
    startScroll: 0,
  });

  const [dragging, setDragging] = useState(false);
  const [scrollInfo, setScrollInfo] = useState({
    thumbWidth: 100,
    thumbLeft: 0,
    canPrev: false,
    canNext: false,
  });

  // ===== Tính vị trí thanh kéo + có cuộn tiếp được không =====
  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    function updateScrollInfo() {
      const maxScroll = track.scrollWidth - track.clientWidth;

      let thumbWidth = 100;
      if (track.scrollWidth > 0) {
        thumbWidth = (track.clientWidth / track.scrollWidth) * 100;
      }

      let thumbLeft = 0;
      if (maxScroll > 0) {
        thumbLeft = (track.scrollLeft / maxScroll) * (100 - thumbWidth);
      }

      const canPrev = track.scrollLeft > 2;
      const canNext = track.scrollLeft < maxScroll - 2;

      setScrollInfo({
        thumbWidth: thumbWidth,
        thumbLeft: thumbLeft,
        canPrev: canPrev,
        canNext: canNext,
      });
    }

    updateScrollInfo();
    track.addEventListener("scroll", updateScrollInfo);
    window.addEventListener("resize", updateScrollInfo);

    return () => {
      track.removeEventListener("scroll", updateScrollInfo);
      window.removeEventListener("resize", updateScrollInfo);
    };
  }, [rooms, loading]);

  // ===== Kéo card bằng chuột =====
  function handleCardPointerDown(event) {
    // Điện thoại đã vuốt được sẵn, chỉ xử lý chuột trái
    if (event.pointerType !== "mouse") {
      return;
    }
    if (event.button !== 0) {
      return;
    }

    const drag = cardDragRef.current;
    drag.isDown = true;
    drag.moved = false;
    drag.startX = event.clientX;
    drag.startScroll = trackRef.current.scrollLeft;
    drag.pointerId = event.pointerId;
  }

  function handleCardPointerMove(event) {
    const drag = cardDragRef.current;
    if (!drag.isDown) {
      return;
    }

    const distance = event.clientX - drag.startX;

    // Kéo quá 5px mới tính là đang kéo
    if (!drag.moved && Math.abs(distance) > 5) {
      drag.moved = true;
      setDragging(true);
      // Giữ chuột cho slider, kéo ra ngoài vẫn không bị mất
      trackRef.current.setPointerCapture(drag.pointerId);
    }

    if (drag.moved) {
      trackRef.current.scrollLeft = drag.startScroll - distance;
    }
  }

  function handleCardPointerUp() {
    const drag = cardDragRef.current;
    if (!drag.isDown) {
      return;
    }

    drag.isDown = false;
    setDragging(false);

    const track = trackRef.current;
    if (track.hasPointerCapture(drag.pointerId)) {
      track.releasePointerCapture(drag.pointerId);
    }
  }

  function handleCardPointerLeave() {
    // Chưa kéo mà chuột đã rời slider thì huỷ
    if (!cardDragRef.current.moved) {
      cardDragRef.current.isDown = false;
    }
  }

  // Vừa kéo xong thì không tính là click (không bấm nhầm nút tim)
  function handleClickCapture(event) {
    if (cardDragRef.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      cardDragRef.current.moved = false;
    }
  }

  // ===== Kéo thanh bên dưới =====
  function handleThumbPointerDown(event) {
    event.preventDefault();
    event.stopPropagation();

    const thumbDrag = thumbDragRef.current;
    thumbDrag.isDown = true;
    thumbDrag.startX = event.clientX;
    thumbDrag.startScroll = trackRef.current.scrollLeft;

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function handleThumbPointerMove(event) {
    const thumbDrag = thumbDragRef.current;
    if (!thumbDrag.isDown) {
      return;
    }

    const track = trackRef.current;
    const bar = barRef.current;

    const maxScroll = track.scrollWidth - track.clientWidth;
    const thumbPixelWidth = bar.clientWidth * (scrollInfo.thumbWidth / 100);
    const freeSpace = bar.clientWidth - thumbPixelWidth;

    if (freeSpace <= 0) {
      return;
    }

    const distance = event.clientX - thumbDrag.startX;
    track.scrollLeft =
      thumbDrag.startScroll + (distance / freeSpace) * maxScroll;
  }

  function handleThumbPointerUp(event) {
    thumbDragRef.current.isDown = false;
    setDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  // Bấm vào chỗ trống trên thanh thì nhảy tới vị trí đó
  function handleBarPointerDown(event) {
    const track = trackRef.current;
    const bar = barRef.current;

    const rect = bar.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const maxScroll = track.scrollWidth - track.clientWidth;

    track.scrollTo({ left: ratio * maxScroll, behavior: "smooth" });
  }

  // ===== Nút trái / phải =====
  function scrollByDirection(direction) {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    const distance = track.clientWidth * 0.8;
    track.scrollBy({ left: distance * direction, behavior: "smooth" });
  }

  function handlePrev() {
    scrollByDirection(-1);
  }

  function handleNext() {
    scrollByDirection(1);
  }

  // Không có phòng thì ẩn cả mục
  if (!loading && !error && rooms.length === 0) {
    return null;
  }

  // ===== Nội dung =====
  const cardWrapperClass = "w-[78%] shrink-0 snap-start sm:w-[300px]";

  let content;
  if (loading) {
    const skeletons = [];
    for (let i = 0; i < 5; i++) {
      skeletons.push(
        <div key={i} className={cardWrapperClass}>
          <RoomCardSkeleton />
        </div>,
      );
    }
    content = skeletons;
  } else {
    content = rooms.map((room) => (
      <div key={room._id} className={cardWrapperClass}>
        <RoomCard room={room} />
      </div>
    ));
  }

  let trackClass =
    "no-scrollbar flex select-none gap-5 overflow-x-auto pb-2 pt-1";
  if (dragging) {
    trackClass = trackClass + " cursor-grabbing";
  } else {
    trackClass = trackClass + " cursor-grab snap-x snap-mandatory";
  }

  // Nút 2 bên
  const arrowClass =
    "absolute top-[40%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:scale-105 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:flex";

  let prevButton = null;
  if (scrollInfo.canPrev) {
    prevButton = (
      <button
        type="button"
        onClick={handlePrev}
        className={arrowClass + " left-0 -translate-x-1/2"}
        aria-label={t("common.prev")}
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
    );
  }

  let nextButton = null;
  if (scrollInfo.canNext) {
    nextButton = (
      <button
        type="button"
        onClick={handleNext}
        className={arrowClass + " right-0 translate-x-1/2"}
        aria-label={t("common.next")}
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    );
  }

  // Thanh kéo dưới: chỉ hiện khi có thể cuộn
  let scrollBar = null;
  if (!loading && scrollInfo.thumbWidth < 99.5) {
    scrollBar = (
      <div
        ref={barRef}
        onPointerDown={handleBarPointerDown}
        className="relative mx-auto h-4 w-full max-w-sm cursor-pointer"
      >
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div
          onPointerDown={handleThumbPointerDown}
          onPointerMove={handleThumbPointerMove}
          onPointerUp={handleThumbPointerUp}
          onPointerCancel={handleThumbPointerUp}
          className="absolute top-1/2 h-2 -translate-y-1/2 cursor-grab touch-none rounded-full bg-emerald-500 transition-[height] hover:h-3 active:cursor-grabbing"
          style={{
            width: scrollInfo.thumbWidth + "%",
            left: scrollInfo.thumbLeft + "%",
          }}
        />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
        {icon}
        {title}
      </h2>

      {error ? (
        <p className="text-red-600">{t("errors." + error.code)}</p>
      ) : null}

      <div className="relative">
        {prevButton}

        <div
          ref={trackRef}
          className={trackClass}
          onPointerDown={handleCardPointerDown}
          onPointerMove={handleCardPointerMove}
          onPointerUp={handleCardPointerUp}
          onPointerCancel={handleCardPointerUp}
          onPointerLeave={handleCardPointerLeave}
          onClickCapture={handleClickCapture}
        >
          {content}
        </div>

        {nextButton}
      </div>

      {scrollBar}
    </section>
  );
}
