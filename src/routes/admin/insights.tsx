import { createFileRoute } from "@tanstack/react-router";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
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

export const Route = createFileRoute("/admin/insights")({
  component: InsightsPage,
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function InsightsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [notification, setNotification] = useState("");
  const editorDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let active = true;

    async function loadPosts() {
      try {
        const { data, error } = await getSupabaseBrowserClient()
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (active) {
          setPosts((data ?? []) as Post[]);
        }
      } catch (error) {
        console.error("Unable to load articles for the CMS.", error);
        if (active) {
          setLoadError("Unable to load articles. Please refresh and try again.");
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

  useEffect(() => {
    const dialog = editorDialog.current;
    if (selectedPost && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!selectedPost && dialog?.open) {
      dialog.close();
    }
  }, [selectedPost]);

  function clearEditor() {
    setTitle("");
    setSlug("");
    setSlugManuallyEdited(false);
    setExcerpt("");
    setContent("");
    setPublished(false);
    setCoverImage(null);
    setSaveError("");
    setDeleteError("");
  }

  function createPost() {
    clearEditor();
    setSelectedPost({
      id: "",
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      cover_image_url: null,
      published: false,
      created_at: new Date().toISOString(),
    });
  }

  function editPost(post: Post) {
    setTitle(post.title);
    setSlug(post.slug);
    setSlugManuallyEdited(true);
    setExcerpt(post.excerpt);
    setContent(post.content);
    setPublished(post.published);
    setCoverImage(null);
    setSaveError("");
    setDeleteError("");
    setSelectedPost(post);
  }

  function handleTitleBlur() {
    if (!slugManuallyEdited) {
      setSlug(slugify(title));
    }
  }

  async function getUniqueSlug(baseSlug: string, postId?: string) {
    const normalizedBase = slugify(baseSlug) || "article";
    const supabase = getSupabaseBrowserClient();

    for (let suffix = 1; ; suffix += 1) {
      const candidate = suffix === 1 ? normalizedBase : `${normalizedBase}-${suffix}`;
      const { data, error } = await supabase
        .from("posts")
        .select("id")
        .eq("slug", candidate)
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }
      if (!data || (postId && data.id === postId)) {
        return candidate;
      }
    }
  }

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPost || saving || deleting) {
      return;
    }

    const updatedTitle = title.trim();
    const updatedExcerpt = excerpt.trim();
    const updatedContent = content.trim();
    const desiredSlug = slugify(slug || title);
    if (!updatedTitle || !desiredSlug || !updatedExcerpt || !updatedContent) {
      setSaveError("Title, slug, excerpt, and content are required.");
      return;
    }

    setSaving(true);
    setSaveError("");
    setNotification("");

    try {
      const supabase = getSupabaseBrowserClient();
      const uniqueSlug = await getUniqueSlug(desiredSlug, selectedPost.id || undefined);
      let coverImageUrl = selectedPost.cover_image_url;

      if (coverImage) {
        const safeFileName = coverImage.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${safeFileName}`;
        const storagePath = `insights/${uniqueFileName}`;
        const { error: uploadError } = await supabase.storage
          .from("public-images")
          .upload(storagePath, coverImage);

        if (uploadError) {
          console.error("Article cover image upload error:", uploadError);
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("public-images")
          .getPublicUrl(storagePath);
        coverImageUrl = publicUrlData.publicUrl;
      }

      const values = {
        title: updatedTitle,
        slug: uniqueSlug,
        excerpt: updatedExcerpt,
        content: updatedContent,
        cover_image_url: coverImageUrl,
        published,
      };
      const query = selectedPost.id
        ? supabase.from("posts").update(values).eq("id", selectedPost.id).select("*")
        : supabase.from("posts").insert(values).select("*");
      const { data, error } = await query.maybeSingle();

      if (error) {
        throw error;
      }
      if (!data) {
        throw new Error("The article was not saved.");
      }

      const savedPost = data as Post;
      setPosts((current) =>
        (selectedPost.id
          ? current.map((post) => (post.id === selectedPost.id ? savedPost : post))
          : [...current, savedPost]
        ).sort((a, b) => b.created_at.localeCompare(a.created_at)),
      );
      setSelectedPost(null);
      setNotification(
        selectedPost.id ? "Article updated successfully." : "Article created successfully.",
      );
    } catch (error) {
      console.error("Unable to save article changes.", error);
      setSaveError(
        `Unable to save article: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function deletePost() {
    if (!selectedPost?.id || saving || deleting) {
      return;
    }
    if (!window.confirm("Are you sure you want to delete this article?")) {
      return;
    }

    setDeleting(true);
    setDeleteError("");
    setNotification("");

    try {
      const { error } = await getSupabaseBrowserClient()
        .from("posts")
        .delete()
        .eq("id", selectedPost.id);

      if (error) {
        throw error;
      }

      setPosts((current) => current.filter((post) => post.id !== selectedPost.id));
      setSelectedPost(null);
      setNotification("Article deleted successfully.");
    } catch (error) {
      console.error("Unable to delete article.", error);
      setDeleteError("Unable to delete article. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#c2a46d]">CMS</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-medium tracking-tight text-[#f4f0e7] sm:text-5xl">
            Insights
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#aaa69c]">
            Manage articles and insights published on your website.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {!loading && !loadError && (
            <p className="text-sm text-[#aaa69c]">
              {posts.length} {posts.length === 1 ? "article" : "articles"}
            </p>
          )}
          <button
            type="button"
            onClick={createPost}
            disabled={loading}
            className="inline-flex items-center gap-2 border border-[#c2a46d]/50 bg-[#c2a46d]/10 px-4 py-2 text-sm font-medium text-[#e1c78e] transition-colors hover:bg-[#c2a46d]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2a46d] disabled:cursor-wait disabled:opacity-60"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New Article
          </button>
        </div>
      </div>

      {loadError ? (
        <p
          role="alert"
          className="mt-8 border border-red-400/20 bg-red-400/[0.06] p-5 text-sm text-red-200"
        >
          {loadError}
        </p>
      ) : (
        <ul
          aria-label="Articles"
          aria-busy={loading}
          className="mt-8 divide-y divide-white/[0.07] border border-white/10 bg-[#141413]"
        >
          {loading ? (
            <li role="status" className="px-5 py-12 text-center text-sm text-[#aaa69c]">
              Loading articles…
            </li>
          ) : posts.length === 0 ? (
            <li className="px-5 py-12 text-center text-sm text-[#aaa69c]">
              No articles have been created yet.
            </li>
          ) : (
            posts.map((post, index) => (
              <li
                key={post.id}
                className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-4">
                  {post.cover_image_url ? (
                    <img
                      src={post.cover_image_url}
                      alt=""
                      className="h-20 w-28 shrink-0 object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-28 shrink-0 items-center justify-center border border-white/10 text-[#8f8b82]">
                      <ImagePlus aria-hidden="true" className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#8f8b82]">
                      Article {String(index + 1).padStart(2, "0")} ·{" "}
                      {post.published ? "Published" : "Draft"}
                    </p>
                    <h2 className="mt-2 truncate font-serif text-xl text-[#f4f0e7]">
                      {post.title}
                    </h2>
                    <p className="mt-1 truncate text-xs text-[#c2a46d]">/{post.slug}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#aaa69c]">
                      {post.excerpt}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => editPost(post)}
                  className="shrink-0 self-start border border-[#c2a46d]/40 px-4 py-2 text-sm text-[#e1c78e] transition-colors hover:border-[#c2a46d] hover:bg-[#c2a46d]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2a46d] sm:self-center"
                >
                  Edit
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {notification && (
        <p role="status" aria-live="polite" className="mt-5 text-sm text-[#e1c78e]">
          {notification}
        </p>
      )}

      <dialog
        ref={editorDialog}
        aria-labelledby="edit-article-title"
        onCancel={() => setSelectedPost(null)}
        onClick={(event) => {
          if (event.target === editorDialog.current) {
            setSelectedPost(null);
          }
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-[#e9e5dc] backdrop:bg-black/70"
      >
        {selectedPost && (
          <aside className="ml-auto flex h-full w-full max-w-3xl flex-col border-l border-white/10 bg-[#111110] shadow-2xl shadow-black/50">
            <header className="flex items-start justify-between gap-6 border-b border-white/10 px-6 py-6 sm:px-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c2a46d]">
                  {selectedPost.id ? "Edit article" : "New article"}
                </p>
                <h2 id="edit-article-title" className="mt-3 font-serif text-3xl text-[#f4f0e7]">
                  {selectedPost.id ? "Update article" : "Create an article"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close article editor"
                onClick={() => setSelectedPost(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 text-[#aaa69c] transition-colors hover:border-[#c2a46d]/50 hover:text-[#e1c78e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2a46d]"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={savePost} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-7 sm:px-8">
                <div>
                  <label
                    htmlFor="article-title"
                    className="text-xs font-medium uppercase tracking-[0.15em] text-[#aaa69c]"
                  >
                    Title
                  </label>
                  <input
                    autoFocus
                    required
                    id="article-title"
                    value={title}
                    onChange={(event) => setTitle(event.currentTarget.value)}
                    onBlur={handleTitleBlur}
                    maxLength={250}
                    className="mt-2 w-full border border-white/10 bg-[#0d0d0c] px-4 py-3 text-sm text-[#f4f0e7] outline-none transition-colors focus:border-[#c2a46d]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="article-slug"
                    className="text-xs font-medium uppercase tracking-[0.15em] text-[#aaa69c]"
                  >
                    Slug
                  </label>
                  <div className="mt-2 flex items-center border border-white/10 bg-[#0d0d0c] px-4 text-sm text-[#8f8b82] focus-within:border-[#c2a46d]">
                    <span aria-hidden="true">/</span>
                    <input
                      required
                      id="article-slug"
                      value={slug}
                      onChange={(event) => {
                        setSlugManuallyEdited(true);
                        setSlug(slugify(event.currentTarget.value));
                      }}
                      maxLength={250}
                      className="w-full bg-transparent px-2 py-3 text-[#f4f0e7] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="article-excerpt"
                    className="text-xs font-medium uppercase tracking-[0.15em] text-[#aaa69c]"
                  >
                    Excerpt
                  </label>
                  <textarea
                    required
                    id="article-excerpt"
                    value={excerpt}
                    onChange={(event) => setExcerpt(event.currentTarget.value)}
                    rows={3}
                    className="mt-2 w-full resize-y border border-white/10 bg-[#0d0d0c] px-4 py-3 text-sm leading-relaxed text-[#f4f0e7] outline-none transition-colors focus:border-[#c2a46d]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="article-content"
                    className="text-xs font-medium uppercase tracking-[0.15em] text-[#aaa69c]"
                  >
                    Content
                  </label>
                  <textarea
                    required
                    id="article-content"
                    value={content}
                    onChange={(event) => setContent(event.currentTarget.value)}
                    rows={18}
                    className="mt-2 w-full resize-y border border-white/10 bg-[#0d0d0c] px-4 py-3 text-sm leading-relaxed text-[#f4f0e7] outline-none transition-colors focus:border-[#c2a46d]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="article-cover-image"
                    className="text-xs font-medium uppercase tracking-[0.15em] text-[#aaa69c]"
                  >
                    Cover Image
                  </label>
                  <input
                    id="article-cover-image"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setCoverImage(event.currentTarget.files?.[0] ?? null)}
                    className="mt-2 block w-full text-sm text-[#aaa69c] file:mr-4 file:border file:border-white/10 file:bg-[#0d0d0c] file:px-4 file:py-2 file:text-sm file:text-[#e1c78e]"
                  />
                  {coverImage && (
                    <p className="mt-2 text-xs text-[#aaa69c]">Selected: {coverImage.name}</p>
                  )}
                  {!coverImage && selectedPost.cover_image_url && (
                    <img
                      src={selectedPost.cover_image_url}
                      alt="Current article cover"
                      className="mt-4 aspect-video max-h-40 object-cover"
                    />
                  )}
                </div>
                <label className="inline-flex items-center gap-3 text-sm text-[#b9b5ab]">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(event) => setPublished(event.currentTarget.checked)}
                    className="h-4 w-4 accent-[#c2a46d]"
                  />
                  Publish this article
                </label>
                {saveError && (
                  <p role="alert" className="text-sm text-red-300">
                    {saveError}
                  </p>
                )}
                {deleteError && (
                  <p role="alert" className="text-sm text-red-300">
                    {deleteError}
                  </p>
                )}
              </div>
              <footer className="flex flex-wrap justify-between gap-3 border-t border-white/10 px-6 py-5 sm:px-8">
                {selectedPost.id ? (
                  <button
                    type="button"
                    onClick={() => void deletePost()}
                    disabled={saving || deleting}
                    className="inline-flex items-center gap-2 border border-red-400/30 px-4 py-2 text-sm text-red-300 transition-colors hover:border-red-400/60 hover:bg-red-400/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPost(null)}
                    disabled={saving || deleting}
                    className="border border-white/10 px-4 py-2 text-sm text-[#b9b5ab] transition-colors hover:border-white/20 hover:text-[#f4f0e7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2a46d] disabled:cursor-wait disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || deleting}
                    className="border border-[#c2a46d]/50 bg-[#c2a46d]/10 px-5 py-2 text-sm font-medium text-[#e1c78e] transition-colors hover:bg-[#c2a46d]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2a46d] disabled:cursor-wait disabled:opacity-60"
                  >
                    {saving ? "Saving…" : selectedPost.id ? "Save changes" : "Create article"}
                  </button>
                </div>
              </footer>
            </form>
          </aside>
        )}
      </dialog>
    </section>
  );
}
