import axios from "axios";
import Cookies from "js-cookie";

const PrivateAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

PrivateAxios.interceptors.request.use((config) => {
  const token = Cookies.get("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { PrivateAxios };
