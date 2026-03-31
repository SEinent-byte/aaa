import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

export async function GET({ params }) {
  const { id } = params;
  const { data, error } = await supabase.from('productos').select('*').eq('id', id).single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
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
  const payload = await request.json();

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

  const { error } = await supabase.from('productos').delete().eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 204,
    headers: { 'Content-Type': 'application/json' }
  });
}
