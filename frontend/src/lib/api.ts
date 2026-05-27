import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("valreport_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("valreport_token");
      localStorage.removeItem("valreport_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: { email: string; full_name: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
};

// Reports
export const reportsApi = {
  list: () => api.get("/reports/"),
  get: (id: string) => api.get(`/reports/${id}`),
  create: (data: { title: string; platform: string; build_id: string; report_type: string }) =>
    api.post("/reports/", data),
  update: (id: string, data: object) => api.patch(`/reports/${id}`, data),
  upload: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`/reports/${id}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  generate: (id: string) => api.post(`/reports/${id}/generate`),
  approve: (id: string) => api.post(`/reports/${id}/approve`),
  share: (id: string, data: { reviewer_email?: string; expires_hours: number }) =>
    api.post(`/reports/${id}/share`, data),
  export: (id: string, format: "pdf" | "docx") =>
    api.get(`/reports/${id}/export/${format}`, { responseType: "blob" }),
};

// Public review endpoints (no auth required)
export const reviewApi = {
  getByToken: (token: string) =>
    axios.get(`${BASE_URL}/reports/review/${token}`),
  approveByToken: (token: string, data: { reviewer_name: string; comment: string }) =>
    axios.post(`${BASE_URL}/reports/review/${token}/approve`, data),
};