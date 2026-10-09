# Cuentas de cliente (Firebase): cómo activarlas

La web ya tiene «Iniciar sesión o registrarse», «Mi cuenta» y la compra con cuenta obligatoria (como en Amazon). Para
que funcione hace falta un proyecto de **Firebase** (de Google, gratis), que guarda las cuentas y las contraseñas de
forma segura. Mientras `site.accounts.firebase` (en `src/data/site.ts`) sea `null`, la web funciona como antes: sin
cuentas y con el pedido abierto.

## Pasos (unos 10 minutos)

1. Entra en <https://console.firebase.google.com> con la cuenta de Google de FAIRINO España (la de Analytics).
2. **Crear un proyecto** → nombre: `fairinocobot` → Google Analytics para este proyecto: no hace falta → Crear.
3. **Authentication** (menú de la izquierda, en «Compilación») → **Comenzar** → pestaña **Método de acceso** →
   **Correo electrónico/contraseña** → activar el primer interruptor → **Guardar**.
4. En Authentication → **Configuración** → **Dominios autorizados** → **Agregar dominio**: `fairinocobot.com`, y otra
   vez: `www.fairinocobot.com`.
5. **Firestore Database** → **Crear base de datos** → ubicación en Europa (`eur3` o `europe-southwest1`, Madrid) →
   **modo de producción** → Crear.
6. En Firestore Database → pestaña **Reglas** → borrar todo lo que hay → pegar el contenido de `firestore.rules`
   (este mismo directorio) → **Publicar**.
7. ⚙️ **Configuración del proyecto** → **General** → abajo, «Tus apps» → icono web **`</>`** → apodo: `Web` →
   **Registrar app**. Sale un bloque `const firebaseConfig = { apiKey: "…", authDomain: "…", projectId: "…", … }`:
   copiarlo entero y pegarlo en `site.accounts.firebase` (son datos públicos; la seguridad la ponen las reglas).
8. Compilar, subir el zip y probar: crear una cuenta, comprar y ver el pedido en «Mi cuenta».

## Dónde ver a los clientes

- **Authentication → Usuarios**: cada cliente con su correo, el día que se registró y la última vez que entró.
- **Firestore Database → Datos**: `clientes` (nombre, empresa, CIF, teléfono, dirección) y `pedidos` (lo que ha comprado
  cada uno, con la fecha y el total).
- Además, por correo (Web3Forms, a la misma dirección que los formularios): un aviso con cada **cliente nuevo** y cada
  **pedido**, con «cliente registrado» y la referencia del pedido.

## Probar en local, sin tocar el proyecto real

Con los emuladores de Firebase (proyecto de prueba `demo-fairino`, no hace falta cuenta):

```sh
cd tools/firebase && npx firebase-tools emulators:start --only auth,firestore --project demo-fairino
# en otra terminal:
PUBLIC_FIREBASE_EMULATOR=1 npm run build && cd dist && python3 -m http.server 4329
```

La web de prueba usa entonces los emuladores (cuentas en `127.0.0.1:9099`, base de datos en `127.0.0.1:8080`).
