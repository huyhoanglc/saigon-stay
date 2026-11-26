export default function Container({ children, className }) {
  let classes = "mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10";

  if (className) {
    classes = classes + " " + className;
  }

  return <div className={classes}>{children}</div>;
}
