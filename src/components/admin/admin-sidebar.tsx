"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  ClipboardList,
  MessageSquare,
  LogOut,
  Menu,
  Store,
  BarChart3,
  FileText,
  Settings,
  Users,
  Home,
} from "lucide-react";

interface AdminSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout?: () => void;
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: FolderTree },
  { id: "tags", label: "Tags", icon: Tag },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
] as const;

const CMS_ITEMS = [
  { id: "homepage", label: "Homepage", icon: Home },
  { id: "faq", label: "FAQs", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

const DATA_ITEMS = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "customers", label: "Customers", icon: Users },
] as const;

function NavContent({
  activeView,
  onViewChange,
  onLogout,
}: {
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <Store className="h-6 w-6 text-primary shrink-0" />
        <span className="text-lg font-bold tracking-tight whitespace-nowrap">
          Indicore Originals
        </span>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-auto" aria-label="Admin navigation">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] text-left ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="my-3">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Content</p>
          <ul className="space-y-1">
            {CMS_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onViewChange(item.id)}
                    className={`flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] text-left ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mb-3">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Data</p>
          <ul className="space-y-1">
            {DATA_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onViewChange(item.id)}
                    className={`flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] text-left ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <Separator />

      {/* Logout */}
      <div className="px-3 py-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 min-h-[44px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            if (onLogout) {
              onLogout();
            } else {
              signOut({ callbackUrl: "/" });
            }
          }}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}

export function AdminSidebar({ activeView, onViewChange, onLogout }: AdminSidebarProps) {
  return (
    <>
      {/* Mobile: Sheet/drawer triggered by hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-background border-b flex items-center px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] p-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <NavContent
              activeView={activeView}
              onViewChange={onViewChange}
              onLogout={onLogout}
            />
          </SheetContent>
        </Sheet>
        <span className="ml-3 font-semibold text-sm">Admin Panel</span>
      </div>

      {/* Desktop: Fixed sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-56 lg:border-r lg:bg-background">
        <NavContent activeView={activeView} onViewChange={onViewChange} onLogout={onLogout} />
      </aside>
    </>
  );
}