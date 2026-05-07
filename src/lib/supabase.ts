import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Env var check — visible en DevTools > Console al cargar el dashboard
console.log("[CFIEL] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ?? "❌ UNDEFINED");
console.log("[CFIEL] NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? `✅ ${supabaseAnonKey.slice(0, 20)}…` : "❌ UNDEFINED");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("[CFIEL] ❌ Faltan variables de entorno de Supabase. Revisa .env.local");
}

export const supabase = createClient(
  supabaseUrl ?? "",
  supabaseAnonKey ?? ""
);
