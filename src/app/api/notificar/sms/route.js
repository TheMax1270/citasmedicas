import twilio from "twilio";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { telefono, mensaje } = body || {};

    console.log("📩 Body recibido en /api/notificar/sms:", body);

    if (!telefono) {
      console.error("❌ No llegó teléfono en el body:", body);
      return NextResponse.json(
        { ok: false, error: "Falta el teléfono del destinatario" },
        { status: 400 }
      );
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const resp = await client.messages.create({
      to: telefono,
      from: process.env.TWILIO_PHONE_NUMBER, // tu número de Twilio
      body: mensaje,
    });

    console.log("✅ SMS enviado. SID:", resp.sid);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ SMS error:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
