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

### Fotos automáticas (con tu llave de Pixabay)
- En la página **Palabras** toca **Buscar fotos automáticamente**. La app usa la llave `PIXABAY_API_KEY` que pusiste en Vercel: busca una foto para cada palabra que no tenga, la guarda en tu Supabase (carpeta de fotos `word-photos`, se crea sola) y la pone en la palabra. Tarda unos segundos por grupo de 12; deja la página abierta (puedes tocar **Detener**).
- Para cambiar una foto: en la fila de la palabra toca **Buscar foto**, elige otra y listo.
- Las palabras sin resultado se marcan como "Sin foto" y muestran la oración con un espacio en blanco.
- Pixabay deja unas 100 búsquedas por minuto, por eso la página espera unos segundos entre grupos.
- Si la tabla está vacía, la página te muestra un botón **Cargar las palabras que vienen con la app** (un solo clic). Si importas el CSV otra vez, nunca borra las definiciones ni las fotos que ya tengas.
- Arriba ves cuántas palabras hay, cuántas no tienen definición u oración y cuántas no tienen foto. Puedes mostrar 100, 250, 500 o 1000 por página y filtrar por "Sin foto" o "Sin definición".

## 6. Primera prueba
1. Abre `tu-dominio/admin` → escribe el código de administrador.
2. En la app toca **Regístrate** y llena un niño de prueba.
3. En el admin: **Aprobar** (puedes escribir el usuario) → botón de WhatsApp o Correo.
4. Entra a la app con ese usuario.

## En el admin puedes
Agregar y editar palabras, aprobar o rechazar, **asignar o cambiar usernames**, **cambiar la fecha de vencimiento**, cambiar grado y colegio, renovar y copiar el mensaje para el padre. Si cambias un username, el progreso del niño se mueve con él.

## 7. Novedades (octubre 2026)
- **Grado PF**: en el admin, en la página Palabras y en el registro ya aparece **PF** (se guarda como grado 0).
- **Empieza en (Unidad · Semana)**: al aprobar, elige en qué semana empieza el niño. Las semanas anteriores salen como **ya hechas** (las vieron en clase desde septiembre). El admin sugiere la semana actual del año escolar. Se puede cambiar después con **Editar**.
- **WhatsApp**: los números de 10 dígitos (809, 829, 849) ahora llevan el **1** delante, que es lo que WhatsApp necesita. Si el número está mal, el admin lo avisa.
- **WhatsApp con foto**: el botón verde oscuro envía el mensaje **con la foto** `public/flyer.jpg` (los pasos para agregar la app). En el celular o iPad abre el menú de compartir: elige WhatsApp. En una computadora sin esa opción, copia el mensaje y abre la foto para enviarla a mano. Para cambiar la foto, reemplaza `public/flyer.jpg`.
- **Fotos automáticas**: ahora busca una palabra a la vez (antes buscaba 12 al mismo tiempo y Pixabay las rechazaba). Si hay un problema con la llave, la página te dice exactamente cuál.
- **Lista "General"**: palabras normales de PF a 5to (inglés y español) para los colegios que no tienen lista propia. Tienen el colegio **General**. Un niño de otro colegio ve automáticamente la lista General; Colegio Continental sigue viendo la suya.
- **Practicar** (botón en el mapa y pestaña abajo): el niño ve una foto (o escucha el significado) y toca la palabra correcta entre 4. Gana gemas igual que en las semanas.
