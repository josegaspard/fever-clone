import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#111] border-t border-[#2a2a2a] mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-2xl font-extrabold text-[#e63946]">
              FEVER
            </Link>
            <p className="mt-3 text-sm text-gray-400">
              Descubre las mejores experiencias y eventos en tu ciudad.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Explorar</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link href="/search" className="hover:text-white transition">
                  Eventos
                </Link>
              </li>
              <li>
                <Link href="/search?category=conciertos" className="hover:text-white transition">
                  Conciertos
                </Link>
              </li>
              <li>
                <Link href="/search?category=teatro" className="hover:text-white transition">
                  Teatro
                </Link>
              </li>
              <li>
                <Link href="/search?category=gastronomia" className="hover:text-white transition">
                  Gastronomía
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Empresa</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <span className="hover:text-white transition cursor-pointer">
                  Sobre nosotros
                </span>
              </li>
              <li>
                <span className="hover:text-white transition cursor-pointer">
                  Trabaja con nosotros
                </span>
              </li>
              <li>
                <span className="hover:text-white transition cursor-pointer">
                  Prensa
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Síguenos</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <span className="hover:text-white transition cursor-pointer">
                  Instagram
                </span>
              </li>
              <li>
                <span className="hover:text-white transition cursor-pointer">
                  Twitter / X
                </span>
              </li>
              <li>
                <span className="hover:text-white transition cursor-pointer">
                  Facebook
                </span>
              </li>
              <li>
                <span className="hover:text-white transition cursor-pointer">
                  TikTok
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#2a2a2a] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Fever. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="hover:text-gray-400 cursor-pointer">
              Términos y condiciones
            </span>
            <span className="hover:text-gray-400 cursor-pointer">
              Política de privacidad
            </span>
            <span className="hover:text-gray-400 cursor-pointer">
              Cookies
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
