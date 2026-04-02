/**
 * Migration & Seed script for Fever Clone
 * Runs against Supabase using the JS client for data operations
 * and tests table existence
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcryptjs from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://sywvdaaldijpzhedbopr.supabase.co';
const SUPABASE_KEY = readFileSync(join(__dirname, '.env.local'), 'utf-8')
  .split('\n')
  .find(l => l.startsWith('SUPABASE_SERVICE_KEY='))
  ?.split('=')
  .slice(1)
  .join('=')
  .trim();

if (!SUPABASE_KEY) {
  console.error('Could not read SUPABASE_SERVICE_KEY from .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Utility to log with colors
const log = (msg) => console.log(`\x1b[32m✓\x1b[0m ${msg}`);
const warn = (msg) => console.log(`\x1b[33m⚠\x1b[0m ${msg}`);
const err = (msg) => console.log(`\x1b[31m✗\x1b[0m ${msg}`);
const info = (msg) => console.log(`\x1b[36mℹ\x1b[0m ${msg}`);

async function tableExists(name) {
  const { data, error } = await supabase.from(name).select('id').limit(1);
  return !error;
}

async function run() {
  console.log('\n\x1b[1m🔥 Fever Clone - Migration & Seed\x1b[0m\n');

  // ── Step 1: Test connection ───────────────────────────────────────
  info('Testing Supabase connection...');
  const { data: testData, error: testError } = await supabase.from('users').select('id').limit(1);
  if (testError) {
    err(`Connection failed: ${testError.message}`);
    process.exit(1);
  }
  log('Supabase connection OK');

  // ── Step 2: Check which tables exist ──────────────────────────────
  info('Checking table existence...');
  const tables = ['users', 'cities', 'categories', 'events', 'favorites', 'plans', 'plan_items', 'plan_invitations', 'tickets', 'reviews', 'refund_policies'];
  const tableStatus = {};
  for (const t of tables) {
    tableStatus[t] = await tableExists(t);
    if (tableStatus[t]) log(`Table "${t}" exists`);
    else warn(`Table "${t}" does NOT exist`);
  }

  const missingTables = tables.filter(t => !tableStatus[t]);
  if (missingTables.length > 0) {
    console.log('\n\x1b[1m\x1b[33m⚠ Missing tables detected!\x1b[0m');
    console.log('The following tables need to be created via the Supabase SQL Editor:');
    console.log(missingTables.map(t => `  - ${t}`).join('\n'));
    console.log('\n\x1b[1mPlease run the contents of supabase-migration.sql in your Supabase dashboard:\x1b[0m');
    console.log('  1. Go to https://supabase.com/dashboard/project/sywvdaaldijpzhedbopr/sql/new');
    console.log('  2. Paste the contents of supabase-migration.sql');
    console.log('  3. Click "Run"');
    console.log('  4. Then re-run this script\n');

    // Try to check if user columns exist
    const { data: userCols } = await supabase.from('users').select('id, user_type').limit(1);
    if (userCols === null) {
      warn('Column "user_type" may not exist on users table. Migration SQL is needed.');
    }

    if (missingTables.includes('plans') || missingTables.includes('tickets') || missingTables.includes('reviews')) {
      console.log('Continuing with seed data for existing tables...\n');
    }
  }

  // ── Step 3: Check if user columns exist ───────────────────────────
  info('Checking user_type column...');
  const { data: userTest, error: userColErr } = await supabase.from('users').select('id, user_type').limit(1);
  if (userColErr && userColErr.message.includes('user_type')) {
    warn('Column "user_type" does not exist. Run migration SQL first.');
  } else {
    log('User columns OK');
  }

  // ── Step 4: Seed Cities ───────────────────────────────────────────
  info('Seeding cities...');
  const cities = [
    { name: 'Madrid', slug: 'madrid', country: 'España', image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=500&fit=crop' },
    { name: 'Barcelona', slug: 'barcelona', country: 'España', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=500&fit=crop' },
    { name: 'New York', slug: 'new-york', country: 'USA', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=500&fit=crop' },
    { name: 'London', slug: 'london', country: 'UK', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=500&fit=crop' },
    { name: 'Paris', slug: 'paris', country: 'France', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=500&fit=crop' },
    { name: 'Ciudad de Mexico', slug: 'cdmx', country: 'Mexico', image: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800&h=500&fit=crop' },
  ];

  for (const city of cities) {
    const { error } = await supabase.from('cities').upsert(city, { onConflict: 'slug' });
    if (error) warn(`City ${city.name}: ${error.message}`);
    else log(`City: ${city.name}`);
  }

  // ── Step 5: Seed Categories ───────────────────────────────────────
  info('Seeding categories...');
  const categories = [
    { name: 'Conciertos', slug: 'conciertos', icon: '🎵', color: '#e63946' },
    { name: 'Arte y Museos', slug: 'arte', icon: '🎨', color: '#457b9d' },
    { name: 'Gastronomia', slug: 'gastronomia', icon: '🍽️', color: '#e9c46a' },
    { name: 'Teatro', slug: 'teatro', icon: '🎭', color: '#9b59b6' },
    { name: 'Festivales', slug: 'festivales', icon: '🎪', color: '#2ecc71' },
    { name: 'Experiencias Inmersivas', slug: 'experiencias-inmersivas', icon: '🌀', color: '#00b4d8' },
    { name: 'Deportes', slug: 'deportes', icon: '⚽', color: '#f4a261' },
    { name: 'Bienestar', slug: 'bienestar', icon: '🧘', color: '#06d6a0' },
    { name: 'Tours', slug: 'tours', icon: '🗺️', color: '#118ab2' },
    { name: 'Vida Nocturna', slug: 'vida-nocturna', icon: '🌙', color: '#7209b7' },
  ];

  for (const cat of categories) {
    const { error } = await supabase.from('categories').upsert(cat, { onConflict: 'slug' });
    if (error) warn(`Category ${cat.name}: ${error.message}`);
    else log(`Category: ${cat.name}`);
  }

  // ── Step 6: Get city/category IDs ─────────────────────────────────
  const { data: cityData } = await supabase.from('cities').select('id, slug');
  const { data: catData } = await supabase.from('categories').select('id, slug');
  const cityMap = Object.fromEntries((cityData || []).map(c => [c.slug, c.id]));
  const catMap = Object.fromEntries((catData || []).map(c => [c.slug, c.id]));

  // ── Step 7: Ensure admin user exists ──────────────────────────────
  info('Checking admin user...');
  const { data: adminUser } = await supabase.from('users').select('id').eq('email', 'admin@fever.com').single();
  let adminId;
  if (adminUser) {
    adminId = adminUser.id;
    log('Admin user exists');
    // Try to update user_type
    await supabase.from('users').update({ user_type: 'SUPERADMIN', onboarding_completed: true }).eq('id', adminId);
  } else {
    const hashedPw = await bcryptjs.hash('admin123', 10);
    const { data: newAdmin, error: adminErr } = await supabase.from('users').insert({
      name: 'Admin',
      email: 'admin@fever.com',
      password: hashedPw,
      role: 'admin',
      user_type: 'SUPERADMIN',
      onboarding_completed: true,
    }).select('id').single();
    if (adminErr) warn(`Admin create: ${adminErr.message}`);
    else { adminId = newAdmin.id; log('Admin user created'); }
  }

  // Ensure regular user
  const { data: regUser } = await supabase.from('users').select('id').eq('email', 'user@fever.com').single();
  let userId;
  if (regUser) {
    userId = regUser.id;
    await supabase.from('users').update({ user_type: 'USER', onboarding_completed: true }).eq('id', userId);
    log('Regular user exists');
  } else {
    const hashedPw = await bcryptjs.hash('user123', 10);
    const { data: newUser, error: userErr } = await supabase.from('users').insert({
      name: 'Usuario Demo',
      email: 'user@fever.com',
      password: hashedPw,
      role: 'user',
      user_type: 'USER',
      onboarding_completed: true,
    }).select('id').single();
    if (userErr) warn(`User create: ${userErr.message}`);
    else { userId = newUser.id; log('Regular user created'); }
  }

  // Ensure business user
  const { data: bizUser } = await supabase.from('users').select('id').eq('email', 'business@fever.com').single();
  if (bizUser) {
    await supabase.from('users').update({ user_type: 'BUSINESS', onboarding_completed: true, company_name: 'EventosPro CDMX' }).eq('id', bizUser.id);
    log('Business user exists');
  } else {
    const hashedPw = await bcryptjs.hash('business123', 10);
    const { error: bizErr } = await supabase.from('users').insert({
      name: 'Empresa Demo',
      email: 'business@fever.com',
      password: hashedPw,
      role: 'user',
      user_type: 'BUSINESS',
      onboarding_completed: true,
      company_name: 'EventosPro CDMX',
      company_description: 'La mejor productora de eventos en Ciudad de Mexico',
    }).select('id').single();
    if (bizErr) warn(`Business create: ${bizErr.message}`);
    else log('Business user created');
  }

  const organizerId = adminId || 1;

  // ── Step 8: Seed Events ───────────────────────────────────────────
  info('Seeding events with real images and videos...');

  const events = [
    // Madrid
    { title: 'Flamenco Vivo Madrid', slug: 'flamenco-vivo-madrid', description: 'Espectáculo de flamenco auténtico en el corazón de Madrid con los mejores bailaores.', short_description: 'Flamenco auténtico en Madrid', image: 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=800&h=500&fit=crop', video_url: 'https://cdn.pixabay.com/video/2024/03/06/203069-920024913_large.mp4', price: 35, original_price: 45, currency: 'EUR', date: '2026-05-15T20:00:00Z', time: '20:00', duration: '90 min', address: 'Corral de la Morería, Madrid', lat: 40.4133, lng: -3.7126, city_id: cityMap['madrid'], category_id: catMap['conciertos'], status: 'PUBLISHED', featured: true, capacity: 200, sold_count: 142, rating: 4.8, review_count: 89, gallery: JSON.stringify(['https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop']) },
    { title: 'Tour Gastronómico Mercado San Miguel', slug: 'tour-gastronomico-san-miguel', description: 'Descubre los sabores de España en el icónico Mercado de San Miguel. Tapas, vinos y más.', short_description: 'Tour gastronómico por el mercado más famoso de Madrid', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=500&fit=crop', video_url: 'https://cdn.pixabay.com/video/2021/10/11/91490-632340698_large.mp4', price: 69, currency: 'EUR', date: '2026-05-20T11:00:00Z', time: '11:00', duration: '3 horas', address: 'Mercado de San Miguel, Madrid', lat: 40.4153, lng: -3.7090, city_id: cityMap['madrid'], category_id: catMap['gastronomia'], status: 'PUBLISHED', featured: true, capacity: 15, sold_count: 11, rating: 4.9, review_count: 156, gallery: JSON.stringify(['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=400&fit=crop']) },
    { title: 'Museo del Prado: Visita Guiada', slug: 'museo-prado-visita-guiada', description: 'Explora las obras maestras del Museo del Prado con un guía experto en arte.', short_description: 'Visita guiada al Prado', image: 'https://images.unsplash.com/photo-1536924940564-47aca29d4e01?w=800&h=500&fit=crop', price: 25, original_price: 35, currency: 'EUR', date: '2026-06-01T10:00:00Z', time: '10:00', duration: '2 horas', address: 'Museo del Prado, Madrid', lat: 40.4138, lng: -3.6921, city_id: cityMap['madrid'], category_id: catMap['arte'], status: 'PUBLISHED', featured: false, capacity: 25, sold_count: 20, rating: 4.7, review_count: 203, gallery: JSON.stringify(['https://images.unsplash.com/photo-1536924940564-47aca29d4e01?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop']) },
    // Barcelona
    { title: 'Primavera Sound Festival', slug: 'primavera-sound-festival', description: 'El festival de música más importante de Barcelona con artistas internacionales.', short_description: 'Festival de música en Barcelona', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=500&fit=crop', video_url: 'https://cdn.pixabay.com/video/2023/06/14/167495-836082586_large.mp4', price: 195, original_price: 250, currency: 'EUR', date: '2026-06-05T16:00:00Z', time: '16:00', duration: '3 días', address: 'Parc del Fòrum, Barcelona', lat: 41.4103, lng: 2.2280, city_id: cityMap['barcelona'], category_id: catMap['festivales'], status: 'PUBLISHED', featured: true, capacity: 50000, sold_count: 38000, rating: 4.6, review_count: 1250, gallery: JSON.stringify(['https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop']) },
    { title: 'Sagrada Familia: Experiencia Inmersiva', slug: 'sagrada-familia-inmersiva', description: 'Vive la Sagrada Familia como nunca antes con proyecciones y realidad aumentada.', short_description: 'Experiencia inmersiva en la Sagrada Familia', image: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800&h=500&fit=crop', price: 45, currency: 'EUR', date: '2026-05-25T09:00:00Z', time: '09:00', duration: '2 horas', address: 'Sagrada Familia, Barcelona', lat: 41.4036, lng: 2.1744, city_id: cityMap['barcelona'], category_id: catMap['experiencias-inmersivas'], status: 'PUBLISHED', featured: true, capacity: 100, sold_count: 87, rating: 4.9, review_count: 342, gallery: JSON.stringify(['https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1564429238961-bf8f8d7e91c0?w=600&h=400&fit=crop']) },
    { title: 'Taller de Paella Valenciana', slug: 'taller-paella-valenciana', description: 'Aprende a cocinar la auténtica paella valenciana con un chef profesional.', short_description: 'Clase de cocina de paella', image: 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&h=500&fit=crop', price: 75, currency: 'EUR', date: '2026-06-10T12:00:00Z', time: '12:00', duration: '3 horas', address: 'La Boqueria, Barcelona', lat: 41.3816, lng: 2.1719, city_id: cityMap['barcelona'], category_id: catMap['gastronomia'], status: 'PUBLISHED', featured: false, capacity: 12, sold_count: 9, rating: 4.8, review_count: 67, gallery: JSON.stringify(['https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop']) },
    // New York
    { title: 'Hamilton on Broadway', slug: 'hamilton-broadway', description: 'El musical que cambió Broadway. Vive la historia de Alexander Hamilton.', short_description: 'Musical Hamilton en Broadway', image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=500&fit=crop', video_url: 'https://cdn.pixabay.com/video/2020/05/16/38613-422400327_large.mp4', price: 129, original_price: 180, currency: 'USD', date: '2026-06-15T19:30:00Z', time: '19:30', duration: '2h 45min', address: 'Richard Rodgers Theatre, NYC', lat: 40.7590, lng: -73.9845, city_id: cityMap['new-york'], category_id: catMap['teatro'], status: 'PUBLISHED', featured: true, capacity: 1319, sold_count: 1100, rating: 4.9, review_count: 2100, gallery: JSON.stringify(['https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&h=400&fit=crop']) },
    { title: 'Jazz at Lincoln Center', slug: 'jazz-lincoln-center', description: 'Una noche mágica de jazz en el corazón de Manhattan con artistas de clase mundial.', short_description: 'Jazz en vivo en Manhattan', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop', video_url: 'https://cdn.pixabay.com/video/2020/07/30/45748-445655646_large.mp4', price: 75, currency: 'USD', date: '2026-06-20T21:00:00Z', time: '21:00', duration: '2 horas', address: 'Lincoln Center, NYC', lat: 40.7725, lng: -73.9835, city_id: cityMap['new-york'], category_id: catMap['conciertos'], status: 'PUBLISHED', featured: false, capacity: 500, sold_count: 380, rating: 4.7, review_count: 450, gallery: JSON.stringify(['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=400&fit=crop']) },
    { title: 'Brooklyn Food Tour', slug: 'brooklyn-food-tour', description: 'Explora los sabores de Brooklyn: pizza, bagels, tacos y craft beer.', short_description: 'Tour gastronómico por Brooklyn', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=500&fit=crop', price: 89, currency: 'USD', date: '2026-06-25T10:00:00Z', time: '10:00', duration: '4 horas', address: 'Williamsburg, Brooklyn', lat: 40.7081, lng: -73.9571, city_id: cityMap['new-york'], category_id: catMap['gastronomia'], status: 'PUBLISHED', featured: false, capacity: 20, sold_count: 16, rating: 4.8, review_count: 230, gallery: JSON.stringify(['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=400&fit=crop']) },
    // London
    { title: 'The Phantom of the Opera', slug: 'phantom-of-the-opera', description: 'El clásico musical de Andrew Lloyd Webber en el West End londinense.', short_description: 'Musical Phantom en el West End', image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=500&fit=crop', price: 45, original_price: 65, currency: 'GBP', date: '2026-07-01T19:30:00Z', time: '19:30', duration: '2h 30min', address: "Her Majesty's Theatre, London", lat: 51.5094, lng: -0.1319, city_id: cityMap['london'], category_id: catMap['teatro'], status: 'PUBLISHED', featured: true, capacity: 1200, sold_count: 950, rating: 4.9, review_count: 1800, gallery: JSON.stringify(['https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=400&fit=crop']) },
    { title: 'TeamLab Borderless London', slug: 'teamlab-borderless-london', description: 'Arte digital inmersivo del colectivo japonés teamLab. Una experiencia sin fronteras.', short_description: 'Arte digital inmersivo', image: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800&h=500&fit=crop', video_url: 'https://cdn.pixabay.com/video/2019/06/23/24781-344520209_large.mp4', price: 25, currency: 'GBP', date: '2026-07-10T10:00:00Z', time: '10:00', duration: '2 horas', address: 'Tate Modern, London', lat: 51.5076, lng: -0.0994, city_id: cityMap['london'], category_id: catMap['experiencias-inmersivas'], status: 'PUBLISHED', featured: true, capacity: 300, sold_count: 250, rating: 4.8, review_count: 520, gallery: JSON.stringify(['https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop']) },
    { title: 'Borough Market Food Tour', slug: 'borough-market-food-tour', description: 'Recorre el mercado más antiguo de Londres probando los mejores productos artesanales.', short_description: 'Tour gastronómico en Borough Market', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=500&fit=crop', price: 55, currency: 'GBP', date: '2026-07-15T11:00:00Z', time: '11:00', duration: '3 horas', address: 'Borough Market, London', lat: 51.5055, lng: -0.0910, city_id: cityMap['london'], category_id: catMap['gastronomia'], status: 'PUBLISHED', featured: false, capacity: 18, sold_count: 14, rating: 4.7, review_count: 180, gallery: JSON.stringify(['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop']) },
    // Paris
    { title: 'Moulin Rouge Cabaret', slug: 'moulin-rouge-cabaret', description: 'El cabaret más famoso del mundo. Una noche de glamour, danza y champagne en París.', short_description: 'Cabaret en el Moulin Rouge', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=500&fit=crop', video_url: 'https://cdn.pixabay.com/video/2024/03/06/203069-920024913_large.mp4', price: 120, original_price: 150, currency: 'EUR', date: '2026-07-20T21:00:00Z', time: '21:00', duration: '2h 30min', address: 'Moulin Rouge, Montmartre, Paris', lat: 48.8841, lng: 2.3322, city_id: cityMap['paris'], category_id: catMap['vida-nocturna'], status: 'PUBLISHED', featured: true, capacity: 850, sold_count: 720, rating: 4.7, review_count: 3200, gallery: JSON.stringify(['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop']) },
    { title: 'Louvre Nocturne: Visita Exclusiva', slug: 'louvre-nocturne', description: 'Visita el Louvre de noche con acceso exclusivo y guía experto. Mona Lisa sin multitudes.', short_description: 'Visita nocturna al Louvre', image: 'https://images.unsplash.com/photo-1499426600726-7f5b4619cca5?w=800&h=500&fit=crop', price: 55, currency: 'EUR', date: '2026-07-25T20:00:00Z', time: '20:00', duration: '2 horas', address: 'Musée du Louvre, Paris', lat: 48.8606, lng: 2.3376, city_id: cityMap['paris'], category_id: catMap['arte'], status: 'PUBLISHED', featured: true, capacity: 50, sold_count: 45, rating: 4.9, review_count: 890, gallery: JSON.stringify(['https://images.unsplash.com/photo-1499426600726-7f5b4619cca5?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1536924940564-47aca29d4e01?w=600&h=400&fit=crop']) },
    // CDMX
    { title: 'Lucha Libre en Arena Mexico', slug: 'lucha-libre-arena-mexico', description: 'Vive la emoción de la Lucha Libre mexicana en la catedral del pancracio.', short_description: 'Lucha Libre en CDMX', image: 'https://images.unsplash.com/photo-1461896836934-bd45ba8b2cda?w=800&h=500&fit=crop', video_url: 'https://cdn.pixabay.com/video/2020/07/30/45748-445655646_large.mp4', price: 350, original_price: 500, currency: 'MXN', date: '2026-08-01T19:00:00Z', time: '19:00', duration: '3 horas', address: 'Arena Mexico, CDMX', lat: 19.4260, lng: -99.1531, city_id: cityMap['cdmx'], category_id: catMap['deportes'], status: 'PUBLISHED', featured: true, capacity: 16500, sold_count: 12000, rating: 4.6, review_count: 890, gallery: JSON.stringify(['https://images.unsplash.com/photo-1461896836934-bd45ba8b2cda?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop']) },
    { title: 'Frida Kahlo: Experiencia Inmersiva', slug: 'frida-kahlo-inmersiva', description: 'Sumérgete en el universo de Frida Kahlo con proyecciones a 360° y realidad virtual.', short_description: 'Experiencia inmersiva de Frida Kahlo', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=500&fit=crop', price: 450, original_price: 550, currency: 'MXN', date: '2026-08-10T10:00:00Z', time: '10:00', duration: '90 min', address: 'Frontón México, CDMX', lat: 19.4350, lng: -99.1526, city_id: cityMap['cdmx'], category_id: catMap['experiencias-inmersivas'], status: 'PUBLISHED', featured: true, capacity: 500, sold_count: 420, rating: 4.7, review_count: 650, gallery: JSON.stringify(['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=600&h=400&fit=crop']) },
    { title: 'Tour de Tacos y Mezcal', slug: 'tour-tacos-mezcal-cdmx', description: 'Descubre los mejores tacos y mezcales de la CDMX en este tour gastronómico nocturno.', short_description: 'Tour de tacos y mezcal en CDMX', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&h=500&fit=crop', price: 650, currency: 'MXN', date: '2026-08-15T18:00:00Z', time: '18:00', duration: '4 horas', address: 'Roma Norte, CDMX', lat: 19.4195, lng: -99.1618, city_id: cityMap['cdmx'], category_id: catMap['gastronomia'], status: 'PUBLISHED', featured: false, capacity: 16, sold_count: 13, rating: 4.9, review_count: 340, gallery: JSON.stringify(['https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop']) },
    { title: 'Yoga al Amanecer en Teotihuacán', slug: 'yoga-amanecer-teotihuacan', description: 'Sesión de yoga al amanecer frente a las pirámides de Teotihuacán.', short_description: 'Yoga en Teotihuacán', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=500&fit=crop', video_url: 'https://cdn.pixabay.com/video/2019/08/12/26253-354285455_large.mp4', price: 0, currency: 'MXN', date: '2026-08-20T05:30:00Z', time: '05:30', duration: '2 horas', address: 'Teotihuacán, Estado de México', lat: 19.6925, lng: -98.8438, city_id: cityMap['cdmx'], category_id: catMap['bienestar'], status: 'PUBLISHED', featured: false, capacity: 50, sold_count: 38, rating: 4.9, review_count: 120, gallery: JSON.stringify(['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop']) },
    { title: 'Trajineras de Xochimilco', slug: 'trajineras-xochimilco', description: 'Navega por los canales de Xochimilco en coloridas trajineras con música y comida.', short_description: 'Paseo en trajinera por Xochimilco', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=500&fit=crop', video_url: 'https://cdn.pixabay.com/video/2021/01/03/60976-498063967_large.mp4', price: 300, currency: 'MXN', date: '2026-09-01T11:00:00Z', time: '11:00', duration: '5 horas', address: 'Embarcadero Nuevo Nativitas, Xochimilco', lat: 19.2726, lng: -99.1024, city_id: cityMap['cdmx'], category_id: catMap['tours'], status: 'PUBLISHED', featured: true, capacity: 25, sold_count: 20, rating: 4.5, review_count: 560, gallery: JSON.stringify(['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=400&fit=crop','https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=600&h=400&fit=crop']) },
  ];

  let insertedCount = 0;
  for (const event of events) {
    event.organizer_id = organizerId;
    // Try upsert by slug
    const { error } = await supabase.from('events').upsert(event, { onConflict: 'slug' });
    if (error) {
      warn(`Event "${event.title}": ${error.message}`);
    } else {
      insertedCount++;
    }
  }
  log(`Seeded ${insertedCount}/${events.length} events`);

  // ── Done ──────────────────────────────────────────────────────────
  console.log('\n\x1b[1m\x1b[32m✅ Migration & Seed complete!\x1b[0m\n');

  if (missingTables.length > 0) {
    console.log('\x1b[33m⚠ Remember to run supabase-migration.sql in Supabase SQL Editor for DDL operations (CREATE TABLE, etc.)\x1b[0m');
    console.log(`  URL: https://supabase.com/dashboard/project/sywvdaaldijpzhedbopr/sql/new\n`);
  }
}

run().catch(e => {
  err(`Fatal: ${e.message}`);
  process.exit(1);
});
