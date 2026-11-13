import axios from "axios";

const CSRF_METHODS = ["post", "put", "patch", "delete"];

function getCookie(name) {
  const row = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return row ? decodeURIComponent(row.slice(name.length + 1)) : null;
}

export function hasCsrfCookie() {
  return getCookie("csrf_token") !== null;
}

/*
 * AuthProvider mendaftarkan fungsi ini agar 401 bisa mengosongkan
 * state user tanpa reload halaman.
 */
let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (CSRF_METHODS.includes(config.method?.toLowerCase())) {
    const csrfToken = getCookie("csrf_token");

    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Pengecekan sesi awal memakai skipUnauthorizedHandler: 401 di sana normal.
    if (
      error.response?.status === 401 &&
      !error.config?.skipUnauthorizedHandler
    ) {
      unauthorizedHandler?.();
    }

    return Promise.reject(error);
  },
);

export default api;
