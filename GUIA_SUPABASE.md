# Configuración de Supabase

## 1. Crear la tabla `productos`

En el SQL Editor de Supabase, ejecuta:

```sql
CREATE TABLE productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT,
  descripcion TEXT,
  precio NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  imagen_url TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acceso público (para desarrollo)
CREATE POLICY "Permitir lectura pública" ON productos
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción pública" ON productos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización pública" ON productos
  FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación pública" ON productos
  FOR DELETE USING (true);
```

## 2. Crear el bucket de Storage para imágenes

1. Ve a **Storage** en el panel de Supabase
2. Haz clic en **New bucket**
3. Nombre: `productos-imagenes`
4. **Public bucket**: Activado
5. Haz clic en **Create bucket**

### Políticas del bucket

Para permitir subida y eliminación pública, ejecuta en SQL Editor:

```sql
-- Permitir upload público
CREATE POLICY "Permitir upload público" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'productos-imagenes');

-- Permitir lectura pública
CREATE POLICY "Permitir lectura pública" ON storage.objects
  FOR SELECT USING (bucket_id = 'productos-imagenes');

-- Permitir eliminación pública
CREATE POLICY "Permitir eliminación pública" ON storage.objects
  FOR DELETE USING (bucket_id = 'productos-imagenes');
```

## 3. Obtener las credenciales

1. Ve a **Settings** → **API**
2. Copia:
   - **Project URL** → `PUBLIC_SUPABASE_URL`
   - **anon/public key** → `PUBLIC_SUPABASE_ANON_KEY`

## 4. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## 5. Añadir a .gitignore

Asegúrate de que `.env.local` esté en `.gitignore`:

```
.env.local
```

---

# Deployment en Render

## 1. Crear un nuevo servicio

1. Ve a [render.com](https://render.com)
2. **New** → **Web Service**
3. Conecta tu repositorio de GitHub

## 2. Configuración del servicio

- **Name**: `api-online` (o el que prefieras)
- **Region**: El más cercano a tus usuarios
- **Branch**: `master`
- **Root Directory**: (déjalo vacío)
- **Runtime**: `Node`
- **Build Command**: `npm run build`
- **Start Command**: `node dist/server/entry.mjs`

## 3. Variables de entorno en Render

En la sección **Environment** de Render, añade:

```
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NODE_VERSION=22.12.0
```

## 4. Desplegar

Haz clic en **Create Web Service** y espera a que termine el deployment.

---

# Resumen de características implementadas

- [x] UI estilo ecommerce con tarjetas de producto
- [x] Imágenes de producto con compresión automática (max 0.5MB, 800px)
- [x] Categorías predefinidas: Microcontroladores, Herramientas, Componentes, Sensores, Actuadores, Fuentes de poder, Cables y conectores
- [x] Validación: nombres sin emojis
- [x] Precios en soles (S/)
- [x] Eliminación de imágenes al borrar productos
- [x] Lazy loading para imágenes
