import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import columns from "@/assets/columns.jpg";
import library from "@/assets/library.jpg";
import { GoldButton, PageHero, Reveal } from "@/components/site";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Attorney = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string | null;
  sort_order: number;
};

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "The Firm — Ntori Chambers" },
      {
        name: "description",
        content:
          "A strategically focused legal practice delivering structured dispute resolution and regulatory advisory services.",
      },
      { property: "og:title", content: "The Firm — Ntori Chambers" },
      {
        property: "og:description",
        content: "The modern standard of legal excellence in Lesotho and Southern Africa.",
      },
    ],
  }),
  component: About,
});

const MILESTONES = [
  {
    t: "Foundational Establishment",
    d: [
      "Developed Ntori Chambers as a litigation-centred practice structured around procedural rigour and strategic case architecture.",
      "Built internal case management frameworks emphasising evidence hierarchy mapping and procedural sequencing.",
    ],
  },
  {
    t: "Litigation & Judicial Engagement",
    d: [
      "Defending high-stakes civil and criminal matters requiring advanced evidentiary scrutiny.",
      "Advancing constitutional arguments within administrative and procedural disputes.",
      "Challenging admissibility standards for electronic and digital records.",
      "Structuring judicial review applications targeting procedural irregularities.",
    ],
  },
  {
    t: "Institutional Advisory",
    d: [
      "Compliance and regulatory advisory for entities in structured statutory environments.",
      "Contractual and governance safeguards mitigating litigation exposure.",
      "Risk management strategies for regulated operations.",
    ],
  },
  {
    t: "Legal Systems Development",
    d: [
      "Structured litigation methodologies: evidence chain integrity, procedural vulnerability detection, constitutional alignment testing.",
      "Research-driven analysis integrated into everyday practice for doctrinal precision.",
      "A forward-looking practice model aligned with institutional clients and complex disputes.",
    ],
  },
];

function About() {
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [loadingAttorneys, setLoadingAttorneys] = useState(true);
  const [attorneysError, setAttorneysError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAttorneys() {
      try {
        const { data, error } = await getSupabaseBrowserClient()
          .from("attorneys")
          .select("*")
          .order("sort_order");

        if (error) {
          throw error;
        }

        if (active) {
          setAttorneys((data ?? []) as Attorney[]);
        }
      } catch (error) {
        console.error("Unable to load attorneys.", error);
        if (active) {
          setAttorneysError("Unable to load our team at this time. Please try again later.");
        }
      } finally {
        if (active) {
          setLoadingAttorneys(false);
        }
      }
    }

    void loadAttorneys();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHero
        eyebrow="The Firm"
        image={columns}
        title={
          <>
            The Modern Standard of <span className="gold-em">Legal Excellence.</span>
          </>
        }
      />

      <section className="mx-auto grid max-w-7xl gap-16 px-6 py-40 lg:grid-cols-2">
        <Reveal>
          <p className="font-serif text-3xl leading-snug text-foreground md:text-4xl">
            Ntori Chambers is a strategically focused legal practice delivering structured dispute
            resolution and regulatory advisory services to institutions and individuals operating
            within <span className="gold-em">complex legal and compliance environments.</span>
          </p>
        </Reveal>
        <Reveal delay={0.2} className="space-y-6 text-lg">
          <p>
            We serve organisations operating in regulated and high-impact environments, where every
            procedural step carries consequence and every piece of evidence must withstand scrutiny.
          </p>
          <p>
            We partner with our clients to deliver reliable legal guidance that protects what
            they've built and supports where they're going.
          </p>
          <img
            src={library}
            alt="Law library with brass lamp"
            loading="lazy"
            width={1280}
            height={960}
            className="mt-10 aspect-[4/3] w-full object-cover"
          />
        </Reveal>
      </section>

      <section className="border-t bg-charcoal py-40">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <p className="eyebrow">Impact Milestones</p>
            <h2 className="mt-6 text-4xl md:text-5xl">
              Built with <span className="gold-em">intent.</span>
            </h2>
          </Reveal>
          <ol className="relative mt-20 border-l border-gold/40 pl-10 md:pl-16">
            {MILESTONES.map((m, i) => (
              <Reveal key={m.t} delay={0.05} className="relative pb-20 last:pb-0">
                <span className="absolute -left-[2.85rem] top-1 flex h-5 w-5 items-center justify-center rounded-full border border-gold bg-onyx md:-left-[4.35rem]">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                </span>
                <p className="font-serif text-sm italic text-gold">Phase 0{i + 1}</p>
                <h3 className="mt-3 text-3xl">{m.t}</h3>
                <ul className="mt-6 space-y-3">
                  {m.d.map((d) => (
                    <li key={d} className="flex gap-4">
                      <span className="mt-3 h-px w-6 shrink-0 bg-gold" />
                      {d}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section
        aria-labelledby="our-team-heading"
        className="border-t border-white/10 py-32 md:py-40"
      >
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">The People Behind the Practice</p>
            <h2 id="our-team-heading" className="mt-6 text-4xl md:text-5xl">
              Our <span className="gold-em">Team.</span>
            </h2>
            <p className="mt-5 text-muted-foreground">
              Experienced counsel committed to thoughtful strategy and trusted representation.
            </p>
          </Reveal>

          {loadingAttorneys ? (
            <div
              role="status"
              aria-label="Loading our team"
              aria-busy="true"
              className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="border border-white/10 bg-charcoal p-6">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <Skeleton className="mt-6 h-7 w-3/4" />
                  <Skeleton className="mt-3 h-3 w-1/3" />
                  <Skeleton className="mt-5 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-5/6" />
                </div>
              ))}
            </div>
          ) : attorneysError ? (
            <p role="alert" className="mt-16 text-center text-sm text-red-300">
              {attorneysError}
            </p>
          ) : attorneys.length === 0 ? (
            <p className="mt-16 text-center text-muted-foreground">
              Team profiles will be added soon.
            </p>
          ) : (
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {attorneys.map((attorney, index) => (
                <Reveal
                  key={attorney.id}
                  delay={Math.min(index % 3, 2) * 0.08}
                  className="group overflow-hidden border border-white/10 bg-charcoal transition-colors hover:border-gold/40"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-onyx">
                    {attorney.image_url ? (
                      <img
                        src={attorney.image_url}
                        alt={attorney.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        aria-label={`No portrait available for ${attorney.name}`}
                        role="img"
                        className="flex h-full w-full items-center justify-center text-gold/50"
                      >
                        <UserRound aria-hidden="true" className="h-20 w-20" strokeWidth={1} />
                      </div>
                    )}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 border border-transparent transition-colors duration-700 group-hover:border-gold/40"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-2xl text-foreground md:text-3xl">
                      {attorney.name}
                    </h3>
                    <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-gold">
                      {attorney.role}
                    </p>
                    <p className="mt-5 line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {attorney.bio}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-40 text-center">
        <GoldButton to="/contact">Consult with Us</GoldButton>
      </section>
    </>
  );
}
