import React, { useState, useRef } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Edit3, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatFCFA, CONDITIONS } from '../config';
import { useModalA11y } from '../hooks/useModalA11y';
import { nettoyerTexte } from '../lib/securite';
import { applyCorrection } from './MenuSection';
import platPhotosData from '../data/platPhotos.json';

const platPhotos = platPhotosData as Record<string, { fichier: string }>;

// Petite photo du plat dans le panier (la clé du panier est la même que celle des photos)
const MiniaturePlat: React.FC<{ cle: string }> = ({ cle }) => {
  const photo = platPhotos[cle]?.fichier;
  if (!photo) return null;
  return (
    <img
      src={photo}
      alt=""
      width={56}
      height={56}
      loading="lazy"
      decoding="async"
      className="w-14 h-14 rounded-lg object-cover border border-[#EADFCF] shrink-0"
    />
  );
};

export const CartDrawer: React.FC = () => {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    updateRemarque,
    clearCart,
    totalPlats,
    totalItemsCount,
    openCheckout
  } = useCart();

  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { containerRef } = useModalA11y({
    isOpen,
    onClose: closeCart,
    initialFocusRef: closeBtnRef
  });

  const [editingRemarqueIdx, setEditingRemarqueIdx] = useState<number | null>(null);
  const [tempRemarque, setTempRemarque] = useState<string>('');

  if (!isOpen) return null;

  const handleStartEditRemarque = (idx: number, currentRemarque?: string) => {
    setEditingRemarqueIdx(idx);
    setTempRemarque(currentRemarque || '');
  };

  const handleSaveRemarque = (idx: number) => {
    updateRemarque(idx, tempRemarque);
    setEditingRemarqueIdx(null);
    setTempRemarque('');
  };

  return (
    <div
      role="presentation"
      onClick={e => {
        if (e.target === e.currentTarget) closeCart();
      }}
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-[2px] transition-opacity duration-300"
    >
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-drawer-title"
          className="w-screen max-w-md bg-[#FBF6EE] border-l border-[#EADFCF] shadow-2xl flex flex-col text-[#2B1A12] transition-transform duration-300 ease-out"
        >
          {/* En-tête du panier */}
          <div className="p-4 sm:p-5 bg-[#F0E6D8] border-b border-[#EADFCF] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-[#EB7F36]/20 text-[#A84A15]">
                <ShoppingBag className="w-5 h-5 text-[#A84A15]" aria-hidden="true" />
              </span>
              <div>
                <h2 id="cart-drawer-title" className="text-base sm:text-lg font-serif font-bold text-[#2B1A12]">
                  Mon Panier
                </h2>
                <p className="text-xs text-[#6B5446]">
                  {totalItemsCount} article{totalItemsCount > 1 ? 's' : ''} • max 40
                </p>
              </div>
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={closeCart}
              aria-label="Fermer le panier"
              className="p-2 rounded-lg text-[#6B5446] hover:text-[#2B1A12] hover:bg-[#EADFCF] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenu de la liste */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#F0E6D8] border border-[#EADFCF] flex items-center justify-center text-[#A84A15]/60">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-base text-[#2B1A12]">
                    Votre panier est vide
                  </h3>
                  <p className="text-xs text-[#6B5446] max-w-xs">
                    Parcourez notre carte et ajoutez vos spécialités italiennes préférées en un clic.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  className="px-5 py-2.5 rounded-lg bg-[#EB7F36] hover:bg-[#D76E27] text-[#2B1A12] text-xs font-semibold transition shadow-xs cursor-pointer"
                >
                  Découvrir la carte
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-[#EADFCF] space-y-3 list-none p-0 m-0">
                {items.map((item, index) => (
                  <li key={`${item.id}-${index}`} className="pt-3 first:pt-0 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <MiniaturePlat cle={item.id} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-serif font-bold text-xs sm:text-sm text-[#2B1A12]">
                            {applyCorrection(item.platNom)}
                          </h3>
                          <span className="font-sans font-semibold text-xs sm:text-sm text-[#2B1A12] tabular-nums shrink-0">
                            {formatFCFA(item.prix * item.quantite)}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#6B5446] mt-0.5">
                          {item.categorie} • {formatFCFA(item.prix)} / unité
                        </p>

                        {/* Options sélectionnées */}
                        {item.options && item.options.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.options.map(opt => (
                              <span
                                key={opt}
                                className="inline-block text-[10px] bg-[#F0E6D8] text-[#A84A15] px-2 py-0.5 rounded font-medium"
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Remarque pour la ligne */}
                        {editingRemarqueIdx === index ? (
                          <div className="mt-2 flex items-center gap-1.5">
                            <input
                              type="text"
                              maxLength={120}
                              value={tempRemarque}
                              onChange={e => setTempRemarque(e.target.value)}
                              placeholder="Remarque (max 120 car.)"
                              className="flex-1 px-2.5 py-1 text-xs rounded border border-[#D9C8B4] bg-white text-[#2B1A12] focus:outline-none focus:border-[#A84A15]"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRemarque(index)}
                              className="p-1 rounded bg-[#A84A15] text-white hover:bg-[#8D3C0F]"
                              aria-label="Enregistrer la remarque"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRemarqueIdx(null)}
                              className="p-1 rounded text-[#6B5446] hover:bg-[#EADFCF]"
                              aria-label="Annuler"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="mt-1.5 flex items-center gap-2">
                            {item.remarque ? (
                              <p className="text-[11px] text-[#A84A15] italic line-clamp-1">
                                « {item.remarque} »
                              </p>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => handleStartEditRemarque(index, item.remarque)}
                              className="text-[10px] text-[#6B5446] hover:text-[#A84A15] underline inline-flex items-center gap-0.5"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>{item.remarque ? 'Modifier note' : '+ Ajouter une note'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contrôles de quantité (+ / −) et suppression */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="inline-flex items-center rounded-lg border border-[#D9C8B4] bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, -1)}
                          aria-label={`Diminuer la quantité de ${applyCorrection(item.platNom)}`}
                          className="p-1 px-2.5 text-[#6B5446] hover:text-[#2B1A12] hover:bg-[#F0E6D8] transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 py-0.5 text-xs font-semibold text-[#2B1A12] tabular-nums min-w-[28px] text-center">
                          {item.quantite}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, 1)}
                          aria-label={`Augmenter la quantité de ${applyCorrection(item.platNom)}`}
                          disabled={item.quantite >= 20 || totalItemsCount >= 40}
                          className="p-1 px-2.5 text-[#6B5446] hover:text-[#2B1A12] hover:bg-[#F0E6D8] transition disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        aria-label={`Supprimer ${applyCorrection(item.platNom)} du panier`}
                        className="p-1.5 text-[#A84A15]/80 hover:text-[#A84A15] hover:bg-[#F0E6D8] rounded-md transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pied de tiroir : Total des plats et bouton Commander */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 bg-[#F0E6D8] border-t border-[#EADFCF] space-y-3">
              <div className="flex items-baseline justify-between text-xs sm:text-sm">
                <span className="text-[#2B1A12] font-semibold">Total des plats :</span>
                <span className="font-serif font-bold text-base sm:text-lg text-[#2B1A12] tabular-nums">
                  {formatFCFA(totalPlats)}
                </span>
              </div>

              {CONDITIONS.fraisLivraisonFCFA !== null && (
                <div className="flex items-center justify-between text-[11px] text-[#6B5446]">
                  <span>Frais de livraison :</span>
                  <span>{formatFCFA(CONDITIONS.fraisLivraisonFCFA)}</span>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={openCheckout}
                  className="w-full py-3 px-4 rounded-xl bg-[#EB7F36] hover:bg-[#D76E27] text-[#2B1A12] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                >
                  <span>Commander</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={clearCart}
                  className="w-full py-1.5 text-[11px] text-[#6B5446] hover:text-[#A84A15] transition text-center underline underline-offset-2 cursor-pointer"
                >
                  Vider le panier
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
