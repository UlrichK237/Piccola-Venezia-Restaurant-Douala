import React, { useState } from 'react';
import { Menu, X, Phone, ShoppingBag } from 'lucide-react';
import { RESTAURANT_DATA } from '../data/restaurantData';
import { useCart } from '../context/CartContext';
import { getPhoneDigits } from '../lib/securite';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItemsCount, openCart } = useCart();
  const lieu = RESTAURANT_DATA.lieux[0];
  const telDigits = getPhoneDigits(lieu.telephone);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#EB7F36] border-b border-[#EADFCF]">
      {/* Barre Principale */}
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Dans l'en-tête, le logo suffit (max 200px) */}
        <a href="#hero" className="inline-block" aria-label="Accueil - L'italien Piccola Venezia">
          <img
            src="/assets/logo_5b391c43.png"
            alt="L'italien Piccola Venezia"
            width={400}
            height={150}
            className="max-w-[200px] w-auto h-9 object-contain"
          />
        </a>

        {/* Liens Desktop : Menu, Réserver, Infos, Contact */}
        <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-6 text-sm text-[#2B1A12]">
          <a href="#menu" className="hover:text-[#A84A15] font-medium transition">
            Menu
          </a>
          <a href="#reservation" className="hover:text-[#A84A15] font-medium transition">
            Réserver
          </a>
          <a href="#infos" className="hover:text-[#A84A15] font-medium transition">
            Infos
          </a>
          <a href="#contact" className="hover:text-[#A84A15] font-medium transition">
            Contact
          </a>
        </nav>

        {/* Boutons d'action Droite : Panier & Appeler */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bouton Panier avec badge */}
          <button
            type="button"
            onClick={openCart}
            aria-label={`Ouvrir le panier, ${totalItemsCount} article(s)`}
            className="relative px-3 py-2 rounded-lg bg-[#FBF6EE] hover:bg-[#F0E6D8] text-[#2B1A12] border border-[#D9C8B4] transition flex items-center gap-1.5 text-xs font-semibold shadow-2xs cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#A84A15]" />
            <span className="hidden sm:inline">Panier</span>
            {totalItemsCount > 0 && (
              <span className="bg-[#A84A15] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums">
                {totalItemsCount}
              </span>
            )}
          </button>

          {/* Bouton Appeler */}
          <div className="hidden sm:flex items-center">
            <a
              href={`tel:${telDigits}`}
              className="px-4 py-2 rounded-lg bg-[#A84A15] hover:bg-[#8D3C0F] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-2xs"
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
              className="p-2 text-[#2B1A12] hover:bg-[#EFE5D6] rounded-lg transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
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
            href="#reservation"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 border-b border-[#EADFCF] hover:text-[#A84A15] font-semibold text-[#A84A15]"
          >
            Réserver une table
          </a>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              openCart();
            }}
            className="w-full text-left py-2 border-b border-[#EADFCF] hover:text-[#A84A15] flex items-center justify-between cursor-pointer"
          >
            <span>Mon Panier</span>
            {totalItemsCount > 0 && (
              <span className="bg-[#A84A15] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItemsCount}
              </span>
            )}
          </button>
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
            href={`tel:${telDigits}`}
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
