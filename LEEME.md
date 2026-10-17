# At Home – cómo ponerlo en línea (Supabase + GitHub + Hostinger)

## 1. Base de datos en Supabase (gratis)
1. Entra a supabase.com, crea un proyecto y ponle una contraseña.
2. Menú **SQL Editor** → **New query** → pega todo el contenido de `supabase/schema.sql` → **Run**.
3. Menú **Project Settings → API**: copia el **Project URL** y la llave **service_role** (es secreta; solo va en el servidor, nunca en GitHub ni en el navegador).

## 2. Código en GitHub
1. Crea un repositorio **privado** en github.com.
2. Sube esta carpeta (con GitHub Desktop es lo más fácil) o con estos comandos:
```
git init
git add .
git commit -m "At Home app"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```
El archivo `.env` NO se sube (ya está bloqueado en `.gitignore`).

## 3. Hostinger
1. hPanel → **Websites → Add Website → Node.js web app** → conecta tu repositorio de GitHub.
2. Archivo de inicio: `server.js`. Node 20 o 22.
3. Agrega estas **variables de entorno**:
   - `ADMIN_CODE` → el código que usarás para entrar a /admin.html (elige uno largo)
   - `SUPABASE_URL` → el Project URL
   - `SUPABASE_SERVICE_KEY` → la llave service_role
   - `PIXABAY_API_KEY` → la llave de fotos que ya creaste (la app la toma de aquí; no está escrita en ningún archivo)
4. Conecta tu dominio.

## 4. Fotos
En tu computadora (con Node.js instalado): copia `.env.example` a `.env`, pon tu `PIXABAY_API_KEY`, y corre `PHOTOS_ONLY=1 node enrich.js`. Luego `node server.js` y abre `http://localhost:3000/review.html` para aprobar o cambiar las fotos. Sube la carpeta `public/photos` a GitHub.

## 5. Primera prueba
1. Abre `tu-dominio/admin.html` → escribe el código de administrador.
2. En otra pestaña abre la app → **Regístrate** → llena el formulario de un niño de prueba.
3. En el admin: **Aprobar** (puedes escribir el usuario que quieras) → usa WhatsApp o Correo.
4. Entra a la app con ese usuario.

## En el admin puedes
Aprobar o rechazar, **asignar o cambiar usernames**, **cambiar la fecha de vencimiento** (+1 año, +6 meses o una fecha exacta), cambiar grado y colegio, renovar y copiar el mensaje para el padre. Si cambias un username, el progreso del niño se mueve con él.
