import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import hero from "@/assets/hero.jpg";
import { PageHero, Reveal } from "@/components/site";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image_url: string | null;
  published: boolean;
  created_at: string;
};

export const Route = createFileRoute("/insights/$slug")({
  head: () => ({
    meta: [
      { title: "Article — Ntori Chambers" },
      {
        name: "description",
        content: "Legal insights, perspectives, and articles from Ntori Chambers.",
      },
    ],
  }),
  component: InsightArticle,
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(date);
}

function InsightArticle() {
  const { slug } = Route.useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPost() {
      setLoading(true);
      setLoadError("");
      setPost(null);

      try {
        const { data, error } = await getSupabaseBrowserClient()
          .from("posts")
          .select("*")
          .eq("slug", slug)
          .eq("published", true)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (active) {
          setPost((data as Post | null) ?? null);
        }
      } catch (error) {
        console.error("Unable to load insight article.", error);
        if (active) {
          setLoadError("Unable to load this article right now. Please try again later.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPost();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <section role="status" aria-label="Loading article" className="mx-auto max-w-4xl px-6 py-40">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-8 h-14 w-4/5" />
        <Skeleton className="mt-4 h-14 w-3/5" />
        <Skeleton className="mt-10 aspect-[16/8] w-full" />
        <Skeleton className="mt-12 h-5 w-full" />
        <Skeleton className="mt-3 h-5 w-full" />
        <Skeleton className="mt-3 h-5 w-4/5" />
      </section>
    );
  }

  if (loadError || !post) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-40 text-center">
        <p className="eyebrow">Insights</p>
        <h1 className="mt-6 font-serif text-4xl text-foreground">
          {loadError ? "Article unavailable." : "Article not found."}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {loadError || "This article may have been moved or is no longer published."}
        </p>
        <Link
          to="/insights"
          className="mt-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-gold hover:text-gold-soft"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          All insights
        </Link>
      </section>
    );
  }

  return (
    <>
      <PageHero eyebrow="Insights" image={post.cover_image_url || hero} title={post.title} />
      <article className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <Reveal>
          <Link
            to="/insights"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-gold transition-colors hover:text-gold-soft"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            All insights
          </Link>
          <time
            dateTime={post.created_at}
            className="mt-10 block text-xs uppercase tracking-[0.2em] text-gold"
          >
            {formatDate(post.created_at)}
          </time>
          <h1 className="mt-5 font-serif text-4xl leading-tight text-foreground md:text-6xl">
            {post.title}
          </h1>
          <p className="mt-7 border-l border-gold/50 pl-6 font-serif text-xl italic leading-relaxed text-muted-foreground md:text-2xl">
            {post.excerpt}
          </p>
          {post.cover_image_url && (
            <img
              src={post.cover_image_url}
              alt=""
              className="mt-12 aspect-[16/8] w-full object-cover"
            />
          )}
          <div className="mt-12 whitespace-pre-line text-base leading-8 text-[#c6c1b7] md:text-lg md:leading-9">
            {post.content}
          </div>
        </Reveal>
      </article>
    </>
  );
}
