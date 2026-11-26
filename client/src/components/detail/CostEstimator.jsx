import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPrice, formatShort } from "../../utils/format";

const FEE_KEYS = [
  "electricity",
  "water",
  "wifi",
  "trash",
  "parking",
  "management",
];

function NumberField({ label, value, min, max, onChange }) {
  function handleChange(event) {
    let number = Number(event.target.value);

    if (isNaN(number)) {
      number = min;
    }
    if (number < min) {
      number = min;
    }
    if (number > max) {
      number = max;
    }

    onChange(number);
  }

  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
    </label>
  );
}

export default function CostEstimator({ room }) {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const building = room.building;

  let maxPeople = 10;
  if (room.maxOccupants) {
    maxPeople = room.maxOccupants;
  }

  let defaultPeople = 2;
  if (maxPeople < 2) {
    defaultPeople = maxPeople;
  }

  const [people, setPeople] = useState(defaultPeople);
  const [vehicles, setVehicles] = useState(1);
  const [kwh, setKwh] = useState(100);
  const [waterM3, setWaterM3] = useState(4);

  let fees = {};
  if (building.fees) {
    fees = building.fees;
  }

  // Chỉ hiện ô nhập kWh / m³ khi tòa nhà tính theo đơn vị đó
  let usesKwh = false;
  if (
    fees.electricity &&
    fees.electricity.pricing === "fixed" &&
    fees.electricity.unit === "kwh"
  ) {
    usesKwh = true;
  }

  let usesM3 = false;
  if (
    fees.water &&
    fees.water.pricing === "fixed" &&
    fees.water.unit === "m3"
  ) {
    usesM3 = true;
  }

  // Tính từng khoản
  const rows = [];
  const statePriceLabels = [];

  for (const key of FEE_KEYS) {
    const fee = fees[key];
    if (!fee) {
      continue;
    }

    const label = t("fee." + key);

    if (fee.pricing === "state") {
      statePriceLabels.push(label);
      continue;
    }

    let quantity = 1;
    if (fee.unit === "kwh") {
      quantity = kwh;
    } else if (fee.unit === "m3") {
      quantity = waterM3 * people;
    } else if (fee.unit === "person") {
      quantity = people;
    } else if (fee.unit === "vehicle") {
      quantity = vehicles;
    }

    let detail = "";
    if (fee.unit !== "room" && fee.unit !== "month") {
      detail =
        formatShort(fee.amount) +
        " × " +
        quantity +
        " " +
        t("unit." + fee.unit);
    }

    rows.push({
      key: key,
      label: label,
      detail: detail,
      amount: fee.amount * quantity,
    });
  }

  let total = room.price;
  for (const row of rows) {
    total = total + row.amount;
  }

  let stateNote = null;
  if (statePriceLabels.length > 0) {
    stateNote = (
      <p className="text-xs text-amber-600 dark:text-amber-400">
        {t("estimator.statePriceNote", { items: statePriceLabels.join(", ") })}
      </p>
    );
  }

  let kwhField = null;
  if (usesKwh) {
    kwhField = (
      <NumberField
        label={t("estimator.electricityUsage")}
        value={kwh}
        min={0}
        max={2000}
        onChange={setKwh}
      />
    );
  }

  let m3Field = null;
  if (usesM3) {
    m3Field = (
      <NumberField
        label={t("estimator.waterUsage")}
        value={waterM3}
        min={0}
        max={50}
        onChange={setWaterM3}
      />
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-bold">{t("estimator.title")}</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <NumberField
          label={t("estimator.people")}
          value={people}
          min={1}
          max={maxPeople}
          onChange={setPeople}
        />
        <NumberField
          label={t("estimator.vehicles")}
          value={vehicles}
          min={0}
          max={10}
          onChange={setVehicles}
        />
        {kwhField}
        {m3Field}
      </div>

      <dl className="text-sm">
        <div className="flex justify-between gap-4 border-b border-slate-100 py-2 dark:border-slate-800">
          <dt className="text-slate-600 dark:text-slate-300">
            {t("estimator.rent")}
          </dt>
          <dd className="font-medium">{formatPrice(room.price, language)}</dd>
        </div>

        {rows.map((row) => (
          <div
            key={row.key}
            className="flex justify-between gap-4 border-b border-slate-100 py-2 dark:border-slate-800"
          >
            <dt className="text-slate-600 dark:text-slate-300">
              {row.label}
              {row.detail !== "" ? (
                <span className="ml-2 text-xs text-slate-400">
                  ({row.detail})
                </span>
              ) : null}
            </dt>
            <dd className="font-medium">{formatPrice(row.amount, language)}</dd>
          </div>
        ))}

        <div className="flex justify-between gap-4 pt-3 text-base">
          <dt className="font-bold">{t("estimator.total")}</dt>
          <dd className="font-bold text-emerald-700 dark:text-emerald-400">
            ≈ {formatPrice(total, language)}
          </dd>
        </div>
      </dl>

      {stateNote}
      <p className="text-xs text-slate-400">{t("estimator.disclaimer")}</p>
    </section>
  );
}
