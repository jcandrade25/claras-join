"""Recorta Archivo para la landing en dos archivos: los titulares (ancho 62,
peso 800, fijos) y el texto (ancho 100, peso 400-500). Latín básico y Latin-1
más ¿¡«»€–, con cifras tabulares. Lo usa solo quien prepara la página; las
fuentes quedan en fonts/ y la página no le pide nada a Google.

Uso: python _tools/fuente_archivo.py "<ruta a Archivo[wdth,wght].ttf>"
Necesita fonttools y brotli (en un entorno aparte, no en el sistema).
"""
import sys
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

RAIZ = Path(__file__).resolve().parent.parent
EXTRA = "¿¡«»€–"
PRUEBA = "áéíóúñÁÉÍÓÚÑ¿¡$%.,"
CORTES = {
    "Archivo-titulos.woff2": {"wdth": 62, "wght": 800},
    "Archivo-texto.woff2": {"wdth": 100, "wght": (400, 500)},
}


def recortar(origen: str, nombre: str, ejes: dict) -> bool:
    fuente = instancer.instantiateVariableFont(TTFont(origen), ejes)
    opciones = Options()
    opciones.flavor = "woff2"
    opciones.layout_features = ["kern", "liga", "tnum", "lnum"]
    opciones.notdef_outline = True
    unicodes = set(range(0x20, 0x7F)) | set(range(0xA0, 0x100)) | {ord(c) for c in EXTRA}
    sub = Subsetter(options=opciones)
    sub.populate(unicodes=unicodes)
    sub.subset(fuente)

    salida = RAIZ / "fonts" / nombre
    salida.parent.mkdir(exist_ok=True)
    fuente.save(salida)

    cmap = TTFont(salida).getBestCmap()
    faltan = [c for c in PRUEBA + EXTRA if ord(c) not in cmap]
    print(f"{nombre}: {salida.stat().st_size / 1024:.1f} KB, {ejes}, "
          + ("cobertura completa" if not faltan else f"FALTAN: {''.join(faltan)}"))
    return not faltan


def main(origen: str) -> None:
    resultados = [recortar(origen, nombre, ejes) for nombre, ejes in CORTES.items()]
    if not all(resultados):
        sys.exit(1)


if __name__ == "__main__":
    main(sys.argv[1])
