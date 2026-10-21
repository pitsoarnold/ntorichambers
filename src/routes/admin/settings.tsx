import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type SiteSetting = {
  key: string;
  value: string;
  description: string;
};

const DEFAULT_SITE_SETTINGS: SiteSetting[] = [
  { key: "contact_email", value: "ntori.p@gmail.com", description: "Contact Email" },
  { key: "contact_phone", value: "+266 63321138", description: "Contact Phone" },
  { key: "contact_whatsapp", value: "+266 63321139", description: "Contact WhatsApp" },
  {
    key: "homepage_hero_title",
    value: "Strengthening Legal Capacity.",
    description: "Homepage Hero Title",
  },
  {
    key: "homepage_hero_subtitle",
    value:
      "A high-level litigation and regulatory advisory firm focused on risk management, compliance assurance, and strategic dispute resolution.",
    description: "Homepage Hero Subtitle",
  },
];

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState("");
  const [notice, setNotice] = useState("");
  const [siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);
  const [settingValues, setSettingValues] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsLoadError, setSettingsLoadError] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaveError, setSettingsSaveError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadConnection() {
      try {
        const { data, error } = await getSupabaseBrowserClient()
          .from("google_auth")
          .select("id")
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (active) {
          setConnected(data !== null);
          if (new URLSearchParams(window.location.search).get("google") === "success") {
            setNotice("Google Calendar connected successfully.");
          } else if (new URLSearchParams(window.location.search).get("google") === "error") {
            setNotice("Google Calendar could not be connected. Please try again.");
          }
        }
      } catch (error) {
        console.error("Unable to check Google Calendar connection.", error);
        if (active) {
          setLoadError(
            "Unable to check the Google Calendar connection. Please refresh and try again.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadConnection();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSiteSettings() {
      try {
        const { data, error } = await getSupabaseBrowserClient()
          .from("site_settings")
          .select("*")
          .order("key");

        if (error) {
          throw error;
        }

        const rows = Array.isArray(data) ? (data as SiteSetting[]) : [];
        const settings = rows.length > 0 ? rows : DEFAULT_SITE_SETTINGS;
        if (active) {
          setSiteSettings(settings);
          setSettingValues(
            Object.fromEntries(settings.map((setting) => [setting.key, setting.value ?? ""])),
          );
        }
      } catch (error) {
        console.error("Supabase Settings Error:", error);
        if (active) {
          setSiteSettings(DEFAULT_SITE_SETTINGS);
          setSettingValues(
            Object.fromEntries(
              DEFAULT_SITE_SETTINGS.map((setting) => [setting.key, setting.value]),
            ),
          );
          setSettingsLoadError("Unable to load site settings. Please refresh and try again.");
        }
      } finally {
        if (active) {
          setSettingsLoading(false);
        }
      }
    }

    void loadSiteSettings();
    return () => {
      active = false;
    };
  }, []);

  async function saveSiteSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (settingsSaving) {
      return;
    }

    setSettingsSaving(true);
    setSettingsSaveError("");

    try {
      const results = await Promise.all(
        siteSettings.map((setting) =>
          getSupabaseBrowserClient()
            .from("site_settings")
            .upsert(
              {
                key: setting.key,
                value: settingValues[setting.key] ?? "",
                description: setting.description,
              },
              { onConflict: "key" },
            ),
        ),
      );
      const failedResult = results.find(({ error }) => error);
      if (failedResult?.error) {
        throw failedResult.error;
      }

      toast.success("Site settings saved successfully.");
    } catch (error) {
      console.error("Unable to save site settings.", error);
      setSettingsSaveError("Unable to save site settings. Please try again.");
    } finally {
      setSettingsSaving(false);
    }
  }

  async function disconnectGoogleCalendar() {
    setDisconnecting(true);
    setDisconnectError("");
    setNotice("");

    try {
      const { error } = await getSupabaseBrowserClient()
        .from("google_auth")
        .delete()
        .not("id", "is", null);
      if (error) {
        throw error;
      }

      setConnected(false);
      setNotice("Google Calendar disconnected.");
    } catch (error) {
      console.error("Unable to disconnect Google Calendar.", error);
      setDisconnectError("Unable to disconnect Google Calendar. Please try again.");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#c2a46d]">Workspace</p>
      <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight text-[#f4f0e7]">
        Settings
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[#aaa69c]">
        Manage integrations for your administration workspace.
      </p>

      <section
        aria-labelledby="google-calendar-heading"
        className="mt-10 max-w-3xl border border-white/10 bg-[#141413] p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h2 id="google-calendar-heading" className="font-serif text-2xl text-[#f4f0e7]">
              Google Calendar Integration
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#aaa69c]">
              Add confirmed consultations to your connected Google Calendar.
            </p>
          </div>
          {loading ? (
            <p role="status" className="text-sm text-[#aaa69c]">
              Checking connection…
            </p>
          ) : loadError ? null : connected ? (
            <span className="inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/[0.08] px-3 py-1.5 text-sm text-emerald-300">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-400" />
              Connected
            </span>
          ) : (
            <a
              href="/api/auth/google"
              className="inline-flex min-h-10 items-center border border-[#c2a46d]/50 bg-[#c2a46d]/10 px-4 py-2 text-sm font-medium text-[#e1c78e] transition-colors hover:bg-[#c2a46d]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2a46d]"
            >
              Connect Google Calendar
            </a>
          )}
        </div>

        {connected && !loading && !loadError && (
          <div className="mt-6 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={disconnectGoogleCalendar}
              disabled={disconnecting}
              className="border border-white/15 px-4 py-2 text-sm text-[#c6c1b7] transition-colors hover:border-red-400/40 hover:text-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2a46d] disabled:cursor-wait disabled:opacity-60"
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        )}

        {loadError && (
          <p role="alert" className="mt-5 text-sm text-red-300">
            {loadError}
          </p>
        )}
        {disconnectError && (
          <p role="alert" className="mt-5 text-sm text-red-300">
            {disconnectError}
          </p>
        )}
        {notice && (
          <p role="status" aria-live="polite" className="mt-5 text-sm text-[#e1c78e]">
            {notice}
          </p>
        )}
      </section>

      <section
        aria-labelledby="site-settings-heading"
        className="mt-10 max-w-3xl border border-white/10 bg-[#141413] p-6 sm:p-8"
      >
        <div>
          <h2 id="site-settings-heading" className="font-serif text-2xl text-[#f4f0e7]">
            Global Site Settings
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#aaa69c]">
            Manage shared content and configuration for your public website.
          </p>
        </div>

        {settingsLoading ? (
          <p role="status" className="mt-6 text-sm text-[#aaa69c]">
            Loading site settings…
          </p>
        ) : (
          <form onSubmit={saveSiteSettings} className="mt-6 space-y-6">
            {settingsLoadError && (
              <p role="alert" className="text-sm text-red-300">
                {settingsLoadError} Default values are shown and can be saved.
              </p>
            )}
            {siteSettings.map((setting) => {
              const label = setting.description.trim() || setting.key;
              const isLongValue =
                (settingValues[setting.key] ?? "").length > 120 ||
                (settingValues[setting.key] ?? "").includes("\n");

              return (
                <div key={setting.key}>
                  <label
                    htmlFor={`site-setting-${setting.key}`}
                    className="text-xs font-medium uppercase tracking-[0.15em] text-[#aaa69c]"
                  >
                    {label}
                  </label>
                  {isLongValue ? (
                    <textarea
                      id={`site-setting-${setting.key}`}
                      value={settingValues[setting.key] ?? ""}
                      onChange={(event) =>
                        setSettingValues((current) => ({
                          ...current,
                          [setting.key]: event.currentTarget.value,
                        }))
                      }
                      rows={5}
                      className="mt-2 w-full resize-y border border-white/10 bg-[#0d0d0c] px-4 py-3 text-sm leading-relaxed text-[#f4f0e7] outline-none transition-colors focus:border-[#c2a46d]"
                    />
                  ) : (
                    <input
                      id={`site-setting-${setting.key}`}
                      value={settingValues[setting.key] ?? ""}
                      onChange={(event) =>
                        setSettingValues((current) => ({
                          ...current,
                          [setting.key]: event.currentTarget.value,
                        }))
                      }
                      className="mt-2 w-full border border-white/10 bg-[#0d0d0c] px-4 py-3 text-sm text-[#f4f0e7] outline-none transition-colors focus:border-[#c2a46d]"
                    />
                  )}
                </div>
              );
            })}
            {settingsSaveError && (
              <p role="alert" className="text-sm text-red-300">
                {settingsSaveError}
              </p>
            )}
            <div className="flex justify-end border-t border-white/10 pt-5">
              <button
                type="submit"
                disabled={settingsSaving}
                className="border border-[#c2a46d]/50 bg-[#c2a46d]/10 px-5 py-2 text-sm font-medium text-[#e1c78e] transition-colors hover:bg-[#c2a46d]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2a46d] disabled:cursor-wait disabled:opacity-60"
              >
                {settingsSaving ? "Saving…" : "Save Settings"}
              </button>
            </div>
          </form>
        )}
      </section>
      <Toaster position="top-right" />
    </section>
  );
}
