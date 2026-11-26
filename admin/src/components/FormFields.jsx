// Các ô nhập dùng chung cho form admin, để class Tailwind không bị lặp lại khắp nơi

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";

function RequiredMark({ required }) {
  if (!required) {
    return null;
  }
  return <span className="text-rose-500"> *</span>;
}

export function FormSection({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

export function TextField({
  label,
  name,
  value,
  onChange,
  type,
  required,
  placeholder,
  hint,
  step,
  min,
}) {
  let inputType = "text";
  if (type) {
    inputType = type;
  }

  let hintText = null;
  if (hint) {
    hintText = (
      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
        {hint}
      </span>
    );
  }

  return (
    <label className={labelClass}>
      {label}
      <RequiredMark required={required} />
      <input
        type={inputType}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        step={step}
        min={min}
        className={inputClass}
      />
      {hintText}
    </label>
  );
}

export function TextAreaField({ label, name, value, onChange, rows }) {
  let rowCount = 4;
  if (rows) {
    rowCount = rows;
  }

  return (
    <label className={labelClass + " sm:col-span-2 lg:col-span-3"}>
      {label}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rowCount}
        className={inputClass}
      />
    </label>
  );
}

// options: mảng { value, label }
export function SelectField({ label, name, value, onChange, options, required }) {
  return (
    <label className={labelClass}>
      {label}
      <RequiredMark required={required} />
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CheckboxField({ label, name, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-emerald-600"
      />
      {label}
    </label>
  );
}

// Thanh nút Lưu / Huỷ ở cuối form, dính đáy màn hình để form dài vẫn bấm được ngay
export function FormActions({ saving, saveLabel, savingLabel, cancelLabel, onCancel }) {
  let buttonText = saveLabel;
  if (saving) {
    buttonText = savingLabel;
  }

  return (
    <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-slate-200 bg-stone-50/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:mx-0 sm:rounded-xl sm:border">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {buttonText}
      </button>
    </div>
  );
}

// Hộp báo lỗi màu đỏ, message rỗng thì không hiện gì
export function ErrorMessage({ message }) {
  if (!message) {
    return null;
  }
  return (
    <p
      role="alert"
      className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
    >
      {message}
    </p>
  );
}
