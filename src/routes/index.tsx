import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import { ShoppingBasket, X, Plus, Minus, Trash2, Mail, Loader2, BadgeCheck } from "lucide-react";

import { getProducts, placeOrder, type StoreProduct } from "@/lib/store.functions";
import { useCart } from "@/hooks/use-cart";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["products"],
      queryFn: () => getProducts(),
    }),
  component: Index,
  head: () => ({
    meta: [
      { title: "Qamber Mini Store — Har cheez, ek jagah" },
      {
        name: "description",
        content:
          "Qamber Mini Store: ghar ka saman, electronics, fashion aur bohat kuch — asaan order, seedha ghar par.",
      },
      { property: "og:title", content: "Qamber Mini Store" },
      {
        property: "og:description",
        content: "Ghar ka saman, electronics, fashion aur bohat kuch — asaan order, seedha ghar par.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const OWNER_EMAIL = "qamberzaidi273@gmail.com";

const fmt = (n: number) => `Rs ${n.toLocaleString("en-PK")}`;

const FORM_FIELDS = [
  { key: "name", label: "Aapka naam", placeholder: "Misal: Ali Khan", type: "text" },
  { key: "phone", label: "Phone number", placeholder: "03xx-xxxxxxx", type: "tel" },
  { key: "email", label: "Email", placeholder: "aap@example.com", type: "email" },
  { key: "city", label: "Shehar", placeholder: "Misal: Karachi", type: "text" },
] as const;

type FormState = { name: string; phone: string; email: string; city: string; address: string; notes: string };

const emptyForm: FormState = { name: "", phone: "", email: "", city: "", address: "", notes: "" };

function Index() {
  const { data } = useSuspenseQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });
  const cart = useCart();

  const [category, setCategory] = useState("Sab");
  const [stage, setStage] = useState<"none" | "cart" | "checkout" | "success">("none");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{ orderCode: string; total: number } | null>(null);
  const [orderedItems, setOrderedItems] = useState<CartItemLite[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");

  const products = data.products;
  const categories = useMemo(
    () => ["Sab", ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  );
  const visible = category === "Sab" ? products : products.filter((p) => p.category === category);

  const submitOrder = async () => {
    if (cart.items.length === 0) return;
    setSubmitting(true);
    try {
      const result = await placeOrder({
        data: {
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          city: form.city,
          notes: form.notes,
          items: cart.items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        },
      });
      setOrderResult(result);
      setCustomerEmail(form.email);
      cart.clearCart();
      setStage("success");
    } catch (err) {
      console.error(err);
      toast.error("Order save nahi hua — dobara koshish karein.");
    } finally {
      setSubmitting(false);
    }
  };

  const emailOrderLink = () => {
    if (!orderResult) return "#";
    const lines = orderedItems
      .map((i) => `• ${i.name} x${i.qty} — ${fmt(i.price * i.qty)}`)
      .join("\n");
    const body = `Assalam-o-Alaikum!\n\nMera naya order:\nOrder #: ${orderResult.orderCode}\nTotal: ${fmt(orderResult.total)}\n\nSam\n${lines}\n\nNaam: ${form.name}\nPhone: ${form.phone}\nPata: ${form.address}, ${form.city}`;
    return `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(`Naya Order — ${orderResult.orderCode}`)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-heading text-lg font-bold text-primary-foreground">
              Q
            </span>
            <div className="leading-tight">
              <p className="font-heading text-base font-bold text-foreground">Qamber Mini Store</p>
              <p className="text-[11px] text-muted-foreground">Har cheez, ek jagah</p>
            </div>
          </div>
          <button
            onClick={() => setStage("cart")}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-accent"
            aria-label="Cart kholein"
          >
            <ShoppingBasket className="h-5 w-5" />
            {cart.count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground">
                {cart.count}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-primary px-4 py-10 text-primary-foreground">
        <div className="mx-auto max-w-5xl">
          <p className="font-heading text-2xl font-bold sm:text-3xl">
            Ghar ka saman se electronics tak — sab kuch milta hai
          </p>
          <p className="mt-2 max-w-md text-sm text-primary-foreground/85">
            Order karein, hum aapke darwaze tak pohancha denge. Cash on delivery available.
          </p>
          <a
            href="#products"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition-transform active:scale-95"
          >
            Shopping shuru karein
          </a>
        </div>
      </section>

      {/* Products */}
      <main id="products" className="mx-auto max-w-5xl px-4 py-6">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-4">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={() => {
              cart.addItem({ id: p.id, name: p.name, price: p.price, image_url: p.image_url });
              toast.success(`${p.name} cart mein daal diya`);
            }} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground">
        <p className="font-heading font-semibold text-foreground">Qamber Mini Store</p>
        <p className="mt-1">Orders aur sawalaat: {OWNER_EMAIL}</p>
      </footer>

      {/* Sticky cart bar (mobile-friendly) */}
      {cart.count > 0 && stage === "none" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card p-3 shadow-lg">
          <button
            onClick={() => setStage("cart")}
            className="mx-auto flex w-full max-w-5xl items-center justify-between rounded-xl bg-primary px-4 py-3 text-primary-foreground"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingBasket className="h-4 w-4" />
              {cart.count} item{cart.count > 1 ? "s" : ""} cart mein
            </span>
            <span className="font-heading text-sm font-bold">{fmt(cart.total)}</span>
          </button>
        </div>
      )}

      {/* Cart / Checkout / Success panel */}
      {stage !== "none" && (
        <div className="fixed inset-0 z-50 flex justify-end bg-foreground/50" onClick={() => setStage("none")}>
          <div
            className="flex h-full w-full max-w-md flex-col bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {stage === "cart" && (
              <CartView
                cart={cart}
                onClose={() => setStage("none")}
                onCheckout={() => setStage("checkout")}
              />
            )}
            {stage === "checkout" && (
              <CheckoutView
                form={form}
                setForm={setForm}
                items={cart.items}
                total={cart.total}
                submitting={submitting}
                onBack={() => setStage("cart")}
                onSubmit={submitOrder}
              />
            )}
            {stage === "success" && orderResult && (
              <SuccessView
                orderCode={orderResult.orderCode}
                total={orderResult.total}
                email={customerEmail}
                mailtoHref={emailOrderLink()}
                onClose={() => setStage("none")}
              />
            )}
          </div>
        </div>
      )}

      <Toaster position="top-center" richColors />
    </div>
  );
}

function ProductCard({ product, onAdd }: { product: StoreProduct; onAdd: () => void }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="aspect-square overflow-hidden bg-secondary">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            width={1024}
            height={1024}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {product.category}
        </p>
        <h3 className="mt-0.5 line-clamp-2 font-heading text-sm font-semibold text-foreground">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-heading text-sm font-bold text-primary">{fmt(product.price)}</span>
          <button
            onClick={onAdd}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform active:scale-90"
            aria-label={`${product.name} cart mein daalein`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

type CartApi = ReturnType<typeof useCart>;

function CartView({
  cart,
  onClose,
  onCheckout,
}: {
  cart: CartApi;
  onClose: () => void;
  onCheckout: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-heading text-lg font-bold">Aapka Cart</h2>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary"
          aria-label="Cart band karein"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {cart.items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <ShoppingBasket className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Cart khali hai — kuch pasand karein!</p>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    loading="lazy"
                    width={1024}
                    height={1024}
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{fmt(item.price)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => cart.changeQty(item.id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border"
                      aria-label="Kam karein"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                    <button
                      onClick={() => cart.changeQty(item.id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border"
                      aria-label="Zyada karein"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => cart.removeItem(item.id)}
                      className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                      aria-label="Nikaal dein"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-heading text-lg font-bold">{fmt(cart.total)}</span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full rounded-xl bg-primary py-3.5 font-heading text-sm font-bold text-primary-foreground transition-transform active:scale-95"
            >
              Order karein
            </button>
          </div>
        </>
      )}
    </>
  );
}

function CheckoutView({
  form,
  setForm,
  items,
  total,
  submitting,
  onBack,
  onSubmit,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  items: CartItemLite[];
  total: number;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border p-4">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary"
          aria-label="Wapas cart par"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-heading text-lg font-bold">Order ki tafseel</h2>
      </div>

      <form
        className="flex-1 space-y-4 overflow-y-auto p-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {FORM_FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-sm font-semibold">{f.label}</span>
            <input
              type={f.type}
              value={form[f.key]}
              onChange={set(f.key)}
              placeholder={f.placeholder}
              required={f.key !== "email" ? true : false}
              maxLength={f.key === "email" ? 255 : 100}
              className="w-full rounded-xl border border-input bg-card px-3 py-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </label>
        ))}
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Poora pata</span>
          <textarea
            value={form.address}
            onChange={set("address")}
            placeholder="Ghar / gali / mohalla ka poora pata"
            required
            maxLength={500}
            rows={2}
            className="w-full rounded-xl border border-input bg-card px-3 py-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Koi note? (ikhtiyari)</span>
          <textarea
            value={form.notes}
            onChange={set("notes")}
            placeholder="Misal: shaam ko deliver karein"
            maxLength={500}
            rows={2}
            className="w-full rounded-xl border border-input bg-card px-3 py-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </label>

        <div className="rounded-xl bg-secondary p-3">
          <p className="mb-2 text-sm font-semibold">Order summary</p>
          {items.map((i) => (
            <div key={i.id} className="flex justify-between py-0.5 text-xs text-muted-foreground">
              <span className="truncate pr-2">{i.name} x{i.qty}</span>
              <span>{fmt(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-bold">
            <span>Total</span>
            <span className="font-heading">{fmt(total)}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Cash on delivery — paisa delivery par dein.</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-heading text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Order ho raha hai...
            </>
          ) : (
            "Order confirm karein"
          )}
        </button>
      </form>
    </>
  );
}

type CartItemLite = { id: string; name: string; price: number; qty: number };

function SuccessView({
  orderCode,
  total,
  email,
  mailtoHref,
  onClose,
}: {
  orderCode: string;
  total: number;
  email: string;
  mailtoHref: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <BadgeCheck className="h-9 w-9 text-primary" />
      </span>
      <h2 className="font-heading text-xl font-bold">Shukriya! Order ho gaya 🎉</h2>
      <p className="text-sm text-muted-foreground">
        Aapka order number: <span className="font-bold text-foreground">{orderCode}</span>
        <br />
        Total: <span className="font-bold text-foreground">{fmt(total)}</span>
      </p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Order hamare paas save ho gaya hai. Order ki copy apne email app se {OWNER_EMAIL} par bhej dein —
        tez confirmation ke liye.
      </p>
      <a
        href={mailtoHref}
        className="mt-2 flex w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-heading text-sm font-bold text-primary-foreground"
      >
        <Mail className="h-4 w-4" />
        Email se order bhejein
      </a>
      <button
        onClick={onClose}
        className="rounded-xl border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary"
      >
        Shopping jaari rakhein
      </button>
      {email && <p className="text-[11px] text-muted-foreground">Aapka email: {email}</p>}
    </div>
  );
}
