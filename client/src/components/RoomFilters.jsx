import { useTranslation } from "react-i18next";
import PriceRangeSlider from "./PriceRangeSlider";

const AREAS = [
  "Quận 1",
  "Quận 3",
  "Quận 7",
  "Bình Thạnh",
  "Phú Nhuận",
  "Thủ Đức",
];
const LAYOUTS = ["studio", "duplex", "1br", "2br"];
const SORTS = ["newest", "price_asc", "price_desc"];

export default function RoomFilters({ filters, onChange, defaults }) {
  const { t } = useTranslation();

  function handleSelectChange(event) {
    const name = event.target.name;
    const value = event.target.value;

    const newFilters = { ...filters };
    newFilters[name] = value;

    onChange(newFilters);
  }

  function handlePriceChange(newMin, newMax) {
    const newFilters = { ...filters };
    newFilters.minPrice = newMin;
    newFilters.maxPrice = newMax;

    onChange(newFilters);
  }

  function handleReset() {
    onChange(defaults);
  }

  const labelClass =
    "flex flex-col gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400";
  const selectClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
      <label className={labelClass}>
        {t("filters.area")}
        <select
          name="area"
          value={filters.area}
          onChange={handleSelectChange}
          className={selectClass}
        >
          <option value="">{t("filters.allAreas")}</option>
          {AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        {t("filters.layout")}
        <select
          name="layout"
          value={filters.layout}
          onChange={handleSelectChange}
          className={selectClass}
        >
          <option value="">{t("filters.allLayouts")}</option>
          {LAYOUTS.map((layout) => (
            <option key={layout} value={layout}>
              {t("layout." + layout)}
            </option>
          ))}
        </select>
      </label>

      <div className={labelClass + " sm:col-span-2 lg:w-80"}>
        {t("filters.priceRange")}
        <PriceRangeSlider
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onChange={handlePriceChange}
        />
      </div>

      <label className={labelClass}>
        {t("filters.sort")}
        <select
          name="sort"
          value={filters.sort}
          onChange={handleSelectChange}
          className={selectClass}
        >
          {SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {t("sort." + sort)}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={handleReset}
        className="justify-self-start py-2 text-sm text-slate-500 underline hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 lg:ml-auto"
      >
        {t("filters.reset")}
      </button>
    </div>
  );
}
