// Hộp báo lỗi màu đỏ, message rỗng thì không hiện gì
export default function ErrorMessage({ message }) {
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
