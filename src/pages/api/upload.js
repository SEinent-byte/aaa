import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey     = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const serviceKey  = import.meta.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error('Supabase credentials not configured. Check .env.local');
}

// Para storage usamos service key (bypasea RLS)
// Si no está configurada, caemos al anon key
const supabaseAdmin = createClient(supabaseUrl, serviceKey || anonKey);
const BUCKET = 'productos-imagenes';

export async function POST({ request }) {
  try {
    const formData  = await request.formData();
    const file      = formData.get('file');
    const productId = formData.get('productId');

    if (!file || !(file instanceof File)) {
      return json400('Archivo no válido');
    }
    if (!productId) {
      return json400('ID de producto requerido');
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return json400('Tipo de archivo no válido. Solo JPG, PNG, WEBP o GIF');
    }
    if (file.size > 5 * 1024 * 1024) {
      return json400('El archivo no puede superar los 5 MB');
    }

    const ext      = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `${productId}-${Date.now()}.${ext}`;
    const path     = `productos/${fileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: true });

    if (error) {
      console.error('Upload error:', error);
      return json500(error.message || 'Error al subir la imagen');
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

    return new Response(JSON.stringify({ success: true, url: urlData.publicUrl, path: data.path }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Upload error:', err);
    return json500(err.message || 'Error interno del servidor');
  }
}

export async function DELETE({ request }) {
  try {
    const { imagePath } = await request.json();
    if (!imagePath) return json400('Ruta de imagen requerida');

    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([imagePath]);
    if (error) return json400(error.message);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return json500('Error interno');
  }
}

function json400(msg) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400, headers: { 'Content-Type': 'application/json' },
  });
}
function json500(msg) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 500, headers: { 'Content-Type': 'application/json' },
  });
}
