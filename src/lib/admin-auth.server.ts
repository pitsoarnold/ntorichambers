import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { getSupabaseServerClient } from "@/lib/supabase-session.server";

export const getAdminUserFn = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeader("Cache-Control", "private, no-store");

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

  if (!user) {
    return null;
  }

  return { id: user.id, email: user.email ?? "" };
});
