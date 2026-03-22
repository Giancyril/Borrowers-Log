import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getToken } from "../../auth/auth";

// API base URL configured via VITE_API_URL environment variable
export const baseApi = createApi({
  reducerPath: "baseApi",
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:5001/api",
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set("authorization", token);
      return headers;
    },
  }),
  tagTypes: ["items", "borrowRecords", "stats", "admins", "activityLogs"],
  endpoints: () => ({}),
});