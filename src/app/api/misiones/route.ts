import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const tenant_id = req.nextUrl.searchParams.get("tenant_id");
  if (!tenant_id) {
    return NextResponse.json({ error: "tenant_id requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("misiones")
    .select("*")
    .eq("tenant_id", tenant_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[CFIEL] GET /api/misiones ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenant_id, titulo, descripcion, puntos_premio, meta_tipo, meta_valor, fecha_fin } =
    body;

  if (!tenant_id || !titulo || puntos_premio === undefined || !meta_tipo || meta_valor === undefined || !fecha_fin) {
    return NextResponse.json(
      { error: "tenant_id, titulo, puntos_premio, meta_tipo, meta_valor y fecha_fin son requeridos" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("misiones")
    .insert({
      tenant_id,
      titulo,
      descripcion: descripcion ?? null,
      puntos_premio: Number(puntos_premio),
      meta_tipo,
      meta_valor: Number(meta_valor),
      fecha_fin,
      activa: true,
    })
    .select()
    .single();

  if (error) {
    console.error("[CFIEL] POST /api/misiones ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
