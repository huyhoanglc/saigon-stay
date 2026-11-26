import { useEffect, useState } from "react";
import { AuthContext } from "./auth-context";
import * as authApi from "../api/client";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true trong lúc đang hỏi server "mình đã đăng nhập chưa", tránh nháy sang trang login khi F5
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function fetchMe() {
      try {
        const me = await authApi.getMe();
        if (!ignore) {
          setUser(me);
        }
      } catch {
        // Chưa đăng nhập hoặc phiên đã hết hạn
        if (!ignore) {
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchMe();

    return () => {
      ignore = true;
    };
  }, []);

  async function login(email, password) {
    const loggedInUser = await authApi.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function register(name, email, password) {
    const newUser = await authApi.register(name, email, password);
    setUser(newUser);
    return newUser;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      // Server lỗi thì phía giao diện vẫn coi như đã đăng xuất
      setUser(null);
    }
  }

  const value = {
    user: user,
    loading: loading,
    login: login,
    register: register,
    logout: logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
