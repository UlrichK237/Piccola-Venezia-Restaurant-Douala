import React from 'react';
import { ArrowUp } from 'lucide-react';
import { RESTAURANT_DATA } from '../data/restaurantData';
import { MODE_DEMO } from '../config';

export const Footer: React.FC = () => {
  const lieu = RESTAURANT_DATA.lieux[0];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#F0E6D8] text-[#6B5446] text-xs border-t border-[#EADFCF] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo_5b391c43.png"
              alt="L'italien Piccola Venezia"
              className="max-w-[200px] w-auto h-8 object-contain"
            />
            <div>
              <div className="font-serif font-bold text-sm text-[#2B1A12]">
                {RESTAURANT_DATA.restaurant.nom}
              </div>
              <div className="text-[11px] text-[#6B5446]">
                {lieu.adresse}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href={`tel:${lieu.telephone}`}
              className="text-[#A84A15] hover:underline font-medium"
            >
              {lieu.telephone}
            </a>
            <span>•</span>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 hover:text-[#2B1A12] transition"
            >
              <span>Haut de page</span>
              <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-[#E0D3C1] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#6B5446]">
          <div>
            © {new Date().getFullYear()} {RESTAURANT_DATA.restaurant.nom}
          </div>
          {MODE_DEMO && (
            <div>
              Maquette de démonstration, non officielle
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
