"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Megaphone,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

function getNavItems(role: string): NavItem[] {
  const common: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "classes", label: "Classes", icon: BookOpen },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "announcements", label: "Announcements", icon: Megaphone },
  ];

  if (role === "STUDENT") {
    return [
      ...common,
      { id: "assignments", label: "Assignments", icon: FileText },
      { id: "grades", label: "Grades", icon: ClipboardCheck },
    ];
  }
  if (role === "TEACHER") {
    return [
      ...common,
      { id: "attendance", label: "Attendance", icon: ClipboardCheck, badge: "New" },
      { id: "grading", label: "Grading", icon: FileText },
    ];
  }
  // ADMIN
  return [
    ...common,
    { id: "users", label: "Users", icon: Users },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface SidebarProps {
  user: { name: string; email: string; role: string; roleLabel: string };
  schoolName: string;
  onLogout: () => void;
  loggingOut: boolean;
}

function SidebarContent({
  user,
  schoolName,
  onLogout,
  loggingOut,
  collapsed,
  activeId,
  onSelectItem,
  onItemClick,
}: SidebarProps & {
  collapsed: boolean;
  activeId: string;
  onSelectItem: (id: string) => void;
  onItemClick?: () => void;
}) {
  const navItems = getNavItems(user.role);

  function handleSelect(id: string, label: string) {
    onSelectItem(id);
    onItemClick?.();
    // For non-dashboard items, show a "coming soon" note — they're placeholders
    // for later phases. The Dashboard itself is fully functional.
    if (id !== "dashboard") {
      // Toasts are queued via the toast hook in the parent Sidebar component,
      // but we can also fire one here if we lift the hook. For now, the active
      // state changes visually so the click is acknowledged.
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Brand header */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0 ${collapsed ? "justify-center" : ""}`}>
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">{schoolName}</p>
            <p className="text-xs text-muted-foreground leading-tight">School Portal</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id, item.label)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all relative group cursor-pointer ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
              {!collapsed && item.badge && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      {/* User card + logout */}
      <div className="border-t border-sidebar-border p-2 space-y-2 shrink-0">
        <div className={`flex items-center gap-3 rounded-xl p-2 ${collapsed ? "justify-center" : ""}`}>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-medium">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground leading-tight truncate">
                {user.roleLabel}
              </p>
            </div>
          )}
          {!collapsed && <ThemeToggle />}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          disabled={loggingOut}
          className={`w-full justify-start text-muted-foreground hover:text-foreground ${
            collapsed ? "px-0" : ""
          }`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign out</span>}
        </Button>
      </div>
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState("dashboard");
  const { toast } = useToast();

  function handleSelectItem(id: string) {
    const previousId = activeId;
    setActiveId(id);
    // Acknowledge the click. For non-dashboard items, show a "coming soon"
    // toast so the user understands why nothing else changed.
    if (id !== "dashboard" && id !== previousId) {
      const navItems = getNavItems(props.user.role);
      const item = navItems.find((n) => n.id === id);
      toast({
        title: `${item?.label ?? "Section"} — coming soon`,
        description:
          "This module is part of a later phase. The Dashboard is fully functional.",
      });
    }
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 sticky top-0 h-screen relative"
      >
        <SidebarContent
          {...props}
          collapsed={collapsed}
          activeId={activeId}
          onSelectItem={handleSelectItem}
        />

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full bg-background border border-border shadow-sm flex items-center justify-center hover:bg-accent transition-colors cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={`h-3.5 w-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </motion.aside>

      {/* ── Mobile top bar (with menu button) ── */}
      <div className="lg:hidden sticky top-0 z-30 h-14 bg-sidebar/95 backdrop-blur border-b border-sidebar-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm">{props.schoolName}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-sidebar border-r border-sidebar-border"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 z-10 h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent
                {...props}
                collapsed={false}
                activeId={activeId}
                onSelectItem={handleSelectItem}
                onItemClick={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
