import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// ADD THESE INTERCEPTORS FOR DEBUGGING:
axiosInstance.interceptors.request.use(
  config => {
    console.log("📤 Axios Request:", {
      url: config.url,
      fullUrl: config.baseURL + config.url,
      method: config.method,
    });
    return config;
  },
  error => {
    console.error("📤 Axios Request Error:", error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  response => {
    console.log("📥 Axios Response:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  error => {
    console.error("📥 Axios Response Error:", {
      url: error.config?.url,
      fullUrl: error.config?.baseURL + error.config?.url,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export default axiosInstance;