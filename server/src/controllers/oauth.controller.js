// Đăng nhập / liên kết bằng Google và Zalo theo chuẩn OAuth 2.0 (luồng "authorization code").
// Các bước:
//   1. Trình duyệt mở /api/auth/<provider>/start → server chuyển hướng sang trang đăng nhập của Google/Zalo
//   2. Người dùng đồng ý → Google/Zalo chuyển về /api/auth/<provider>/callback?code=...&state=...
//   3. Server đổi code lấy thông tin người dùng (gọi thẳng từ server, client secret không lộ ra trình duyệt)
//   4. Tìm hoặc tạo user, đặt cookie đăng nhập, chuyển về trang web
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  REFRESH_COOKIE,
  getCookieOptions,
  setAuthCookies,
  verifyRefreshToken,
} from "../utils/tokens.js";
import { isAllowedOrigin, getDefaultOrigin } from "../utils/origins.js";

const STATE_COOKIE = "oauth_state";
const STATE_MINUTES = 10;

// ===== Google =====

const google = {
  idField: "googleId",

  isConfigured() {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      return true;
    }
    return false;
  },

  buildAuthUrl(redirectUri, state) {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state: state,
      prompt: "select_account", // luôn cho chọn tài khoản Google
    });
    return "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString();
  },

  async fetchProfile(code, redirectUri) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const data = await response.json();
    if (!data.id_token) {
      throw new Error("Google không trả về id_token: " + JSON.stringify(data));
    }

    // id_token nhận trực tiếp từ Google qua HTTPS nên theo chuẩn OpenID Connect
    // không bắt buộc kiểm tra chữ ký, nhưng vẫn kiểm tra token đúng là cấp cho app mình và còn hạn
    const payload = jwt.decode(data.id_token);
    if (!payload) {
      throw new Error("id_token không đọc được");
    }
    const validIssuers = ["https://accounts.google.com", "accounts.google.com"];
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw new Error("id_token không phải của app này");
    }
    if (!validIssuers.includes(payload.iss)) {
      throw new Error("id_token sai nơi cấp");
    }
    if (payload.exp * 1000 < Date.now()) {
      throw new Error("id_token đã hết hạn");
    }

    return {
      id: String(payload.sub),
      email: payload.email || "",
      emailVerified: payload.email_verified === true,
      name: payload.name || "",
      avatar: payload.picture || "",
    };
  },
};

// ===== Zalo =====

// Mã lỗi Zalo trả về khi request lấy thông tin cá nhân đến từ IP ngoài Việt Nam
const ZALO_IP_LIMITED = -501;

async function fetchZaloMe(accessToken, fields) {
  const response = await fetch("https://graph.zalo.me/v2.0/me?fields=" + fields, {
    headers: { access_token: accessToken },
  });
  return response.json();
}
// Zalo bắt buộc dùng PKCE: gửi code_challenge lúc bắt đầu, gửi code_verifier lúc đổi code.
// Zalo không cung cấp email.

const zalo = {
  idField: "zaloId",

  isConfigured() {
    if (process.env.ZALO_APP_ID && process.env.ZALO_APP_SECRET) {
      return true;
    }
    return false;
  },

  buildAuthUrl(redirectUri, state, codeChallenge) {
    const params = new URLSearchParams({
      app_id: process.env.ZALO_APP_ID,
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      state: state,
    });
    return "https://oauth.zaloapp.com/v4/permission?" + params.toString();
  },

  async fetchProfile(code, redirectUri, codeVerifier) {
    const tokenResponse = await fetch(
      "https://oauth.zaloapp.com/v4/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          secret_key: process.env.ZALO_APP_SECRET,
        },
        body: new URLSearchParams({
          code: code,
          app_id: process.env.ZALO_APP_ID,
          grant_type: "authorization_code",
          code_verifier: codeVerifier,
        }),
      },
    );
    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error("Zalo không trả về access_token: " + JSON.stringify(tokenData));
    }

    let profile = await fetchZaloMe(tokenData.access_token, "id,name,picture");

    // Zalo chặn lấy thông tin cá nhân (tên, ảnh) khi server không đặt ở Việt Nam
    // (Render đang ở Singapore) → lỗi -501. Khi đó chỉ xin id: đủ để nhận ra tài khoản,
    // tên và ảnh người dùng tự sửa ở trang cá nhân.
    if (!profile.id && profile.error === ZALO_IP_LIMITED) {
      profile = await fetchZaloMe(tokenData.access_token, "id");
    }

    if (!profile.id) {
      throw new Error("Zalo không trả về thông tin: " + JSON.stringify(profile));
    }

    let avatar = "";
    if (profile.picture && profile.picture.data && profile.picture.data.url) {
      avatar = profile.picture.data.url;
    }

    return {
      id: String(profile.id),
      email: "",
      emailVerified: false,
      name: profile.name || "",
      avatar: avatar,
    };
  },
};

const PROVIDERS = { google: google, zalo: zalo };

// ===== Hàm phụ =====

// Chỉ nhận đường dẫn trong web (bắt đầu bằng "/" nhưng không phải "//")
function getSafePath(value) {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/";
}

function getRedirectUri(origin, providerName) {
  return origin + "/api/auth/" + providerName + "/callback";
}

// Chuyển về trang web kèm mã lỗi để trang đó hiển thị bằng t("errors." + code)
function redirectWithError(res, origin, mode, code) {
  let page = "/login";
  if (mode === "link") {
    page = "/profile";
  }
  res.redirect(origin + page + "?error=" + encodeURIComponent(code));
}

// Đọc user đang đăng nhập từ refresh token (cookie này được gửi kèm vì cùng đường dẫn /api/auth)
async function getLoggedInUser(req) {
  let token = null;
  if (req.cookies) {
    token = req.cookies[REFRESH_COOKIE];
  }
  if (!token) {
    return null;
  }

  const payload = verifyRefreshToken(token);
  if (!payload) {
    return null;
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive || user.tokenVersion !== payload.version) {
    return null;
  }
  return user;
}

// ===== Controller =====

// GET /api/auth/:provider/start?origin=https://...&mode=login|link&redirect=/duong-dan
export async function startOAuth(req, res) {
  const providerName = req.params.provider;
  const provider = PROVIDERS[providerName];
  if (!provider) {
    return res
      .status(404)
      .json({ code: "NOT_FOUND", message: "Không hỗ trợ cách đăng nhập này" });
  }

  // origin phải nằm trong danh sách cho phép, tránh bị lợi dụng để chuyển người dùng sang web lạ
  const origin = req.query.origin;
  if (!isAllowedOrigin(origin)) {
    return res
      .status(400)
      .json({ code: "ORIGIN_INVALID", message: "Địa chỉ trang web không hợp lệ" });
  }

  let mode = "login";
  if (req.query.mode === "link") {
    mode = "link";
  }

  if (!provider.isConfigured()) {
    return redirectWithError(res, origin, mode, "OAUTH_NOT_CONFIGURED");
  }

  // state: chuỗi ngẫu nhiên, khi quay về phải khớp → chống giả mạo request (CSRF)
  const state = crypto.randomBytes(16).toString("hex");
  // PKCE cho Zalo
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  // Lưu thông tin phiên đăng nhập vào cookie tạm đã ký, để lúc quay về biết là của ai, quay về đâu
  const stateData = {
    state: state,
    provider: providerName,
    origin: origin,
    mode: mode,
    redirect: getSafePath(req.query.redirect),
    codeVerifier: codeVerifier,
  };
  const stateToken = jwt.sign(stateData, process.env.JWT_ACCESS_SECRET, {
    expiresIn: STATE_MINUTES * 60,
  });

  res.cookie(STATE_COOKIE, stateToken, {
    ...getCookieOptions(),
    path: "/api/auth",
    maxAge: STATE_MINUTES * 60 * 1000,
  });

  const redirectUri = getRedirectUri(origin, providerName);
  res.redirect(provider.buildAuthUrl(redirectUri, state, codeChallenge));
}

// GET /api/auth/:provider/callback?code=...&state=...
export async function oauthCallback(req, res) {
  const providerName = req.params.provider;
  const provider = PROVIDERS[providerName];

  // Đọc rồi xoá ngay cookie tạm, mỗi phiên đăng nhập chỉ dùng được 1 lần
  let stateData = null;
  if (req.cookies && req.cookies[STATE_COOKIE]) {
    try {
      stateData = jwt.verify(req.cookies[STATE_COOKIE], process.env.JWT_ACCESS_SECRET);
    } catch {
      stateData = null;
    }
  }
  res.clearCookie(STATE_COOKIE, { ...getCookieOptions(), path: "/api/auth" });

  if (!provider || !stateData || stateData.provider !== providerName) {
    return redirectWithError(res, getDefaultOrigin(), "login", "OAUTH_STATE_INVALID");
  }

  const origin = stateData.origin;
  const mode = stateData.mode;

  if (req.query.state !== stateData.state) {
    return redirectWithError(res, origin, mode, "OAUTH_STATE_INVALID");
  }

  // Người dùng bấm "Huỷ" ở trang Google/Zalo
  if (!req.query.code) {
    return redirectWithError(res, origin, mode, "OAUTH_CANCELLED");
  }

  let profile;
  try {
    profile = await provider.fetchProfile(
      String(req.query.code),
      getRedirectUri(origin, providerName),
      stateData.codeVerifier,
    );
  } catch (err) {
    console.error("Lỗi đăng nhập " + providerName + ":", err.message);
    return redirectWithError(res, origin, mode, "OAUTH_FAILED");
  }

  const idField = provider.idField;

  // Người khác đã dùng tài khoản Google/Zalo này chưa
  const owner = await User.findOne({ [idField]: profile.id });

  // ----- Liên kết thêm vào tài khoản đang đăng nhập (từ trang profile) -----
  if (mode === "link") {
    const currentUser = await getLoggedInUser(req);
    if (!currentUser) {
      return redirectWithError(res, origin, "login", "UNAUTHORIZED");
    }
    if (owner && String(owner._id) !== String(currentUser._id)) {
      return redirectWithError(res, origin, mode, "PROVIDER_ALREADY_LINKED");
    }

    currentUser[idField] = profile.id;
    if (!currentUser.avatar && profile.avatar) {
      currentUser.avatar = profile.avatar;
    }
    await currentUser.save();

    return res.redirect(origin + "/profile?linked=" + providerName);
  }

  // ----- Đăng nhập -----
  let user = owner;

  // Chưa liên kết, nhưng Google xác nhận email này và đã có tài khoản cùng email → gộp vào tài khoản đó
  if (!user && profile.email && profile.emailVerified) {
    user = await User.findOne({ email: profile.email.toLowerCase() });
    if (user) {
      user[idField] = profile.id;
      if (!user.avatar && profile.avatar) {
        user.avatar = profile.avatar;
      }
      await user.save();
    }
  }

  // Người mới hoàn toàn → tạo tài khoản guest
  let needsName = false;
  if (!user) {
    let name = profile.name.trim();
    if (name === "") {
      // Không lấy được tên (Zalo chặn IP ngoài Việt Nam) → đặt tạm, chuyển tới trang cá nhân để tự sửa
      name = "SaiGon Stay User";
      needsName = true;
    }

    const newUser = {
      name: name.slice(0, 100),
      avatar: profile.avatar,
      role: "guest",
      [idField]: profile.id,
    };
    // Chỉ lưu email đã được Google xác nhận và chưa ai dùng
    if (profile.email && profile.emailVerified) {
      newUser.email = profile.email.toLowerCase();
    }
    user = await User.create(newUser);
  }

  if (!user.isActive) {
    return redirectWithError(res, origin, mode, "ACCOUNT_DISABLED");
  }

  setAuthCookies(res, user);

  // Web admin không có trang profile, nên chỉ chuyển tới /profile khi đang ở web khách
  if (needsName && !origin.includes("admin")) {
    return res.redirect(origin + "/profile");
  }
  res.redirect(origin + stateData.redirect);
}
