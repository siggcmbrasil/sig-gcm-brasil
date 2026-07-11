import {
  NextRequest,
  NextResponse,
} from "next/server";

const COOKIE_CONTEXTO =
  "sig_municipio_contexto";

function numeroId(
  valor: unknown
) {
  const numero = Number(valor);

  if (
    !Number.isSafeInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

export function proxy(
  request: NextRequest
) {
  const pathname =
    request.nextUrl.pathname;

  if (
    pathname ===
    "/api/contexto-municipio"
  ) {
    return NextResponse.next();
  }

  const municipioId =
    numeroId(
      request.cookies.get(
        COOKIE_CONTEXTO
      )?.value
    );

  if (
    !municipioId ||
    request.nextUrl.searchParams.has(
      "municipio_id"
    )
  ) {
    return NextResponse.next();
  }

  const destino =
    request.nextUrl.clone();

  destino.searchParams.set(
    "municipio_id",
    String(municipioId)
  );

  return NextResponse.rewrite(
    destino
  );
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
};