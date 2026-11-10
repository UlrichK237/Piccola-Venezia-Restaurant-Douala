import React, { useRef } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { RESTAURANT_DATA } from '../data/restaurantData';
import { getPhoneDigits } from '../lib/securite';
import { useModalA11y } from '../hooks/useModalA11y';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
  triggerRef
}) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { containerRef } = useModalA11y({
    isOpen,
    onClose,
    triggerRef,
    initialFocusRef: closeBtnRef
  });

  if (!isOpen) return null;

  const lieu = RESTAURANT_DATA.lieux[0];
  const telDigits = getPhoneDigits(lieu.telephone);

  return (
    <div
      role="presentation"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4"
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
        className="relative w-full max-w-lg max-h-[85vh] bg-[#FBF6EE] border border-[#EADFCF] rounded-2xl shadow-2xl overflow-y-auto flex flex-col text-[#2B1A12]"
      >
        <div className="sticky top-0 bg-[#FBF6EE]/95 backdrop-blur-md px-6 py-4 border-b border-[#EADFCF] flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-[#A84A15]">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            <h2 id="privacy-modal-title" className="font-serif font-bold text-lg text-[#2B1A12]">
              Confidentialité & Données
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre de confidentialité"
            className="p-1.5 rounded-lg text-[#6B5446] hover:text-[#2B1A12] hover:bg-[#F0E6D8] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs sm:text-sm text-[#6B5446] leading-relaxed">
          <section className="space-y-1.5">
            <h3 className="font-bold text-[#2B1A12]">Données saisies</h3>
            <p>
              Nom, numéro de téléphone, quartier et adresse de livraison (le cas échéant), et remarques ou souhaits particuliers.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-[#2B1A12]">Usage de vos informations</h3>
            <p>
              Ces informations servent exclusivement à pré-remplir le message que vous envoyez vous-même au restaurant via WhatsApp pour votre commande ou votre réservation.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-[#2B1A12]">Ce qui est stocké sur votre appareil</h3>
            <p>
              Uniquement le contenu temporaire de votre panier (plats sélectionnés, options et quantités), enregistré localement dans votre propre navigateur pour une durée maximale de 24 heures. Rien d'autre n'est conservé. Le site n'utilise aucun cookie de traçage, aucun outil de statistiques ni aucune publicité.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-[#2B1A12]">Transmission via WhatsApp</h3>
            <p>
              La commande ou la réservation est transmise directement par l'application WhatsApp selon les conditions d'utilisation et la politique de confidentialité de ce service.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-[#2B1A12]">Comment effacer vos données locales</h3>
            <p>
              Vous pouvez à tout moment vider votre panier grâce au bouton « Vider le panier » présent dans le tiroir, ou simplement effacer les données de navigation de votre navigateur.
            </p>
          </section>

          <section className="space-y-1.5 pt-2 border-t border-[#EADFCF]">
            <h3 className="font-bold text-[#2B1A12]">Contact direct</h3>
            <p>
              Pour toute question, contactez directement l'établissement par téléphone au{' '}
              <a href={`tel:${telDigits}`} className="text-[#A84A15] font-semibold underline">
                {lieu.telephone}
              </a>.
            </p>
          </section>
        </div>

        <div className="p-4 bg-[#F0E6D8] border-t border-[#EADFCF] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#A84A15] hover:bg-[#8D3C0F] text-white text-xs font-semibold transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
