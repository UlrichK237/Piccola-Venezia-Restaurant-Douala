import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Plat } from '../data/restaurantData';
import { urlHttpsSure } from '../lib/securite';
import {
  applyCorrection,
  formatPrice,
  parseDescription,
  shouldDisplayNote,
} from './MenuSection';

export interface PlatPhotoInfo {
  fichier: string;
  auteur: string;
  licence: string;
  licence_url: string;
  source_url: string;
  requete?: string;
  niveau?: 'exact' | 'approchant';
}

interface PlatModalProps {
  isOpen: boolean;
  onClose: () => void;
  plat: Plat | null;
  photoInfo: PlatPhotoInfo | null;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const PlatModal: React.FC<PlatModalProps> = ({
  isOpen,
  onClose,
  plat,
  photoInfo,
  triggerRef,
}) => {
  const [imgError, setImgError] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Réinitialiser l'état d'erreur de l'image au changement de plat
  useEffect(() => {
    setImgError(false);
  }, [plat, photoInfo]);

  // Blocage du défilement de la page arrière-plan
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Piège du focus et gestion du focus entrant / sortant
  useEffect(() => {
    if (!isOpen) return;

    // Déplacer le focus dans la modale
    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      // Retourner le focus au bouton déclencheur
      if (triggerRef && triggerRef.current) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen || !plat) return null;

  const correctedNom = applyCorrection(plat.nom);
  const correctedDesc = applyCorrection(plat.description);
  const { mainText, accompagnement } = parseDescription(correctedDesc);
  const displayNote = shouldDisplayNote(plat.note, plat.description);

  return (
    <div
      role="presentation"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-[2px] p-0 sm:p-4 transition-opacity duration-150 motion-reduce:transition-none"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plat-modal-title"
        className="relative w-full sm:max-w-[440px] max-sm:max-h-[85vh] sm:max-h-[90vh] bg-[#FBF6EE] border-t sm:border border-[#EADFCF] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-y-auto flex flex-col transition-transform duration-150 ease-out motion-reduce:transition-none text-[#2B1A12]"
      >
        {/* Bouton Fermer (zone tactile 44 px, positionné en haut à droite) */}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Fermer la vue détaillée"
          className="absolute top-2.5 right-2.5 z-20 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm border border-white/20 transition focus-visible:ring-2 focus-visible:ring-[#EB7F36] focus-visible:outline-none"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Emplacement de la Photo (ratio 4:3 réservé à l'avance pour éviter tout saut de mise en page) */}
        {!imgError && photoInfo?.fichier && (
          <div className="w-full aspect-[4/3] bg-[#F0E6D8] overflow-hidden relative shrink-0">
            <img
              src={photoInfo.fichier}
              alt={`Photo d'illustration : ${correctedNom}`}
              width={440}
              height={330}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Mentions sous la photo (visible sans défilement sur ordinateur) */}
        {!imgError && photoInfo?.fichier && (
          <div className="px-4 py-2.5 bg-[#F0E6D8]/60 border-b border-[#EADFCF] text-[11px] text-[#6B5446] space-y-0.5 leading-snug">
            <p>
              {photoInfo.niveau === 'approchant'
                ? "Photo d'illustration approchante : elle ne représente pas exactement ce plat."
                : "Photo d'illustration, qui peut différer du plat servi."}
            </p>
            <p className="truncate">
              Photo : {photoInfo.auteur},{' '}
              {(() => {
                const safeLicenceUrl = urlHttpsSure(photoInfo.licence_url);
                const safeSourceUrl = urlHttpsSure(photoInfo.source_url);
                return (
                  <>
                    {safeLicenceUrl ? (
                      <a
                        href={safeLicenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#A84A15] underline hover:text-[#8D3C0F]"
                      >
                        {photoInfo.licence}
                      </a>
                    ) : (
                      <span>{photoInfo.licence}</span>
                    )}{' '}
                    (
                    {safeSourceUrl ? (
                      <a
                        href={safeSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#A84A15] underline hover:text-[#8D3C0F]"
                      >
                        Wikimedia Commons
                      </a>
                    ) : (
                      <span>Wikimedia Commons</span>
                    )}
                    )
                  </>
                );
              })()}
            </p>
          </div>
        )}

        {/* Contenu textuel détaillé du plat */}
        <div className="p-5 space-y-3">
          <div className="flex items-baseline justify-between gap-3 border-b border-[#EADFCF] pb-2.5">
            <h2
              id="plat-modal-title"
              className="font-serif font-bold text-lg sm:text-xl text-[#2B1A12] leading-snug"
            >
              {correctedNom}
            </h2>
            <span className="font-sans font-semibold text-[#2B1A12] text-base whitespace-nowrap tabular-nums shrink-0">
              {formatPrice(plat.prix)}
            </span>
          </div>

          {/* Description principale */}
          {mainText && (
            <p className="text-xs sm:text-sm text-[#6B5446] leading-relaxed">
              {mainText}
            </p>
          )}

          {/* Accompagnement sur une ligne séparée en italique */}
          {accompagnement && (
            <p className="text-xs sm:text-sm italic text-[#6B5446] leading-relaxed">
              {accompagnement}
            </p>
          )}

          {/* Note si non redondante */}
          {displayNote && (
            <p className="text-[11px] sm:text-xs text-[#A84A15] italic font-sans">
              ({applyCorrection(plat.note)})
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
