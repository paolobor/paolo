# Saca el manual oficial de FAIRINO (PDF en inglés) a textos para la base de conocimiento del asistente de ElevenLabs.
#   curl -L -o fairino-manual.pdf https://fairino-doc-en.readthedocs.io/_/downloads/en/latest/pdf/
#   python3 tools/asistente/extraer-manual.py fairino-manual.pdf <carpeta de salida>
# Necesita pdftotext (poppler-utils). Los rangos de páginas son los de la Release 4.0.0 (28/09/2026, 3107 páginas):
# si FAIRINO publica otra versión, hay que revisarlos con el índice del PDF.
import os, re, subprocess, sys
PDF = sys.argv[1]
OUT = sys.argv[2]
HEAD = re.compile(r'^(FAIRINO Collaborative Robot User Manual, Release [\d.]+|Chapter \d+\. .+|\d+\.\d+(\.\d+)*\. .{1,70}|\d{1,4})$')

def paginas(a, b):
    txt = subprocess.run(['pdftotext', '-enc', 'UTF-8', '-f', str(a), '-l', str(b), PDF, '-'], capture_output=True, text=True).stdout
    for page in txt.split('\f'):
        lines = [l.rstrip() for l in page.split('\n')]
        # cabecera y pie: solo en las primeras 3 y últimas 6 líneas no vacías de cada página
        idx = [i for i, l in enumerate(lines) if l.strip()]
        quitar = set(i for i in idx[:3] + idx[-6:] if HEAD.match(lines[i].strip()))
        yield '\n'.join(l for i, l in enumerate(lines) if i not in quitar)

def guardar(nombre, titulo, rangos):
    partes = []
    for a, b in rangos:
        partes.extend(paginas(a, b))
    texto = '\n'.join(partes)
    texto = re.sub(r'[ \t]+\n', '\n', texto)
    texto = re.sub(r'\n{3,}', '\n\n', texto).strip()
    cab = (f'{titulo}\nFuente: FAIRINO Collaborative Robot User Manual, Release 4.0.0 (28/09/2026), documentación oficial de '
           'FAIRINO en inglés: https://fairino-doc-en.readthedocs.io/latest/\n'
           'Texto extraído del PDF oficial para la base de conocimiento del asistente de FAIRINO España (las figuras no se incluyen).\n\n')
    nombre = os.path.join(OUT, nombre)
    open(nombre, 'w').write(cab + texto + '\n')
    print(f'{nombre:58s} {len((cab+texto).encode())/1024:8.0f} KB')

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    guardar('fairino-manual-cobot-completo.txt', 'MANUAL DEL COBOT FAIRINO (completo: puesta en marcha, instalación, seguridad, software, programación, aplicaciones, apéndices y versiones)', [(89, 1670)])
    guardar('fairino-sdk-python.txt', 'MANUAL DEL SDK DE FAIRINO: PYTHON', [(2562, 2866)])
    guardar('fairino-sdk-cpp.txt', 'MANUAL DEL SDK DE FAIRINO: C++', [(1671, 1972)])
    guardar('fairino-sdk-csharp.txt', 'MANUAL DEL SDK DE FAIRINO: C#', [(1973, 2274)])
    guardar('fairino-sdk-java.txt', 'MANUAL DEL SDK DE FAIRINO: JAVA', [(2275, 2561)])
    guardar('fairino-sdk-codigos-error.txt', 'TABLA DE CÓDIGOS DE ERROR DEL SDK DE FAIRINO', [(2867, 2874)])
    guardar('fairino-maquina-virtual-frcap-lua-cnde-ros.txt', 'FAIRINO: MÁQUINA VIRTUAL, PLUG-INS FRCAP, LUA, COMUNICACIÓN CNDE, ROS, ROS 2 Y MOVEIT2', [(2875, 3078)])
    guardar('fairino-manual-esencial.txt', 'MANUAL DEL COBOT FAIRINO: LO ESENCIAL (puesta en marcha, parámetros básicos, instalación y conexionado, LED, seguridad, Modbus TCP, errores del controlador y términos)', [(89, 222), (346, 403), (927, 985), (1634, 1649)])
