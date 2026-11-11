import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { Plat } from '../data/restaurantData';
import { formatFCFA } from '../config';
import { nettoyerTexte } from '../lib/securite';
import { useModalA11y } from '../hooks/useModalA11y';
import { applyCorrection } from './MenuSection';

interface OptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plat: Plat | null;
  categorie: string;
  onConfirm: (options: string[], remarque: string) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const OptionModal: React.FC<OptionModalProps> = ({
  isOpen,
  onClose,
  plat,
  categorie,
  onConfirm,
  triggerRef
}) => {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { containerRef } = useModalA11y({
    isOpen,
    onClose,
    triggerRef,
    initialFocusRef: closeBtnRef
  });

  const [selectedRadio, setSelectedRadio] = useState<string>('');
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<string[]>([]);
  const [remarque, setRemarque] = useState<string>('');
  const [error, setError] = useState<string>('');

  const isMultiOption = Boolean(
    plat?.description && plat.description.toLowerCase().includes('en option')
  );

  const isAuChoixMandatory = Boolean(
    !plat?.options &&
      plat?.description &&
      (plat.description.toLowerCase().includes('au choix') ||
        plat.description.toLowerCase().includes('du jour'))
  );

  useEffect(() => {
    if (plat) {
      if (plat.options && plat.options.length > 0) {
        if (!isMultiOption) {
          setSelectedRadio(plat.options[0]);
        } else {
          setSelectedCheckboxes([]);
        }
      } else {
        setSelectedRadio('');
        setSelectedCheckboxes([]);
      }
      setRemarque('');
      setError('');
    }
  }, [plat, isMultiOption]);

  if (!isOpen || !plat) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let finalOptions: string[] = [];

    if (plat.options && plat.options.length > 0) {
      if (isMultiOption) {
        finalOptions = selectedCheckboxes;
      } else {
        if (!selectedRadio) {
          setError('Veuillez sélectionner une option.');
          return;
        }
        finalOptions = [selectedRadio];
      }
    }

    const cleanedRemarque = nettoyerTexte(remarque, 120, { multiligne: false });

    if (isAuChoixMandatory && !cleanedRemarque) {
      setError('Précisez vos variétés de pâtes pour ce plat.');
      return;
    }

    onConfirm(finalOptions, cleanedRemarque);
    onClose();
  };

  const toggleCheckbox = (opt: string) => {
    setSelectedCheckboxes(prev =>
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    );
  };

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
        aria-labelledby="option-modal-title"
        className="relative w-full max-w-md bg-[#FBF6EE] border border-[#EADFCF] rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col text-[#2B1A12]"
      >
        <div className="sticky top-0 bg-[#FBF6EE]/95 backdrop-blur-md px-6 py-4 border-b border-[#EADFCF] flex items-center justify-between z-10">
          <div>
            <span className="text-[11px] font-sans uppercase tracking-wider text-[#6B5446] font-medium">
              {categorie}
            </span>
            <h2 id="option-modal-title" className="font-serif font-bold text-lg text-[#2B1A12]">
              {applyCorrection(plat.nom)}
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre d'options"
            className="p-1.5 rounded-lg text-[#6B5446] hover:text-[#2B1A12] hover:bg-[#F0E6D8] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-sm font-sans font-semibold text-[#A84A15]">
            Prix : {formatFCFA(plat.prix)}
          </div>

          {/* Options de choix */}
          {plat.options && plat.options.length > 0 && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2B1A12]">
                {isMultiOption ? 'Options au choix (facultatif)' : 'Choix obligatoire :'}
              </label>

              <div className="space-y-2">
                {plat.options.map(opt => {
                  const isChecked = isMultiOption
                    ? selectedCheckboxes.includes(opt)
                    : selectedRadio === opt;

                  return (
                    <label
                      key={opt}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition text-xs sm:text-sm font-medium ${
                        isChecked
                          ? 'border-[#A84A15] bg-[#F0E6D8] text-[#2B1A12]'
                          : 'border-[#D9C8B4] bg-white hover:bg-[#FBF6EE] text-[#6B5446]'
                      }`}
                    >
                      <span>{opt}</span>
                      <input
                        type={isMultiOption ? 'checkbox' : 'radio'}
                        name="platOption"
                        value={opt}
                        checked={isChecked}
                        onChange={() => {
                          if (isMultiOption) {
                            toggleCheckbox(opt);
                          } else {
                            setSelectedRadio(opt);
                          }
                        }}
                        className="w-4 h-4 text-[#A84A15] focus:ring-[#A84A15]"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Remarque spéciale */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <label htmlFor="plat-remarque-input" className="block text-xs font-bold uppercase tracking-wider text-[#2B1A12]">
                {isAuChoixMandatory ? 'Variétés de pâtes (obligatoire) :' : 'Remarque pour ce plat (facultatif) :'}
              </label>
              <span className="text-[10px] text-[#6B5446]">
                {remarque.length}/120
              </span>
            </div>

            <input
              id="plat-remarque-input"
              type="text"
              maxLength={120}
              value={remarque}
              onChange={e => setRemarque(e.target.value)}
              placeholder={isAuChoixMandatory ? 'Précisez vos variétés de pâtes' : 'Ex: sans piment, sauce à part...'}
              aria-required={isAuChoixMandatory}
              aria-invalid={Boolean(error && isAuChoixMandatory && !remarque)}
              aria-describedby={error ? 'option-error-msg' : undefined}
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-xs sm:text-sm text-[#2B1A12] placeholder-[#8C7565] focus:outline-none focus:border-[#A84A15] transition"
            />
            {isAuChoixMandatory && (
              <p className="text-[11px] text-[#6B5446] italic">
                Précisez vos variétés de pâtes
              </p>
            )}
          </div>

          {error && (
            <div id="option-error-msg" role="alert" className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-[#D9C8B4] hover:bg-[#F0E6D8] text-[#2B1A12] text-xs font-medium transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#A84A15] hover:bg-[#8D3C0F] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Ajouter au panier</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
