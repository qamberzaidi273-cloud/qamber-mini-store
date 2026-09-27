import { createServerFn, createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { z } from "zod";

// Attaches the signed-in user's id when a bearer token is present, but never
// rejects the request — guest checkout must keep working.
const optionalSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    let userId: string | null = null;
    try {
      const request = getRequest();
      const authHeader = request?.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (token && token.split(".").length === 3) {
        const client = createClient(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );
        const { data } = await client.auth.getClaims(token);
        userId = data?.claims?.sub ?? null;
      }
    } catch {
      userId = null;
    }
    return next({ context: { userId } });
  },
);

export type StoreProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  in_stock: boolean;
};

function getPublicClient() {
  return createClient(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export const getProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ products: StoreProduct[] }> => {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, price, category, image_url, in_stock")
      .eq("in_stock", true)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    return { products: (data ?? []) as StoreProduct[] };
  },
);

const orderItemSchema = z.object({
  id: z.string().max(64),
  name: z.string().trim().min(1).max(120),
  price: z.number().int().min(0).max(1_000_000),
  qty: z.number().int().min(1).max(50),
});

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Poora naam likhein").max(100),
  phone: z
    .string()
    .trim()
    .min(10, "Sahi phone number likhein")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Phone number sirf numbers ho sakta hai"),
  email: z.string().trim().email("Sahi email likhein").max(255),
  address: z.string().trim().min(5, "Poora pata likhein").max(500),
  city: z.string().trim().min(2, "Shehar likhein").max(100),
  notes: z.string().trim().max(500).optional().default(""),
  items: z.array(orderItemSchema).min(1, "Cart khali hai").max(30),
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([optionalSupabaseAuth])
  .inputValidator((data) => checkoutSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Recompute the total server-side so the client can't send a fake price.
    const total = data.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const orderCode = `QMS-${randomBytes(3).toString("hex").toUpperCase()}`;

    // Orders contain everyone's data, so anonymous users may only insert (RLS).
    // The privileged client is loaded here, inside the handler, to write the
    // validated order and read back its code.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders").insert({
      order_code: orderCode,
      customer_name: data.name,
      customer_phone: data.phone,
      customer_email: data.email,
      address: data.address,
      city: data.city,
      notes: data.notes ?? "",
      items: data.items,
      total,
      user_id: context.userId,
    });

    if (error) throw new Error(error.message);
    return { orderCode, total };
  });
