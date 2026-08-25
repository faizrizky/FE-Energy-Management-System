"use client";

/**
 * Client-side HTTP client for use inside "use client" components/hooks.
 * Attaches the auth token automatically and normalizes error shape.
 */
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  let token: string | undefined;
  if (typeof document !== "undefined") {
    token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("ems_token="))
      ?.split("=")[1];
  }
  token ??= process.env.NEXT_PUBLIC_DEV_API_TOKEN;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message ?? "Something went wrong";
    return Promise.reject(new Error(message));
  }
);
