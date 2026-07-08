import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN =
    process.env.WHATSAPP_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN
  ) {
    return new NextResponse(challenge, {
      status: 200,
    });
  }

  return NextResponse.json(
    { erro: "Token inválido" },
    { status: 403 }
  );
}

export async function POST(
  req: NextRequest
) {
  try {
    const body = await req.json();

    console.log(
      "Webhook WhatsApp:",
      JSON.stringify(body, null, 2)
    );

    return NextResponse.json({
      recebido: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { erro: true },
      { status: 500 }
    );
  }
}