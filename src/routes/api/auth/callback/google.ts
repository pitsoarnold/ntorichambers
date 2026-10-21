import { createFileRoute } from "@tanstack/react-router";
import { deleteCookie, setResponseHeader } from "@tanstack/react-start/server";
import { getSupabaseServerClient, getSupabaseUser } from "@/lib/supabase-session.server";

type GoogleTokenResponse = {
  refresh_token?: string;
  error?: string;
};

export const Route = createFileRoute("/api/auth/callback/google")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const settingsUrl = new URL("/admin/settings", request.url);
        setResponseHeader("Cache-Control", "private, no-store");
        deleteCookie("google_oauth_state", {
          path: "/api/auth",
          httpOnly: true,
          sameSite: "lax",
          secure: requestUrl.protocol === "https:",
        });

        const cookieValue = request.headers
          .get("cookie")
          ?.split(";")
          .map((cookie) => cookie.trim())
          .find((cookie) => cookie.startsWith("google_oauth_state="))
          ?.slice("google_oauth_state=".length);
        const returnedState = requestUrl.searchParams.get("state");
        if (!cookieValue || !returnedState || cookieValue !== returnedState) {
          settingsUrl.searchParams.set("google", "error");
          return Response.redirect(settingsUrl, 302);
        }

        const user = await getSupabaseUser();
        if (!user) {
          return Response.redirect(new URL("/admin/login", request.url), 302);
        }
        const supabase = getSupabaseServerClient();

        const code = requestUrl.searchParams.get("code");
        const clientId = process.env["GOOGLE_CLIENT_ID"];
        const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
        const redirectUri = process.env["GOOGLE_REDIRECT_URI"];
        if (!code || !clientId || !clientSecret || !redirectUri) {
          console.error("Google OAuth callback is missing required configuration or code.");
          settingsUrl.searchParams.set("google", "error");
          return Response.redirect(settingsUrl, 302);
        }

        try {
          const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
              grant_type: "authorization_code",
              code,
            }),
          });
          const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
          if (!tokenResponse.ok || !tokens.refresh_token) {
            throw new Error(
              `Google token exchange failed: ${tokens.error ?? tokenResponse.status}`,
            );
          }

          const { error: deleteError } = await supabase
            .from("google_auth")
            .delete()
            .not("id", "is", null);
          if (deleteError) {
            throw deleteError;
          }

          const { error: insertError } = await supabase
            .from("google_auth")
            .insert({ refresh_token: tokens.refresh_token });
          if (insertError) {
            throw insertError;
          }

          settingsUrl.searchParams.set("google", "success");
        } catch (error) {
          console.error("Unable to complete Google Calendar authorization.", error);
          settingsUrl.searchParams.set("google", "error");
        }

        return Response.redirect(settingsUrl, 302);
      },
    },
  },
});
