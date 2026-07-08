import { NextResponse } from "next/server";

export async function GET() {
  try {
    const latitude = "-11.6213";
    const longitude = "-38.8068";

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
      `&timezone=America%2FBahia`;

    const resposta = await fetch(url, {
      next: { revalidate: 900 },
    });

    const data = await resposta.json();

    return NextResponse.json({
      sucesso: true,
      clima: data.current,
    });
  } catch (error) {
    console.error("Erro ao buscar clima:", error);

    return NextResponse.json(
      {
        sucesso: false,
        clima: null,
      },
      { status: 500 }
    );
  }
}