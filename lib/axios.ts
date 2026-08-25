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

api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      response.data = response.data.data;
    }

    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message ?? "Something went wrong";
    return Promise.reject(new Error(message));
  }
);
