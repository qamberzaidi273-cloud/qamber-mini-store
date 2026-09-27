import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Naya Password — Qamber Mini Store" },
      { name: "description", content: "Apne account ka naya password set karein." },
      { property: "og:title", content: "Naya Password — Qamber Mini Store" },
      { property: "og:description", content: "Apne account ka naya password set karein." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Recovery links arrive with type=recovery in the URL hash; Supabase
    // exchanges it for a session and fires PASSWORD_RECOVERY.
    const hash = window.location.hash;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else if (!hash.includes("type=recovery")) setInvalid(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password kam az kam 6 characters ka ho");
      return;
    }
    if (password !== confirm) {
      toast.error("Dono passwords same nahi hain");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password badal gaya! Ab login karein.");
    navigate({ to: "/auth" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-heading text-lg font-bold text-primary-foreground">
              Q
            </span>
            <span className="font-heading text-base font-bold">Qamber Mini Store</span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
          {invalid ? (
            <div className="text-center">
              <h1 className="font-heading text-lg font-bold">Link kaam nahi kar raha</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Reset link expire ho gaya hai ya ghalat hai. Dobara reset link mangwayein.
              </p>
              <Link
                to="/auth"
                className="mt-4 inline-block rounded-xl bg-primary px-5 py-3 font-heading text-sm font-bold text-primary-foreground"
              >
                Auth page par jayein
              </Link>
            </div>
          ) : !ready ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Link check ho raha hai...
            </div>
          ) : (
            <>
              <h1 className="font-heading text-xl font-bold">Naya password set karein</h1>
              <form onSubmit={submit} className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">Naya password</span>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-xl border border-input bg-card px-3 py-3 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-label={showPass ? "Password chhupayein" : "Password dekhein"}
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">Password dobara likhein</span>
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-input bg-card px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-heading text-sm font-bold text-primary-foreground disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Password save karein
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
