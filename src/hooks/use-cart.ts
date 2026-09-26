import { useEffect, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  qty: number;
};

const STORAGE_KEY = "qamber-mini-store-cart";

function readCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        typeof item.qty === "number" &&
        item.qty > 0,
    );
  } catch {
    return [];
  }
}

/** Cart state that persists in the browser. Loads only after mount so SSR stays safe. */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full or blocked — cart just won't persist
    }
  }, [items, hydrated]);

  const addItem = (item: Omit<CartItem, "qty">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: Math.min(i.qty + 1, 50) } : i,
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.id === id ? { ...i, qty: Math.min(Math.max(i.qty + delta, 0), 50) } : i,
        )
        .filter((i) => i.qty > 0),
    );
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clearCart = () => setItems([]);

  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return { items, hydrated, addItem, changeQty, removeItem, clearCart, count, total };
}
