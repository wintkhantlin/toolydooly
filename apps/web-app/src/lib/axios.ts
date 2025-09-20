import axios from "axios";
import { API_GATEWAY } from "@/constants";
import { useAuth } from "@/stores/auth";

const api = axios.create({
    baseURL: API_GATEWAY,
    withCredentials: true,
});

api.interceptors.response.use(
  res => res,
  async err => {
    const authStore = useAuth();
    const originalRequest = err.config;

    if (err.response?.status === 401) {
      if (originalRequest._retry) return Promise.reject(err);
      originalRequest._retry = true;

      const refreshed = await authStore.refresh();

      if (refreshed) {
        originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`;
        return api(originalRequest);
      } else {
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
);


export default api;
