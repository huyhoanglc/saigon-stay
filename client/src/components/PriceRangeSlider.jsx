import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPrice } from "../utils/format";

const MIN = 0;
const MAX = 30000000;
const STEP = 500000;

function toNumber(value, fallback) {
  if (value === "" || value === undefined || value === null) {
    return fallback;
  }

  const number = Number(value);
  if (isNaN(number)) {
    return fallback;
  }

  return number;
}

export default function PriceRangeSlider({ minPrice, maxPrice, onChange }) {
  const { t, i18n } = useTranslation();

  // Giá trị đang kéo trên màn hình
  const [minValue, setMinValue] = useState(toNumber(minPrice, MIN));
  const [maxValue, setMaxValue] = useState(toNumber(maxPrice, MAX));

  // Bộ lọc bên ngoài đổi (VD: bấm "Xoá bộ lọc") thì cập nhật lại thanh kéo
  useEffect(() => {
    setMinValue(toNumber(minPrice, MIN));
    setMaxValue(toNumber(maxPrice, MAX));
  }, [minPrice, maxPrice]);

  // Ngừng kéo 400ms mới gửi lên, tránh gọi API liên tục
  useEffect(() => {
    const timer = setTimeout(() => {
      let newMin = "";
      if (minValue > MIN) {
        newMin = String(minValue);
      }

      let newMax = "";
      if (maxValue < MAX) {
        newMax = String(maxValue);
      }

      // Không có gì thay đổi thì thôi
      if (newMin === minPrice && newMax === maxPrice) {
        return;
      }

      onChange(newMin, newMax);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [minValue, maxValue, minPrice, maxPrice, onChange]);

  function handleMinChange(event) {
    let value = Number(event.target.value);

    // Không cho đầu trái vượt qua đầu phải
    if (value > maxValue - STEP) {
      value = maxValue - STEP;
    }

    setMinValue(value);
  }

  function handleMaxChange(event) {
    let value = Number(event.target.value);

    // Không cho đầu phải vượt qua đầu trái
    if (value < minValue + STEP) {
      value = minValue + STEP;
    }

    setMaxValue(value);
  }

  // Vị trí đoạn màu xanh giữa 2 nút
  const leftPercent = ((minValue - MIN) / (MAX - MIN)) * 100;
  const rightPercent = ((maxValue - MIN) / (MAX - MIN)) * 100;

  const minLabel = formatPrice(minValue, i18n.language);

  let maxLabel = formatPrice(maxValue, i18n.language);
  if (maxValue === MAX) {
    maxLabel = maxLabel + "+";
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between text-xs font-medium text-slate-700 dark:text-slate-200">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>

      <div className="relative h-5">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-emerald-500"
          style={{
            left: leftPercent + "%",
            width: rightPercent - leftPercent + "%",
          }}
        />

        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={minValue}
          onChange={handleMinChange}
          className="range-thumb absolute inset-0 h-5 w-full"
          aria-label={t("filters.minPrice")}
        />
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={maxValue}
          onChange={handleMaxChange}
          className="range-thumb absolute inset-0 h-5 w-full"
          aria-label={t("filters.maxPrice")}
        />
      </div>
    </div>
  );
}
