import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getToken } from "../../auth/auth";
import { act } from "react";

export const baseApi = createApi({
  reducerPath: "baseApi",
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({
    baseUrl: "http://127.0.0.1:5001/api",
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set("authorization", token);
      return headers;
    },
  }),
  tagTypes: ["items", "borrowRecords", "stats", "admins", "activityLogs"],
  endpoints: () => ({}),
});