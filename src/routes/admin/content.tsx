import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Service = {
  id: string;
  title: string;
  description: string;
  icon_name: string | null;
  sort_order: number;
};

export const Route = createFileRoute("/admin/content")({
  component: ContentPage,
});

function ContentPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [notification, setNotification] = useState("");
  const editDialog = useRef<HTMLDialogElement>(null);

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
        console.error("Unable to load services for the CMS.", error);
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

  useEffect(() => {
    const dialog = editDialog.current;
    if (selectedService && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!selectedService && dialog?.open) {
      dialog.close();
    }
  }, [selectedService]);

  function editService(service: Service) {
    setTitle(service.title);
    setDescription(service.description);
    setSaveError("");
    setDeleteError("");
    setSelectedService(service);
  }

  function createService() {
    setTitle("");
    setDescription("");
    setSaveError("");
    setDeleteError("");
    setSelectedService({
      id: "",
      title: "",
      description: "",
      icon_name: null,
      sort_order: services.reduce((max, service) => Math.max(max, service.sort_order), -1) + 1,
    });
  }

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedService || saving || deleting) {
      return;
    }

    const updatedTitle = title.trim();
    const updatedDescription = description.trim();
    if (!updatedTitle || !updatedDescription) {
      setSaveError("Title and description are required.");
      return;
    }

    setSaving(true);
    setSaveError("");
    setNotification("");

    try {
      const supabase = getSupabaseBrowserClient();
      const query = selectedService.id
        ? supabase
            .from("services")
            .update({ title: updatedTitle, description: updatedDescription })
            .eq("id", selectedService.id)
            .select("*")
        : supabase
            .from("services")
            .insert({
              title: updatedTitle,
              description: updatedDescription,
              icon_name: null,
              sort_order: selectedService.sort_order,
            })
            .select("*");
      const { data, error } = await query.maybeSingle();

      if (error) {
        throw error;
      }
      if (!data) {
        throw new Error("The service was not saved.");
      }

      const savedService = data as Service;
      setServices((current) =>
        selectedService.id
          ? current.map((service) => (service.id === selectedService.id ? savedService : service))
          : [...current, savedService].sort((a, b) => a.sort_order - b.sort_order),
      );
      setSelectedService(null);
      setNotification(
        selectedService.id ? "Service updated successfully." : "Service created successfully.",
      );
    } catch (error) {
      console.error("Unable to save service changes.", error);
      setSaveError("Unable to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteService() {
    if (!selectedService?.id || saving || deleting) {
      return;
    }
    if (!window.confirm("Are you sure you want to delete this service?")) {
      return;
    }

    setDeleting(true);
    setDeleteError("");
    setNotification("");

    try {
      const { error } = await getSupabaseBrowserClient()
        .from("services")
        .delete()
        .eq("id", selectedService.id);

      if (error) {
        throw error;
      }

      setServices((current) => current.filter((service) => service.id !== selectedService.id));
      setSelectedService(null);
      setNotification("Service deleted successfully.");
    } catch (error) {
      console.error("Unable to delete service.", error);
      setDeleteError("Unable to delete service. Please try again.");
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
            Content
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#aaa69c]">
            Manage the services displayed on your public website.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {!loading && !loadError && (
            <p className="text-sm text-[#aaa69c]">
              {services.length} {services.length === 1 ? "service" : "services"}
            </p>
          )}
          <button
            type="button"
            onClick={createService}
            disabled={loading}
            className="inline-flex items-center gap-2 border border-[#c2a46d]/50 bg-[#c2a46d]/10 px-4 py-2 text-sm font-medium text-[#e1c78e] transition-colors hover:bg-[#c2a46d]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2a46d] disabled:cursor-wait disabled:opacity-60"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New Service
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
          aria-label="Services"
          aria-busy={loading}
          className="mt-8 divide-y divide-white/[0.07] border border-white/10 bg-[#141413]"
        >
          {loading ? (
            <li role="status" className="px-5 py-12 text-center text-sm text-[#aaa69c]">
              Loading services…
            </li>
          ) : services.length === 0 ? (
            <li className="px-5 py-12 text-center text-sm text-[#aaa69c]">
              No services are available yet.
            </li>
          ) : (
            services.map((service, index) => (
              <li
                key={service.id}
                className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#8f8b82]">
                    Service {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-2 font-serif text-xl text-[#f4f0e7]">{service.title}</h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#aaa69c]">
                    {service.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => editService(service)}
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
        aria-labelledby="edit-service-title"
        onCancel={() => setSelectedService(null)}
        onClick={(event) => {
          if (event.target === editDialog.current) {
            setSelectedService(null);
          }
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-[#e9e5dc] backdrop:bg-black/70"
      >
        {selectedService && (
          <aside className="ml-auto flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-[#111110] shadow-2xl shadow-black/50">
            <header className="flex items-start justify-between gap-6 border-b border-white/10 px-6 py-6 sm:px-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c2a46d]">
                  {selectedService.id ? "Edit service" : "New service"}
                </p>
                <h2 id="edit-service-title" className="mt-3 font-serif text-3xl text-[#f4f0e7]">
                  {selectedService.id ? "Update content" : "Add a service"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close service editor"
                onClick={() => setSelectedService(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 text-[#aaa69c] transition-colors hover:border-[#c2a46d]/50 hover:text-[#e1c78e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2a46d]"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={saveService} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-7 sm:px-8">
                <div>
                  <label
                    htmlFor="service-title"
                    className="text-xs font-medium uppercase tracking-[0.15em] text-[#aaa69c]"
                  >
                    Title
                  </label>
                  <input
                    autoFocus
                    required
                    id="service-title"
                    value={title}
                    onChange={(event) => setTitle(event.currentTarget.value)}
                    maxLength={200}
                    className="mt-2 w-full border border-white/10 bg-[#0d0d0c] px-4 py-3 text-sm text-[#f4f0e7] outline-none transition-colors focus:border-[#c2a46d]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="service-description"
                    className="text-xs font-medium uppercase tracking-[0.15em] text-[#aaa69c]"
                  >
                    Description
                  </label>
                  <textarea
                    required
                    id="service-description"
                    value={description}
                    onChange={(event) => setDescription(event.currentTarget.value)}
                    rows={8}
                    className="mt-2 w-full resize-y border border-white/10 bg-[#0d0d0c] px-4 py-3 text-sm leading-relaxed text-[#f4f0e7] outline-none transition-colors focus:border-[#c2a46d]"
                  />
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
                {selectedService.id ? (
                  <button
                    type="button"
                    onClick={() => void deleteService()}
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
                    onClick={() => setSelectedService(null)}
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
                    {saving ? "Saving…" : selectedService.id ? "Save changes" : "Create service"}
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
