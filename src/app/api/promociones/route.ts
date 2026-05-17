import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const tenant_id = req.nextUrl.searchParams.get("tenant_id");
  if (!tenant_id) {
    return NextResponse.json({ error: "tenant_id requerido" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("promociones")
    .select("*")
    .eq("tenant_id", tenant_id)
    .order("fecha_fin", { ascending: false });

  if (error) {
    console.error("[CFIEL] GET /api/promociones ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = (data ?? []).map((p) => ({
    ...p,
    is_active: p.activa && p.fecha_fin && new Date(p.fecha_fin) > new Date(now),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenant_id, titulo, descripcion, tipo, valor, fecha_inicio, fecha_fin, usos_por_cliente } =
    body;

  if (!tenant_id || !titulo || !tipo || valor === undefined || valor === "" || !fecha_inicio || !fecha_fin) {
    return NextResponse.json(
      { error: "tenant_id, titulo, tipo, valor, fecha_inicio y fecha_fin son requeridos" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("promociones")
    .insert({
      tenant_id,
      titulo,
      descripcion: descripcion || null,
      tipo,
      valor,
      fecha_inicio,
      fecha_fin,
      usos_por_cliente: usos_por_cliente ?? 1,
      activa: true,
    })
    .select()
    .single();

  if (error) {
    console.error("[CFIEL] POST /api/promociones ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
