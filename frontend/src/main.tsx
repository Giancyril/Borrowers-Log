import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";
import { store } from "./redux/store";

import App from "./App";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import ItemsPage from "./pages/items/ItemsPage";
import BorrowRecordsPage from "./pages/borrowRecords/BorrowRecordsPage";
import BorrowRecordDetail from "./pages/borrowRecords/BorrowRecordDetail";
import NewBorrowRecord from "./pages/borrowRecords/NewBorrowRecord";
import ReturnPage from "./pages/borrowRecords/ReturnPage";
import OverduePage from "./pages/borrowRecords/OverduePage";

import BorrowerHistory from "./pages/borrowRecords/BorrowerHistory";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import ActivityLogsPage from "./pages/activity/ActivityLogsPage";
import BorrowRequestsPage from "./pages/borrowRequests/BorrowRequestsPage";
import BorrowRequestForm from "./pages/borrowRequests/BorrowRequestForm";
import RemindersPage from "./pages/reminders/RemindersPage";

// router configuration with authentication removed
const router = createBrowserRouter([
  // Public borrower-facing request form — no auth required
  { path: "/request", element: <BorrowRequestForm /> },
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard",        element: <DashboardLayout><Overview /></DashboardLayout> },
      { path: "items",            element: <DashboardLayout><ItemsPage /></DashboardLayout> },
      { path: "borrow-records",   element: <DashboardLayout><BorrowRecordsPage /></DashboardLayout> },
      { path: "borrow-records/new", element: <DashboardLayout><NewBorrowRecord /></DashboardLayout> },
      { path: "borrow-records/:id", element: <DashboardLayout><BorrowRecordDetail /></DashboardLayout> },
      { path: "borrow-records/:id/return", element: <DashboardLayout><ReturnPage /></DashboardLayout> },
      { path: "overdue",          element: <DashboardLayout><OverduePage /></DashboardLayout> },

      { path: "borrowers/:name",  element: <DashboardLayout><BorrowerHistory /></DashboardLayout> },
      { path: "analytics",        element: <DashboardLayout><AnalyticsPage /></DashboardLayout> },
      { path: "activity-logs",    element: <DashboardLayout><ActivityLogsPage /></DashboardLayout> },
      { path: "borrow-requests",  element: <DashboardLayout><BorrowRequestsPage /></DashboardLayout> },
      { path: "reminders",        element: <DashboardLayout><RemindersPage /></DashboardLayout> },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
);