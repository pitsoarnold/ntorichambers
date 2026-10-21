import { createFileRoute, Link, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Settings,
  FileText,
  Inbox,
  Users,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getAdminUserFn } from "@/lib/admin-auth.server";

const NAVIGATION = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { to: "/admin/content", label: "Content", icon: FileText },
  { to: "/admin/insights", label: "Insights", icon: FileText },
  { to: "/admin/team", label: "Team", icon: Users },
  { to: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export const Route = createFileRoute("/admin")({
  headers: () => ({ "Cache-Control": "private, no-store" }),
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/admin/login") {
      return { user: null };
    }

    const user = await getAdminUserFn();
    if (!user) {
      throw redirect({ to: "/admin/login" });
    }
    return { user };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();

  if (!user) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[#0d0d0c] text-[#e9e5dc]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/10 bg-[#111110] px-6 py-7 md:flex">
        <AdminBrand />
        <AdminNavigation />
        <div className="mt-auto border-t border-white/10 pt-6">
          <p className="mb-4 truncate text-xs text-[#a9a398]" title={user.email}>
            {user.email}
          </p>
          <SignOutButton />
        </div>
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#111110]/95 px-5 py-4 backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-4">
            <AdminBrand />
            <SignOutButton compact />
          </div>
          <AdminNavigation mobile />
        </header>
        <main className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminBrand() {
  return (
    <Link to="/admin" className="flex min-w-0 items-center gap-3">
      <img src={logo} alt="" width={42} height={42} className="h-10 w-10 shrink-0" />
      <span className="min-w-0">
        <span className="block truncate font-serif text-lg leading-tight text-[#f4f0e7]">
          Ntori Chambers
        </span>
        <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.22em] text-[#c2a46d]">
          Administration
        </span>
      </span>
    </Link>
  );
}

function AdminNavigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      aria-label="Admin navigation"
      className={mobile ? "mt-4 flex gap-2 overflow-x-auto pb-1" : "mt-14 flex flex-col gap-2"}
    >
      {NAVIGATION.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: to === "/admin" }}
          className={
            "flex shrink-0 items-center gap-3 border px-3 py-3 text-sm transition-colors " +
            "border-transparent text-[#b9b5ab] hover:border-[#c2a46d]/30 hover:bg-white/[0.04] hover:text-[#f4f0e7]"
          }
          activeProps={{
            className: "border-[#c2a46d]/40 bg-[#c2a46d]/10 text-[#e1c78e]",
          }}
        >
          <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function signOut() {
    setError("");
    setPending(true);

    try {
      const { error: signOutError } = await getSupabaseBrowserClient().auth.signOut({
        scope: "local",
      });
      if (signOutError) {
        throw signOutError;
      }

      await router.navigate({ to: "/admin/login" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign out. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className="flex w-full items-center gap-3 border border-transparent px-3 py-3 text-left text-sm text-[#b9b5ab] transition-colors hover:border-[#c2a46d]/30 hover:bg-white/[0.04] hover:text-[#f4f0e7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2a46d] disabled:cursor-wait disabled:opacity-60"
      >
        <LogOut aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
        {pending ? "Signing out…" : "Sign Out"}
      </button>
      {error && (
        <p role="alert" className="mt-2 px-3 text-xs leading-relaxed text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
