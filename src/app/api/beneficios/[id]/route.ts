import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { disponible } = body;

  if (disponible === undefined) {
    return NextResponse.json({ error: "disponible es requerido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("beneficios")
    .update({ disponible: Boolean(disponible) })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[CFIEL] PATCH /api/beneficios/[id] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase
    .from("beneficios")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[CFIEL] DELETE /api/beneficios/[id] ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
