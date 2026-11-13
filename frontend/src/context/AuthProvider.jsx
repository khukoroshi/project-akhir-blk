import { useCallback, useEffect, useMemo, useState } from "react";

import api, { hasCsrfCookie, setUnauthorizedHandler } from "../services/api";
import { AuthContext } from "./AuthContext";

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Pengunjung anonim (tanpa cookie csrf_token) tidak perlu menunggu apa pun.
  const [loading, setLoading] = useState(() => hasCsrfCookie());

  /*
   * Cek sesi awal. Sisa key "token" lama dihapus sekali saat dimuat
   * (sesi lama pindah ke cookie, user lama cukup login ulang).
   */
  useEffect(() => {
    localStorage.removeItem("token");

    if (!hasCsrfCookie()) {
      return;
    }

    let ignore = false;

    const checkSession = async () => {
      try {
        const response = await api.get("/auth/profile", {
          skipUnauthorizedHandler: true,
        });

        const { id, name, email } = response.data.data.userInfo;

        if (!ignore) {
          setUser({ id, name, email });
        }
      } catch (error) {
        if (ignore) return;

        setUser(null);

        if (error.response?.status === 401) {
          // 401 saat cek sesi itu normal. Cookie csrf_token yang tersisa
          // dibersihkan lewat logout agar pengecekan ini tidak diulang.
          api.post("/auth/logout").catch(() => {});
        } else {
          console.error("Gagal memeriksa sesi:", error.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      ignore = true;
    };
  }, []);

  /*
   * 401 dari request biasa: kosongkan user, lalu ProtectedRoute
   * yang mengalihkan ke /login (tanpa reload halaman).
   */
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));

    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Abaikan error jaringan, state tetap dikosongkan.
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
