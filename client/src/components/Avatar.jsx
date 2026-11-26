// Ảnh đại diện tròn. Chưa có ảnh thì hiện chữ cái đầu của tên.
export default function Avatar({ src, name, className }) {
  let sizeClass = "h-9 w-9 text-sm";
  if (className) {
    sizeClass = className;
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        className={sizeClass + " shrink-0 rounded-full object-cover ring-1 ring-black/10"}
      />
    );
  }

  let initial = "?";
  if (name) {
    initial = name.trim().charAt(0).toUpperCase();
  }

  return (
    <span
      aria-hidden="true"
      className={
        sizeClass +
        " flex shrink-0 items-center justify-center rounded-full bg-emerald-600 font-semibold text-white"
      }
    >
      {initial}
    </span>
  );
}
