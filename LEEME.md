# At Home – cómo ponerlo en línea (Supabase + GitHub + Vercel)

## 1. Supabase (la base de datos) – YA ESTÁ CREADA
- Proyecto: `at-home-app`  ·  Dirección (SUPABASE_URL): `https://oqlkfkuxlkyodpreezrn.supabase.co`
- Las tablas `accounts` (cuentas) y `progress` (progreso) ya existen y están bloqueadas para que solo tu servidor pueda leerlas.
- **Falta una cosa que tú tienes que copiar** (es secreta, yo no puedo verla): en Supabase abre tu proyecto → **Project Settings** (la rueda abajo a la izquierda) → **API Keys** → copia la llave **secret** (también llamada **service_role**). Esa llave va solo en Vercel (paso 3). Nunca en GitHub ni en el navegador.
- Para ver tus datos: menú izquierdo **Table Editor** → `accounts` (ahí aparecen las solicitudes y los estudiantes).

## 2. Código en GitHub
Crea un repositorio **privado** y sube esta carpeta (GitHub Desktop: File → Add local repository → Publish repository). El archivo `.env` no se sube (está bloqueado en `.gitignore`).

## 3. Vercel (la página web)
1. vercel.com → **Add New → Project** → importa tu repositorio de GitHub.
2. Framework Preset: **Other**. No escribas ningún comando de build. **Deploy**.
3. **Settings → Environment Variables**, agrega estas y luego **Redeploy**:
   - `ADMIN_CODE` → el código que usarás en /admin (elige uno largo)
   - `SUPABASE_URL` → `https://oqlkfkuxlkyodpreezrn.supabase.co`
   - `SUPABASE_SERVICE_KEY` → la llave secret de Supabase
   - `PIXABAY_API_KEY` → tu llave de fotos (solo la usa la herramienta de fotos en tu computadora, pero puedes guardarla aquí también)
4. **Settings → Domains** para conectar tu dominio.
Nota: el plan gratis de Vercel (Hobby) es solo para uso no comercial; si vas a cobrar, necesitas el plan Pro.

## 4. Fotos (en tu computadora)
Con Node.js instalado: copia `.env.example` a `.env`, pon tu `PIXABAY_API_KEY`, y corre `PHOTOS_ONLY=1 node enrich.js`. Luego `node server.js` y abre `http://localhost:3000/review` para aprobar o cambiar fotos. Sube la carpeta `public/photos` a GitHub. (Las fotos salen pequeñas, unos 30 KB cada una, para no pasar el límite de tamaño de Vercel.)

## 5. Palabras (tabla en el admin)
1. Abre `tu-dominio/words` (o el botón **Palabras** del admin).
2. La primera vez toca **Importar CSV** y elige `words-colegio-continental.csv` (el archivo de palabras que te di). Sube todas las palabras de una vez.
3. Desde ahí puedes **agregar** una palabra (fila verde de arriba), **editar** cualquier casilla y tocar **Guardar**, o **Borrar**. Puedes filtrar por idioma y grado y buscar.
4. La columna **Foto** lleva el nombre del archivo (por ejemplo `cat.webp`) de la carpeta `public/photos`. **Colegio** vacío = todos los colegios. **Sin foto** = muestra la oración con un espacio en blanco.
5. Una semana aparece en la app cuando **todas** sus palabras tienen definición y oración. Los cambios se ven en la app la próxima vez que el estudiante entre.
6. **Exportar CSV** baja todas tus palabras (se pueden volver a importar).

## 6. Primera prueba
1. Abre `tu-dominio/admin` → escribe el código de administrador.
2. En la app toca **Regístrate** y llena un niño de prueba.
3. En el admin: **Aprobar** (puedes escribir el usuario) → botón de WhatsApp o Correo.
4. Entra a la app con ese usuario.

## En el admin puedes
Agregar y editar palabras, aprobar o rechazar, **asignar o cambiar usernames**, **cambiar la fecha de vencimiento**, cambiar grado y colegio, renovar y copiar el mensaje para el padre. Si cambias un username, el progreso del niño se mueve con él.
