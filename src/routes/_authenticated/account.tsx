import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, LogOut, Package, User } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { getMyProfile, getMyOrders, updateMyProfile } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
  head: () => ({
    meta: [
      { title: "Mera Account — Qamber Mini Store" },
      { name: "description", content: "Apna profile aur orders dekhein." },
      { property: "og:title", content: "Mera Account — Qamber Mini Store" },
      { property: "og:description", content: "Apna profile aur orders dekhein." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const fmt = (n: number) => `Rs ${n.toLocaleString("en-PK")}`;

function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({ queryKey: ["my-profile"], queryFn: () => getMyProfile() });
  const ordersQuery = useQuery({ queryKey: ["my-orders"], queryFn: () => getMyOrders() });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profileQuery.data?.profile) {
      setFullName(profileQuery.data.profile.full_name);
      setPhone(profileQuery.data.profile.phone);
    }
  }, [profileQuery.data]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyProfile({ data: { full_name: fullName, phone } });
      toast.success("Profile save ho gaya");
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    } catch (err) {
      console.error(err);
      toast.error("Profile save nahi hua — dobara koshish karein.");
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const profile = profileQuery.data?.profile;
  const orders = ordersQuery.data?.orders ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-heading text-lg font-bold text-primary-foreground">
              Q
            </span>
            <span className="font-heading text-base font-bold">Qamber Mini Store</span>
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        {/* Profile card */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h1 className="font-heading text-lg font-bold">Mera Profile</h1>
          </div>
          {profileQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Load ho raha hai...
            </div>
          ) : (
            <form onSubmit={saveProfile} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Poora naam</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Phone number</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03xx-xxxxxxx"
                  maxLength={20}
                  className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Email</span>
                <input
                  type="email"
                  value={profile?.email ?? ""}
                  disabled
                  className="w-full rounded-xl border border-border bg-secondary px-3 py-3 text-sm text-muted-foreground"
                />
              </label>
              {profile?.created_at && (
                <p className="text-xs text-muted-foreground">
                  Account bana: {new Date(profile.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-heading text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save karein
              </button>
            </form>
          )}
        </section>

        {/* Orders card */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-bold">Mere Orders</h2>
          </div>
          {ordersQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Load ho raha hai...
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Abhi tak koi order nahi. <Link to="/" className="font-semibold text-primary hover:underline">Shopping shuru karein</Link>
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-sm font-bold">{o.order_code}</span>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                      {o.status}
                    </span>
                  </div>
                  <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {o.items.map((i, idx) => (
                      <p key={idx} className="truncate">
                        {i.name} x{i.qty}
                      </p>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                    </span>
                    <span className="font-heading font-bold">{fmt(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
