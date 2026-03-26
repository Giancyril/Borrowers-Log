import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";

export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <>
      <Outlet />
      <ToastContainer
        position={isMobile ? "top-center" : "top-right"}
        autoClose={3000}
        theme="dark"
        toastStyle={{
          background: "#111827",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          color: "#f9fafb",
          fontSize: "14px",
          padding: "14px 18px",
          minHeight: "unset",
        }}
        style={isMobile ? {
          top: "30px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "auto",
          minWidth: "320px",
          maxWidth: "calc(100vw - 32px)",
        } : {
          top: "16px",
          right: "16px",
        }}
      />
    </>
  );
}