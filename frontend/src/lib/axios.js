import axios from "axios";

// Fix: Ensure baseURL always ends with /api
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  
  // Add /api if missing
  if (!envURL.endsWith('/api')) {
    console.log("⚠️ Fixing baseURL - adding /api to:", envURL);
    return envURL.endsWith('/') ? envURL + 'api' : envURL + '/api';
  }
  return envURL;
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

// Remove debug interceptors if you want
export default axiosInstance;