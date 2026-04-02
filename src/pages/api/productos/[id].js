import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not configured. Check .env.local');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET({ params }) {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID de producto requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { data, error } = await supabase.from('productos').select('*').eq('id', id).single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: 'Producto no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function PUT({ request, params }) {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID de producto requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!payload || Object.keys(payload).length === 0) {
    return new Response(JSON.stringify({ error: 'Body vacío' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validar nombre sin emojis si se está actualizando
  if (payload.nombre !== undefined) {
    if (!payload.nombre.trim()) {
      return new Response(JSON.stringify({ error: 'El nombre no puede estar vacío' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const emojiRegex = /[\p{Emoji}]/u;
    if (emojiRegex.test(payload.nombre)) {
      return new Response(JSON.stringify({ error: 'Los nombres no pueden contener emojis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    payload.nombre = payload.nombre.trim();
  }

  const { data, error } = await supabase
    .from('productos')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function DELETE({ params }) {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID de producto requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Primero obtener el producto para verificar si tiene imagen
  const { data: producto } = await supabase
    .from('productos')
    .select('imagen_url')
    .eq('id', id)
    .single();

  // Eliminar imagen de Storage si existe
  if (producto?.imagen_url) {
    const urlParts = producto.imagen_url.split('/productos/');
    if (urlParts.length > 1) {
      const imagePath = 'productos/' + urlParts[1];
      await supabase.storage
        .from('productos-imagenes')
        .remove([imagePath]);
    }
  }

  const { error } = await supabase.from('productos').delete().eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(null, {
    status: 204,
    headers: { 'Content-Type': 'application/json' }
  });
}
