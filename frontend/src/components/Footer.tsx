import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#111] border-t border-[#2a2a2a] mt-16" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-2xl font-extrabold text-[#e63946]" aria-label="Fever - Ir al inicio">
              FEVER
            </Link>
            <p className="mt-3 text-sm text-gray-400">
              Descubre las mejores experiencias y eventos en tu ciudad.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-3 mt-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-8 h-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex items-center justify-center text-gray-500 hover:text-[#e63946] hover:border-[#e63946]/30 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" className="w-8 h-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex items-center justify-center text-gray-500 hover:text-[#e63946] hover:border-[#e63946]/30 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-8 h-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex items-center justify-center text-gray-500 hover:text-[#e63946] hover:border-[#e63946]/30 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-8 h-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex items-center justify-center text-gray-500 hover:text-[#e63946] hover:border-[#e63946]/30 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
            </div>
          </div>

          {/* Explore links */}
          <nav aria-label="Explorar">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Explorar</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/search" className="hover:text-white transition">Todos los eventos</Link></li>
              <li><Link href="/search?category=conciertos" className="hover:text-white transition">Conciertos</Link></li>
              <li><Link href="/search?category=teatro" className="hover:text-white transition">Teatro</Link></li>
              <li><Link href="/search?category=gastronomia" className="hover:text-white transition">Gastronomía</Link></li>
              <li><Link href="/search?category=arte" className="hover:text-white transition">Arte</Link></li>
              <li><Link href="/search?maxPrice=0" className="hover:text-white transition">Eventos gratis</Link></li>
            </ul>
          </nav>

          {/* Cities */}
          <nav aria-label="Ciudades">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Ciudades</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/search?city=cdmx" className="hover:text-white transition">Ciudad de México</Link></li>
              <li><Link href="/search?city=madrid" className="hover:text-white transition">Madrid</Link></li>
              <li><Link href="/search?city=barcelona" className="hover:text-white transition">Barcelona</Link></li>
              <li><Link href="/search?city=new-york" className="hover:text-white transition">New York</Link></li>
              <li><Link href="/search?city=london" className="hover:text-white transition">London</Link></li>
              <li><Link href="/search?city=paris" className="hover:text-white transition">Paris</Link></li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Empresa">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Empresa</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/search" className="hover:text-white transition">Sobre nosotros</Link></li>
              <li><Link href="/search" className="hover:text-white transition">Trabaja con nosotros</Link></li>
              <li><Link href="/search" className="hover:text-white transition">Prensa</Link></li>
              <li><Link href="/auth/register" className="hover:text-white transition">Crear cuenta</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition">Iniciar sesión</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-[#2a2a2a] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Fever. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <Link href="/search" className="hover:text-gray-400 transition">
              Términos y condiciones
            </Link>
            <Link href="/search" className="hover:text-gray-400 transition">
              Política de privacidad
            </Link>
            <Link href="/search" className="hover:text-gray-400 transition">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
