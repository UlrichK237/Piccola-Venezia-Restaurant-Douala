import React, { useEffect, useRef } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatFCFA } from '../config';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalItemsCount,
    openCheckout
  } = useCart();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Fermeture par touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeCart]);

  // Blocage du défilement d'arrière-plan quand le tiroir est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Panier de commande">
      {/* Arrière-plan semi-transparent */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-md bg-[#FBF6EE] border-l border-[#EADFCF] shadow-2xl flex flex-col text-[#2B1A12] transition-transform duration-300 ease-out"
        >
          {/* En-tête du panier */}
          <div className="p-4 sm:p-5 bg-[#F0E6D8] border-b border-[#EADFCF] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-[#EB7F36]/20 text-[#A84A15]">
                <ShoppingBag className="w-5 h-5 text-[#A84A15]" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#2B1A12]">
                  Mon Panier
                </h2>
                <p className="text-xs text-[#6B5446]">
                  {totalItemsCount} article{totalItemsCount > 1 ? 's' : ''} sélectionné{totalItemsCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <button
              onClick={closeCart}
              aria-label="Fermer le panier"
              className="p-2 rounded-lg text-[#6B5446] hover:text-[#2B1A12] hover:bg-[#EADFCF] transition"
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
                  onClick={closeCart}
                  className="px-5 py-2.5 rounded-lg bg-[#EB7F36] hover:bg-[#D76E27] text-[#2B1A12] text-xs font-semibold transition shadow-xs"
                >
                  Découvrir la carte
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-[#EADFCF] space-y-3">
                {items.map(item => (
                  <li key={item.id} className="pt-3 first:pt-0 flex items-start gap-3">
                    {/* Miniature */}
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.platNom}
                        className="w-16 h-16 rounded-lg object-cover border border-[#EADFCF] shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-[#F0E6D8] border border-[#EADFCF] flex items-center justify-center text-[#A84A15] font-serif font-bold text-xs shrink-0">
                        PV
                      </div>
                    )}

                    {/* Détails du plat */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="font-serif font-bold text-xs sm:text-sm text-[#2B1A12] truncate">
                          {item.platNom}
                        </h4>
                        <span className="font-sans font-semibold text-xs sm:text-sm text-[#2B1A12] tabular-nums shrink-0">
                          {formatFCFA(item.prix * item.quantite)}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#6B5446] mt-0.5">
                        {item.categorie} • {formatFCFA(item.prix)} / unité
                      </p>

                      {/* Contrôles de quantité (+ / −) et suppression */}
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="inline-flex items-center rounded-lg border border-[#D9C8B4] bg-white overflow-hidden shadow-2xs">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            aria-label={`Diminuer la quantité de ${item.platNom}`}
                            className="p-1 px-2 text-[#6B5446] hover:text-[#2B1A12] hover:bg-[#F0E6D8] transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 py-0.5 text-xs font-semibold text-[#2B1A12] tabular-nums min-w-[24px] text-center">
                            {item.quantite}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            aria-label={`Augmenter la quantité de ${item.platNom}`}
                            className="p-1 px-2 text-[#6B5446] hover:text-[#2B1A12] hover:bg-[#F0E6D8] transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Supprimer ${item.platNom} du panier`}
                          className="p-1.5 text-[#A84A15]/70 hover:text-[#A84A15] hover:bg-[#F0E6D8] rounded-md transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pied de tiroir : Sous-total et bouton Commander */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 bg-[#F0E6D8] border-t border-[#EADFCF] space-y-3">
              <div className="flex items-baseline justify-between text-xs sm:text-sm">
                <span className="text-[#6B5446]">Sous-total articles :</span>
                <span className="font-serif font-bold text-base sm:text-lg text-[#2B1A12] tabular-nums">
                  {formatFCFA(subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#6B5446]">
                <span>Frais de livraison :</span>
                <span>Calculés à l'étape suivante</span>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={openCheckout}
                  className="w-full py-3 px-4 rounded-xl bg-[#EB7F36] hover:bg-[#D76E27] text-[#2B1A12] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <span>Passer la commande</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Voulez-vous vraiment vider votre panier ?')) {
                      clearCart();
                    }
                  }}
                  className="w-full py-2 text-[11px] text-[#6B5446] hover:text-[#A84A15] transition text-center underline underline-offset-2"
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
