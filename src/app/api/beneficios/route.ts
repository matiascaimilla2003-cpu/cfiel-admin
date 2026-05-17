import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const tenant_id = req.nextUrl.searchParams.get("tenant_id");
  if (!tenant_id) {
    return NextResponse.json({ error: "tenant_id requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("beneficios")
    .select("*")
    .eq("tenant_id", tenant_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[CFIEL] GET /api/beneficios ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenant_id, nombre, descripcion, icono, costo_puntos, tipo } = body;

  if (!tenant_id || !nombre || costo_puntos === undefined) {
    return NextResponse.json(
      { error: "tenant_id, nombre y costo_puntos son requeridos" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("beneficios")
    .insert({
      tenant_id,
      nombre,
      descripcion: descripcion || null,
      icono: icono || "🎁",
      costo_puntos: Number(costo_puntos),
      tipo: tipo || "producto",
      disponible: true,
    })
    .select()
    .single();

  if (error) {
    console.error("[CFIEL] POST /api/beneficios ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
