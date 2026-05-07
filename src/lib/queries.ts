import { supabase } from "./supabase";

export interface Tenant {
  id: string;
  nombre: string;
}

export interface DashboardStats {
  totalClientes: number;
  activosEsteMes: number;
  puntosEmitidos: number;
  canjesEsteMes: number;
}

export interface Transaccion {
  id: string;
  tipo: string;
  puntos: number;
  descripcion: string | null;
  referencia_externa: string | null;
  created_at: string;
  usuario_id: string;
}

export async function getTenant(slug: string): Promise<Tenant> {
  console.log("[CFIEL] getTenant → buscando slug:", slug);

  const { data, error } = await supabase
    .from("tenants")
    .select("id, nombre")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("[CFIEL] getTenant ERROR:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      slug,
    });
    throw new Error(`getTenant: ${error.message} (code: ${error.code})`);
  }

  console.log("[CFIEL] getTenant OK:", data);
  return data as Tenant;
}

export async function getDashboardStats(tenantId: string): Promise<DashboardStats> {
  console.log("[CFIEL] getDashboardStats → tenant_id:", tenantId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  console.log("[CFIEL] rango mes:", startOfMonth, "/ 30d:", thirtyDaysAgo);

  const [totalClientesRes, activosRaw, puntosRaw, canjesRes] = await Promise.all([
    supabase
      .from("usuarios")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId),
    supabase
      .from("transacciones_puntos")
      .select("usuario_id")
      .eq("tenant_id", tenantId)
      .gte("created_at", thirtyDaysAgo),
    supabase
      .from("transacciones_puntos")
      .select("puntos")
      .eq("tenant_id", tenantId)
      .eq("tipo", "compra")
      .gte("created_at", startOfMonth),
    supabase
      .from("transacciones_puntos")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("tipo", "canje")
      .gte("created_at", startOfMonth),
  ]);

  // Log cada resultado individualmente para pinpoint el error
  if (totalClientesRes.error) {
    console.error("[CFIEL] query usuarios ERROR:", {
      message: totalClientesRes.error.message,
      code: totalClientesRes.error.code,
      details: totalClientesRes.error.details,
      hint: totalClientesRes.error.hint,
    });
  } else {
    console.log("[CFIEL] query usuarios OK → count:", totalClientesRes.count);
  }

  if (activosRaw.error) {
    console.error("[CFIEL] query activos ERROR:", {
      message: activosRaw.error.message,
      code: activosRaw.error.code,
      details: activosRaw.error.details,
      hint: activosRaw.error.hint,
    });
  } else {
    console.log("[CFIEL] query activos OK → rows:", activosRaw.data?.length);
  }

  if (puntosRaw.error) {
    console.error("[CFIEL] query puntos ERROR:", {
      message: puntosRaw.error.message,
      code: puntosRaw.error.code,
      details: puntosRaw.error.details,
      hint: puntosRaw.error.hint,
    });
  } else {
    console.log("[CFIEL] query puntos OK → rows:", puntosRaw.data?.length);
  }

  if (canjesRes.error) {
    console.error("[CFIEL] query canjes ERROR:", {
      message: canjesRes.error.message,
      code: canjesRes.error.code,
      details: canjesRes.error.details,
      hint: canjesRes.error.hint,
    });
  } else {
    console.log("[CFIEL] query canjes OK → count:", canjesRes.count);
  }

  // Si alguna query crítica falló, lanzar con detalle
  const firstError =
    totalClientesRes.error ??
    activosRaw.error ??
    puntosRaw.error ??
    canjesRes.error;

  if (firstError) {
    throw new Error(`getDashboardStats: ${firstError.message} (code: ${firstError.code})`);
  }

  const activosEsteMes = new Set(
    (activosRaw.data ?? []).map((r: { usuario_id: string }) => r.usuario_id)
  ).size;

  const puntosEmitidos = (puntosRaw.data ?? []).reduce(
    (sum: number, r: { puntos: number }) => sum + (r.puntos ?? 0),
    0
  );

  return {
    totalClientes: totalClientesRes.count ?? 0,
    activosEsteMes,
    puntosEmitidos,
    canjesEsteMes: canjesRes.count ?? 0,
  };
}

export interface Usuario {
  id: string;
  nombre: string;
  telefono: string | null;
  nivel: string | null;
  puntos_total: number;
  ultima_visita: string | null;
  created_at: string;
  tenant_id: string;
}

export async function getClientes(tenantId: string): Promise<Usuario[]> {
  console.log("[CFIEL] getClientes → tenant_id:", tenantId);

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, telefono, nivel, puntos_total, ultima_visita, created_at, tenant_id")
    .eq("tenant_id", tenantId)
    .order("puntos_total", { ascending: false });

  if (error) {
    console.error("[CFIEL] getClientes ERROR:", error);
    throw new Error(`getClientes: ${error.message}`);
  }

  console.log("[CFIEL] getClientes OK → rows:", data?.length);
  return (data ?? []) as Usuario[];
}

export async function getRecentTransactions(
  tenantId: string,
  limit = 20
): Promise<Transaccion[]> {
  console.log("[CFIEL] getRecentTransactions → tenant_id:", tenantId, "limit:", limit);

  const { data, error } = await supabase
    .from("transacciones_puntos")
    .select("id, tipo, puntos, descripcion, referencia_externa, created_at, usuario_id")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[CFIEL] getRecentTransactions ERROR:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`getRecentTransactions: ${error.message} (code: ${error.code})`);
  }

  console.log("[CFIEL] getRecentTransactions OK → rows:", data?.length);
  return (data ?? []) as Transaccion[];
}
