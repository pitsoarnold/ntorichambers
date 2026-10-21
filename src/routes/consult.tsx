import { createFileRoute } from "@tanstack/react-router";
import { Check, Clock3, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Reveal } from "@/components/site";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export const Route = createFileRoute("/consult")({
  head: () => ({
    meta: [
      { title: "Book a Consultation — Ntori Chambers" },
      {
        name: "description",
        content:
          "Request a confidential consultation with Ntori Chambers for strategic litigation, criminal defense, and legal advisory.",
      },
      { property: "og:title", content: "Book a Consultation — Ntori Chambers" },
      {
        property: "og:description",
        content: "Arrange a conversation with Ntori Chambers, Lesotho.",
      },
    ],
  }),
  component: Consult,
});

const SERVICES = [
  "Strategic Litigation",
  "Criminal Defense",
  "Regulatory Advisory",
  "Corporate Advisory",
] as const;

const TIME_SLOTS = ["09:00", "10:30", "14:00", "15:30"] as const;

const fieldClassName =
  "min-h-12 w-full border border-white/15 bg-[#111110] px-4 py-3 text-base text-[#f4f0e7] outline-none transition-colors placeholder:text-[#aaa69c]/60 focus:border-[#c2a46d] disabled:cursor-wait disabled:opacity-60";

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function Consult() {
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState("");
  const today = getTodayDate();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError("");
    setSubmitting(true);

    try {
      const { error: insertError } = await getSupabaseBrowserClient()
        .from("bookings")
        .insert({
          client_name: String(formData.get("client_name")).trim(),
          client_email: String(formData.get("client_email")).trim(),
          client_phone: String(formData.get("client_phone")).trim() || null,
          service_type: String(formData.get("service_type")),
          booking_date: String(formData.get("booking_date")),
          booking_time: String(formData.get("booking_time")),
          status: "pending",
        });

      if (insertError) {
        throw insertError;
      }

      form.reset();
      setRequested(true);
    } catch {
      setError(
        "We could not submit your request just now. Please try again or contact us directly.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-32 pt-36 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:pt-44">
      <Reveal className="lg:sticky lg:top-32 lg:self-start">
        <p className="eyebrow">A considered first conversation</p>
        <h1 className="mt-6 max-w-xl text-5xl md:text-6xl">
          Book a <span className="gold-em">consultation.</span>
        </h1>
        <p className="mt-7 max-w-lg text-lg leading-relaxed text-[#c6c1b7]">
          Tell us a little about the guidance you are seeking. Our team will
          review your request and be in touch to confirm a suitable time.
        </p>

        <div className="mt-12 space-y-5 border-t border-white/10 pt-8">
          <div className="flex items-start gap-4">
            <ShieldCheck
              aria-hidden="true"
              className="mt-1 h-5 w-5 shrink-0 text-[#c2a46d]"
              strokeWidth={1.5}
            />
            <p className="text-sm leading-relaxed text-[#aaa69c]">
              Your request is handled with care and discretion. Please avoid
              including confidential or sensitive case details in this form.
            </p>
          </div>
          <div className="flex items-start gap-4">
            <Clock3
              aria-hidden="true"
              className="mt-1 h-5 w-5 shrink-0 text-[#c2a46d]"
              strokeWidth={1.5}
            />
            <p className="text-sm leading-relaxed text-[#aaa69c]">
              Your selected date and time are a request and will be confirmed
              with you by email.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <div className="border border-white/10 bg-[#141413] p-6 sm:p-10 lg:p-12">
          {requested ? (
            <div
              role="status"
              aria-live="polite"
              className="flex min-h-[26rem] flex-col items-start justify-center"
            >
              <span className="flex h-14 w-14 items-center justify-center border border-[#c2a46d]/50 bg-[#c2a46d]/10 text-[#e1c78e]">
                <Check aria-hidden="true" className="h-6 w-6" strokeWidth={1.5} />
              </span>
              <p className="mt-8 text-xs font-medium uppercase tracking-[0.25em] text-[#c2a46d]">
                Request received
              </p>
              <h2 className="mt-4 text-4xl sm:text-5xl">
                Consultation Requested
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-[#c6c1b7]">
                We will review your request and confirm via email shortly.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-9 border-b border-white/10 pb-6">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#c2a46d]">
                  Consultation request
                </p>
                <h2 className="mt-3 font-serif text-3xl text-[#f4f0e7]">
                  How may we assist?
                </h2>
              </div>

              <form onSubmit={submit} className="space-y-6">
                <div>
                  <label
                    htmlFor="client-name"
                    className="mb-2 block text-sm text-[#e9e5dc]"
                  >
                    Full Name <span aria-hidden="true" className="text-[#c2a46d]">*</span>
                  </label>
                  <input
                    id="client-name"
                    name="client_name"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={200}
                    disabled={submitting}
                    className={fieldClassName}
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="client-email"
                      className="mb-2 block text-sm text-[#e9e5dc]"
                    >
                      Email <span aria-hidden="true" className="text-[#c2a46d]">*</span>
                    </label>
                    <input
                      id="client-email"
                      name="client_email"
                      type="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      required
                      maxLength={320}
                      disabled={submitting}
                      className={fieldClassName}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="client-phone"
                      className="mb-2 block text-sm text-[#e9e5dc]"
                    >
                      Phone <span className="text-[#aaa69c]">(Optional)</span>
                    </label>
                    <input
                      id="client-phone"
                      name="client_phone"
                      type="tel"
                      autoComplete="tel"
                      maxLength={40}
                      disabled={submitting}
                      className={fieldClassName}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="service-type"
                    className="mb-2 block text-sm text-[#e9e5dc]"
                  >
                    Service Type <span aria-hidden="true" className="text-[#c2a46d]">*</span>
                  </label>
                  <select
                    id="service-type"
                    name="service_type"
                    defaultValue=""
                    required
                    disabled={submitting}
                    className={fieldClassName}
                  >
                    <option value="" disabled>
                      Select a service
                    </option>
                    {SERVICES.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="booking-date"
                      className="mb-2 block text-sm text-[#e9e5dc]"
                    >
                      Preferred Date <span aria-hidden="true" className="text-[#c2a46d]">*</span>
                    </label>
                    <input
                      id="booking-date"
                      name="booking_date"
                      type="date"
                      min={today}
                      required
                      disabled={submitting}
                      className={fieldClassName}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="booking-time"
                      className="mb-2 block text-sm text-[#e9e5dc]"
                    >
                      Preferred Time <span aria-hidden="true" className="text-[#c2a46d]">*</span>
                    </label>
                    <select
                      id="booking-time"
                      name="booking_time"
                      defaultValue=""
                      required
                      disabled={submitting}
                      className={fieldClassName}
                    >
                      <option value="" disabled>
                        Select a time
                      </option>
                      {TIME_SLOTS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    aria-live="assertive"
                    className="border border-red-400/25 bg-red-400/[0.06] px-4 py-3 text-sm leading-relaxed text-red-200"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="group inline-flex min-h-14 w-full items-center justify-center gap-3 bg-[#c2a46d] px-8 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#111110] transition-colors duration-300 hover:bg-[#e1c78e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c2a46d] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                >
                  {submitting ? "Sending Request..." : "Request Consultation"}
                  {!submitting && (
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  )}
                </button>
                <p className="text-xs leading-relaxed text-[#aaa69c]">
                  Fields marked <span className="text-[#c2a46d]">*</span> are
                  required. A request is not a confirmed appointment.
                </p>
              </form>
            </>
          )}
        </div>
      </Reveal>
    </section>
  );
}
