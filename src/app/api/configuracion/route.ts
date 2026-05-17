import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { tenant_id, nombre } = body;

  if (!tenant_id || !nombre) {
    return NextResponse.json({ error: "tenant_id y nombre son requeridos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tenants")
    .update({ nombre: nombre.trim() })
    .eq("id", tenant_id)
    .select()
    .single();

  if (error) {
    console.error("[CFIEL] PATCH /api/configuracion ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
