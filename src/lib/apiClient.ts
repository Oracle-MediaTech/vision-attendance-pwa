import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";

// Backend always runs on port 3030 on the same host the user is browsing
// from — we reuse the page's hostname so the API URL tracks the laptop's
// current LAN IP without rebuilds. Works for localhost, LAN IP, or any host.
const BACKEND_PORT = 3030;

function resolveApiUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}/api/v1`;
  }
  return "";
}

const API_URL = resolveApiUrl();

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      try {
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = (refreshResponse.data as { accessToken: string }).accessToken;
        localStorage.setItem("accessToken", newToken);
        if (error.config) {
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return apiClient.request(error.config);
        }
      } catch {
        localStorage.removeItem("accessToken");
        window.location.href = "/terminal/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
