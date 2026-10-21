import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { createCalendarEvent } from "@/lib/calendar.server";

type BookingStatus = "pending" | "confirmed" | "cancelled";

type Booking = {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  service_type: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  created_at: string;
};

const STATUSES: { value: BookingStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

export const Route = createFileRoute("/admin/bookings")({
  component: BookingsPage,
});

function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [notification, setNotification] = useState("");
  const detailsDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      try {
        const { data, error } = await getSupabaseBrowserClient()
          .from("bookings")
          .select(
            "id, client_name, client_email, client_phone, service_type, booking_date, booking_time, status, created_at",
          )
          .order("booking_date", { ascending: true })
          .order("booking_time", { ascending: true });

        if (error) {
          throw error;
        }

        if (active) {
          setBookings((data ?? []) as Booking[]);
        }
      } catch {
        if (active) {
          setLoadError("Unable to load bookings. Please refresh and try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadBookings();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timeout = window.setTimeout(() => setNotification(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [notification]);

  useEffect(() => {
    const dialog = detailsDialog.current;
    if (selectedBooking && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!selectedBooking && dialog?.open) {
      dialog.close();
    }
  }, [selectedBooking]);

  async function updateStatus(booking: Booking, nextStatus: BookingStatus) {
    if (booking.status === nextStatus) {
      return;
    }

    setUpdatingId(booking.id);
    setNotification("");

    try {
      const { data, error } = await getSupabaseBrowserClient()
        .from("bookings")
        .update({ status: nextStatus })
        .eq("id", booking.id)
        .select("id")
        .maybeSingle();

      if (error) {
        throw error;
      }
      if (!data) {
        throw new Error("The booking status was not updated.");
      }

      setBookings((current) =>
        current.map((item) =>
          item.id === booking.id ? { ...item, status: nextStatus } : item,
        ),
      );
      setSelectedBooking((current) =>
        current?.id === booking.id ? { ...current, status: nextStatus } : current,
      );
      if (nextStatus === "confirmed") {
        try {
          await createCalendarEvent({ data: { bookingId: booking.id } });
          setNotification("Booking confirmed and calendar event created.");
        } catch (error) {
          console.error(
            "Booking was confirmed, but its calendar event could not be created.",
            error,
          );
          setNotification(
            "Booking confirmed, but the calendar event could not be created. Check the Calendar integration and try again.",
          );
        }
      } else {
        setNotification("Booking status updated.");
      }
    } catch {
      setNotification("Unable to update status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#c2a46d]">
        Client relationships
      </p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-medium tracking-tight text-[#f4f0e7] sm:text-5xl">
            Bookings
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#aaa69c]">
            Review upcoming consultations and manage each request.
          </p>
        </div>
        {!loading && !loadError && (
          <p className="text-sm text-[#aaa69c]">
            {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
          </p>
        )}
      </div>

      {loadError ? (
        <p
          role="alert"
          className="mt-8 border border-red-400/20 bg-red-400/[0.06] p-5 text-sm text-red-200"
        >
          {loadError}
        </p>
      ) : (
        <div
          role="region"
          aria-label="Consultation bookings"
          tabIndex={0}
          className="mt-8 overflow-x-auto border border-white/10 bg-[#141413] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2a46d]"
        >
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <caption className="sr-only">Consultation bookings, ordered by appointment date and time</caption>
            <thead className="border-b border-white/10 bg-[#111110] text-xs uppercase tracking-[0.14em] text-[#aaa69c]">
              <tr>
                <th scope="col" className="px-5 py-4 font-medium">Date &amp; Time</th>
                <th scope="col" className="px-5 py-4 font-medium">Client Name</th>
                <th scope="col" className="px-5 py-4 font-medium">Service</th>
                <th scope="col" className="px-5 py-4 font-medium">Contact Info</th>
                <th scope="col" className="px-5 py-4 font-medium">Status</th>
                <th scope="col" className="px-5 py-4 font-medium"><span className="sr-only">Details</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.07]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#aaa69c]">
                    Loading bookings…
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#aaa69c]">
                    No bookings yet.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="transition-colors hover:bg-white/[0.025]">
                    <td className="whitespace-nowrap px-5 py-4 text-[#c6c1b7]">
                      <span className="block text-[#f4f0e7]">{formatBookingDate(booking.booking_date)}</span>
                      <span className="mt-1 block text-xs text-[#aaa69c]">{formatBookingTime(booking.booking_time)}</span>
                    </td>
                    <th scope="row" className="max-w-48 truncate px-5 py-4 font-medium text-[#f4f0e7]">
                      {booking.client_name}
                    </th>
                    <td className="max-w-56 px-5 py-4 text-[#c6c1b7]">{booking.service_type}</td>
                    <td className="px-5 py-4 text-[#c6c1b7]">
                      <a href={`mailto:${booking.client_email}`} className="block max-w-56 truncate hover:text-[#e1c78e]">
                        {booking.client_email}
                      </a>
                      {booking.client_phone ? (
                        <a href={`tel:${booking.client_phone}`} className="mt-1 block text-xs text-[#aaa69c] hover:text-[#e1c78e]">
                          {booking.client_phone}
                        </a>
                      ) : (
                        <span className="mt-1 block text-xs text-[#77746d]">No phone provided</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <label className="sr-only" htmlFor={`booking-status-${booking.id}`}>
                        Status for {booking.client_name}
                      </label>
                      <select
                        id={`booking-status-${booking.id}`}
                        value={booking.status}
                        disabled={updatingId === booking.id}
                        onChange={(event) => {
                          const status = event.currentTarget.value;
                          if (isBookingStatus(status)) {
                            void updateStatus(booking, status);
                          }
                        }}
                        className="border border-white/10 bg-[#0d0d0c] px-3 py-2 text-xs text-[#e9e5dc] outline-none transition-colors focus:border-[#c2a46d] disabled:cursor-wait disabled:opacity-60"
                      >
                        {STATUSES.map((status) => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(booking)}
                        className="text-xs font-medium text-[#c2a46d] underline decoration-[#c2a46d]/40 underline-offset-4 transition-colors hover:text-[#e1c78e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c2a46d]"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {notification && (
        <p
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 max-w-sm border px-5 py-3 text-sm shadow-xl ${
            notification.startsWith("Unable")
              ? "border-red-400/30 bg-[#211513] text-red-200"
              : "border-[#c2a46d]/40 bg-[#191812] text-[#e1c78e]"
          }`}
        >
          {notification}
        </p>
      )}

      <dialog
        ref={detailsDialog}
        aria-labelledby="booking-details-title"
        onCancel={() => setSelectedBooking(null)}
        onClick={(event) => {
          if (event.target === detailsDialog.current) {
            setSelectedBooking(null);
          }
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-[#e9e5dc] backdrop:bg-black/70"
      >
        {selectedBooking && (
          <aside className="ml-auto flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-[#111110] shadow-2xl shadow-black/50">
            <header className="flex items-start justify-between gap-6 border-b border-white/10 px-6 py-6 sm:px-8">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c2a46d]">
                  Booking details
                </p>
                <h2 id="booking-details-title" className="mt-3 truncate font-serif text-3xl text-[#f4f0e7]">
                  {selectedBooking.client_name}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close booking details"
                onClick={() => setSelectedBooking(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 text-[#aaa69c] transition-colors hover:border-[#c2a46d]/50 hover:text-[#e1c78e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2a46d]"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </header>
            <div className="flex-1 space-y-7 overflow-y-auto px-6 py-7 sm:px-8">
              <dl className="grid gap-5 sm:grid-cols-2">
                <Detail label="Email" value={selectedBooking.client_email} />
                <Detail label="Phone" value={selectedBooking.client_phone || "Not provided"} />
                <Detail label="Service" value={selectedBooking.service_type} />
                <Detail label="Appointment date" value={formatBookingDate(selectedBooking.booking_date)} />
                <Detail label="Appointment time" value={formatBookingTime(selectedBooking.booking_time)} />
                <Detail label="Status" value={getStatusLabel(selectedBooking.status)} />
                <Detail label="Requested" value={formatDateTime(selectedBooking.created_at)} />
              </dl>
            </div>
          </aside>
        )}
      </dialog>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-[0.15em] text-[#8f8b82]">{label}</dt>
      <dd className="mt-2 break-words text-sm text-[#e9e5dc]">{value}</dd>
    </div>
  );
}

function formatBookingDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function formatBookingTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (hours === undefined || minutes === undefined || Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(value: BookingStatus) {
  return STATUSES.find((status) => status.value === value)?.label ?? value;
}

function isBookingStatus(value: string): value is BookingStatus {
  return STATUSES.some((status) => status.value === value);
}
