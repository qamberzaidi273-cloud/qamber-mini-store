import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, MailCheck, ShoppingBasket } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Login / Register — Qamber Mini Store" },
      { name: "description", content: "Qamber Mini Store par account banayein ya login karein." },
      { property: "og:title", content: "Login / Register — Qamber Mini Store" },
      { property: "og:description", content: "Qamber Mini Store par account banayein ya login karein." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Mode = "login" | "register" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [registered, setRegistered] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const signInGoogle = async () => {
    setBusy(true);
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch (err) {
      console.error(err);
      toast.error("Google sign-in nahi hua — dobara koshish karein.");
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    if (mode === "register") {
      if (fullName.trim().length < 2) return toast.error("Poora naam likhein");
      if (password.length < 6) return toast.error("Password kam az kam 6 characters ka ho");
      if (password !== confirm) return toast.error("Dono passwords same nahi hain");
      setBusy(true);
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: window.location.origin,
        },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      setRegistered(true);
      return;
    }

    if (mode === "forgot") {
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Password reset link aapki email par bhej diya gaya hai.");
      setMode("login");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return toast.error("Email ya password ghalat hai.");
    toast.success("Welcome back!");
    navigate({ to: "/" });
  };

  if (registered) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="h-7 w-7 text-primary" />
          </span>
          <h1 className="font-heading text-xl font-bold">Email check karein!</h1>
          <p className="text-sm text-muted-foreground">
            Humne <span className="font-semibold text-foreground">{email}</span> par ek confirmation
            link bheja hai. Link par click karein, phir login karein.
          </p>
          <button
            onClick={() => {
              setRegistered(false);
              setMode("login");
            }}
            className="mt-2 w-full rounded-xl bg-primary py-3 font-heading text-sm font-bold text-primary-foreground"
          >
            Login par jayein
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="font-heading text-xl font-bold">
        {mode === "login" ? "Welcome back!" : mode === "register" ? "Account banayein" : "Password bhool gaye?"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {mode === "login"
          ? "Apne account mein login karein"
          : mode === "register"
            ? "Sirf ek minute mein register karein"
            : "Apna email likhein — reset link bhej denge"}
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        {mode === "register" && (
          <Field label="Poora naam">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Misal: Ali Khan"
              required
              maxLength={100}
              className={inputCls}
            />
          </Field>
        )}

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="aap@example.com"
            required
            maxLength={255}
            className={inputCls}
          />
        </Field>

        {mode !== "forgot" && (
          <Field label="Password">
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className={`${inputCls} pr-11`}
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
          </Field>
        )}

        {mode === "register" && (
          <Field label="Password dobara likhein">
            <input
              type={showPass ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className={inputCls}
            />
          </Field>
        )}

        {mode === "login" && (
          <div className="text-right">
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Password bhool gaye?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-heading text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login" ? "Login karein" : mode === "register" ? "Account banayein" : "Reset link bhejein"}
        </button>
      </form>

      {mode !== "forgot" && (
        <>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ya
            <span className="h-px flex-1 bg-border" />
          </div>
          <button
            onClick={signInGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
          >
            <GoogleIcon />
            Google se {mode === "login" ? "login" : "register"} karein
          </button>
        </>
      )}

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            Account nahi hai?{" "}
            <button onClick={() => setMode("register")} className="font-semibold text-primary hover:underline">
              Register karein
            </button>
          </>
        ) : (
          <>
            Pehle se account hai?{" "}
            <button onClick={() => setMode("login")} className="font-semibold text-primary hover:underline">
              Login karein
            </button>
          </>
        )}
      </p>
    </AuthShell>
  );
}

const inputCls =
  "w-full rounded-xl border border-input bg-card px-3 py-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
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
          <div className="mb-4 flex justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <ShoppingBasket className="h-6 w-6 text-primary" />
            </span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.03c2.2-2.1 3.7-5.1 3.7-8.6z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5l-.14.01-3.7 2.9-.05.13C3.3 21.3 7.3 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.4c-.24-.7-.38-1.5-.38-2.4s.14-1.7.4-2.4l-.01-.16-3.8-2.9-.12.06C.5 8.3 0 10.1 0 12s.5 3.7 1.4 5.4l3.9-3z"
      />
      <path
        fill="#EB4335"
        d="M12 4.6c2.2 0 3.7 1 4.6 1.8l3.3-3.3C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.4 6.6l3.9 3c.9-2.9 3.6-5 6.7-5z"
      />
    </svg>
  );
}
