import { useState } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAdminItem } from "../../hooks/admin/useAdminItem";
import { useAdminBuildings } from "../../hooks/admin/useAdminBuildings";
import { createRoom, updateRoom } from "../../api/client";
import { PageHeader, StateMessage } from "../../components/admin/AdminUI";
import {
  FormSection,
  TextField,
  TextAreaField,
  SelectField,
  CheckboxField,
  FormActions,
  ErrorMessage,
} from "../../components/admin/FormFields";
import ImageUploader from "../../components/admin/ImageUploader";
import { useUploadTracker } from "../../hooks/admin/useUploadTracker";
import {
  LAYOUTS,
  WINDOWS,
  FURNITURES,
  ROOM_STATUSES,
} from "../../utils/constants";

function numberToText(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value);
}

// Chuyển dữ liệu phòng từ server sang state của form.
// defaultBuilding: tòa chọn sẵn khi thêm phòng từ trang lọc theo tòa.
function roomToForm(room, defaultBuilding) {
  if (!room) {
    return {
      building: defaultBuilding,
      code: "",
      title: "",
      description: "",
      floor: "",
      layout: "studio",
      separateKitchen: false,
      size: "",
      maxOccupants: "2",
      window: "outside",
      furniture: "full",
      privateWasher: false,
      price: "",
      originalPrice: "",
      depositMonths: "1",
      minLeaseMonths: "6",
      commission: "",
      status: "available",
      availableFrom: "",
      isHot: false,
      images: [],
    };
  }

  // Ô <input type="date"> cần dạng YYYY-MM-DD
  let availableFrom = "";
  if (room.availableFrom) {
    availableFrom = room.availableFrom.slice(0, 10);
  }

  let images = [];
  if (room.images) {
    images = room.images;
  }

  return {
    building: room.building,
    code: room.code,
    title: room.title || "",
    description: room.description || "",
    floor: numberToText(room.floor),
    layout: room.layout,
    separateKitchen: room.separateKitchen,
    size: numberToText(room.size),
    maxOccupants: numberToText(room.maxOccupants),
    window: room.window,
    furniture: room.furniture,
    privateWasher: room.privateWasher,
    price: numberToText(room.price),
    originalPrice: numberToText(room.originalPrice),
    depositMonths: numberToText(room.depositMonths),
    minLeaseMonths: numberToText(room.minLeaseMonths),
    commission: numberToText(room.commission),
    status: room.status,
    availableFrom: availableFrom,
    isHot: room.isHot,
    images: images,
  };
}

function RoomForm({ id, initialForm, buildings }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [errorCode, setErrorCode] = useState("");
  const { trackUpload, finishSave } = useUploadTracker();

  function handleChange(event) {
    const target = event.target;
    let value = target.value;
    if (target.type === "checkbox") {
      value = target.checked;
    }
    setForm((prev) => ({ ...prev, [target.name]: value }));
  }

  function handleImagesChange(images) {
    setForm((prev) => ({ ...prev, images: images }));
  }

  function handleCancel() {
    navigate("/admin/rooms");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrorCode("");

    // State của form có cùng tên trường với API nên gửi thẳng lên, server tự kiểm tra và đổi kiểu
    try {
      if (id) {
        await updateRoom(id, form);
      } else {
        await createRoom(form);
      }
      finishSave(form.images);
      navigate("/admin/rooms");
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

  const buildingOptions = [{ value: "", label: t("admin.rooms.chooseBuilding") }];
  for (const building of buildings) {
    buildingOptions.push({
      value: building._id,
      label: building.name + " (" + building.address.area + ")",
    });
  }

  const layoutOptions = [];
  for (const layout of LAYOUTS) {
    layoutOptions.push({ value: layout, label: t("layout." + layout) });
  }

  const windowOptions = [];
  for (const item of WINDOWS) {
    windowOptions.push({ value: item, label: t("window." + item) });
  }

  const furnitureOptions = [];
  for (const item of FURNITURES) {
    furnitureOptions.push({ value: item, label: t("furniture." + item) });
  }

  const statusOptions = [];
  for (const item of ROOM_STATUSES) {
    statusOptions.push({ value: item, label: t("roomStatus." + item) });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ErrorMessage message={errorMessage} />

      <FormSection title={t("admin.rooms.sectionBasic")}>
        <SelectField
          label={t("admin.rooms.building")}
          name="building"
          value={form.building}
          onChange={handleChange}
          options={buildingOptions}
          required
        />
        <TextField
          label={t("admin.rooms.code")}
          name="code"
          value={form.code}
          onChange={handleChange}
          required
          placeholder="101"
        />
        <TextField
          label={t("admin.rooms.floor")}
          name="floor"
          type="number"
          min="0"
          value={form.floor}
          onChange={handleChange}
          hint={t("admin.rooms.floorHint")}
        />
        <div className="sm:col-span-2 lg:col-span-3">
          <TextField
            label={t("admin.rooms.titleField")}
            name="title"
            value={form.title}
            onChange={handleChange}
          />
        </div>
        <TextAreaField
          label={t("detail.description")}
          name="description"
          value={form.description}
          onChange={handleChange}
        />
      </FormSection>

      <FormSection title={t("detail.roomInfo")}>
        <SelectField
          label={t("admin.rooms.layout")}
          name="layout"
          value={form.layout}
          onChange={handleChange}
          options={layoutOptions}
          required
        />
        <TextField
          label={t("admin.rooms.size")}
          name="size"
          type="number"
          step="any"
          min="1"
          value={form.size}
          onChange={handleChange}
          required
        />
        <TextField
          label={t("detail.maxOccupants")}
          name="maxOccupants"
          type="number"
          min="1"
          value={form.maxOccupants}
          onChange={handleChange}
        />
        <SelectField
          label={t("detail.window")}
          name="window"
          value={form.window}
          onChange={handleChange}
          options={windowOptions}
        />
        <SelectField
          label={t("detail.furniture")}
          name="furniture"
          value={form.furniture}
          onChange={handleChange}
          options={furnitureOptions}
        />
        <div className="hidden lg:block" />
        <CheckboxField
          label={t("detail.separateKitchen")}
          name="separateKitchen"
          checked={form.separateKitchen}
          onChange={handleChange}
        />
        <CheckboxField
          label={t("detail.privateWasher")}
          name="privateWasher"
          checked={form.privateWasher}
          onChange={handleChange}
        />
      </FormSection>

      <FormSection title={t("admin.rooms.sectionPricing")}>
        <TextField
          label={t("admin.rooms.price")}
          name="price"
          type="number"
          min="0"
          step="1000"
          value={form.price}
          onChange={handleChange}
          required
        />
        <TextField
          label={t("admin.rooms.originalPrice")}
          name="originalPrice"
          type="number"
          min="0"
          step="1000"
          value={form.originalPrice}
          onChange={handleChange}
          hint={t("admin.rooms.originalPriceHint")}
        />
        <TextField
          label={t("admin.rooms.commission")}
          name="commission"
          type="number"
          min="0"
          step="1000"
          value={form.commission}
          onChange={handleChange}
          hint={t("admin.rooms.commissionHint")}
        />
        <TextField
          label={t("admin.rooms.depositMonths")}
          name="depositMonths"
          type="number"
          min="0"
          step="0.5"
          value={form.depositMonths}
          onChange={handleChange}
        />
        <TextField
          label={t("admin.rooms.minLeaseMonths")}
          name="minLeaseMonths"
          type="number"
          min="0"
          value={form.minLeaseMonths}
          onChange={handleChange}
        />
      </FormSection>

      <FormSection title={t("admin.rooms.sectionStatus")}>
        <SelectField
          label={t("admin.rooms.status")}
          name="status"
          value={form.status}
          onChange={handleChange}
          options={statusOptions}
        />
        <TextField
          label={t("admin.rooms.availableFrom")}
          name="availableFrom"
          type="date"
          value={form.availableFrom}
          onChange={handleChange}
        />
        <div className="flex items-end">
          <CheckboxField
            label={t("admin.rooms.isHot")}
            name="isHot"
            checked={form.isHot}
            onChange={handleChange}
          />
        </div>
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

export default function AdminRoomFormPage() {
  const { t } = useTranslation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const id = params.id;
  const roomResult = useAdminItem("room", id);
  const buildingsResult = useAdminBuildings(0);

  let title = t("admin.rooms.newTitle");
  if (id) {
    title = t("admin.rooms.editTitle");
  }

  let content;
  if (roomResult.loading || buildingsResult.loading) {
    content = <StateMessage>{t("common.loading")}</StateMessage>;
  } else if (roomResult.error) {
    content = <StateMessage isError>{t("errors." + roomResult.error.code)}</StateMessage>;
  } else if (buildingsResult.error) {
    content = (
      <StateMessage isError>{t("errors." + buildingsResult.error.code)}</StateMessage>
    );
  } else if (buildingsResult.buildings.length === 0) {
    // Chưa có tòa nhà thì chưa thêm phòng được
    content = (
      <StateMessage>
        {t("admin.rooms.noBuildingYet")}{" "}
        <Link
          to="/admin/buildings/new"
          className="font-medium text-emerald-700 underline dark:text-emerald-400"
        >
          {t("admin.buildings.add")}
        </Link>
      </StateMessage>
    );
  } else {
    const defaultBuilding = searchParams.get("building") || "";
    content = (
      <RoomForm
        key={id}
        id={id}
        initialForm={roomToForm(roomResult.item, defaultBuilding)}
        buildings={buildingsResult.buildings}
      />
    );
  }

  return (
    <div>
      <PageHeader title={title} />
      {content}
    </div>
  );
}
