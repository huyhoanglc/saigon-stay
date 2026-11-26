/*
 * Logo lấy từ Simple Icons (https://simpleicons.org) - CC0 1.0
 * Logo vẫn là thương hiệu của chủ sở hữu, chỉ dùng cho nút chia sẻ.
 */
import facebookLogo from "../assets/brands/facebook.svg";
import messengerLogo from "../assets/brands/messenger.svg";
import whatsappLogo from "../assets/brands/whatsapp.svg";
import zaloLogo from "../assets/brands/zalo.svg";

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

export function FacebookLogo({ className }) {
  return <BrandImage src={facebookLogo} className={className} />;
}

export function MessengerLogo({ className }) {
  return <BrandImage src={messengerLogo} className={className} />;
}

export function WhatsappLogo({ className }) {
  return <BrandImage src={whatsappLogo} className={className} />;
}

export function ZaloLogo({ className }) {
  return <BrandImage src={zaloLogo} className={className} />;
}
