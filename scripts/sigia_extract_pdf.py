import sys
import json
import fitz

arquivo = sys.argv[1]

doc = fitz.open(arquivo)

paginas = []

for numero, pagina in enumerate(doc, start=1):
    texto = pagina.get_text("text").strip()

    if texto:
        paginas.append({
            "pagina": numero,
            "texto": texto
        })

print(json.dumps({
    "total_paginas": len(doc),
    "paginas": paginas
}, ensure_ascii=False))