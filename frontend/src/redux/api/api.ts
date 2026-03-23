import { baseApi } from "./baseApi";

const api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ── Auth ──────────────────────────────────────────────────────────────
    login: build.mutation({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    registerAdmin: build.mutation({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      invalidatesTags: ["admins"],
    }),
    getAdmins: build.query({
      query: () => "/auth/admins",
      providesTags: ["admins"],
    }),
    deleteAdmin: build.mutation({
      query: (id: string) => ({ url: `/auth/admins/${id}`, method: "DELETE" }),
      invalidatesTags: ["admins"],
    }),
    changePassword: build.mutation({
      query: (body) => ({ url: "/auth/change-password", method: "PUT", body }),
    }),
    changeEmail: build.mutation({
      query: (body) => ({ url: "/auth/change-email", method: "PUT", body }),
    }),
    changeUsername: build.mutation({
      query: (body) => ({ url: "/auth/change-username", method: "PUT", body }),
    }),

    // ── Items ─────────────────────────────────────────────────────────────
    getItems: build.query({
      query: (params) => ({ url: "/items", params }),
      providesTags: ["items"],
    }),
    getSingleItem: build.query({
      query: (id: string) => `/items/${id}`,
      providesTags: ["items"],
    }),
    getItemStats: build.query({
      query: (id: string) => `/items/${id}/stats`,
      providesTags: ["items", "borrowRecords"],
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

    // ── Borrow Records ────────────────────────────────────────────────────
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
    getBorrowerHistory: build.query({
      query: (name: string) => ({ url: "/borrow-records", params: { search: name, limit: 100 } }),
      providesTags: ["borrowRecords"],
    }),
    createBorrowRecord: build.mutation({
      query: (body) => ({ url: "/borrow-records", method: "POST", body }),
      invalidatesTags: ["borrowRecords", "items", "stats"],
    }),
    updateBorrowRecord: build.mutation({
      query: ({ id, ...body }) => ({ url: `/borrow-records/${id}`, method: "PUT", body }),
      invalidatesTags: ["borrowRecords", "stats"],
    }),
    returnBorrowRecord: build.mutation({
      query: ({ id, ...body }) => ({ url: `/borrow-records/${id}/return`, method: "PUT", body }),
      invalidatesTags: ["borrowRecords", "items", "stats"],
    }),
    deleteBorrowRecord: build.mutation({
      query: (id: string) => ({ url: `/borrow-records/${id}`, method: "DELETE" }),
      invalidatesTags: ["borrowRecords", "stats"],
    }),
    bulkReturnRecords: build.mutation({
      query: (body: { ids: string[] }) => ({ url: "/borrow-records/bulk-return", method: "PUT", body }),
      invalidatesTags: ["borrowRecords", "items", "stats"],
    }),
    bulkDeleteRecords: build.mutation({
      query: (body: { ids: string[] }) => ({ url: "/borrow-records/bulk-delete", method: "DELETE", body }),
      invalidatesTags: ["borrowRecords", "stats"],
    }),

    getActivityLogs: build.query({
      query: (params) => ({ url: "/activity-logs", params }),
      providesTags: ["activityLogs"],
    }),
    clearActivityLogs: build.mutation<void, void>({
      query: () => ({ url: "/activity-logs", method: "DELETE" }),
      invalidatesTags: ["activityLogs"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterAdminMutation,
  useGetAdminsQuery,
  useDeleteAdminMutation,
  useChangePasswordMutation,
  useChangeEmailMutation,
  useChangeUsernameMutation,
  useGetItemsQuery,
  useGetSingleItemQuery,
  useGetItemStatsQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
  useGetBorrowRecordsQuery,
  useGetSingleBorrowRecordQuery,
  useGetOverdueRecordsQuery,
  useGetDashboardStatsQuery,
  useGetBorrowerHistoryQuery,
  useCreateBorrowRecordMutation,
  useUpdateBorrowRecordMutation,
  useReturnBorrowRecordMutation,
  useDeleteBorrowRecordMutation,
  useBulkReturnRecordsMutation,
  useBulkDeleteRecordsMutation,
  useGetActivityLogsQuery,
  useClearActivityLogsMutation,
} = api;