import React from 'react';
import { MapPin, Phone, Clock, Navigation } from 'lucide-react';
import { RESTAURANT_DATA } from '../data/restaurantData';

interface LocationSectionProps {
  onOpenReservation: () => void;
}

export const LocationSection: React.FC<LocationSectionProps> = ({ onOpenReservation }) => {
  const lieu = RESTAURANT_DATA.lieux[0];

  return (
    <>
      {/* Section Infos pratiques */}
      <section
        id="infos"
        aria-label="Infos pratiques"
        className="py-12 md:py-14 px-4 sm:px-6 bg-[#FBF6EE] text-[#2B1A12] border-t border-[#EADFCF]"
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

            {/* Horaires (uniquement si présents dans data.json) */}
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
        className="py-12 md:py-14 px-4 sm:px-6 bg-[#FBF6EE] text-[#2B1A12] border-t border-[#EADFCF]"
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
              href={`tel:${lieu.telephone}`}
              className="text-base font-semibold text-[#2B1A12] hover:text-[#A84A15] block transition"
            >
              {lieu.telephone}
            </a>

            {/* Boutons d'action concrets */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={`tel:${lieu.telephone}`}
                className="px-5 py-2.5 rounded-lg bg-[#A84A15] hover:bg-[#8D3C0F] text-white text-xs font-semibold inline-flex items-center gap-2 transition"
              >
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Appeler</span>
              </a>

              <a
                href={lieu.maps_url}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-lg bg-[#F0E6D8] hover:bg-[#E5D7C4] text-[#2B1A12] text-xs font-semibold inline-flex items-center gap-2 transition border border-[#D9C8B4]"
              >
                <Navigation className="w-3.5 h-3.5 text-[#A84A15]" aria-hidden="true" />
                <span>Itinéraire</span>
              </a>

              {/* Bouton WhatsApp uniquement si lieux[0].whatsapp n'est pas null */}
              {lieu.whatsapp && (
                <a
                  href={`https://wa.me/${lieu.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-lg bg-[#EB7F36] hover:bg-[#D76E27] text-[#2B1A12] text-xs font-semibold inline-flex items-center gap-2 transition"
                >
                  <span>WhatsApp</span>
                </a>
              )}

              <button
                onClick={onOpenReservation}
                className="px-5 py-2.5 rounded-lg bg-transparent hover:bg-[#F0E6D8] text-[#2B1A12] text-xs font-semibold inline-flex items-center gap-2 transition"
              >
                <span>Commander / Réserver</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
