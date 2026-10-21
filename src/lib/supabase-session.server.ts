import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";

export function getSupabaseServerClient() {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const publishableKey =
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? import.meta.env["VITE_SUPABASE_ANON_KEY"];

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY).",
    );
  }

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(getRequestHeader("cookie") ?? "");
      },
      setAll(cookies, headers) {
        for (const name of ["Cache-Control", "Expires", "Pragma"] as const) {
          const value = headers[name];
          if (value) {
            setResponseHeader(name, value);
          }
        }

        setResponseHeader(
          "Set-Cookie",
          cookies.map(({ name, value, options }) => serializeCookieHeader(name, value, options)),
        );
      },
    },
  });
}

export async function getSupabaseUser() {
  const supabase = getSupabaseServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }
  if (!session) {
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError?.status === 401) {
    return null;
  }
  if (userError) {
    throw userError;
  }
  return user;
}
