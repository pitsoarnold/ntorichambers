import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUp, Menu, X, MessageCircle } from "lucide-react";
import logo from "@/assets/logo.png";

const MotionLink = motion(Link);

export const EASE = [0.22, 1, 0.36, 1] as const;
export const CONTACT = {
  email: "ntori.p@gmail.com",
  whatsapp: "+266 63321139",
  whatsappLink: "https://wa.me/26663321139",
  phone: "+266 63321138",
  phoneLink: "tel:+26663321138",
};

export function Reveal({
  children,
  delay = 0,
  ...rest
}: { children: ReactNode; delay?: number } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function GoldButton({
  to,
  children,
  outline,
}: {
  to: "/" | "/about" | "/services" | "/contact";
  children: ReactNode;
  outline?: boolean;
}) {
  return (
    <MotionLink
      to={to}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={
        "group relative inline-flex items-center gap-3 overflow-hidden px-8 py-4 text-xs font-semibold uppercase tracking-[0.25em] transition-all duration-500 " +
        (outline
          ? "border border-ivory/30 text-foreground hover:border-gold hover:text-gold"
          : "bg-gold text-primary-foreground hover:glow-gold hover:bg-gold-soft")
      }
    >
      {children}
      <span className="transition-transform duration-500 group-hover:translate-x-2">→</span>
    </MotionLink>
  );
}

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "The Firm" },
  { to: "/services", label: "Expertise" },
  { to: "/insights", label: "Insights" },
  { to: "/contact", label: "Contact" },
  { to: "/consult", label: "Consultation" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30);
    on();
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-50 transition-all duration-700 " +
        (scrolled ? "border-b bg-onyx/90 backdrop-blur-md" : "bg-transparent")
      }
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Ntori Chambers crest" width={44} height={44} className="h-11 w-11" />
          <span className="hidden flex-col leading-none sm:flex">
            <span className="font-serif text-lg tracking-wide text-foreground">Ntori Chambers</span>
            <span className="mt-1 text-[0.6rem] uppercase tracking-[0.25em] text-gold">
              Your Modern Lawyer
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className={
                n.to === "/consult"
                  ? "border border-gold px-5 py-2.5 text-xs uppercase tracking-[0.25em] text-gold transition-all duration-500 hover:bg-gold hover:text-primary-foreground"
                  : "text-xs uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-gold"
              }
              activeProps={{
                className:
                  n.to === "/consult"
                    ? "border-[#c2a46d] bg-[#c2a46d] text-primary-foreground"
                    : "text-gold",
              }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <button
          className="text-foreground md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            id="mobile-navigation"
            initial={{ height: 0, opacity: 0, y: reduceMotion ? 0 : -12 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: reduceMotion ? 0 : -12 }}
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: EASE }}
            className="flex flex-col gap-6 overflow-hidden border-t bg-onyx px-6 py-8 md:hidden"
          >
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="font-serif text-2xl text-foreground"
              >
                {n.label}
              </Link>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-charcoal">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-3">
        <div className="flex items-center gap-4">
          <img
            src={logo}
            alt="Ntori Chambers crest"
            width={72}
            height={72}
            loading="lazy"
            className="h-18 w-18"
          />
          <div>
            <p className="font-serif text-xl text-foreground">Ntori Chambers</p>
            <p className="eyebrow mt-1">Your Modern Lawyer</p>
          </div>
        </div>
        <p className="text-sm">
          Strategic litigation and regulatory advisory for institutions and individuals across
          Lesotho and Southern Africa.
        </p>
        <div className="space-y-1 text-sm md:text-right">
          <a href={`mailto:${CONTACT.email}`} className="block hover:text-gold">
            {CONTACT.email}
          </a>
          <a href={CONTACT.phoneLink} className="block hover:text-gold">
            {CONTACT.phone}
          </a>
          <a
            href={CONTACT.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="block hover:text-gold"
          >
            WhatsApp {CONTACT.whatsapp}
          </a>
        </div>
      </div>
      <div className="border-t py-6 text-center text-[0.65rem] uppercase tracking-[0.25em]">
        © {new Date().getFullYear()} Ntori Chambers · Rea Leboha
      </div>
    </footer>
  );
}

export function WhatsAppFloat() {
  return (
    <a
      href={CONTACT.whatsappLink}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-gold bg-onyx/90 text-gold backdrop-blur-md transition-all duration-500 hover:glow-gold hover:bg-gold hover:text-primary-foreground"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}

export function ScrollToTopFloat() {
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label="Scroll to top"
          title="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.9 }}
          whileHover={{ scale: reduceMotion ? 1 : 1.05 }}
          whileTap={{ scale: reduceMotion ? 1 : 0.95 }}
          transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE }}
          className="fixed bottom-24 right-6 z-50 flex h-12 w-12 items-center justify-center border border-gold/60 bg-onyx/90 text-gold backdrop-blur-md transition-colors hover:border-gold hover:bg-gold hover:text-primary-foreground"
        >
          <ArrowUp className="h-5 w-5" strokeWidth={1.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export function PageHero({
  eyebrow,
  title,
  image,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  image: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative flex min-h-[70vh] items-end overflow-hidden">
      <motion.img
        src={image}
        alt=""
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.4, ease: EASE }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="img-overlay absolute inset-0" />
      <div className="relative mx-auto w-full max-w-7xl px-6 pb-20 pt-40">
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
        </Reveal>
        <Reveal delay={0.15}>
          <h1 className="mt-6 max-w-4xl text-5xl md:text-7xl">{title}</h1>
        </Reveal>
        {children && <Reveal delay={0.3}>{children}</Reveal>}
      </div>
    </section>
  );
}
