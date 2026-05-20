import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3030/api/v1";

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
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
