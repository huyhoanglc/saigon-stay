// Mẫu email gửi cho người dùng.
// Email không chạy được CSS hiện đại (Gmail, Outlook bỏ thẻ <style>, không hỗ trợ flex/grid),
// nên dựng bằng <table> và viết style thẳng vào từng thẻ. Đây là cách làm chuẩn cho email.

const BRAND = "SaiGon Stay";
const BRAND_COLOR = "#059669"; // emerald-600, cùng màu chủ đạo của web
const TEXT_COLOR = "#1e293b";
const MUTED_COLOR = "#64748b";

const ROLE_NAMES = {
  sale: "Nhân viên kinh doanh (Sale)",
  admin: "Quản trị viên (Admin)",
  guest: "Khách hàng",
};

// Chống chèn HTML: tên người dùng do admin nhập, không được để nó thành thẻ HTML trong email
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Khung chung: logo chữ, nội dung, chân trang
function layout(preheader, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${BRAND}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
<!-- Dòng xem trước hiện ở danh sách hộp thư, ẩn trong nội dung -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td style="padding:0 8px 20px 8px;font-family:Arial,Helvetica,sans-serif;">
            <span style="font-size:22px;font-weight:bold;color:${BRAND_COLOR};">${BRAND}</span>
            <span style="display:block;font-size:11px;letter-spacing:2px;color:${MUTED_COLOR};text-transform:uppercase;">Ở đâu cũng như nhà</span>
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;border-radius:16px;padding:32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${TEXT_COLOR};">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 8px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${MUTED_COLOR};text-align:center;">
            Đây là email tự động từ ${BRAND}, vui lòng không trả lời email này.<br>
            Căn hộ dịch vụ tại TP. Hồ Chí Minh
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// Nút bấm to, dễ bấm trên điện thoại
function button(link, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
  <tr>
    <td style="border-radius:10px;background-color:${BRAND_COLOR};">
      <a href="${escapeHtml(link)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:10px;">${label}</a>
    </td>
  </tr>
</table>`;
}

// Link dự phòng: ứng dụng mail chặn nút thì vẫn copy được link
function fallbackLink(link) {
  return `<p style="margin:0;font-size:13px;line-height:20px;color:${MUTED_COLOR};">
  Nếu nút không bấm được, hãy sao chép đường dẫn sau vào trình duyệt:<br>
  <a href="${escapeHtml(link)}" style="color:${BRAND_COLOR};word-break:break-all;">${escapeHtml(link)}</a>
</p>`;
}

function infoRow(label, value) {
  return `<tr>
  <td style="padding:6px 0;width:130px;font-size:14px;color:${MUTED_COLOR};vertical-align:top;">${label}</td>
  <td style="padding:6px 0;font-size:14px;font-weight:bold;color:${TEXT_COLOR};">${escapeHtml(value)}</td>
</tr>`;
}

// Email mời nhân viên mới. Trả về { subject, html, text }
export function staffInviteEmail(data) {
  let roleName = ROLE_NAMES[data.role];
  if (!roleName) {
    roleName = data.role;
  }

  let rows = infoRow("Email đăng nhập", data.email) + infoRow("Vai trò", roleName);
  if (data.staffCode) {
    rows = rows + infoRow("Mã nhân viên", data.staffCode);
  }

  // Có mã nhân viên thì nhắc cách dùng mã khi tư vấn
  let staffCodeNote = "";
  if (data.staffCode) {
    staffCodeNote =
      " Khi tư vấn, hãy nhờ khách điền mã nhân viên <strong>" +
      escapeHtml(data.staffCode) +
      "</strong> vào form để hệ thống ghi nhận cho bạn.";
  }

  const body = `
<h1 style="margin:0 0 16px 0;font-size:22px;line-height:30px;color:${TEXT_COLOR};">Chào mừng ${escapeHtml(data.name)} đến với ${BRAND}!</h1>
<p style="margin:0 0 20px 0;">Tài khoản nhân viên của bạn đã được tạo. Hãy đặt mật khẩu để bắt đầu sử dụng.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
  <tr><td style="padding:12px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
  </td></tr>
</table>
${button(data.link, "Đặt mật khẩu")}
<p style="margin:0 0 20px 0;font-size:14px;color:${MUTED_COLOR};">Liên kết có hiệu lực trong <strong>${data.expiresHours} giờ</strong> và chỉ dùng được một lần.${staffCodeNote}</p>
${fallbackLink(data.link)}`;

  let staffCodeLine = "";
  if (data.staffCode) {
    staffCodeLine = "Mã nhân viên: " + data.staffCode + "\n";
  }
  const text =
    "Chào mừng " + data.name + " đến với " + BRAND + "!\n\n" +
    "Tài khoản nhân viên của bạn đã được tạo.\n" +
    "Email đăng nhập: " + data.email + "\n" +
    "Vai trò: " + roleName + "\n" +
    staffCodeLine +
    "\nĐặt mật khẩu tại: " + data.link + "\n" +
    "Liên kết có hiệu lực trong " + data.expiresHours + " giờ và chỉ dùng được một lần.\n\n" +
    "Đây là email tự động, vui lòng không trả lời.";

  return {
    subject: "[" + BRAND + "] Mời bạn kích hoạt tài khoản nhân viên",
    html: layout("Đặt mật khẩu để bắt đầu dùng tài khoản " + BRAND, body),
    text: text,
  };
}

// Email đặt lại mật khẩu (quên mật khẩu hoặc admin gửi). Trả về { subject, html, text }
export function resetPasswordEmail(data) {
  const body = `
<h1 style="margin:0 0 16px 0;font-size:22px;line-height:30px;color:${TEXT_COLOR};">Đặt lại mật khẩu</h1>
<p style="margin:0 0 8px 0;">Xin chào ${escapeHtml(data.name)},</p>
<p style="margin:0;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${escapeHtml(data.email)}</strong>.</p>
${button(data.link, "Đặt mật khẩu mới")}
<p style="margin:0 0 20px 0;font-size:14px;color:${MUTED_COLOR};">Liên kết có hiệu lực trong <strong>${data.expiresHours} giờ</strong> và chỉ dùng được một lần. Nếu bạn không yêu cầu, hãy bỏ qua email này, mật khẩu hiện tại vẫn giữ nguyên.</p>
${fallbackLink(data.link)}`;

  const text =
    "Xin chào " + data.name + ",\n\n" +
    "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản " + data.email + ".\n" +
    "Đặt mật khẩu mới tại: " + data.link + "\n" +
    "Liên kết có hiệu lực trong " + data.expiresHours + " giờ và chỉ dùng được một lần.\n" +
    "Nếu bạn không yêu cầu, hãy bỏ qua email này.\n\n" +
    "Đây là email tự động, vui lòng không trả lời.";

  return {
    subject: "[" + BRAND + "] Đặt lại mật khẩu",
    html: layout("Liên kết đặt lại mật khẩu tài khoản " + BRAND, body),
    text: text,
  };
}
