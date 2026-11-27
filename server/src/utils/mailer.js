// Gửi email qua Resend (https://resend.com) bằng fetch có sẵn của Node, không cần thư viện.
// Biến môi trường:
//   RESEND_API_KEY  khoá API của Resend (bắt đầu bằng "re_")
//   MAIL_FROM       người gửi, vd "SaiGon Stay <no-reply@huyhoanggia.id.vn>"
//                   (domain phải được xác thực trên Resend, nếu không mail bị từ chối)

const RESEND_API = "https://api.resend.com/emails";

export class MailError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function isMailConfigured() {
  if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) {
    return true;
  }
  return false;
}

// Gửi 1 email. html: bản đẹp, text: bản chữ thường (cho ứng dụng mail không hiện HTML, và giảm bị coi là spam)
export async function sendMail(to, subject, html, text) {
  if (!isMailConfigured()) {
    throw new MailError("MAIL_NOT_CONFIGURED", "Chưa cấu hình RESEND_API_KEY / MAIL_FROM");
  }

  let response;
  try {
    response = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [to],
        subject: subject,
        html: html,
        text: text,
      }),
    });
  } catch (err) {
    throw new MailError("MAIL_FAILED", "Không kết nối được Resend: " + err.message);
  }

  if (!response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      detail = data.message || JSON.stringify(data);
    } catch {
      detail = "";
    }
    // Ghi log để dò lỗi trên Render (lời nhắn của Resend không chứa API key)
    console.error("Resend lỗi " + response.status + ": " + detail);
    throw new MailError("MAIL_FAILED", "Gửi email thất bại (" + response.status + ")");
  }
}
