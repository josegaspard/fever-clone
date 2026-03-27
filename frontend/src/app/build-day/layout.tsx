import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Arma tu Day Perfecto | Fever',
  description: 'Crea tu día perfecto con eventos, experiencias, conciertos, gastronomía y más. Elige tu grupo, presupuesto y preferencias para generar rutas personalizadas.',
};

export default function BuildDayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
