import axios from "axios";
import { API_GATEWAY } from "@/constants";
import { useAuth } from "@/stores/auth";

const api = axios.create({
    baseURL: API_GATEWAY,
    withCredentials: true,
});

// Request interceptor to add Authorization header
api.interceptors.request.use(
  (config) => {
    const authStore = useAuth();
    const token = authStore.accessToken || localStorage.getItem("token");
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors and token refresh
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
