import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Create tables + seed venues + events all in one go
export async function POST() {
  try {
    // 1. Create venues table
    // Table creation must be done via Supabase SQL editor
    // This endpoint only seeds data

    // Try direct insert - if table exists this works, if not we handle it
    // First check if venues table exists by trying a select
    const { error: checkError } = await supabase.from('venues').select('id').limit(1);

    if (checkError && checkError.message.includes('does not exist')) {
      return NextResponse.json({
        error: 'La tabla venues no existe. Ejecuta el SQL de supabase/venues-schema.sql en tu Supabase dashboard primero.',
        sql_file: 'supabase/venues-schema.sql'
      }, { status: 400 });
    }

    // Get city IDs
    const { data: cities } = await supabase.from('cities').select('id, slug, name');
    const cityMap: Record<string, number> = {};
    (cities || []).forEach(c => { cityMap[c.slug] = c.id; });

    // Get category IDs
    const { data: cats } = await supabase.from('categories').select('id, slug, name');
    const catMap: Record<string, number> = {};
    (cats || []).forEach(c => { catMap[c.slug] = c.id; });

    // 2. Seed venues
    const venues = [
      {
        slug: 'museo-franz-mayer',
        name: 'Museo Franz Mayer',
        description: 'El Museo Franz Mayer es uno de los museos mas importantes de Mexico, ubicado en el Centro Historico de la Ciudad de Mexico. Alberga una de las colecciones de artes decorativas mas importantes de America Latina, con mas de 10,000 piezas que abarcan desde el siglo XVI hasta el XIX.\n\nEl museo tambien cuenta con una impresionante biblioteca con mas de 14,000 volumenes y realiza exposiciones temporales de arte contemporaneo, diseno y fotografia.\n\nFundado en 1986 por el empresario aleman Franz Mayer, el museo se encuentra en el antiguo Hospital de San Juan de Dios, un edificio del siglo XVII con una hermosa arquitectura colonial.',
        short_description: 'Museo de artes decorativas y diseno en el Centro Historico de CDMX',
        logo: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=200&h=200&fit=crop&q=80',
        cover_image: 'https://images.unsplash.com/photo-1565060169194-19fabf63012c?w=1920&h=600&fit=crop&q=80',
        category: 'museo',
        address: 'Av. Hidalgo 45, Centro Historico, 06300 CDMX',
        city_id: cityMap['cdmx'] || null,
        lat: 19.4368, lng: -99.1412,
        phone: '+52 55 5518 2266',
        website: 'https://www.franzmayer.org.mx',
        instagram: '@museosfranzmayer',
        verified: true, featured: true,
        rating: 4.7, review_count: 342, follower_count: 8500,
      },
      {
        slug: 'teatro-metropolitan',
        name: 'Teatro Metropolitan',
        description: 'El Teatro Metropolitan es uno de los foros mas emblematicos de la Ciudad de Mexico. Con capacidad para mas de 3,000 personas, ha sido escenario de los artistas y espectaculos mas importantes del mundo. Desde conciertos de rock y pop hasta obras de teatro, stand-up comedy y eventos corporativos.\n\nUbicado en la zona de la Independencia, el teatro combina una arquitectura Art Deco impresionante con tecnologia de punta en iluminacion y sonido.',
        short_description: 'Foro de conciertos y espectaculos en CDMX con mas de 3,000 localidades',
        logo: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=200&h=200&fit=crop&q=80',
        cover_image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1920&h=600&fit=crop&q=80',
        category: 'teatro',
        address: 'Independencia 90, Centro, 06050 CDMX',
        city_id: cityMap['cdmx'] || null,
        lat: 19.4284, lng: -99.1478,
        phone: '+52 55 5510 1045',
        instagram: '@teatrometropolitan',
        verified: true, featured: true,
        rating: 4.5, review_count: 1230, follower_count: 25000,
      },
      {
        slug: 'pujol-restaurant',
        name: 'Pujol',
        description: 'Pujol es el restaurante del chef Enrique Olvera, reconocido como uno de los mejores restaurantes del mundo. Su propuesta gastronomica reinterpreta la cocina mexicana con tecnicas contemporaneas, usando ingredientes locales y de temporada.\n\nEl menu degustacion incluye platos iconicos como el Mole Madre (que lleva mas de 1,500 dias en preparacion) y el Taco de Larva de Hormiga. La experiencia culinaria va mas alla de la comida, con un servicio impecable y un espacio disenado para estimular todos los sentidos.',
        short_description: 'Restaurante de alta cocina mexicana del chef Enrique Olvera, #1 en Mexico',
        logo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop&q=80',
        cover_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=600&fit=crop&q=80',
        category: 'gastronomia',
        address: 'Tennyson 133, Polanco, 11560 CDMX',
        city_id: cityMap['cdmx'] || null,
        lat: 19.4320, lng: -99.1937,
        phone: '+52 55 5545 4111',
        website: 'https://pujol.com.mx',
        instagram: '@paboreal',
        verified: true, featured: true,
        rating: 4.9, review_count: 890, follower_count: 45000,
      },
      {
        slug: 'palacio-bellas-artes',
        name: 'Palacio de Bellas Artes',
        description: 'El Palacio de Bellas Artes es el recinto cultural mas importante de Mexico. Inaugurado en 1934, su arquitectura combina estilos Art Nouveau y Art Deco. Alberga murales de Diego Rivera, David Alfaro Siqueiros, Jose Clemente Orozco y Rufino Tamayo.\n\nEs sede de la Orquesta Sinfonica Nacional, el Ballet Folklorico de Mexico y presenta las exposiciones de arte mas importantes del pais. Su sala principal tiene capacidad para 1,800 espectadores.',
        short_description: 'Recinto cultural mas importante de Mexico. Murales, opera, ballet y exposiciones',
        logo: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=200&h=200&fit=crop&q=80',
        cover_image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=1920&h=600&fit=crop&q=80',
        category: 'arte',
        address: 'Av. Juarez s/n, Centro Historico, 06050 CDMX',
        city_id: cityMap['cdmx'] || null,
        lat: 19.4352, lng: -99.1412,
        phone: '+52 55 8647 6500',
        website: 'https://museopalaciodebellasartes.gob.mx',
        instagram: '@paboreal',
        verified: true, featured: true,
        rating: 4.8, review_count: 2100, follower_count: 120000,
      },
      {
        slug: 'sala-juanino-madrid',
        name: 'Sala Juanino',
        description: 'La Sala Juanino es uno de los espacios de musica en vivo mas reconocidos de Madrid. Con una programacion eclectica que va del jazz al indie, pasando por flamenco fusion y electronica. Su ambiente intimo y su acustica impecable la convierten en el lugar favorito de los melomanos madrilenos.',
        short_description: 'Sala de conciertos intimos y musica en vivo en el centro de Madrid',
        logo: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&q=80',
        cover_image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&h=600&fit=crop&q=80',
        category: 'conciertos',
        address: 'Calle de Atocha 125, 28012 Madrid',
        city_id: cityMap['madrid'] || null,
        lat: 40.4098, lng: -3.6953,
        instagram: '@salajuanino',
        verified: true, featured: false,
        rating: 4.6, review_count: 456, follower_count: 18000,
      },
    ];

    let venuesCreated = 0;
    const venueIds: Record<string, number> = {};

    for (const v of venues) {
      const { data, error } = await supabase
        .from('venues')
        .upsert(v, { onConflict: 'slug' })
        .select('id, slug')
        .single();

      if (!error && data) {
        venuesCreated++;
        venueIds[data.slug] = data.id;
      }
    }

    // 3. Create events for each venue
    const venueEvents = [
      // Franz Mayer events
      { venue: 'museo-franz-mayer', title: 'Exposicion: Diseno Mexicano Contemporaneo', slug: 'diseno-mexicano-franz-mayer', description: 'Una muestra que celebra lo mejor del diseno mexicano actual. Desde mobiliario hasta joyeria, textiles y objetos de uso cotidiano creados por disenadores emergentes y consolidados.', short_description: 'Lo mejor del diseno mexicano en una exposicion unica', price: 80, currency: 'MXN', image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=1000&fit=crop&q=80', category: 'arte', date: '2026-04-15', time: '10:00', duration: '2 horas', featured: true },
      { venue: 'museo-franz-mayer', title: 'Taller de Tipografia Artesanal', slug: 'taller-tipografia-franz-mayer', description: 'Aprende las tecnicas tradicionales de tipografia con tipos moviles en el taller del museo. Incluye materiales y una impresion para llevar a casa.', short_description: 'Workshop de tipografia con tipos moviles', price: 350, currency: 'MXN', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=1000&fit=crop&q=80', category: 'talleres', date: '2026-04-20', time: '11:00', duration: '3 horas', featured: false },
      { venue: 'museo-franz-mayer', title: 'Visita Guiada Nocturna: Secretos del Museo', slug: 'visita-nocturna-franz-mayer', description: 'Recorre el museo despues del horario habitual con una guia experta que te revelara las historias ocultas detras de las piezas mas emblemáticas de la coleccion.', short_description: 'Tour nocturno por la coleccion permanente', price: 150, currency: 'MXN', image: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&h=1000&fit=crop&q=80', category: 'tours', date: '2026-04-25', time: '20:00', duration: '1.5 horas', featured: true },
      { venue: 'museo-franz-mayer', title: 'Concierto en el Claustro: Jazz & Vino', slug: 'jazz-vino-franz-mayer', description: 'Una velada magica en el claustro del museo con jazz en vivo y degustacion de vinos mexicanos. Cupo limitado para una experiencia intima.', short_description: 'Jazz en vivo + degustacion de vinos en el claustro', price: 500, currency: 'MXN', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=1000&fit=crop&q=80', category: 'conciertos', date: '2026-05-02', time: '19:30', duration: '2.5 horas', featured: true, capacity: 80 },
      { venue: 'museo-franz-mayer', title: 'Exposicion Gratuita: Fotografia Documental', slug: 'fotografia-documental-franz-mayer', description: 'Muestra de fotografia documental que retrata la vida cotidiana en Mexico a traves de los ojos de 15 fotografos emergentes. Entrada libre.', short_description: 'Fotografia documental mexicana - Entrada gratuita', price: 0, currency: 'MXN', image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&h=1000&fit=crop&q=80', category: 'arte', date: '2026-04-10', time: '10:00', duration: '1 hora', featured: false },

      // Teatro Metropolitan events
      { venue: 'teatro-metropolitan', title: 'El Fantasma de la Opera - Musical', slug: 'fantasma-opera-metropolitan', description: 'La produccion mas espectacular del musical mas famoso del mundo llega a Ciudad de Mexico. Vestuario original de Broadway, orquesta en vivo y efectos especiales impresionantes.', short_description: 'El musical mas famoso del mundo en CDMX', price: 890, currency: 'MXN', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=1000&fit=crop&q=80', category: 'teatro', date: '2026-04-18', time: '20:00', duration: '2.5 horas', featured: true, capacity: 3000 },
      { venue: 'teatro-metropolitan', title: 'Stand Up Comedy: Noche de Comedia', slug: 'standup-metropolitan', description: 'Los mejores comediantes de Mexico se reunen en una noche epica de stand-up comedy. Risas garantizadas.', short_description: 'Los mejores comediantes en una sola noche', price: 450, currency: 'MXN', image: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&h=1000&fit=crop&q=80', category: 'teatro', date: '2026-04-22', time: '21:00', duration: '2 horas', featured: false, capacity: 3000 },

      // Pujol events
      { venue: 'pujol-restaurant', title: 'Cena Degustacion: Menu Milpa', slug: 'cena-degustacion-pujol', description: 'Experiencia gastronomica de 7 tiempos con maridaje de mezcales artesanales. El chef Enrique Olvera presenta su nuevo menu inspirado en la milpa mexicana.', short_description: 'Menu degustacion 7 tiempos + maridaje de mezcales', price: 4500, currency: 'MXN', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=1000&fit=crop&q=80', category: 'gastronomia', date: '2026-04-12', time: '20:30', duration: '3 horas', featured: true, capacity: 24 },
      { venue: 'pujol-restaurant', title: 'Masterclass: Mole con el Chef Olvera', slug: 'masterclass-mole-pujol', description: 'Aprende a preparar el legendario Mole Madre directamente del chef Enrique Olvera. Incluye ingredientes, recetario y degustacion.', short_description: 'Cocina mole con el chef #1 de Mexico', price: 3800, currency: 'MXN', image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=1000&fit=crop&q=80', category: 'talleres', date: '2026-05-10', time: '11:00', duration: '4 horas', featured: true, capacity: 12 },

      // Bellas Artes events
      { venue: 'palacio-bellas-artes', title: 'Ballet Folklorico de Mexico', slug: 'ballet-folklorico-bellas-artes', description: 'El legendario Ballet Folklorico de Mexico presenta su espectaculo completo con danzas de todas las regiones del pais. Vestuario tradicional, musica en vivo y coreografias espectaculares.', short_description: 'Espectaculo completo de danzas folkloricas mexicanas', price: 350, currency: 'MXN', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=1000&fit=crop&q=80', category: 'festivales', date: '2026-04-16', time: '19:00', duration: '2 horas', featured: true, capacity: 1800 },
      { venue: 'palacio-bellas-artes', title: 'Orquesta Sinfonica Nacional: Beethoven', slug: 'sinfonica-beethoven-bellas-artes', description: 'La OSN interpreta la Novena Sinfonia de Beethoven con coro completo. Direccion del maestro Carlos Miguel Prieto.', short_description: 'Novena Sinfonia de Beethoven con la OSN', price: 280, currency: 'MXN', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=1000&fit=crop&q=80', category: 'conciertos', date: '2026-04-28', time: '20:00', duration: '2 horas', featured: true, capacity: 1800 },
      { venue: 'palacio-bellas-artes', title: 'Visita Guiada: Murales de Rivera y Orozco', slug: 'murales-bellas-artes', description: 'Recorrido guiado por los murales mas importantes del palacio. Incluye obras de Diego Rivera, Orozco, Siqueiros y Tamayo con explicacion historica completa.', short_description: 'Tour guiado por los murales del Palacio', price: 0, currency: 'MXN', image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800&h=1000&fit=crop&q=80', category: 'tours', date: '2026-04-14', time: '11:00', duration: '1.5 horas', featured: false },

      // Sala Juanino Madrid
      { venue: 'sala-juanino-madrid', title: 'Jazz Night: The Madrid Quartet', slug: 'jazz-night-juanino-madrid', description: 'Una noche de jazz contemporaneo con el cuarteto mas aclamado de la escena madrilena. Ambiente intimo, acustica perfecta y copas incluidas.', short_description: 'Jazz contemporaneo en la mejor sala de Madrid', price: 25, currency: 'EUR', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=1000&fit=crop&q=80', category: 'conciertos', date: '2026-04-19', time: '22:00', duration: '2 horas', featured: true, capacity: 200 },
      { venue: 'sala-juanino-madrid', title: 'Flamenco Fusion: Noche Gitana', slug: 'flamenco-fusion-juanino', description: 'Flamenco contemporaneo fusionado con electronica y jazz. Una experiencia unica que reinventa la tradicion flamenca.', short_description: 'Flamenco + electronica + jazz en vivo', price: 30, currency: 'EUR', image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=1000&fit=crop&q=80', category: 'conciertos', date: '2026-04-26', time: '21:30', duration: '2 horas', featured: false, capacity: 200 },
    ];

    let eventsCreated = 0;

    for (const ev of venueEvents) {
      const venueId = venueIds[ev.venue];
      if (!venueId) continue;

      const cityId = venues.find(v => v.slug === ev.venue)?.city_id;
      const categoryId = catMap[ev.category] || null;

      const { error } = await supabase.from('events').upsert({
        title: ev.title,
        slug: ev.slug,
        description: ev.description,
        short_description: ev.short_description,
        price: ev.price,
        currency: ev.currency,
        image: ev.image,
        date: ev.date,
        time: ev.time,
        duration: ev.duration,
        featured: ev.featured,
        capacity: ev.capacity || null,
        status: 'PUBLISHED',
        city_id: cityId,
        category_id: categoryId,
        venue_id: venueId,
        rating: 4.2 + Math.random() * 0.7,
        review_count: Math.floor(50 + Math.random() * 500),
        sold_count: Math.floor(10 + Math.random() * 200),
        address: venues.find(v => v.slug === ev.venue)?.address || null,
        lat: venues.find(v => v.slug === ev.venue)?.lat || null,
        lng: venues.find(v => v.slug === ev.venue)?.lng || null,
      }, { onConflict: 'slug' });

      if (!error) eventsCreated++;
    }

    return NextResponse.json({
      success: true,
      venues_created: venuesCreated,
      events_created: eventsCreated,
      venues: Object.keys(venueIds).map(slug => ({
        slug,
        url: `https://ctxplorer.com/venues/${slug}`,
      })),
    });
  } catch (err) {
    console.error('Seed error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
