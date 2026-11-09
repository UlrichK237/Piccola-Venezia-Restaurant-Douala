import React, { useState } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import { RESTAURANT_DATA } from '../data/restaurantData';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lieu = RESTAURANT_DATA.lieux[0];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FBF6EE] border-b border-[#EADFCF]">
      {/* Bandeau discret et fixe */}
      <div className="bg-[#EB7F36] text-[#2B1A12] px-4 py-1.5 text-center text-xs font-medium border-b border-[#D76E27]">
        Maquette de démonstration, non officielle
      </div>

      {/* Barre Principale */}
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Dans l'en-tête, le logo suffit (max 200px) */}
        <a href="#hero" className="inline-block" aria-label="Accueil - L'italien Piccola Venezia">
          <img
            src="/public/assets/aistudio/logo_5b391c43.png"
            alt="L'italien Piccola Venezia"
            className="max-w-[200px] w-auto h-9 object-contain"
          />
        </a>

        {/* Liens Desktop : Menu, Infos, Contact */}
        <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-6 text-sm text-[#2B1A12]">
          <a href="#menu" className="hover:text-[#A84A15] font-medium transition">
            Menu
          </a>
          <a href="#infos" className="hover:text-[#A84A15] font-medium transition">
            Infos
          </a>
          <a href="#contact" className="hover:text-[#A84A15] font-medium transition">
            Contact
          </a>
        </nav>

        {/* Bouton Appeler (bouton plein en #A84A15 avec texte blanc) */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href={`tel:${lieu.telephone}`}
            className="px-4 py-2 rounded-lg bg-[#A84A15] hover:bg-[#8D3C0F] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition"
          >
            <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Appeler</span>
          </a>
        </div>

        {/* Déclencheur mobile */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            className="p-2 text-[#2B1A12] hover:bg-[#EFE5D6] rounded-lg transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FBF6EE] border-b border-[#EADFCF] px-4 py-3 space-y-2 text-sm text-[#2B1A12]">
          <a
            href="#menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 border-b border-[#EADFCF] hover:text-[#A84A15]"
          >
            Menu
          </a>
          <a
            href="#infos"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 border-b border-[#EADFCF] hover:text-[#A84A15]"
          >
            Infos
          </a>
          <a
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 border-b border-[#EADFCF] hover:text-[#A84A15]"
          >
            Contact
          </a>
          <a
            href={`tel:${lieu.telephone}`}
            className="inline-flex items-center gap-2 mt-2 px-4 py-2.5 rounded-lg bg-[#A84A15] text-white text-xs font-semibold"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Appeler ({lieu.telephone})</span>
          </a>
        </div>
      )}
    </header>
  );
};
