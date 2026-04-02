import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

// GET /api/blog - Listar articulos (publico con filtro de status)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let query = supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/blog - Crear articulo (protegido)
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || (user.userType || '').toUpperCase() !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();

  const {
    title,
    slug,
    content,
    excerpt,
    image,
    author_name,
    category,
    tags,
    meta_title,
    meta_description,
    status: postStatus,
    featured,
    reading_time,
  } = body;

  if (!title || !slug || !content) {
    return NextResponse.json(
      { error: 'Titulo, slug y contenido son obligatorios' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      title,
      slug,
      content,
      excerpt: excerpt || null,
      image: image || null,
      author_name: author_name || 'CTXplorer Team',
      category: category || 'general',
      tags: tags || [],
      meta_title: meta_title || title,
      meta_description: meta_description || excerpt || '',
      status: postStatus || 'DRAFT',
      featured: featured || false,
      reading_time: reading_time || 5,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
