import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth-helpers';

// GET /api/blog/:id - Obtener un articulo
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', Number(id))
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Articulo no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ data });
}

// PUT /api/blog/:id - Actualizar un articulo (protegido)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user || (user.userType || '').toUpperCase() !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
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

  const { data, error } = await supabase
    .from('blog_posts')
    .update({
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
      featured: featured ?? false,
      reading_time: reading_time || 5,
      updated_at: new Date().toISOString(),
    })
    .eq('id', Number(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/blog/:id - Eliminar un articulo (protegido)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user || (user.userType || '').toUpperCase() !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', Number(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Articulo eliminado' });
}
