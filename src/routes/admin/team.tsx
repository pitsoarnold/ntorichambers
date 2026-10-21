import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Attorney = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string | null;
  sort_order: number;
};

export const Route = createFileRoute("/admin/team")({
  component: TeamPage,
});

function TeamPage() {
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedAttorney, setSelectedAttorney] = useState<Attorney | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [sortOrder, setSortOrder] = useState<number | "">(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [notification, setNotification] = useState("");
  const editDialog = useRef<HTMLDialogElement>(null);

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
        console.error("Unable to load attorneys for the CMS.", error);
        if (active) {
          setLoadError("Unable to load attorneys. Please refresh and try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAttorneys();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const dialog = editDialog.current;
    if (selectedAttorney && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!selectedAttorney && dialog?.open) {
      dialog.close();
    }
  }, [selectedAttorney]);

  function resetForm() {
    setName("");
    setRole("");
    setBio("");
    setSortOrder(attorneys.reduce((max, attorney) => Math.max(max, attorney.sort_order), -1) + 1);
    setImageFile(null);
    setSaveError("");
    setDeleteError("");
  }

  function createAttorney() {
    resetForm();
    setSelectedAttorney({
      id: "",
      name: "",
      role: "",
      bio: "",
      image_url: null,
      sort_order: attorneys.reduce((max, attorney) => Math.max(max, attorney.sort_order), -1) + 1,
    });
  }

  function editAttorney(attorney: Attorney) {
    setName(attorney.name);
    setRole(attorney.role);
    setBio(attorney.bio);
    setSortOrder(attorney.sort_order);
    setImageFile(null);
    setSaveError("");
    setDeleteError("");
    setSelectedAttorney(attorney);
  }

  async function saveAttorney(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAttorney || saving || deleting) {
      return;
    }

    const updatedName = name.trim();
    const updatedRole = role.trim();
    const updatedBio = bio.trim();
    if (
      !updatedName ||
      !updatedRole ||
      !updatedBio ||
      sortOrder === "" ||
      !Number.isFinite(sortOrder)
    ) {
      setSaveError("Name, role, bio, and a valid sort order are required.");
      return;
    }

    setSaving(true);
    setSaveError("");
    setNotification("");

    try {
      const supabase = getSupabaseBrowserClient();
      let imageUrl = selectedAttorney.image_url;

      if (imageFile) {
        const safeFileName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${safeFileName}`;
        const storagePath = `attorneys/${uniqueFileName}`;
        const { error: uploadError } = await supabase.storage
          .from("public-images")
          .upload(storagePath, imageFile);
        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from("public-images")
          .getPublicUrl(storagePath);
        imageUrl = publicUrlData.publicUrl;
      }

      const values = {
        name: updatedName,
        role: updatedRole,
        bio: updatedBio,
        image_url: imageUrl,
        sort_order: sortOrder,
      };
      const query = selectedAttorney.id
        ? supabase.from("attorneys").update(values).eq("id", selectedAttorney.id).select("*")
        : supabase.from("attorneys").insert(values).select("*");
      const { data, error } = await query.maybeSingle();

      if (error) {
        throw error;
      }
      if (!data) {
        throw new Error("The attorney was not saved.");
      }

      const savedAttorney = data as Attorney;
      setAttorneys((current) =>
        (selectedAttorney.id
          ? current.map((attorney) =>
              attorney.id === selectedAttorney.id ? savedAttorney : attorney,
            )
          : [...current, savedAttorney]
        ).sort((a, b) => a.sort_order - b.sort_order),
      );
      setSelectedAttorney(null);
      setNotification(
        selectedAttorney.id ? "Attorney updated successfully." : "Attorney created successfully.",
      );
    } catch (error) {
      console.error("Unable to save attorney changes.", error);
      const message = error instanceof Error ? error.message : String(error);
      setSaveError(`Unable to save changes: ${message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteAttorney() {
    if (!selectedAttorney?.id || saving || deleting) {
      return;
    }
    if (!window.confirm("Are you sure you want to delete this attorney?")) {
      return;
    }

    setDeleting(true);
    setDeleteError("");
    setNotification("");

    try {
      const { error } = await getSupabaseBrowserClient()
        .from("attorneys")
        .delete()
        .eq("id", selectedAttorney.id);

      if (error) {
        throw error;
      }

      setAttorneys((current) => current.filter((attorney) => attorney.id !== selectedAttorney.id));
      setSelectedAttorney(null);
      setNotification("Attorney deleted successfully.");
    } catch (error) {
      console.error("Unable to delete attorney.", error);
      setDeleteError("Unable to delete attorney. Please try again.");
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
            Team
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#aaa69c]">
            Manage the attorneys displayed on your public website.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {!loading && !loadError && (
            <p className="text-sm text-[#aaa69c]">
              {attorneys.length} {attorneys.length === 1 ? "attorney" : "attorneys"}
            </p>
          )}
          <button
            type="button"
            onClick={createAttorney}
            disabled={loading}
            className="inline-flex items-center gap-2 border border-[#c2a46d]/50 bg-[#c2a46d]/10 px-4 py-2 text-sm font-medium text-[#e1c78e] transition-colors hover:bg-[#c2a46d]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2a46d] disabled:cursor-wait disabled:opacity-60"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New Attorney
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
          aria-label="Attorneys"
          aria-busy={loading}
          className="mt-8 divide-y divide-white/[0.07] border border-white/10 bg-[#141413]"
        >
          {loading ? (
            <li role="status" className="px-5 py-12 text-center text-sm text-[#aaa69c]">
              Loading attorneys…
            </li>
          ) : attorneys.length === 0 ? (
            <li className="px-5 py-12 text-center text-sm text-[#aaa69c]">
              No attorneys are available yet.
            </li>
          ) : (
            attorneys.map((attorney, index) => (
              <li
                key={attorney.id}
                className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-4">
                  {attorney.image_url ? (
                    <img
                      src={attorney.image_url}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/10 text-sm text-[#8f8b82]"
                    >
                      No image
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#8f8b82]">
                      Attorney {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="mt-2 font-serif text-xl text-[#f4f0e7]">{attorney.name}</h2>
                    <p className="mt-1 text-sm text-[#c2a46d]">{attorney.role}</p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#aaa69c]">
                      {attorney.bio}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => editAttorney(attorney)}
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
        ref={editDialog}
        aria-labelledby="edit-attorney-title"
        onCancel={() => setSelectedAttorney(null)}
        onClick={(event) => {
          if (event.target === editDialog.current) {
            setSelectedAttorney(null);
          }
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-[#e9e5dc] backdrop:bg-black/70"
      >
        {selectedAttorney && (
          <aside className="ml-auto flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-[#111110] shadow-2xl shadow-black/50">
            <header className="flex items-start justify-between gap-6 border-b border-white/10 px-6 py-6 sm:px-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c2a46d]">
                  {selectedAttorney.id ? "Edit attorney" : "New attorney"}
                </p>
                <h2 id="edit-attorney-title" className="mt-3 font-serif text-3xl text-[#f4f0e7]">
                  {selectedAttorney.id ? "Update team member" : "Add an attorney"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close attorney editor"
                onClick={() => setSelectedAttorney(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 text-[#aaa69c] transition-colors hover:border-[#c2a46d]/50 hover:text-[#e1c78e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2a46d]"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={saveAttorney} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-7 sm:px-8">
                <div>
                  <label
                    htmlFor="attorney-name"
                    className="text-xs font-medium uppercase tracking-[0.15em] text-[#aaa69c]"
                  >
                    Name
                  </label>
                  <input
                    autoFocus
                    required
                    id="attorney-name"
                    value={name}
                    onChange={(event) => setName(event.currentTarget.value)}
                    maxLength={200}
                    className="mt-2 w-full border border-white/10 bg-[#0d0d0c] px-4 py-3 text-sm text-[#f4f0e7] outline-none transition-colors focus:border-[#c2a46d]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="attorney-role"
                    className="text-xs font-medium uppercase tracking-[0.15em] text-[#aaa69c]"
                  >
                    Role
                  </label>
                  <input
                    required
                    id="attorney-role"
                    value={role}
                    onChange={(event) => setRole(event.currentTarget.value)}
                    maxLength={200}
                    className="mt-2 w-full border border-white/10 bg-[#0d0d0c] px-4 py-3 text-sm text-[#f4f0e7] outline-none transition-colors focus:border-[#c2a46d]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="attorney-bio"
                    className="text-xs font-medium uppercase tracking-[0.15em] text-[#aaa69c]"
                  >
                    Bio
                  </label>
                  <textarea
                    required
                    id="attorney-bio"
                    value={bio}
                    onChange={(event) => setBio(event.currentTarget.value)}
                    rows={8}
                    className="mt-2 w-full resize-y border border-white/10 bg-[#0d0d0c] px-4 py-3 text-sm leading-relaxed text-[#f4f0e7] outline-none transition-colors focus:border-[#c2a46d]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="attorney-sort-order"
                    className="text-xs font-medium uppercase tracking-[0.15em] text-[#aaa69c]"
                  >
                    Sort Order
                  </label>
                  <input
                    required
                    id="attorney-sort-order"
                    type="number"
                    step="1"
                    value={sortOrder}
                    onChange={(event) =>
                      setSortOrder(
                        event.currentTarget.value === "" ? "" : event.currentTarget.valueAsNumber,
                      )
                    }
                    className="mt-2 w-full border border-white/10 bg-[#0d0d0c] px-4 py-3 text-sm text-[#f4f0e7] outline-none transition-colors focus:border-[#c2a46d]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="attorney-image"
                    className="text-xs font-medium uppercase tracking-[0.15em] text-[#aaa69c]"
                  >
                    Image Upload
                  </label>
                  <input
                    id="attorney-image"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setImageFile(event.currentTarget.files?.[0] ?? null)}
                    className="mt-2 block w-full text-sm text-[#aaa69c] file:mr-4 file:border file:border-white/10 file:bg-[#0d0d0c] file:px-4 file:py-2 file:text-sm file:text-[#e1c78e]"
                  />
                  {imageFile && (
                    <p className="mt-2 text-xs text-[#aaa69c]">Selected: {imageFile.name}</p>
                  )}
                  {!imageFile && selectedAttorney.image_url && (
                    <img
                      src={selectedAttorney.image_url}
                      alt="Current attorney portrait"
                      className="mt-4 h-24 w-24 rounded-full object-cover"
                    />
                  )}
                  <p className="mt-2 text-xs text-[#8f8b82]">
                    {selectedAttorney.image_url
                      ? "Choose a new image to replace the current portrait."
                      : "Choose an image for this attorney."}
                  </p>
                </div>
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
                {selectedAttorney.id ? (
                  <button
                    type="button"
                    onClick={() => void deleteAttorney()}
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
                    onClick={() => setSelectedAttorney(null)}
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
                    {saving ? "Saving…" : selectedAttorney.id ? "Save changes" : "Create attorney"}
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
