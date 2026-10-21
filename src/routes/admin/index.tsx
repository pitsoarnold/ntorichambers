import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, FileText, Users } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#c2a46d]">
        Ntori Chambers · Admin
      </p>
      <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-[#f4f0e7] sm:text-5xl">
        Welcome to Ntori Admin
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#aaa69c] sm:text-base">
        Your workspace for client relationships, firm content, and bookings.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          {
            title: "Client relationships",
            detail: "CRM workspace",
            icon: Users,
            to: "/admin/enquiries",
          },
          { title: "Firm content", detail: "CMS workspace", icon: FileText, to: "/admin/content" },
          { title: "Bookings", detail: "Appointments and enquiries", icon: CalendarDays, to: "/admin/bookings" },
        ].map(({ title, detail, icon: Icon, to }) => (
          <Link
            key={title}
            to={to}
            className="group border border-white/10 bg-[#141413] p-6 transition-colors hover:border-[#c2a46d]/50 hover:bg-[#181714] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2a46d]"
          >
            <div className="flex items-center justify-between">
              <Icon aria-hidden="true" className="h-5 w-5 text-[#c2a46d]" strokeWidth={1.6} />
              <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-[#77736b] transition-colors group-hover:text-[#e1c78e]" />
            </div>
            <h2 className="mt-8 font-serif text-xl text-[#f4f0e7]">{title}</h2>
            <p className="mt-2 text-sm text-[#aaa69c]">{detail}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
