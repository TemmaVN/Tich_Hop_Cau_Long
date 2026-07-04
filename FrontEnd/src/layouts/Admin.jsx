import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./admin/Sidebar";
import Header from "./admin/Header";
import { useUser } from "../contexts/UserContext";
import { useMediaQuery } from "../mystate/useMediaQuery";

const Admin = () => {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [sideBarCollapsed, setSideBarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer when switching to desktop
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  const handleToggle = () => {
    if (isDesktop) setSideBarCollapsed((c) => !c);
    else setMobileOpen((o) => !o);
  };

  const { loading } = useUser();
  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Đang tải...</div>;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">

      {/* ── Desktop sidebar (always in layout flow) ── */}
      {isDesktop && (
        <Sidebar sideBarCollapsed={sideBarCollapsed} onToggleSidebar={setSideBarCollapsed} />
      )}

      {/* ── Mobile sidebar (overlay drawer) ── */}
      {!isDesktop && mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed left-0 top-0 h-full z-50 shadow-2xl">
            <Sidebar
              sideBarCollapsed={false}
              isMobile
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          sideBarCollapsed={sideBarCollapsed}
          onToggleSidebar={handleToggle}
        />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Admin;
