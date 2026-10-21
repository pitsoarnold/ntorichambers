import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ChevronDown, Mail, MessageCircle, Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import { CONTACT, Reveal } from "@/components/site";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Consult with Us — Ntori Chambers" },
      {
        name: "description",
        content:
          "Contact Ntori Chambers by email, WhatsApp or phone for a confidential consultation.",
      },
      { property: "og:title", content: "Consult with Us — Ntori Chambers" },
      { property: "og:description", content: "Speak with Ntori Chambers in confidence." },
    ],
  }),
  component: Contact,
});

const field =
  "w-full border-0 border-b border-input bg-transparent py-4 text-foreground placeholder:text-muted-foreground/60 focus:border-gold focus:outline-none transition-colors";

function Contact() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [contactDetails, setContactDetails] = useState({
    email: CONTACT.email,
    phone: CONTACT.phone,
    whatsapp: CONTACT.whatsapp,
  });

  useEffect(() => {
    let active = true;

    async function loadContactDetails() {
      try {
        const { data, error: settingsError } = await getSupabaseBrowserClient()
          .from("site_settings")
          .select("key, value")
          .in("key", ["contact_email", "contact_phone", "contact_whatsapp"]);

        if (settingsError) {
          throw settingsError;
        }

        const settings = new Map<string, string>(
          (data ?? []).map((setting: { key: string; value: string }) => [
            setting.key,
            setting.value,
          ]),
        );
        if (active) {
          setContactDetails({
            email: settings.get("contact_email")?.trim() || CONTACT.email,
            phone: settings.get("contact_phone")?.trim() || CONTACT.phone,
            whatsapp: settings.get("contact_whatsapp")?.trim() || CONTACT.whatsapp,
          });
        }
      } catch (cause) {
        console.error("Unable to load contact details.", cause);
      }
    }

    void loadContactDetails();
    return () => {
      active = false;
    };
  }, []);

  const whatsappHref = /^https?:\/\//i.test(contactDetails.whatsapp)
    ? contactDetails.whatsapp
    : `https://wa.me/${contactDetails.whatsapp.replace(/\D/g, "")}`;
  const phoneHref = `tel:${contactDetails.phone.replace(/[^\d+]/g, "")}`;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setSent(false);
    setError("");
    setSending(true);

    try {
      const { error: insertError } = await getSupabaseBrowserClient()
        .from("enquiries")
        .insert({
          name: String(formData.get("name")).trim(),
          email: String(formData.get("email")).trim(),
          phone: String(formData.get("phone")).trim(),
          enquiry_type: String(formData.get("enquiry_type")),
          message: String(formData.get("message")).trim(),
          status: "new",
        });

      if (insertError) {
        throw insertError;
      }

      setSent(true);
      form.reset();
    } catch {
      setError("Something went wrong. Please try WhatsApp instead.");
    } finally {
      setSending(false);
    }
  }
  return (
    <section className="mx-auto grid max-w-7xl gap-20 px-6 pb-32 pt-40 lg:grid-cols-2">
      <Reveal>
        <p className="eyebrow">Consult with Us</p>
        <h1 className="mt-6 text-5xl md:text-6xl">
          Speak with us <span className="gold-em">in confidence.</span>
        </h1>
        <form onSubmit={submit} className="mt-14 space-y-6">
          <input required name="name" placeholder="Full name" className={field} />
          <div className="grid gap-6 sm:grid-cols-2">
            <input required type="email" name="email" placeholder="Email" className={field} />
            <input name="phone" placeholder="Phone" className={field} />
          </div>
          <div className="relative">
            <select
              name="enquiry_type"
              defaultValue=""
              required
              className={field + " appearance-none bg-onyx pr-10"}
            >
              <option value="" disabled>
                Type of enquiry
              </option>
              <option>Strategic Litigation & Dispute Resolution</option>
              <option>Criminal Defence</option>
              <option>Regulatory & Institutional Advisory</option>
              <option>Corporate & Commercial Advisory</option>
              <option>Other</option>
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-gold"
            />
          </div>
          <textarea
            required
            name="message"
            rows={5}
            placeholder="Briefly describe your matter"
            className={field + " resize-none"}
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-gold px-10 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary-foreground transition-all duration-500 hover:glow-gold hover:bg-gold-soft disabled:cursor-wait disabled:opacity-60"
          >
            {sending ? "Sending..." : "Submit Enquiry"}
          </button>
          {error && (
            <p role="alert" aria-live="polite" className="text-sm text-red-400">
              {error}
            </p>
          )}
          {sent && (
            <p role="status" aria-live="polite" className="text-gold">
              Thank you — your enquiry has been received.
            </p>
          )}
        </form>
      </Reveal>
      <Reveal
        delay={0.2}
        className="flex flex-col items-center border bg-charcoal p-12 text-center"
      >
        <img
          src={logo}
          alt="Ntori Chambers — Your Modern Lawyer"
          width={260}
          height={260}
          className="w-56 md:w-64"
        />
        <div className="mt-14 w-full divide-y border-y text-left">
          {[
            { i: Mail, l: "Email", v: contactDetails.email, h: `mailto:${contactDetails.email}` },
            { i: MessageCircle, l: "WhatsApp", v: contactDetails.whatsapp, h: whatsappHref },
            { i: Phone, l: "Call Us", v: contactDetails.phone, h: phoneHref },
          ].map((c) => (
            <a
              key={c.l}
              href={c.h}
              target={c.l === "WhatsApp" ? "_blank" : undefined}
              rel="noreferrer"
              className="group flex items-center gap-6 py-6"
            >
              <c.i className="h-5 w-5 text-gold" strokeWidth={1.3} />
              <div>
                <p className="eyebrow">{c.l}</p>
                <p className="mt-1 font-serif text-xl text-foreground transition-colors group-hover:text-gold">
                  {c.v}
                </p>
              </div>
            </a>
          ))}
        </div>
        <p className="mt-10 font-serif italic text-gold">Rea Leboha</p>
      </Reveal>
    </section>
  );
}
