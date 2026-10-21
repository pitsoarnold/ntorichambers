import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import hero from "@/assets/hero.jpg";
import library from "@/assets/library.jpg";
import columns from "@/assets/columns.jpg";
import office from "@/assets/office.jpg";
import { GoldButton, PageHero, Reveal } from "@/components/site";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Areas of Practice — Ntori Chambers" },
      {
        name: "description",
        content:
          "Strategic litigation, criminal defence, regulatory advisory and commercial contract structuring.",
      },
      { property: "og:title", content: "Areas of Practice — Ntori Chambers" },
      {
        property: "og:description",
        content:
          "Litigation, criminal defence, regulatory and commercial advisory for high-stakes matters.",
      },
    ],
  }),
  component: Services,
});

type Service = {
  id: string;
  title: string;
  description: string;
  icon_name: string | null;
};

const SERVICE_IMAGES = [hero, library, columns, office];
const IMAGE_BY_NAME: Record<string, (typeof SERVICE_IMAGES)[number]> = {
  hero,
  library,
  columns,
  office,
};

function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadServices() {
      try {
        const { data, error } = await getSupabaseBrowserClient()
          .from("services")
          .select("*")
          .order("sort_order");

        if (error) {
          throw error;
        }

        if (active) {
          setServices((data ?? []) as Service[]);
        }
      } catch (error) {
        console.error("Unable to load services.", error);
        if (active) {
          setLoadError("Unable to load services. Please refresh and try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadServices();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Areas of Practice"
        image={office}
        title={
          <>
            Precision where the <span className="gold-em">stakes are highest.</span>
          </>
        }
      />
      <section className="mx-auto max-w-7xl space-y-32 px-6 py-40">
        {loading ? (
          <div role="status" aria-label="Loading services" aria-busy="true" className="space-y-32">
            {SERVICE_IMAGES.map((image, index) => (
              <div key={image} className="grid items-center gap-12 lg:grid-cols-2">
                <Skeleton className={"aspect-[4/3] w-full " + (index % 2 ? "lg:order-2" : "")} />
                <div className="space-y-6">
                  <Skeleton className="h-16 w-20" />
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            ))}
            <span className="sr-only">Loading services...</span>
          </div>
        ) : loadError ? (
          <p
            role="alert"
            className="border border-red-400/20 bg-red-400/[0.06] p-5 text-sm text-red-200"
          >
            {loadError}
          </p>
        ) : services.length === 0 ? (
          <p className="text-muted-foreground">No services are available at this time.</p>
        ) : (
          services.map((service, index) => {
            const image = service.icon_name
              ? (IMAGE_BY_NAME[service.icon_name.toLowerCase()] ??
                SERVICE_IMAGES[index % SERVICE_IMAGES.length])
              : SERVICE_IMAGES[index % SERVICE_IMAGES.length];

            return (
              <div
                key={service.id}
                className="group grid items-start gap-12 lg:grid-cols-2 lg:items-center"
              >
                <Reveal
                  className={"relative min-w-0 overflow-hidden " + (index % 2 ? "lg:order-2" : "")}
                >
                  <img
                    src={image}
                    alt={service.title}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-[1.6s] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-onyx/30" />
                  <div className="absolute inset-0 border border-transparent transition-colors duration-700 group-hover:border-gold" />
                </Reveal>
                <Reveal delay={0.15}>
                  <span className="font-serif text-6xl italic text-gold/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="mt-4 text-4xl transition-colors duration-500 group-hover:text-gold-soft md:text-5xl">
                    {service.title}
                  </h2>
                  <p className="mt-10 whitespace-pre-line border-y py-6 leading-relaxed">
                    {service.description}
                  </p>
                </Reveal>
              </div>
            );
          })
        )}
      </section>
      <section className="border-t bg-charcoal py-40 text-center">
        <Reveal>
          <h2 className="text-4xl md:text-5xl">
            Strategy precedes <span className="gold-em">advocacy.</span>
          </h2>
          <div className="mt-10">
            <GoldButton to="/contact">Consult with Us</GoldButton>
          </div>
        </Reveal>
      </section>
    </>
  );
}
