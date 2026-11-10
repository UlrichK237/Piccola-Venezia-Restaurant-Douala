import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatFCFA } from '../config';

export const FloatingCartButton: React.FC = () => {
  const { totalItemsCount, subtotal, openCart, isOpen, isCheckoutOpen } = useCart();

  // On ne l'affiche pas si le tiroir ou le checkout est déjà ouvert
  if (isOpen || isCheckoutOpen) return null;

  return (
    <aside
      aria-label="Accès rapide au panier"
      className="fixed bottom-5 right-4 sm:right-6 z-40 transition-transform duration-300 hover:scale-105"
    >
      <button
        onClick={openCart}
        aria-label={`Ouvrir le panier, ${totalItemsCount} article(s), total ${formatFCFA(subtotal)}`}
        className={`flex items-center gap-2.5 px-4 py-3 rounded-full font-sans font-bold text-xs sm:text-sm shadow-2xl transition-all duration-300 border ${
          totalItemsCount > 0
            ? 'bg-[#EB7F36] hover:bg-[#D76E27] text-[#2B1A12] border-[#D76E27]'
            : 'bg-[#F0E6D8] hover:bg-[#E5D7C4] text-[#2B1A12] border-[#D9C8B4]'
        }`}
      >
        <div className="relative flex items-center justify-center">
          <ShoppingBag className="w-4 h-4 text-[#2B1A12]" />
          {totalItemsCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#A84A15] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {totalItemsCount}
            </span>
          )}
        </div>

        <span className="font-serif">Panier</span>

        {totalItemsCount > 0 && (
          <>
            <span className="text-[#2B1A12]/40">•</span>
            <span className="font-sans font-bold tabular-nums">
              {formatFCFA(subtotal)}
            </span>
          </>
        )}
      </button>
    </aside>
  );
};
