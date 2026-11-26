import { useEffect } from "react";
import { useLocation } from "react-router";

// Mỗi lần chuyển trang thì cuộn lên đầu
export default function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}
