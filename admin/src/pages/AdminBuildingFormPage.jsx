import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAdminItem } from "../hooks/useAdminItem";
import { createBuilding, updateBuilding } from "../api/client";
import { PageHeader, StateMessage } from "../components/AdminUI";
import {
  FormSection,
  TextField,
  TextAreaField,
  SelectField,
  CheckboxField,
  FormActions,
  ErrorMessage,
} from "../components/FormFields";
import ImageUploader from "../components/ImageUploader";
import { useUploadTracker } from "../hooks/useUploadTracker";
import {
  AREAS,
  ROAD_TYPES,
  PARKING_TYPES,
  FEE_KEYS,
  FEE_UNITS,
} from "../utils/constants";

// Đơn vị gợi ý sẵn cho từng loại phí khi admin chọn "giá cố định"
const DEFAULT_FEE_UNITS = {
  electricity: "kwh",
  water: "m3",
  wifi: "room",
  trash: "room",
  parking: "vehicle",
  management: "room",
};

// Số từ server → chuỗi cho ô input (không có thì để trống)
function numberToText(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value);
}

// Chuyển dữ liệu tòa nhà từ server sang state của form (ô input luôn là chuỗi)
function buildingToForm(building) {
  const fees = {};
  for (const key of FEE_KEYS) {
    fees[key] = { pricing: "none", amount: "", unit: DEFAULT_FEE_UNITS[key] };
  }

  // Form thêm mới: giá trị mặc định
  if (!building) {
    return {
      name: "",
      houseNumber: "",
      street: "",
      ward: "",
      area: "",
      lng: "",
      lat: "",
      roadType: "car_alley",
      isDeadEnd: false,
      floors: "",
      hasElevator: false,
      parking: "garage",
      hasSecurity: false,
      hasFireSafety: false,
      petAllowed: false,
      cleaningPerWeek: "0",
      freeHours: true,
      isNewOpening: false,
      fees: fees,
      ownerName: "",
      ownerPhone: "",
      managerName: "",
      managerPhone: "",
      description: "",
      images: [],
    };
  }

  if (building.fees) {
    for (const key of FEE_KEYS) {
      const fee = building.fees[key];
      if (fee) {
        let unit = DEFAULT_FEE_UNITS[key];
        if (fee.unit) {
          unit = fee.unit;
        }
        fees[key] = {
          pricing: fee.pricing,
          amount: numberToText(fee.amount),
          unit: unit,
        };
      }
    }
  }

  let contact = {};
  if (building.contact) {
    contact = building.contact;
  }

  let images = [];
  if (building.images) {
    images = building.images;
  }

  return {
    name: building.name,
    houseNumber: building.address.houseNumber,
    street: building.address.street,
    ward: building.address.ward,
    area: building.address.area,
    lng: numberToText(building.location.coordinates[0]),
    lat: numberToText(building.location.coordinates[1]),
    roadType: building.roadType,
    isDeadEnd: building.isDeadEnd,
    floors: numberToText(building.floors),
    hasElevator: building.hasElevator,
    parking: building.parking,
    hasSecurity: building.hasSecurity,
    hasFireSafety: building.hasFireSafety,
    petAllowed: building.petAllowed,
    cleaningPerWeek: numberToText(building.cleaningPerWeek),
    freeHours: building.freeHours,
    isNewOpening: building.isNewOpening,
    fees: fees,
    ownerName: contact.ownerName || "",
    ownerPhone: contact.ownerPhone || "",
    managerName: contact.managerName || "",
    managerPhone: contact.managerPhone || "",
    description: building.description,
    images: images,
  };
}

// Chuyển state của form thành dữ liệu gửi lên API
function formToPayload(form) {
  const fees = {};
  for (const key of FEE_KEYS) {
    const fee = form.fees[key];
    if (fee.pricing === "state") {
      fees[key] = { pricing: "state" };
    } else if (fee.pricing === "fixed") {
      fees[key] = { pricing: "fixed", amount: fee.amount, unit: fee.unit };
    }
    // pricing "none": không gửi, nghĩa là tòa này không có phí đó
  }

  return {
    name: form.name,
    address: {
      houseNumber: form.houseNumber,
      street: form.street,
      ward: form.ward,
      area: form.area,
    },
    // GeoJSON: kinh độ trước, vĩ độ sau
    location: { coordinates: [form.lng, form.lat] },
    roadType: form.roadType,
    isDeadEnd: form.isDeadEnd,
    floors: form.floors,
    hasElevator: form.hasElevator,
    parking: form.parking,
    hasSecurity: form.hasSecurity,
    hasFireSafety: form.hasFireSafety,
    petAllowed: form.petAllowed,
    cleaningPerWeek: form.cleaningPerWeek,
    freeHours: form.freeHours,
    isNewOpening: form.isNewOpening,
    fees: fees,
    contact: {
      ownerName: form.ownerName,
      ownerPhone: form.ownerPhone,
      managerName: form.managerName,
      managerPhone: form.managerPhone,
    },
    description: form.description,
    images: form.images,
  };
}

function BuildingForm({ id, initialForm }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [errorCode, setErrorCode] = useState("");
  const { trackUpload, finishSave } = useUploadTracker();

  // Dùng chung cho mọi ô input / select / checkbox, dựa vào thuộc tính name
  function handleChange(event) {
    const target = event.target;
    let value = target.value;
    if (target.type === "checkbox") {
      value = target.checked;
    }
    setForm((prev) => ({ ...prev, [target.name]: value }));
  }

  function handleFeeChange(feeKey, field, value) {
    setForm((prev) => {
      const newFee = { ...prev.fees[feeKey], [field]: value };
      const newFees = { ...prev.fees, [feeKey]: newFee };
      return { ...prev, fees: newFees };
    });
  }

  function handleImagesChange(images) {
    setForm((prev) => ({ ...prev, images: images }));
  }

  function handleCancel() {
    navigate("/buildings");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrorCode("");

    const payload = formToPayload(form);
    try {
      if (id) {
        await updateBuilding(id, payload);
      } else {
        await createBuilding(payload);
      }
      finishSave(form.images);
      navigate("/buildings");
    } catch (err) {
      setErrorCode(err.code);
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  let errorMessage = "";
  if (errorCode) {
    errorMessage = t("errors." + errorCode);
  }

  const roadOptions = [];
  for (const road of ROAD_TYPES) {
    roadOptions.push({ value: road, label: t("road." + road) });
  }

  const parkingOptions = [];
  for (const parking of PARKING_TYPES) {
    parkingOptions.push({ value: parking, label: t("parking." + parking) });
  }

  const pricingOptions = [
    { value: "none", label: t("admin.buildings.pricingNone") },
    { value: "fixed", label: t("admin.buildings.pricingFixed") },
    { value: "state", label: t("admin.buildings.pricingState") },
  ];

  const unitOptions = [];
  for (const unit of FEE_UNITS) {
    unitOptions.push({ value: unit, label: t("unit." + unit) });
  }

  const smallInputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ErrorMessage message={errorMessage} />

      <FormSection title={t("admin.buildings.sectionBasic")}>
        <TextField
          label={t("admin.buildings.name")}
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <SelectField
          label={t("admin.buildings.roadType")}
          name="roadType"
          value={form.roadType}
          onChange={handleChange}
          options={roadOptions}
          required
        />
        <TextField
          label={t("admin.buildings.floors")}
          name="floors"
          type="number"
          min="1"
          value={form.floors}
          onChange={handleChange}
        />
      </FormSection>

      <FormSection title={t("admin.buildings.sectionAddress")}>
        <TextField
          label={t("admin.buildings.houseNumber")}
          name="houseNumber"
          value={form.houseNumber}
          onChange={handleChange}
          required
          hint={t("admin.buildings.houseNumberHint")}
        />
        <TextField
          label={t("admin.buildings.street")}
          name="street"
          value={form.street}
          onChange={handleChange}
          required
        />
        <TextField
          label={t("admin.buildings.ward")}
          name="ward"
          value={form.ward}
          onChange={handleChange}
          required
          placeholder={t("admin.buildings.wardPlaceholder")}
        />
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("admin.buildings.area")}
          <span className="text-rose-500"> *</span>
          {/* datalist: gợi ý các khu vực có sẵn nhưng vẫn cho gõ khu vực mới */}
          <input
            name="area"
            list="area-options"
            value={form.area}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <datalist id="area-options">
            {AREAS.map((area) => (
              <option key={area} value={area} />
            ))}
          </datalist>
        </label>
        <TextField
          label={t("admin.buildings.lat")}
          name="lat"
          type="number"
          step="any"
          value={form.lat}
          onChange={handleChange}
          required
          placeholder="10.7769"
        />
        <TextField
          label={t("admin.buildings.lng")}
          name="lng"
          type="number"
          step="any"
          value={form.lng}
          onChange={handleChange}
          required
          placeholder="106.7009"
          hint={t("admin.buildings.locationHint")}
        />
      </FormSection>

      <FormSection title={t("admin.buildings.sectionAmenities")}>
        <SelectField
          label={t("admin.buildings.parking")}
          name="parking"
          value={form.parking}
          onChange={handleChange}
          options={parkingOptions}
        />
        <TextField
          label={t("admin.buildings.cleaningPerWeek")}
          name="cleaningPerWeek"
          type="number"
          min="0"
          value={form.cleaningPerWeek}
          onChange={handleChange}
        />
        <div className="hidden lg:block" />
        <CheckboxField label={t("amenity.elevator")} name="hasElevator" checked={form.hasElevator} onChange={handleChange} />
        <CheckboxField label={t("amenity.security")} name="hasSecurity" checked={form.hasSecurity} onChange={handleChange} />
        <CheckboxField label={t("amenity.fireSafety")} name="hasFireSafety" checked={form.hasFireSafety} onChange={handleChange} />
        <CheckboxField label={t("amenity.pet")} name="petAllowed" checked={form.petAllowed} onChange={handleChange} />
        <CheckboxField label={t("amenity.freeHours")} name="freeHours" checked={form.freeHours} onChange={handleChange} />
        <CheckboxField label={t("amenity.deadEnd")} name="isDeadEnd" checked={form.isDeadEnd} onChange={handleChange} />
        <CheckboxField label={t("admin.buildings.isNewOpening")} name="isNewOpening" checked={form.isNewOpening} onChange={handleChange} />
      </FormSection>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
          {t("detail.fees")}
        </h2>
        <div className="space-y-3">
          {FEE_KEYS.map((key) => {
            const fee = form.fees[key];
            // Chỉ hiện ô số tiền và đơn vị khi là giá cố định
            let fixedInputs = null;
            if (fee.pricing === "fixed") {
              fixedInputs = (
                <>
                  <input
                    type="number"
                    min="0"
                    value={fee.amount}
                    onChange={(e) => handleFeeChange(key, "amount", e.target.value)}
                    required
                    placeholder={t("admin.buildings.amount")}
                    aria-label={t("fee." + key) + " - " + t("admin.buildings.amount")}
                    className={smallInputClass}
                  />
                  <select
                    value={fee.unit}
                    onChange={(e) => handleFeeChange(key, "unit", e.target.value)}
                    aria-label={t("fee." + key) + " - " + t("admin.buildings.unit")}
                    className={smallInputClass}
                  >
                    {unitOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        / {option.label}
                      </option>
                    ))}
                  </select>
                </>
              );
            }

            return (
              <div
                key={key}
                className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[140px_1fr_1fr_1fr]"
              >
                <span className="col-span-2 text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-1">
                  {t("fee." + key)}
                </span>
                <select
                  value={fee.pricing}
                  onChange={(e) => handleFeeChange(key, "pricing", e.target.value)}
                  aria-label={t("fee." + key)}
                  className={smallInputClass + " col-span-2 sm:col-span-1"}
                >
                  {pricingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fixedInputs}
              </div>
            );
          })}
        </div>
      </section>

      <FormSection title={t("admin.buildings.sectionContact")}>
        <TextField label={t("admin.buildings.ownerName")} name="ownerName" value={form.ownerName} onChange={handleChange} />
        <TextField label={t("admin.buildings.ownerPhone")} name="ownerPhone" type="tel" value={form.ownerPhone} onChange={handleChange} />
        <div className="hidden lg:block" />
        <TextField label={t("admin.buildings.managerName")} name="managerName" value={form.managerName} onChange={handleChange} />
        <TextField label={t("admin.buildings.managerPhone")} name="managerPhone" type="tel" value={form.managerPhone} onChange={handleChange} />
      </FormSection>

      <FormSection title={t("detail.description")}>
        <TextAreaField
          label={t("detail.description")}
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={5}
        />
      </FormSection>

      <FormSection title={t("admin.images.title")}>
        <ImageUploader
          images={form.images}
          onChange={handleImagesChange}
          onUploaded={trackUpload}
        />
      </FormSection>

      <FormActions
        saving={saving}
        saveLabel={t("admin.common.save")}
        savingLabel={t("admin.common.saving")}
        cancelLabel={t("admin.common.cancel")}
        onCancel={handleCancel}
      />
    </form>
  );
}

export default function AdminBuildingFormPage() {
  const { t } = useTranslation();
  const params = useParams();
  // Đường dẫn /admin/buildings/new thì không có id → form thêm mới
  const id = params.id;
  const { item, loading, error } = useAdminItem("building", id);

  let title = t("admin.buildings.newTitle");
  if (id) {
    title = t("admin.buildings.editTitle");
  }

  let content;
  if (loading) {
    content = <StateMessage>{t("common.loading")}</StateMessage>;
  } else if (error) {
    content = <StateMessage isError>{t("errors." + error.code)}</StateMessage>;
  } else {
    // key: đổi sang tòa khác thì form được tạo lại với dữ liệu mới
    content = <BuildingForm key={id} id={id} initialForm={buildingToForm(item)} />;
  }

  return (
    <div>
      <PageHeader title={title} />
      {content}
    </div>
  );
}
