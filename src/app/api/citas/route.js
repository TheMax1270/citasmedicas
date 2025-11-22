import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// BASE URL PARA SERVICIOS INTERNOS
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";


// ============================================================================
// GET – obtener citas (por id o usuario_id)
// ============================================================================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const usuario_id = searchParams.get("usuario_id");

    let query = supabase.from("citas").select("*");

    if (id) query = query.eq("id", id).limit(1);
    if (usuario_id) query = query.eq("usuario_id", usuario_id);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(id ? data?.[0] || null : data || []);
  } catch (err) {
    console.error("❌ GET /api/citas error:", err);
    return NextResponse.json([], { status: 200 });
  }
}



// ============================================================================
// POST – crear cita Y enviar SMS si existe teléfono
// ============================================================================
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      usuario_id,
      especialidad,
      doctor,
      fecha,
      hora,
      ubicacion,
      telefono
    } = body;

    if (!usuario_id || !especialidad || !doctor || !fecha || !hora || !ubicacion) {
      return NextResponse.json(
        { message: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("citas")
      .insert([
        {
          usuario_id,
          especialidad,
          doctor,
          fecha,
          hora,
          ubicacion,
          estado: "Programada"
        }
      ])
      .select();

    if (error) throw error;

    const cita = data[0];

    // 🟢 ENVIAR SMS — PERO SIN AFECTAR el guardado si falla
    if (telefono) {
      fetch(`${BASE_URL}/api/notificar/sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: telefono,
          message: `Tu cita de ${especialidad} está programada para el ${fecha} a las ${hora}.`
        })
      }).catch(err => {
        console.error("⚠️ Error enviando SMS (no detiene la cita):", err);
      });
    }

    return NextResponse.json({ ok: true, data });

  } catch (err) {
    console.error("❌ POST /api/citas error:", err);
    return NextResponse.json(
      { message: "Error en servidor" },
      { status: 500 }
    );
  }
}



// ============================================================================
// PATCH – actualizar cita
// ============================================================================
export async function PATCH(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body = await req.json();

    if (!id)
      return NextResponse.json(
        { message: "Falta ID" },
        { status: 400 }
      );

    const { data, error } = await supabase
      .from("citas")
      .update(body)
      .eq("id", id)
      .select();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });

  } catch (err) {
    console.error("❌ PATCH /api/citas error:", err);
    return NextResponse.json(
      { message: "Error en servidor" },
      { status: 500 }
    );
  }
}



// ============================================================================
// DELETE – cancelar cita
// ============================================================================
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json(
        { message: "Falta ID" },
        { status: 400 }
      );

    const { data, error } = await supabase
      .from("citas")
      .update({
        estado: "Cancelada",
        motivo_cancelacion: "Cancelada por el usuario"
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });

  } catch (err) {
    console.error("❌ DELETE /api/citas error:", err);
    return NextResponse.json(
      { message: "Error en servidor" },
      { status: 500 }
    );
  }
}
