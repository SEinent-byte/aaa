import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  const { data, error } = await supabase.from('productos').select('*');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }) {
  let payload;

  try {
    payload = await request.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'JSON inválido o body vacío' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!payload || !payload.nombre || payload.precio == null || payload.stock == null) {
    return new Response(
      JSON.stringify({
        error:
          'Body incompleto: debe incluir nombre, precio y stock (descripcion/categoria opcional)'
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { nombre, descripcion = '', precio, stock = 0, categoria = '' } = payload;

  const { data, error } = await supabase
    .from('productos')
    .insert([{ nombre, descripcion, precio, stock, categoria }])
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
