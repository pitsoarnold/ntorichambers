import { createFileRoute, useRouter } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import logo from "@/assets/logo.png";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;

    async function redirectIfSignedIn() {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError) {
            throw userError;
          }

          if (user && active) {
            await router.navigate({ to: "/admin" });
          }
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Unable to check your session.");
        }
      }
    }

    void redirectIfSignedIn();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const { error: signInError } = await getSupabaseBrowserClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      await router.navigate({ to: "/admin" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0d0d0c] px-5 py-12 text-[#e9e5dc]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[#c2a46d]/[0.07] blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#c2a46d]/[0.05] blur-3xl" />
      </div>

      <section className="relative w-full max-w-md border border-white/10 bg-[#141413]/95 p-7 shadow-2xl shadow-black/40 sm:p-10">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-xs text-[#aaa69c] transition-colors hover:text-[#e1c78e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c2a46d]"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Return to Ntori Chambers
        </a>

        <div className="mt-10 flex flex-col items-center text-center">
          <img src={logo} alt="" width={60} height={60} className="h-14 w-14" />
          <p className="mt-6 text-[0.65rem] font-medium uppercase tracking-[0.28em] text-[#c2a46d]">
            Secure administration
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-[#f4f0e7]">
            Welcome back
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#aaa69c]">
            Sign in to manage Ntori Chambers.
          </p>
        </div>

        <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-xs font-medium text-[#d6d1c7]">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              name="email"
              autoComplete="username"
              inputMode="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-white/15 bg-[#0d0d0c] px-4 py-3 text-sm text-[#f4f0e7] outline-none transition-colors placeholder:text-[#77736b] focus:border-[#c2a46d] focus:ring-1 focus:ring-[#c2a46d]/30"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-2 block text-xs font-medium text-[#d6d1c7]">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-white/15 bg-[#0d0d0c] px-4 py-3 text-sm text-[#f4f0e7] outline-none transition-colors placeholder:text-[#77736b] focus:border-[#c2a46d] focus:ring-1 focus:ring-[#c2a46d]/30"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p role="alert" aria-live="polite" className="border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm leading-relaxed text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 bg-[#c2a46d] px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#151411] transition-colors hover:bg-[#d5b980] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e1c78e] disabled:cursor-wait disabled:opacity-60"
          >
            <LockKeyhole aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
            {pending ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}
