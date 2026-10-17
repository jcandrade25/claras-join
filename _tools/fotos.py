"""Recorta y comprime las fotos de Colombia para la landing y escribe sus
créditos. Las originales se bajaron aparte (assets.mjs de taste-skill) y no
entran al repositorio; aquí quedan solo las versiones webp.

Uso: python _tools/fotos.py "<carpeta con las originales y credits.json>"
"""
import json
import sys
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "img" / "mundo"

# archivo original -> (nombre webp, ancho, alto, foco vertical 0..1)
FOTOS = {
    "restaurant-dining-room-with-brick-walls-and.jpg": ("restaurante", 880, 1144, 0.55),
    "medellin-sep-2025-imagen-71.jpg": ("mesa-medellin", 880, 1144, 0.5),
    "bandeja-paisa-plato-colombiano.jpg": ("bandeja-paisa", 880, 1144, 0.5),
    "chiva-rustic-bus-4925716402.jpg": ("chiva", 1000, 750, 0.5),
    "colombia-guatape-fachadas-01.jpg": ("guatape-fachadas", 1000, 750, 0.5),
    "aerial-view-at-guatape-antioquia-colombia.jpg": ("guatape-represa", 1000, 750, 0.5),
}


def recortar(im: Image.Image, ancho: int, alto: int, foco: float) -> Image.Image:
    escala = max(ancho / im.width, alto / im.height)
    im = im.resize((round(im.width * escala), round(im.height * escala)), Image.LANCZOS)
    x = (im.width - ancho) // 2
    y = round((im.height - alto) * foco)
    return im.crop((x, y, x + ancho, y + alto))


def main(origen: str) -> None:
    carpeta = Path(origen)
    creditos_originales = {c["file"]: c for c in json.loads((carpeta / "credits.json").read_text("utf-8"))}
    SALIDA.mkdir(parents=True, exist_ok=True)
    creditos = []
    for archivo, (nombre, ancho, alto, foco) in FOTOS.items():
        im = recortar(Image.open(carpeta / archivo).convert("RGB"), ancho, alto, foco)
        destino = SALIDA / f"{nombre}.webp"
        im.save(destino, "WEBP", quality=(56 if nombre == "bandeja-paisa" else 64) if alto > ancho else 72, method=6)
        c = creditos_originales[archivo]
        creditos.append({
            "archivo": destino.name,
            "titulo": c["title"],
            "autor": c["creator"],
            "licencia": c["license"],
            "licencia_url": c["licenseUrl"],
            "fuente": c["page"],
        })
        print(f"{destino.name}: {destino.stat().st_size // 1024} KB")
    (SALIDA / "CREDITOS.json").write_text(json.dumps(creditos, ensure_ascii=False, indent=1) + "\n", "utf-8")


if __name__ == "__main__":
    main(sys.argv[1])
