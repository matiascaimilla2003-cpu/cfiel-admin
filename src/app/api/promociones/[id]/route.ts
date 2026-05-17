import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { activa } = body;

  if (activa === undefined) {
    return NextResponse.json({ error: "activa es requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("promociones")
    .update({ activa: Boolean(activa) })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[CFIEL] PATCH /api/promociones/[id] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase
    .from("promociones")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[CFIEL] DELETE /api/promociones/[id] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
