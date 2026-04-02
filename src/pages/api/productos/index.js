import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not configured. Check .env.local');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  const { data, error } = await supabase.from('productos').select('*').order('creado_en', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(data || []), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'JSON inválido o body vacío' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!payload?.nombre?.trim()) {
    return new Response(
      JSON.stringify({ error: 'El nombre es requerido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validar que el nombre no tenga emojis
  const emojiRegex = /[\p{Emoji}]/u;
  if (emojiRegex.test(payload.nombre)) {
    return new Response(
      JSON.stringify({ error: 'Los nombres de producto no pueden contener emojis' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (payload.precio === undefined || payload.precio === null || payload.precio < 0) {
    return new Response(
      JSON.stringify({ error: 'El precio debe ser mayor o igual a 0' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (payload.stock === undefined || payload.stock === null || payload.stock < 0) {
    return new Response(
      JSON.stringify({ error: 'El stock debe ser mayor o igual a 0' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { nombre, descripcion = '', precio, stock = 0, categoria = '', imagen_url = null } = payload;

  const { data, error } = await supabase
    .from('productos')
    .insert([{ nombre: nombre.trim(), descripcion, precio, stock, categoria, imagen_url }])
    .select('*');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(data[0]), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}
