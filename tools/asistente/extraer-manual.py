# Saca el manual oficial de FAIRINO (PDF en inglés) a textos para la base de conocimiento del asistente de ElevenLabs.
#   curl -L -o fairino-manual.pdf https://fairino-doc-en.readthedocs.io/_/downloads/en/latest/pdf/
#   python3 tools/asistente/extraer-manual.py fairino-manual.pdf <carpeta de salida>
# Necesita pdftotext (poppler-utils). Los rangos de páginas son los de la Release 4.0.0 (28/09/2026, 3107 páginas):
# si FAIRINO publica otra versión, hay que revisarlos con el índice del PDF.
#
# Preparado para la búsqueda del agente (RAG), que trocea por párrafos:
# - Con maquetación (-layout), para que cada fila de una tabla (códigos de error, parámetros) no se separe de su
#   descripción. Las columnas quedan separadas por « | ».
# - Fuera cabeceras, pies y avisos de «continúa en la página siguiente».
# - Los ejemplos de código, sin los números de línea y con su sangría.
# - Bloques de unos 2.000 caracteres que empiezan en un apartado del manual, cada uno con una línea [documento ·
#   apartado] delante: así ningún trozo suelto («24», un título solo) llega al agente sin saber de qué habla.
import os, re, subprocess, sys
PDF = sys.argv[1]
OUT = sys.argv[2]

FUERA = [re.compile(p) for p in (
    r'^FAIRINO Collaborative Robot User Manual, Release [\d.]+$',
    r'^\d{1,4} \| Chapter \d+\. .+$',                    # pie de página par: «14 | Chapter 1. Collaborative robot»
    r'^\d+(\.\d+)*\. .{1,90} \| \d{1,4}$',             # pie de página impar: «1.2. Quick start | 15»
    r'^\(?continued from previous page\)?$',
    r'^continues on next page$',
    r'^Table [\d.]+ – continued from previous page$',
)]
APARTADO = re.compile(r'^(\d+(?:\.\d+)+)\.?\s+([A-Z][^|]{2,90})$')

CODIGO = re.compile(r'^(\s*)(\d{1,4})(?:( {2,})(\S.*))?$')
NUM_ANTERIOR = 0  # último número de línea de un ejemplo de código (los ejemplos siguen de una página a otra)

def codigo(raw):
    """Línea de un ejemplo de código numerado: sin el número y con su sangría. None si no lo es."""
    global NUM_ANTERIOR, COL_BASE
    m = CODIGO.match(raw)
    if not m:
        return None
    n = int(m.group(2))
    if n == 1:
        COL_BASE = len(m.group(1)) + len(m.group(2)) + len(m.group(3) or '   ')
    elif n != NUM_ANTERIOR + 1 or NUM_ANTERIOR == 0:
        return None
    NUM_ANTERIOR = n
    if not m.group(4):
        return ''
    col = len(m.group(1)) + len(m.group(2)) + len(m.group(3))
    return ' ' * max(0, col - COL_BASE) + m.group(4)

def lineas(a, b):
    global NUM_ANTERIOR
    txt = subprocess.run(['pdftotext', '-layout', '-enc', 'UTF-8', '-f', str(a), '-l', str(b), PDF, '-'],
                         capture_output=True, text=True).stdout
    for page in txt.split('\f'):
        out = []
        for raw in page.split('\n'):
            raw = raw.replace('˓→', '').replace('␣', '').rstrip()
            if not raw.strip():
                continue
            c = codigo(raw)
            if c is not None:
                if c.strip():
                    out.append(c)
                continue
            l = re.sub(r'(?<=\S) {3,}(?=\S)', ' | ', raw.strip())
            if any(p.match(l) for p in FUERA) or l.startswith('Added in version') or re.fullmatch(r'(Mandatory|Default) parameters \| NULL', l):
                continue
            if APARTADO.match(l):
                NUM_ANTERIOR = 0
            out.append(l)
        # número de página suelto arriba o abajo
        while out and re.fullmatch(r'\d{1,4}', out[0]):
            out.pop(0)
        while out and re.fullmatch(r'\d{1,4}', out[-1]):
            out.pop()
        yield from out

def guardar(nombre, titulo, corto, rangos, objetivo=2000):
    nivel = {}
    bloques, actual, tam = [], [], 0

    def cabecera(primera):
        # Documento y apartado; si el bloque ya empieza con el título del apartado, basta con el de nivel superior.
        ruta = [nivel[k] for k in sorted(nivel)]
        if ruta and ruta[-1] == primera:
            ruta = ruta[:-1]
        return f'[{corto}' + (f' · {ruta[-1]}' if ruta else '') + ']'

    def cerrar():
        nonlocal actual, tam
        if actual:
            bloques.append(cabecera_bloque + '\n' + '\n'.join(actual))
        actual, tam = [], 0

    cabecera_bloque = f'[{corto}]'
    for a, b in rangos:
        for l in lineas(a, b):
            m = APARTADO.match(l.strip())
            if m and tam >= 400:
                cerrar()
            if m:
                prof = m.group(1).count('.')
                nivel = {k: v for k, v in nivel.items() if k < prof}
                nivel[prof] = l
            elif tam + len(l) > objetivo and tam >= 400:
                cerrar()
            if not actual:
                cabecera_bloque = cabecera(l)
            actual.append(l)
            tam += len(l) + 1
    cerrar()
    cab = (f'{titulo}\nFuente: FAIRINO Collaborative Robot User Manual, Release 4.0.0 (28/09/2026), documentación oficial de '
           'FAIRINO en inglés: https://fairino-doc-en.readthedocs.io/latest/\n'
           'Texto extraído del PDF oficial para la base de conocimiento del asistente de FAIRINO España (las figuras no se '
           'incluyen; en las tablas, las columnas van separadas por « | »).\n\n')
    texto = cab + '\n\n'.join(bloques) + '\n'
    nombre = os.path.join(OUT, nombre)
    open(nombre, 'w').write(texto)
    print(f'{os.path.basename(nombre):52s} {len(texto.encode()):9d} bytes  {len(bloques):5d} bloques')

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    guardar('fairino-manual-esencial.txt', 'MANUAL DEL COBOT FAIRINO: LO ESENCIAL (puesta en marcha, parámetros básicos, instalación y conexionado, LED, seguridad, Modbus TCP, errores del controlador y términos)', 'Manual del cobot', [(89, 222), (346, 403), (927, 985), (1634, 1649)])
    guardar('fairino-sdk-codigos-error.txt', 'TABLA DE CÓDIGOS DE ERROR DEL SDK DE FAIRINO', 'Códigos de error del SDK', [(2867, 2874)])
    guardar('fairino-sdk-python.txt', 'MANUAL DEL SDK DE FAIRINO: PYTHON', 'SDK de Python', [(2562, 2866)])
    guardar('fairino-manual-cobot-completo.txt', 'MANUAL DEL COBOT FAIRINO (completo: puesta en marcha, instalación, seguridad, software, programación, aplicaciones, apéndices y versiones)', 'Manual del cobot', [(89, 1670)])
    guardar('fairino-sdk-cpp.txt', 'MANUAL DEL SDK DE FAIRINO: C++', 'SDK de C++', [(1671, 1972)])
    guardar('fairino-sdk-csharp.txt', 'MANUAL DEL SDK DE FAIRINO: C#', 'SDK de C#', [(1973, 2274)])
    guardar('fairino-sdk-java.txt', 'MANUAL DEL SDK DE FAIRINO: JAVA', 'SDK de Java', [(2275, 2561)])
    guardar('fairino-maquina-virtual-frcap-lua-cnde-ros.txt', 'FAIRINO: MÁQUINA VIRTUAL, PLUG-INS FRCAP, LUA, COMUNICACIÓN CNDE, ROS, ROS 2 Y MOVEIT2', 'Máquina virtual, Lua y ROS', [(2875, 3078)])
