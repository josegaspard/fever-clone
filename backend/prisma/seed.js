const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.favorite.deleteMany();
  await prisma.event.deleteMany();
  await prisma.category.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@fever.com',
      password: adminPassword,
      name: 'Admin Fever',
      role: 'ADMIN',
      avatar: 'https://picsum.photos/seed/admin/200/200',
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'user@fever.com',
      password: userPassword,
      name: 'María García',
      role: 'USER',
      avatar: 'https://picsum.photos/seed/user1/200/200',
    },
  });

  console.log('Users created');

  // Create cities
  const cities = await Promise.all([
    prisma.city.create({
      data: {
        name: 'Madrid',
        slug: 'madrid',
        image: 'https://picsum.photos/seed/madrid/800/400',
        country: 'España',
      },
    }),
    prisma.city.create({
      data: {
        name: 'Barcelona',
        slug: 'barcelona',
        image: 'https://picsum.photos/seed/barcelona/800/400',
        country: 'España',
      },
    }),
    prisma.city.create({
      data: {
        name: 'New York',
        slug: 'new-york',
        image: 'https://picsum.photos/seed/newyork/800/400',
        country: 'United States',
      },
    }),
    prisma.city.create({
      data: {
        name: 'London',
        slug: 'london',
        image: 'https://picsum.photos/seed/london/800/400',
        country: 'United Kingdom',
      },
    }),
    prisma.city.create({
      data: {
        name: 'Paris',
        slug: 'paris',
        image: 'https://picsum.photos/seed/paris/800/400',
        country: 'France',
      },
    }),
  ]);

  const [madrid, barcelona, newYork, london, paris] = cities;
  console.log('Cities created');

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Conciertos',
        slug: 'conciertos',
        icon: '🎵',
        color: '#E91E63',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Experiencias Inmersivas',
        slug: 'experiencias-inmersivas',
        icon: '🌀',
        color: '#9C27B0',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Gastronomía',
        slug: 'gastronomia',
        icon: '🍽️',
        color: '#FF9800',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Teatro',
        slug: 'teatro',
        icon: '🎭',
        color: '#F44336',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Festivales',
        slug: 'festivales',
        icon: '🎪',
        color: '#4CAF50',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Arte',
        slug: 'arte',
        icon: '🎨',
        color: '#2196F3',
      },
    }),
  ]);

  const [conciertos, inmersivas, gastronomia, teatro, festivales, arte] = categories;
  console.log('Categories created');

  // Create events
  const events = [
    {
      title: 'Coldplay: Music of the Spheres World Tour',
      slug: 'coldplay-music-spheres-madrid',
      description: 'Coldplay regresa a Madrid con su espectacular gira "Music of the Spheres". Una experiencia audiovisual única con efectos lumínicos, pulseras LED sincronizadas y un repertorio que abarca toda su carrera. Prepárate para cantar desde "Yellow" hasta "My Universe" en una noche inolvidable en el Estadio Santiago Bernabéu.',
      shortDescription: 'Coldplay en vivo en Madrid con su gira mundial más espectacular.',
      image: 'https://picsum.photos/seed/coldplay/800/500',
      gallery: JSON.stringify([
        'https://picsum.photos/seed/coldplay1/800/500',
        'https://picsum.photos/seed/coldplay2/800/500',
        'https://picsum.photos/seed/coldplay3/800/500',
      ]),
      price: 95.0,
      originalPrice: 120.0,
      currency: 'EUR',
      date: new Date('2026-05-15T21:00:00Z'),
      endDate: new Date('2026-05-15T23:30:00Z'),
      time: '21:00',
      duration: '2h 30min',
      address: 'Estadio Santiago Bernabéu, Av. de Concha Espina, Madrid',
      lat: 40.453,
      lng: -3.6883,
      cityId: madrid.id,
      categoryId: conciertos.id,
      organizerId: admin.id,
      status: 'PUBLISHED',
      featured: true,
      capacity: 60000,
      soldCount: 45200,
    },
    {
      title: 'Van Gogh: The Immersive Experience',
      slug: 'van-gogh-immersive-barcelona',
      description: 'Sumérgete en el universo de Vincent van Gogh a través de proyecciones 360° de sus obras más icónicas. Camina entre girasoles gigantes, observa La Noche Estrellada envolverte por completo y descubre los secretos detrás de cada pincelada en esta exposición inmersiva que ha cautivado a millones en todo el mundo.',
      shortDescription: 'Exposición inmersiva 360° de las obras maestras de Van Gogh.',
      image: 'https://picsum.photos/seed/vangogh/800/500',
      gallery: JSON.stringify([
        'https://picsum.photos/seed/vangogh1/800/500',
        'https://picsum.photos/seed/vangogh2/800/500',
      ]),
      price: 15.5,
      currency: 'EUR',
      date: new Date('2026-04-01T10:00:00Z'),
      endDate: new Date('2026-07-31T21:00:00Z'),
      time: '10:00 - 21:00',
      duration: '1h 15min',
      address: 'Ideal Barcelona, C/ del Dr. Trueta 196, Barcelona',
      lat: 41.3879,
      lng: 2.1942,
      cityId: barcelona.id,
      categoryId: inmersivas.id,
      organizerId: admin.id,
      status: 'PUBLISHED',
      featured: true,
      capacity: 200,
      soldCount: 156,
    },
    {
      title: 'Secret Food Tour: Tapas de Madrid',
      slug: 'secret-food-tour-tapas-madrid',
      description: 'Descubre los sabores más auténticos de Madrid en un recorrido gastronómico por los barrios de La Latina y Lavapiés. Visita mercados tradicionales, tabernas centenarias y bares de tapas escondidos mientras un guía local te cuenta la historia detrás de cada bocado. Incluye degustaciones de jamón ibérico, tortilla española, croquetas y mucho más.',
      shortDescription: 'Tour gastronómico por las mejores tapas escondidas de Madrid.',
      image: 'https://picsum.photos/seed/tapas/800/500',
      gallery: JSON.stringify([
        'https://picsum.photos/seed/tapas1/800/500',
        'https://picsum.photos/seed/tapas2/800/500',
      ]),
      price: 69.0,
      originalPrice: 85.0,
      currency: 'EUR',
      date: new Date('2026-04-10T11:00:00Z'),
      endDate: new Date('2026-08-30T14:00:00Z'),
      time: '11:00',
      duration: '3h',
      address: 'Plaza de la Cebada, Madrid',
      lat: 40.4115,
      lng: -3.7096,
      cityId: madrid.id,
      categoryId: gastronomia.id,
      organizerId: admin.id,
      status: 'PUBLISHED',
      featured: false,
      capacity: 15,
      soldCount: 8,
    },
    {
      title: 'The Phantom of the Opera',
      slug: 'phantom-opera-london',
      description: 'Experience the longest-running show in Broadway history now in London\'s West End. Andrew Lloyd Webber\'s masterpiece tells the story of a masked figure who lurks beneath the Paris Opera House, exercising a reign of terror over all who inhabit it. With stunning sets, breathtaking costumes, and the iconic chandelier crash, this is theatre at its most spectacular.',
      shortDescription: 'The legendary musical returns to London\'s West End.',
      image: 'https://picsum.photos/seed/phantom/800/500',
      gallery: JSON.stringify([
        'https://picsum.photos/seed/phantom1/800/500',
        'https://picsum.photos/seed/phantom2/800/500',
      ]),
      price: 45.0,
      originalPrice: 65.0,
      currency: 'GBP',
      date: new Date('2026-04-05T19:30:00Z'),
      endDate: new Date('2026-08-30T22:00:00Z'),
      time: '19:30',
      duration: '2h 30min',
      address: 'Her Majesty\'s Theatre, Haymarket, London',
      lat: 51.5094,
      lng: -0.1313,
      cityId: london.id,
      categoryId: teatro.id,
      organizerId: admin.id,
      status: 'PUBLISHED',
      featured: true,
      capacity: 1200,
      soldCount: 980,
    },
    {
      title: 'Primavera Sound 2026',
      slug: 'primavera-sound-barcelona-2026',
      description: 'El festival de música más importante del Mediterráneo vuelve con un cartel impresionante. Tres días de música en directo con artistas nacionales e internacionales en el Parc del Fòrum de Barcelona. Electrónica, indie, hip-hop, pop y mucho más en un entorno único frente al mar.',
      shortDescription: 'El mayor festival de música de Barcelona junto al mar.',
      image: 'https://picsum.photos/seed/primavera/800/500',
      gallery: JSON.stringify([
        'https://picsum.photos/seed/primavera1/800/500',
        'https://picsum.photos/seed/primavera2/800/500',
        'https://picsum.photos/seed/primavera3/800/500',
      ]),
      price: 195.0,
      originalPrice: 230.0,
      currency: 'EUR',
      date: new Date('2026-06-04T16:00:00Z'),
      endDate: new Date('2026-06-06T05:00:00Z'),
      time: '16:00',
      duration: '3 días',
      address: 'Parc del Fòrum, Barcelona',
      lat: 41.4106,
      lng: 2.2289,
      cityId: barcelona.id,
      categoryId: festivales.id,
      organizerId: admin.id,
      status: 'PUBLISHED',
      featured: true,
      capacity: 50000,
      soldCount: 38000,
    },
    {
      title: 'Broadway Week: Hamilton',
      slug: 'broadway-hamilton-new-york',
      description: 'Don\'t miss your shot! Hamilton, the revolutionary musical by Lin-Manuel Miranda, tells the story of America\'s founding father Alexander Hamilton through hip-hop, jazz, blues, and R&B. This Pulitzer Prize-winning masterpiece continues to captivate audiences with its diverse cast and genre-defying score.',
      shortDescription: 'The revolutionary hip-hop musical about Alexander Hamilton.',
      image: 'https://picsum.photos/seed/hamilton/800/500',
      gallery: JSON.stringify([
        'https://picsum.photos/seed/hamilton1/800/500',
        'https://picsum.photos/seed/hamilton2/800/500',
      ]),
      price: 129.0,
      currency: 'USD',
      date: new Date('2026-04-20T20:00:00Z'),
      endDate: new Date('2026-04-20T22:45:00Z'),
      time: '20:00',
      duration: '2h 45min',
      address: 'Richard Rodgers Theatre, 226 W 46th St, New York',
      lat: 40.7590,
      lng: -73.9845,
      cityId: newYork.id,
      categoryId: teatro.id,
      organizerId: admin.id,
      status: 'PUBLISHED',
      featured: false,
      capacity: 1300,
      soldCount: 1150,
    },
    {
      title: 'Monet: A Luminous Journey',
      slug: 'monet-luminous-journey-paris',
      description: 'Plongez dans l\'univers lumineux de Claude Monet dans cette exposition immersive au cœur de Paris. Des Nymphéas aux Meules de foin, découvrez les chefs-d\'œuvre de l\'impressionnisme projetés sur des surfaces monumentales. Une expérience sensorielle unique accompagnée de musique classique.',
      shortDescription: 'Immersive exhibition of Monet\'s masterpieces in the heart of Paris.',
      image: 'https://picsum.photos/seed/monet/800/500',
      gallery: JSON.stringify([
        'https://picsum.photos/seed/monet1/800/500',
        'https://picsum.photos/seed/monet2/800/500',
      ]),
      price: 18.0,
      currency: 'EUR',
      date: new Date('2026-04-15T09:30:00Z'),
      endDate: new Date('2026-09-15T19:30:00Z'),
      time: '09:30 - 19:30',
      duration: '1h',
      address: 'Atelier des Lumières, 38 Rue Saint-Maur, Paris',
      lat: 48.8612,
      lng: 2.3809,
      cityId: paris.id,
      categoryId: arte.id,
      organizerId: admin.id,
      status: 'PUBLISHED',
      featured: true,
      capacity: 300,
      soldCount: 210,
    },
    {
      title: 'Jazz at Lincoln Center: Wynton Marsalis',
      slug: 'jazz-lincoln-center-wynton-marsalis',
      description: 'An evening of world-class jazz with the legendary Wynton Marsalis and the Jazz at Lincoln Center Orchestra. Enjoy an unforgettable night of swing, bebop, and contemporary jazz in one of New York\'s most prestigious venues with panoramic views of Central Park and Columbus Circle.',
      shortDescription: 'World-class jazz with Wynton Marsalis at Lincoln Center.',
      image: 'https://picsum.photos/seed/jazz/800/500',
      gallery: JSON.stringify([
        'https://picsum.photos/seed/jazz1/800/500',
      ]),
      price: 75.0,
      currency: 'USD',
      date: new Date('2026-05-08T20:00:00Z'),
      endDate: new Date('2026-05-08T22:30:00Z'),
      time: '20:00',
      duration: '2h 30min',
      address: 'Jazz at Lincoln Center, 10 Columbus Circle, New York',
      lat: 40.7688,
      lng: -73.9831,
      cityId: newYork.id,
      categoryId: conciertos.id,
      organizerId: admin.id,
      status: 'PUBLISHED',
      featured: false,
      capacity: 1200,
      soldCount: 670,
    },
    {
      title: 'Flamenco Vivo: Noches de Tablao',
      slug: 'flamenco-vivo-noches-tablao-madrid',
      description: 'Vive la pasión del flamenco en su máxima expresión. Un espectáculo íntimo en un tablao histórico del centro de Madrid con los mejores bailaores, cantaores y guitarristas del panorama actual. Incluye copa de vino o sangría de bienvenida.',
      shortDescription: 'Espectáculo de flamenco íntimo en un tablao histórico de Madrid.',
      image: 'https://picsum.photos/seed/flamenco/800/500',
      gallery: JSON.stringify([
        'https://picsum.photos/seed/flamenco1/800/500',
        'https://picsum.photos/seed/flamenco2/800/500',
      ]),
      price: 35.0,
      currency: 'EUR',
      date: new Date('2026-04-01T20:30:00Z'),
      endDate: new Date('2026-08-31T23:00:00Z'),
      time: '20:30',
      duration: '1h 30min',
      address: 'Corral de la Morería, C/ de la Morería 17, Madrid',
      lat: 40.4131,
      lng: -3.7141,
      cityId: madrid.id,
      categoryId: conciertos.id,
      organizerId: admin.id,
      status: 'PUBLISHED',
      featured: false,
      capacity: 80,
      soldCount: 62,
    },
    {
      title: 'London Street Food Festival',
      slug: 'london-street-food-festival-2026',
      description: 'The UK\'s biggest street food event returns to Brick Lane with over 100 food vendors from around the world. From Japanese ramen to Mexican tacos, Ethiopian injera to classic British pies, there\'s something for every palate. Live music, craft cocktails, and cooking demos throughout the weekend.',
      shortDescription: 'Over 100 food vendors from around the world at Brick Lane.',
      image: 'https://picsum.photos/seed/streetfood/800/500',
      gallery: JSON.stringify([
        'https://picsum.photos/seed/streetfood1/800/500',
        'https://picsum.photos/seed/streetfood2/800/500',
      ]),
      price: 12.0,
      currency: 'GBP',
      date: new Date('2026-06-20T11:00:00Z'),
      endDate: new Date('2026-06-21T22:00:00Z'),
      time: '11:00 - 22:00',
      duration: '2 días',
      address: 'Brick Lane, Shoreditch, London',
      lat: 51.5219,
      lng: -0.0718,
      cityId: london.id,
      categoryId: gastronomia.id,
      organizerId: admin.id,
      status: 'PUBLISHED',
      featured: false,
      capacity: 10000,
      soldCount: 4500,
    },
    {
      title: 'Banksy: Genius or Vandal?',
      slug: 'banksy-genius-vandal-new-york',
      description: 'The most comprehensive unauthorized exhibition of Banksy\'s works arrives in New York. Featuring over 80 original pieces including prints, sculptures, and installations, this exhibition explores the mysterious street artist\'s impact on contemporary art and culture. Discover iconic works alongside rare pieces from private collections.',
      shortDescription: 'The most comprehensive Banksy exhibition with 80+ original works.',
      image: 'https://picsum.photos/seed/banksy/800/500',
      gallery: JSON.stringify([
        'https://picsum.photos/seed/banksy1/800/500',
        'https://picsum.photos/seed/banksy2/800/500',
        'https://picsum.photos/seed/banksy3/800/500',
      ]),
      price: 30.0,
      originalPrice: 40.0,
      currency: 'USD',
      date: new Date('2026-05-01T10:00:00Z'),
      endDate: new Date('2026-08-31T20:00:00Z'),
      time: '10:00 - 20:00',
      duration: '1h 30min',
      address: 'Exhibition Hub, 526 6th Ave, New York',
      lat: 40.7425,
      lng: -73.9930,
      cityId: newYork.id,
      categoryId: arte.id,
      organizerId: admin.id,
      status: 'PUBLISHED',
      featured: true,
      capacity: 250,
      soldCount: 180,
    },
    {
      title: 'Paris Wine & Cheese Experience',
      slug: 'paris-wine-cheese-experience',
      description: 'Embark on a guided tasting journey through France\'s finest wines and artisan cheeses in a charming cave à vin in the Marais district. Learn to pair Bordeaux, Burgundy, and Champagne with a curated selection of AOC cheeses from expert sommeliers. An intimate experience limited to 12 guests.',
      shortDescription: 'Guided wine and cheese pairing in a charming Parisian cave.',
      image: 'https://picsum.photos/seed/winecheese/800/500',
      gallery: JSON.stringify([
        'https://picsum.photos/seed/winecheese1/800/500',
      ]),
      price: 89.0,
      currency: 'EUR',
      date: new Date('2026-04-05T18:00:00Z'),
      endDate: new Date('2026-08-30T20:30:00Z'),
      time: '18:00',
      duration: '2h 30min',
      address: 'Cave des Abbesses, 43 Rue des Abbesses, Paris',
      lat: 48.8843,
      lng: 2.3384,
      cityId: paris.id,
      categoryId: gastronomia.id,
      organizerId: admin.id,
      status: 'PUBLISHED',
      featured: false,
      capacity: 12,
      soldCount: 9,
    },
    {
      title: 'Teamlab Borderless: Digital Art Museum',
      slug: 'teamlab-borderless-london',
      description: 'TeamLab Borderless brings its world-renowned digital art museum to London. Wander through a labyrinth of immersive, interactive digital artworks that move, respond to your presence, and blend into one another without boundaries. A transcendent experience where art leaves the frame and becomes part of your world.',
      shortDescription: 'TeamLab\'s boundary-breaking digital art museum comes to London.',
      image: 'https://picsum.photos/seed/teamlab/800/500',
      gallery: JSON.stringify([
        'https://picsum.photos/seed/teamlab1/800/500',
        'https://picsum.photos/seed/teamlab2/800/500',
        'https://picsum.photos/seed/teamlab3/800/500',
      ]),
      price: 25.0,
      currency: 'GBP',
      date: new Date('2026-04-20T10:00:00Z'),
      endDate: new Date('2026-10-31T20:00:00Z'),
      time: '10:00 - 20:00',
      duration: '1h 30min',
      address: 'The Boiler House, 152 Brick Lane, London',
      lat: 51.5237,
      lng: -0.0715,
      cityId: london.id,
      categoryId: inmersivas.id,
      organizerId: admin.id,
      status: 'PUBLISHED',
      featured: true,
      capacity: 400,
      soldCount: 320,
    },
    {
      title: 'Rosalía: Motomami World Tour',
      slug: 'rosalia-motomami-barcelona',
      description: 'Rosalía llega a Barcelona con su aclamada gira Motomami. Un espectáculo que fusiona flamenco, reggaetón, electrónica y pop en un show visualmente deslumbrante. Con una puesta en escena vanguardista y coreografías impactantes, esta es la artista española más internacional del momento.',
      shortDescription: 'Rosalía presenta su gira Motomami en Barcelona.',
      image: 'https://picsum.photos/seed/rosalia/800/500',
      gallery: JSON.stringify([
        'https://picsum.photos/seed/rosalia1/800/500',
        'https://picsum.photos/seed/rosalia2/800/500',
      ]),
      price: 65.0,
      currency: 'EUR',
      date: new Date('2026-07-12T21:30:00Z'),
      endDate: new Date('2026-07-12T23:30:00Z'),
      time: '21:30',
      duration: '2h',
      address: 'Palau Sant Jordi, Passeig Olímpic, Barcelona',
      lat: 41.3642,
      lng: 2.1527,
      cityId: barcelona.id,
      categoryId: conciertos.id,
      organizerId: admin.id,
      status: 'PUBLISHED',
      featured: false,
      capacity: 17000,
      soldCount: 12400,
    },
    {
      title: 'Moulin Rouge! The Musical',
      slug: 'moulin-rouge-musical-paris',
      description: 'Le spectacle musical inspiré du film culte de Baz Luhrmann arrive enfin à Paris. Vivez une explosion de glamour, de romance et de chansons inoubliables dans un décor somptueux. Avec un medley de tubes pop remixés de manière spectaculaire, ce show est une fête pour les sens.',
      shortDescription: 'The spectacular Baz Luhrmann musical arrives in Paris.',
      image: 'https://picsum.photos/seed/moulinrouge/800/500',
      gallery: JSON.stringify([
        'https://picsum.photos/seed/moulinrouge1/800/500',
        'https://picsum.photos/seed/moulinrouge2/800/500',
      ]),
      price: 55.0,
      originalPrice: 75.0,
      currency: 'EUR',
      date: new Date('2026-05-20T20:00:00Z'),
      endDate: new Date('2026-08-20T22:30:00Z'),
      time: '20:00',
      duration: '2h 30min',
      address: 'Théâtre Mogador, 25 Rue de Mogador, Paris',
      lat: 48.8753,
      lng: 2.3326,
      cityId: paris.id,
      categoryId: teatro.id,
      organizerId: admin.id,
      status: 'PUBLISHED',
      featured: false,
      capacity: 1600,
      soldCount: 1100,
    },
    {
      title: 'Summer Rooftop Festival Madrid',
      slug: 'summer-rooftop-festival-madrid',
      description: 'El festival de azoteas más exclusivo de Madrid. Tres días de música electrónica y DJ sets en las terrazas más emblemáticas de la ciudad, con vistas panorámicas al skyline madrileño. Incluye acceso a piscina, zona chill-out y food trucks gourmet.',
      shortDescription: 'Festival de música electrónica en las mejores azoteas de Madrid.',
      image: 'https://picsum.photos/seed/rooftop/800/500',
      gallery: JSON.stringify([
        'https://picsum.photos/seed/rooftop1/800/500',
        'https://picsum.photos/seed/rooftop2/800/500',
      ]),
      price: 45.0,
      currency: 'EUR',
      date: new Date('2026-07-24T18:00:00Z'),
      endDate: new Date('2026-07-26T03:00:00Z'),
      time: '18:00',
      duration: '3 días',
      address: 'Azotea del Círculo de Bellas Artes, C/ de Alcalá 42, Madrid',
      lat: 40.4189,
      lng: -3.6960,
      cityId: madrid.id,
      categoryId: festivales.id,
      organizerId: admin.id,
      status: 'PUBLISHED',
      featured: false,
      capacity: 500,
      soldCount: 310,
    },
    {
      title: 'Draft Event: Comedy Night (Unpublished)',
      slug: 'draft-comedy-night-madrid',
      description: 'A comedy night event that is still in draft mode.',
      shortDescription: 'Draft comedy event.',
      image: 'https://picsum.photos/seed/comedy/800/500',
      gallery: '[]',
      price: 20.0,
      currency: 'EUR',
      date: new Date('2026-08-15T21:00:00Z'),
      time: '21:00',
      duration: '2h',
      address: 'Teatro Lara, Madrid',
      lat: 40.4223,
      lng: -3.7075,
      cityId: madrid.id,
      categoryId: teatro.id,
      organizerId: admin.id,
      status: 'DRAFT',
      featured: false,
      capacity: 300,
      soldCount: 0,
    },
  ];

  for (const event of events) {
    await prisma.event.create({ data: event });
  }

  console.log(`${events.length} events created`);

  // Add some favorites for the regular user
  const publishedEvents = await prisma.event.findMany({
    where: { status: 'PUBLISHED' },
    take: 4,
  });

  for (const event of publishedEvents) {
    await prisma.favorite.create({
      data: {
        userId: user.id,
        eventId: event.id,
      },
    });
  }

  console.log('Favorites created');
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
