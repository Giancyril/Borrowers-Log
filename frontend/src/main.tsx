import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";
import { store } from "./redux/store";
import { isAuthenticated } from "./auth/auth";

import App            from "./App";
import Login          from "./pages/login/Login";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import Overview       from "./pages/dashboard/Overview";
import ItemsPage      from "./pages/items/ItemsPage";
import BorrowRecordsPage from "./pages/borrowRecords/BorrowRecordsPage";
import BorrowRecordDetail from "./pages/borrowRecords/BorrowRecordDetail";
import NewBorrowRecord from "./pages/borrowRecords/NewBorrowRecord";
import OverduePage    from "./pages/borrowRecords/OverduePage";

// Route guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      { index: true,              element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard",        element: <DashboardLayout><Overview /></DashboardLayout> },
      { path: "items",            element: <DashboardLayout><ItemsPage /></DashboardLayout> },
      { path: "borrow-records",   element: <DashboardLayout><BorrowRecordsPage /></DashboardLayout> },
      { path: "borrow-records/new", element: <DashboardLayout><NewBorrowRecord /></DashboardLayout> },
      { path: "borrow-records/:id", element: <DashboardLayout><BorrowRecordDetail /></DashboardLayout> },
      { path: "overdue",          element: <DashboardLayout><OverduePage /></DashboardLayout> },
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