import axios from "axios";

const configuredBaseURL = import.meta.env.VITE_API_BASE_URL || "/api";
const normalizedBaseURL = configuredBaseURL.replace(/\/+$/, "");

export const api = axios.create({
  baseURL: normalizedBaseURL.endsWith("/api") ? normalizedBaseURL : `${normalizedBaseURL}/api`,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    try {
      const session = JSON.parse(sessionStorage.getItem("meditrack.session"));
      if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
    } catch {
      sessionStorage.removeItem("meditrack.session");
    }
  }
  return config;
});

export async function apiRequest(path, token, options = {}) {
  const url = path.replace(/^\/api(?=\/|$)/, "");
  const { body, method = "GET", ...config } = options;
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }

  try {
    const response = await api.request({ ...config, url, method, data: body });
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      const abortError = new Error("Request was cancelled.");
      abortError.name = "AbortError";
      throw abortError;
    }
    const message = error.response?.data?.message
      || (error.response?.status >= 500
        ? "The MediTrack API at http://localhost:5000 is unavailable. Check that the backend is running."
        : error.response
          ? error.message
          : "Unable to connect to the MediTrack API. Check that the backend is running on http://localhost:5000.");
    throw new Error(message || "The request could not be completed.");
  }
}

export function apiUrl(path) {
  const url = path.replace(/^\/api(?=\/|$)/, "");
  return api.getUri({ url });
}
