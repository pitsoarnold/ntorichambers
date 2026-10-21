import { createFileRoute } from "@tanstack/react-router";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Building2, User, Landmark, Globe2, ShieldCheck } from "lucide-react";
import hero from "@/assets/hero.jpg";
import library from "@/assets/library.jpg";
import logo from "@/assets/logo.png";
import { EASE, GoldButton, Reveal } from "@/components/site";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ntori Chambers — Litigation & Regulatory Advisory, Lesotho" },
      {
        name: "description",
        content:
          "Strategic dispute resolution, compliance assurance and risk management for corporations, institutions and individuals.",
      },
      { property: "og:title", content: "Ntori Chambers — Your Modern Lawyer" },
      {
        property: "og:description",
        content: "We are not transactional volume lawyers. We are outcome engineers.",
      },
    ],
  }),
  component: Home,
});

const PHILOSOPHY = [
  { n: "I", t: "Procedure is power." },
  { n: "II", t: "Evidence must be controlled, not assumed." },
  { n: "III", t: "Constitutional reasoning underpins durable outcomes." },
  { n: "IV", t: "Strategy precedes advocacy." },
];
const SERVE = [
  { i: Building2, t: "Corporations & SMEs" },
  { i: User, t: "Individuals in high-impact disputes" },
  { i: Landmark, t: "Public institutions" },
  { i: Globe2, t: "Development organisations" },
  { i: ShieldCheck, t: "Regulated entities" },
];

function Home() {
  const ref = useRef(null);
  const [heroTitle, setHeroTitle] = useState(
    "Strengthening Legal Capacity.\nAdvancing Long-Term Value.",
  );
  const [heroSubtitle, setHeroSubtitle] = useState(
    "A high-level litigation and regulatory advisory firm focused on risk management, compliance assurance, and strategic dispute resolution.",
  );
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0.15, 0.45, 0.75], [0, 1, 0.2]);
  const scale = useTransform(scrollYProgress, [0.15, 0.5], [0.94, 1]);
  const backgroundY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [-40, 40]);

  useEffect(() => {
    let active = true;

    async function loadHeroSettings() {
      try {
        const { data, error } = await getSupabaseBrowserClient()
          .from("site_settings")
          .select("key, value")
          .in("key", ["homepage_hero_title", "homepage_hero_subtitle"]);

        if (error) {
          throw error;
        }

        const settings = new Map<string, string>(
          (data ?? []).map((setting: { key: string; value: string }) => [
            setting.key,
            setting.value,
          ]),
        );
        if (active) {
          const title = settings.get("homepage_hero_title")?.trim();
          const subtitle = settings.get("homepage_hero_subtitle")?.trim();
          if (title) {
            setHeroTitle(title);
          }
          if (subtitle) {
            setHeroSubtitle(subtitle);
          }
        }
      } catch (error) {
        console.error("Unable to load homepage hero settings.", error);
      }
    }

    void loadHeroSettings();
    return () => {
      active = false;
    };
  }, []);

  const [heroTitleLead, heroTitleHighlight] = heroTitle.split("\n", 2);

  return (
    <>
      <section className="relative flex min-h-screen items-center overflow-hidden">
        <motion.img
          src={hero}
          alt="Dark courtroom lit by golden light"
          width={1920}
          height={1088}
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 3, ease: EASE }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="img-overlay absolute inset-0" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pt-24 lg:grid-cols-[1fr_auto]">
          <div>
            <Reveal>
              <p className="eyebrow">Ntori Chambers · Est. 2022 · Lesotho</p>
            </Reveal>
            <Reveal delay={0.15}>
              <h1 className="mt-8 whitespace-pre-line text-5xl md:text-7xl lg:text-8xl">
                {heroTitleLead}
                {heroTitleHighlight && (
                  <>
                    <br />
                    <span className="gold-em">{heroTitleHighlight}</span>
                  </>
                )}
              </h1>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-8 max-w-2xl text-lg">{heroSubtitle}</p>
            </Reveal>
            <Reveal delay={0.45} className="mt-12 flex flex-wrap gap-4">
              <GoldButton to="/contact">Consult with Us</GoldButton>
              <GoldButton to="/services" outline>
                Our Expertise
              </GoldButton>
            </Reveal>
          </div>
          <motion.img
            src={logo}
            alt="Ntori Chambers crest"
            initial={{ opacity: 0, rotate: -12 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: 1.8, ease: EASE, delay: 0.6 }}
            className="hidden w-72 drop-shadow-2xl lg:block"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-40">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <p className="eyebrow">Our Philosophy</p>
            <h2 className="mt-6 text-4xl md:text-5xl">
              Law is not merely about arguments. It is about{" "}
              <span className="gold-em">structure, integrity, and leverage.</span>
            </h2>
          </Reveal>
          <div className="grid gap-px bg-border sm:grid-cols-2">
            {PHILOSOPHY.map((p, i) => (
              <Reveal
                key={p.n}
                delay={i * 0.1}
                className="group bg-onyx p-10 transition-colors duration-700 hover:bg-charcoal"
              >
                <span className="font-serif text-sm italic text-gold">{p.n}</span>
                <p className="mt-10 font-serif text-2xl leading-snug text-foreground transition-colors duration-500 group-hover:text-gold-soft">
                  {p.t}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-charcoal py-40">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="eyebrow">Who We Serve</p>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {SERVE.map((s, i) => (
              <Reveal
                key={s.t}
                delay={i * 0.08}
                className={i === SERVE.length - 1 ? "sm:col-span-2" : ""}
              >
                <article className="group flex min-h-44 items-start gap-6 border border-ivory/10 bg-onyx/30 p-7 transition-colors duration-500 hover:border-gold/70 hover:bg-ivory/[0.04] sm:p-9">
                  <s.i
                    aria-hidden="true"
                    className="mt-1 h-6 w-6 shrink-0 text-gold"
                    strokeWidth={1.2}
                  />
                  <div>
                    <span className="text-xs uppercase tracking-[0.25em] text-gold/70">
                      0{i + 1}
                    </span>
                    <h3 className="mt-5 font-serif text-2xl leading-tight text-foreground transition-colors duration-500 group-hover:text-gold-soft md:text-3xl">
                      {s.t}
                    </h3>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        ref={ref}
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
      >
        <motion.img
          src={library}
          alt=""
          loading="lazy"
          style={{ y: backgroundY }}
          className="absolute -inset-y-[10%] h-[120%] w-full object-cover opacity-25"
        />
        <div className="img-overlay absolute inset-0" />
        <motion.h2
          style={{ opacity, scale }}
          className="relative max-w-6xl text-center text-5xl md:text-8xl"
        >
          We are not transactional volume lawyers. We are{" "}
          <span className="gold-em">outcome engineers.</span>
        </motion.h2>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-40 text-center">
        <Reveal>
          <h2 className="text-4xl md:text-6xl">
            Ready to secure <span className="gold-em">your interests?</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl">
            Procedure is power. Evidence must be controlled, not assumed. Speak with us in
            confidence.
          </p>
          <div className="mt-12">
            <GoldButton to="/contact">Consult with Us</GoldButton>
          </div>
        </Reveal>
      </section>
    </>
  );
}
