/*
 * Logo lấy từ Simple Icons (https://simpleicons.org) - CC0 1.0
 * Logo vẫn là thương hiệu của chủ sở hữu, chỉ dùng cho nút đăng nhập.
 */
import zaloLogo from "../assets/brands/zalo.svg";
import googleLogo from "../assets/brands/google.svg";

function BrandImage({ src, className }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
    />
  );
}

export function ZaloLogo({ className }) {
  return <BrandImage src={zaloLogo} className={className} />;
}

export function GoogleLogo({ className }) {
  return <BrandImage src={googleLogo} className={className} />;
}
