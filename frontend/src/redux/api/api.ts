import { baseApi } from "./baseApi";

const api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ── Auth ───────────────────────────────────────────────────────────────
    login: build.mutation({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),

    // ── Items ──────────────────────────────────────────────────────────────
    getItems: build.query({
      query: (params) => ({ url: "/items", params }),
      providesTags: ["items"],
    }),
    getSingleItem: build.query({
      query: (id: string) => `/items/${id}`,
      providesTags: ["items"],
    }),
    createItem: build.mutation({
      query: (body) => ({ url: "/items", method: "POST", body }),
      invalidatesTags: ["items", "stats"],
    }),
    updateItem: build.mutation({
      query: ({ id, ...body }) => ({ url: `/items/${id}`, method: "PUT", body }),
      invalidatesTags: ["items"],
    }),
    deleteItem: build.mutation({
      query: (id: string) => ({ url: `/items/${id}`, method: "DELETE" }),
      invalidatesTags: ["items", "stats"],
    }),

    // ── Borrow Records ─────────────────────────────────────────────────────
    getBorrowRecords: build.query({
      query: (params) => ({ url: "/borrow-records", params }),
      providesTags: ["borrowRecords"],
    }),
    getSingleBorrowRecord: build.query({
      query: (id: string) => `/borrow-records/${id}`,
      providesTags: ["borrowRecords"],
    }),
    getOverdueRecords: build.query({
      query: () => "/borrow-records/overdue",
      providesTags: ["borrowRecords"],
    }),
    getDashboardStats: build.query({
      query: () => "/borrow-records/stats",
      providesTags: ["stats"],
    }),
    createBorrowRecord: build.mutation({
      query: (body) => ({ url: "/borrow-records", method: "POST", body }),
      invalidatesTags: ["borrowRecords", "items", "stats"],
    }),
    updateBorrowRecord: build.mutation({
      query: ({ id, ...body }) => ({ url: `/borrow-records/${id}`, method: "PUT", body }),
      invalidatesTags: ["borrowRecords"],
    }),
    returnBorrowRecord: build.mutation({
      query: ({ id, ...body }) => ({ url: `/borrow-records/${id}/return`, method: "PUT", body }),
      invalidatesTags: ["borrowRecords", "items", "stats"],
    }),
    deleteBorrowRecord: build.mutation({
      query: (id: string) => ({ url: `/borrow-records/${id}`, method: "DELETE" }),
      invalidatesTags: ["borrowRecords", "stats"],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetItemsQuery,
  useGetSingleItemQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
  useGetBorrowRecordsQuery,
  useGetSingleBorrowRecordQuery,
  useGetOverdueRecordsQuery,
  useGetDashboardStatsQuery,
  useCreateBorrowRecordMutation,
  useUpdateBorrowRecordMutation,
  useReturnBorrowRecordMutation,
  useDeleteBorrowRecordMutation,
} = api;