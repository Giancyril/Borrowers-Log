import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getToken } from "../../auth/auth";

export const baseApi = createApi({
  reducerPath: "baseApi",
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({
    baseUrl: "https://borrowers-log.onrender.com/api",
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set("authorization", token);
      return headers;
    },
  }),
  tagTypes: [
    "items",
    "borrowRecords",
    "stats",
    "admins",
    "activityLogs",
    "borrowRequests",
    "reminderSettings",
  ],
  endpoints: () => ({}),
});