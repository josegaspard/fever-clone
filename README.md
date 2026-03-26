# Fever Clone

Clon de [feverup.com](https://feverup.com) - Plataforma de descubrimiento y venta de entradas para eventos.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Prisma + SQLite
- **Auth**: JWT (bcryptjs + jsonwebtoken)

## Setup

### Backend
```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
npm run dev
```
Runs on http://localhost:4000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:3000

### Credenciales de prueba
- **Admin**: admin@fever.com / admin123
- **Usuario**: user@fever.com / user123

## Features

- Listado de eventos con carruseles por categoría
- Búsqueda y filtros (ciudad, categoría, precio, fecha)
- Detalle de evento con info completa
- Sistema de favoritos
- Auth (registro/login)
- Panel admin: crear, editar, eliminar, gestionar estado de eventos (borrador/publicado/archivado)
- Diseño dark theme inspirado en Fever
- Responsive (mobile-first)
