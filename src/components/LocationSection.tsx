import React from 'react';
import { MapPin, Phone, Clock, Navigation, Calendar, ShoppingBag } from 'lucide-react';
import { RESTAURANT_DATA } from '../data/restaurantData';
import { useCart } from '../context/CartContext';
import { getPhoneDigits, urlHttpsSure } from '../lib/securite';

export const LocationSection: React.FC = () => {
  const lieu = RESTAURANT_DATA.lieux[0];
  const { openCart } = useCart();
  const telDigits = getPhoneDigits(lieu.telephone);
  const safeMapsUrl = urlHttpsSure(lieu.maps_url);

  return (
    <>
      {/* Section Infos pratiques */}
      <section
        id="infos"
        aria-label="Infos pratiques"
        className="scroll-mt-16 py-12 md:py-14 px-4 sm:px-6 bg-[#FBF6EE] text-[#2B1A12] border-t border-[#EADFCF]"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2B1A12]">
              Infos pratiques
            </h2>
            <p className="text-xs sm:text-sm text-[#6B5446]">
              {lieu.quartier}, {lieu.ville}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Adresse */}
            <div className="p-5 rounded-lg bg-[#F0E6D8]/60 border border-[#EADFCF] space-y-2">
              <div className="flex items-center gap-2 text-[#A84A15]">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                <h3 className="font-semibold text-sm">Adresse</h3>
              </div>
              <p className="text-xs text-[#6B5446] leading-relaxed">
                {lieu.adresse}
              </p>
            </div>

            {/* Horaires */}
            {lieu.horaires && (
              <div className="p-5 rounded-lg bg-[#F0E6D8]/60 border border-[#EADFCF] space-y-2">
                <div className="flex items-center gap-2 text-[#A84A15]">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  <h3 className="font-semibold text-sm">Horaires</h3>
                </div>
                <p className="text-xs text-[#6B5446] leading-relaxed">
                  {lieu.horaires}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section Contact */}
      <section
        id="contact"
        aria-label="Contact"
        className="scroll-mt-16 py-12 md:py-14 px-4 sm:px-6 bg-[#FBF6EE] text-[#2B1A12] border-t border-[#EADFCF]"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2B1A12]">
              Contact
            </h2>
            <p className="text-xs sm:text-sm text-[#6B5446]">
              Pour joindre l'établissement ou s'y rendre.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-[#F0E6D8]/60 border border-[#EADFCF] space-y-4">
            <div className="flex items-center gap-2 text-[#A84A15]">
              <Phone className="w-4 h-4" aria-hidden="true" />
              <h3 className="font-semibold text-sm">Téléphone</h3>
            </div>
            <a
              href={`tel:${telDigits}`}
              className="text-base font-semibold text-[#2B1A12] hover:text-[#A84A15] block transition"
            >
              {lieu.telephone}
            </a>

            {/* Boutons d'action concrets */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
              <a
                href={`tel:${telDigits}`}
                className="px-4 sm:px-5 py-2.5 rounded-lg bg-[#A84A15] hover:bg-[#8D3C0F] text-white text-xs font-semibold inline-flex items-center gap-2 transition shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Appeler</span>
              </a>

              {safeMapsUrl && (
                <a
                  href={safeMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 sm:px-5 py-2.5 rounded-lg bg-[#F0E6D8] hover:bg-[#E5D7C4] text-[#2B1A12] text-xs font-semibold inline-flex items-center gap-2 transition border border-[#D9C8B4]"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#A84A15]" aria-hidden="true" />
                  <span>Itinéraire</span>
                </a>
              )}

              {/* Lien d'ancre vers la réservation */}
              <a
                href="#reservation"
                className="px-4 sm:px-5 py-2.5 rounded-lg bg-[#EB7F36] hover:bg-[#D76E27] text-[#2B1A12] text-xs font-semibold inline-flex items-center gap-2 transition shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-[#2B1A12]" aria-hidden="true" />
                <span>Réserver une table</span>
              </a>

              {/* Bouton qui ouvre le panier de commande */}
              <button
                type="button"
                onClick={openCart}
                className="px-4 sm:px-5 py-2.5 rounded-lg bg-[#F0E6D8] hover:bg-[#E5D7C4] text-[#2B1A12] text-xs font-semibold inline-flex items-center gap-2 transition border border-[#D9C8B4] cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#A84A15]" aria-hidden="true" />
                <span>Commander des plats</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
