/**
 * TenderOS API Client
 * Centralized axios instance with JWT auth, token refresh, and error handling.
 * All API calls in the app should go through this client.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL = "/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request Interceptor: attach JWT ─────────────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("tenderos_access_token")
      : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor: handle 401 / token refresh ────────────────────────

let _isRefreshing = false;
let _refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !original?._retry) {
      if (_isRefreshing) {
        // Queue additional requests while refresh is in flight
        return new Promise((resolve) => {
          _refreshQueue.push((token: string) => {
            if (original.headers) original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      _isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("tenderos_refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        localStorage.setItem("tenderos_access_token", data.access_token);
        localStorage.setItem("tenderos_refresh_token", data.refresh_token);

        // Flush the queue
        _refreshQueue.forEach((cb) => cb(data.access_token));
        _refreshQueue = [];

        if (original.headers) {
          original.headers.Authorization = `Bearer ${data.access_token}`;
        }
        return api(original);
      } catch {
        // Refresh failed — clear session and redirect to login
        localStorage.removeItem("tenderos_access_token");
        localStorage.removeItem("tenderos_refresh_token");
        localStorage.removeItem("tenderos_user");
        _refreshQueue = [];
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Typed API helpers ────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: (refreshToken: string) =>
    api.post("/auth/logout", { refresh_token: refreshToken }),
  me: (userId: string) => api.get(`/auth/users/${userId}`),
};

export const tendersApi = {
  list: (params?: Record<string, unknown>) => api.get("/tenders", { params }),
  get: (id: string) => api.get(`/tenders/${id}`),
  summary: (id: string) => api.get(`/tenders/${id}/summary`),
  similar: (id: string, limit = 5) =>
    api.get(`/tenders/${id}/similar`, { params: { limit } }),
  addWatchlist: (id: string) => api.post(`/tenders/${id}/watchlist`),
  removeWatchlist: (id: string) => api.delete(`/tenders/${id}/watchlist`),
  listWatchlist: () => api.get("/tenders/watchlist"),
};

export const searchApi = {
  search: (params: Record<string, unknown>) => api.get("/search", { params }),
  advanced: (body: Record<string, unknown>) => api.post("/search/advanced", body),
  facets: () => api.get("/search/facets"),
  suggest: (q: string) => api.get("/search/suggest", { params: { q } }),
};

export const companyApi = {
  getProfile: (userId: string) => api.get(`/company/profile/${userId}`),
  upsertProfile: (data: Record<string, unknown>) => api.post("/company/profile", data),
  getScore: (userId: string) => api.get(`/company/profile/${userId}/score`),
  listDocuments: (userId: string) =>
    api.get(`/company/documents`, { params: { user_id: userId } }),
  uploadDocument: (userId: string, type: string, file: File) => {
    const fd = new FormData();
    fd.append("user_id", userId);
    fd.append("doc_type", type);
    fd.append("file", file);
    return api.post("/company/documents", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteDocument: (docId: string, userId: string) =>
    api.delete(`/company/documents/${docId}`, { params: { user_id: userId } }),
  fetchProfile: (userId: string) => api.get(`/company/profile/${userId}`),
  updateProfile: (data: Record<string, unknown>) => api.post("/company/profile", data),
  fetchDocuments: (userId: string) =>
    api.get(`/company/documents`, { params: { user_id: userId } }),
};

export const copilotApi = {
  chat: (tenderId: string, body: { message: string; user_id: string; conversation_id?: string }) =>
    api.post(`/chat/${tenderId}`, body),
};

export const eligibilityApi = {
  qualify: (tenderId: string, userId: string) =>
    api.get(`/eligibility/${tenderId}`, { params: { user_id: userId } }),
  recommendations: (userId: string, limit = 10) =>
    api.get(`/recommendations`, { params: { user_id: userId, limit } }),
};

export const proposalsApi = {
  generate: (tenderId: string, userId: string) =>
    api.get(`/proposals/${tenderId}`, { params: { user_id: userId } }),
  getWorkflow: (tenderId: string) => api.get(`/proposals/${tenderId}/workflow`),
  transition: (tenderId: string, body: { target_state: string; user_role: string }) =>
    api.post(`/proposals/${tenderId}/workflow/transition`, body),
};

export const analyticsApi = {
  overview: () => api.get("/analytics/overview"),
  trends: (period = "12m") => api.get("/analytics/trends", { params: { period } }),
  ministries: (limit = 10) => api.get("/analytics/ministries", { params: { limit } }),
  categories: () => api.get("/analytics/categories"),
  predictions: (params?: Record<string, unknown>) =>
    api.get("/analytics/predictions", { params }),
};

export const notificationsApi = {
  list: () => api.get("/notifications"),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
};
