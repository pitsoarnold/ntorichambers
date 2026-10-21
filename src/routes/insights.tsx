import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import hero from "@/assets/hero.jpg";
import { PageHero, Reveal } from "@/components/site";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  created_at: string;
};

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Ntori Chambers" },
      {
        name: "description",
        content: "Legal insights, perspectives, and articles from Ntori Chambers.",
      },
      { property: "og:title", content: "Insights — Ntori Chambers" },
      {
        property: "og:description",
        content: "Legal insights, perspectives, and articles from Ntori Chambers.",
      },
    ],
  }),
  component: Insights,
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(date);
}

function Insights() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPosts() {
      try {
        const { data, error } = await getSupabaseBrowserClient()
          .from("posts")
          .select("id, title, slug, excerpt, cover_image_url, created_at")
          .eq("published", true)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (active) {
          setPosts((data ?? []) as Post[]);
        }
      } catch (error) {
        console.error("Unable to load published insights.", error);
        if (active) {
          setLoadError("Unable to load insights right now. Please try again later.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPosts();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHero
        eyebrow="Ideas & Perspectives"
        image={hero}
        title={
          <>
            Insights for a <span className="gold-em">changing legal landscape.</span>
          </>
        }
      />

      <section aria-label="Published articles" className="mx-auto max-w-7xl px-6 py-28 md:py-40">
        {loading ? (
          <div
            role="status"
            aria-label="Loading insights"
            aria-busy="true"
            className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="border border-white/10 bg-charcoal p-5">
                <Skeleton className="aspect-[16/10] w-full" />
                <Skeleton className="mt-6 h-3 w-1/3" />
                <Skeleton className="mt-4 h-8 w-4/5" />
                <Skeleton className="mt-4 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-5/6" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <p
            role="alert"
            className="border border-red-400/20 bg-red-400/[0.06] p-5 text-sm text-red-200"
          >
            {loadError}
          </p>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen aria-hidden="true" className="mx-auto h-10 w-10 text-gold/50" />
            <p className="mt-5 font-serif text-2xl text-foreground">Insights are coming soon.</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Check back for perspectives from Ntori Chambers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <Reveal
                key={post.id}
                delay={(index % 3) * 0.08}
                className="group flex h-full flex-col overflow-hidden border border-white/10 bg-charcoal transition-colors hover:border-gold/50"
              >
                <Link
                  to="/insights/$slug"
                  params={{ slug: post.slug }}
                  aria-label={`Read article: ${post.title}`}
                  className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-onyx">
                    {post.cover_image_url ? (
                      <img
                        src={post.cover_image_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gold/40">
                        <BookOpen aria-hidden="true" className="h-12 w-12" strokeWidth={1} />
                      </div>
                    )}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 border border-transparent transition-colors duration-500 group-hover:border-gold/50"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <time
                      dateTime={post.created_at}
                      className="text-xs uppercase tracking-[0.18em] text-gold"
                    >
                      {formatDate(post.created_at)}
                    </time>
                    <h2 className="mt-4 font-serif text-2xl leading-snug text-foreground transition-colors group-hover:text-gold-soft">
                      {post.title}
                    </h2>
                    <p className="mt-4 line-clamp-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {post.excerpt}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-gold">
                      Read article
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
