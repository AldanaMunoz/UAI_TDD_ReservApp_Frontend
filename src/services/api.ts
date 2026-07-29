import axios from "axios";

export const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("firebaseUID");
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export function resolveApiAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url, API_URL).toString();
  } catch {
    return undefined;
  }
}

export default api;
