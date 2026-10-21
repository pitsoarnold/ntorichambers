import { createFileRoute } from "@tanstack/react-router";
import { setCookie, setResponseHeader } from "@tanstack/react-start/server";
import { getSupabaseUser } from "@/lib/supabase-session.server";

export const Route = createFileRoute("/api/auth/google")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          setResponseHeader("Cache-Control", "private, no-store");
          const user = await getSupabaseUser();
          if (!user) {
            const loginUrl = new URL("/admin/login", request.url);
            return new Response(null, {
              status: 302,
              headers: { Location: loginUrl.toString() },
            });
          }

          console.log(
            "Checking Google env vars:",
            !!process.env["GOOGLE_CLIENT_ID"],
            !!process.env["GOOGLE_CLIENT_SECRET"],
          );
          const clientId = process.env["GOOGLE_CLIENT_ID"];
          const redirectUri = process.env["GOOGLE_REDIRECT_URI"];
          if (!clientId || !redirectUri) {
            throw new Error("Google Calendar integration is not configured.");
          }

          const state = crypto.randomUUID();
          setCookie("google_oauth_state", state, {
            path: "/api/auth",
            httpOnly: true,
            sameSite: "lax",
            secure: new URL(request.url).protocol === "https:",
            maxAge: 600,
          });

          const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
          authorizationUrl.search = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: "code",
            scope: "https://www.googleapis.com/auth/calendar.events",
            access_type: "offline",
            prompt: "consent",
            state,
          }).toString();

          return new Response(null, {
            status: 302,
            headers: { Location: authorizationUrl.toString() },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error("Google OAuth route failed:", error);
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
