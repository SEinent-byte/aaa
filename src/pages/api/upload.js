import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not configured. Check .env.local');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const productId = formData.get('productId');

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'Archivo no válido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!productId) {
      return new Response(JSON.stringify({ error: 'ID de producto requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return new Response(JSON.stringify({
        error: 'Tipo de archivo no válido. Solo se permiten JPG, PNG, WEBP o GIF'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({
        error: 'El archivo no puede superar los 5MB'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generar nombre único
    const ext = file.name.split('.').pop();
    const fileName = `${productId}-${Date.now()}.${ext}`;
    const path = `productos/${fileName}`;

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('productos-imagenes')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading:', error);
      return new Response(JSON.stringify({
        error: error.message || 'Error al subir la imagen'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('productos-imagenes')
      .getPublicUrl(path);

    return new Response(JSON.stringify({
      success: true,
      url: urlData.publicUrl,
      path: data.path
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE({ request }) {
  try {
    const { imagePath } = await request.json();

    if (!imagePath) {
      return new Response(JSON.stringify({ error: 'Ruta de imagen requerida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { error } = await supabase.storage
      .from('productos-imagenes')
      .remove([imagePath]);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
