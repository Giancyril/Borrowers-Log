import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt, FaBoxOpen, FaClipboardList, FaExclamationTriangle,
  FaBars, FaTimes, FaSignOutAlt, FaChevronLeft, FaChevronRight,
  FaChevronDown, FaCog, FaChartBar, FaHistory,
} from "react-icons/fa";
import { signOut, useAdminUser } from "../../auth/auth";
import { useGetDashboardStatsQuery } from "../../redux/api/api";
import OnboardingTour from "../../components/ui/OnboardingTour";

const menu = [
  { label: "Overview",       icon: FaTachometerAlt,       path: "/dashboard",     exact: true },
  { label: "Inventory",      icon: FaBoxOpen,             path: "/items"                      },
  { label: "Borrow Records", icon: FaClipboardList,       path: "/borrow-records"             },
  { label: "Overdue",        icon: FaExclamationTriangle, path: "/overdue"                    },
  { label: "Analytics",      icon: FaChartBar,            path: "/analytics"                  },
  { label: "Activity Logs",  icon: FaHistory,             path: "/activity-logs"              },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const user      = useAdminUser();
  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen,      setProfileOpen]      = useState(false);
  const { data: stats } = useGetDashboardStatsQuery(undefined);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#profile-dropdown-anchor")) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const isActive = (path: string, exact?: boolean) =>
    exact
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(path + "/");

  const initial =
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.username?.charAt(0)?.toUpperCase() || "A";

  const overdueCount = stats?.data?.overdueRecords ?? 0;

  return (
    <div className="min-h-screen bg-gray-950 lg:flex">

      <OnboardingTour />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed top-0 left-0 h-full z-50 flex flex-col bg-gray-900 border-r border-white/5
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        ${sidebarCollapsed ? "lg:w-[72px]" : "lg:w-60"}
        w-60`}>

        {/* Logo */}
        <div className="px-5 border-b border-white/5 shrink-0 h-14 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png"
                alt="NBSC"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = "none";
                  const fb = img.nextElementSibling as HTMLElement | null;
                  if (fb) fb.style.display = "flex";
                }}
              />
              <span
                className="text-blue-400 text-xs font-black select-none w-full h-full items-center justify-center"
                style={{ display: "none" }}
              >N</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-bold tracking-widest">NBSC SAS</p>
              <p className="text-gray-500 text-[9px] uppercase tracking-widest">Borrowers Log</p>
            </div>
          </div>
        </div>
        {sidebarCollapsed && (
          <img
            src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png"
            alt="NBSC SAS Logo"
            className="w-8 h-8 object-contain"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-white p-1">
          <FaTimes size={14} />
        </button>
        

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
    
          {menu.map(({ label, icon: Icon, path, exact }) => {
            const active = isActive(path, exact);
            return (
              <Link key={path} to={path} onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? label : undefined}
                className={`relative flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                  ${active ? "bg-cyan-500/10 text-cyan-400" : "text-gray-400 hover:text-white hover:bg-white/5"}
                  ${sidebarCollapsed ? "justify-center" : ""}`}>
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-full" />}
                <span className="relative shrink-0">
                  <Icon size={14} className={active ? "text-cyan-400" : "text-gray-500 group-hover:text-gray-300"} />
                  {path === "/overdue" && overdueCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {overdueCount > 9 ? "9+" : overdueCount}
                    </span>
                  )}
                </span>
                {!sidebarCollapsed && <span>{label}</span>}
                {!sidebarCollapsed && path === "/overdue" && overdueCount > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full border border-red-500/30">
                    {overdueCount}
                  </span>
                )}
                {sidebarCollapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-gray-800 border border-white/10 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

      </aside>

      {/* ── Main content ── */}
      <div className={`w-full flex flex-col min-h-screen bg-gray-950 transition-all duration-300
        ${sidebarCollapsed ? "lg:ml-[72px] lg:w-[calc(100%-72px)]" : "lg:ml-60 lg:w-[calc(100%-240px)]"}`}>

        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-white/5 px-4 lg:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <FaBars size={13} />
          </button>

          {/* Logo in topbar — mobile only */}
          <div className="flex lg:hidden items-center gap-2.5 flex-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="https://nbsc.edu.ph/wp-content/uploads/2024/03/cropped-NBSC_NewLogo_icon.png"
                alt="NBSC"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = "none";
                }}
              />
              <span
                className="text-blue-400 text-[9px] font-black w-full h-full items-center justify-center"
                style={{ display: "none" }}
              >N</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">NBSC SAS</p>
              <p className="text-gray-400 text-[10px] truncate uppercase">Borrowers Log</p>
            </div>
          </div>

          <div className="hidden lg:flex flex-1" />

          {/* Profile */}
          <div id="profile-dropdown-anchor" className="relative pl-3 border-l border-l-blue-500/30">
            <button
              onClick={() => setProfileOpen((p) => !p)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-black">{initial}</span>
              </div>
              <span className="hidden sm:block text-white text-xs font-semibold max-w-[120px] truncate">
                {user?.username || user?.name || "Admin"}
              </span>
              <FaChevronDown
                size={9}
                className={`hidden sm:block text-gray-500 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-10 w-44 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-white text-xs font-semibold truncate">{user?.username || user?.name || " "}</p>
                  <p className="text-gray-500 text-[10px] mt-0.5 truncate">{user?.email || ""}</p>
                </div>
                <div className="py-1">
                  <Link to="/settings" onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-xs"
                  >
                    <FaCog size={11} className="text-gray-400 shrink-0" />
                    Settings
                  </Link>
                  <div className="mx-3 my-1 border-t border-white/5" />
                  <button onClick={() => { setProfileOpen(false); signOut(navigate); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs"
                  >
                    <FaSignOutAlt size={11} className="text-red-400 shrink-0" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 p-4 sm:p-5 lg:p-7 overflow-auto bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}