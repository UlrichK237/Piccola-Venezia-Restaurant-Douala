import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '../types/order';
import { RESTAURANT_DATA, Plat } from '../data/restaurantData';
import { nettoyerTexte } from '../lib/securite';

const STORAGE_CART_KEY = 'pv_panier_v2';
const CART_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 heures

// Dictionnaire en mémoire des plats issus de restaurantData.ts (source unique de vérité pour les prix)
const MENU_INDEX: Record<string, { plat: Plat; categorie: string }> = {};
RESTAURANT_DATA.menu.forEach(cat => {
  cat.plats.forEach(p => {
    MENU_INDEX[`${cat.categorie}::${p.nom}`] = { plat: p, categorie: cat.categorie };
  });
});

/**
 * Calcule le total des plats à partir des données réelles du menu.
 * Source unique de calcul pour l'affichage et le message WhatsApp.
 */
export function calculerTotal(items: CartItem[]): number {
  return items.reduce((acc, item) => {
    const found = MENU_INDEX[item.id];
    const prix = found ? found.plat.prix : item.prix;
    return acc + (typeof prix === 'number' && !isNaN(prix) ? prix * item.quantite : 0);
  }, 0);
}

function areOptionsIdentical(a?: string[], b?: string[]): boolean {
  const arrA = a || [];
  const arrB = b || [];
  if (arrA.length !== arrB.length) return false;
  const sortedA = [...arrA].sort();
  const sortedB = [...arrB].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (
    plat: Plat,
    categorie: string,
    options?: string[],
    remarque?: string,
    quantite?: number
  ) => { success: boolean; error?: string };
  removeItem: (index: number) => void;
  updateQuantity: (index: number, delta: number) => { success: boolean; error?: string };
  setQuantity: (index: number, quantite: number) => { success: boolean; error?: string };
  updateRemarque: (index: number, remarque: string) => void;
  clearCart: () => void;
  totalItemsCount: number;
  totalPlats: number;
  toastMessage: string | null;
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // 1. Nettoyage des anciennes clés non autorisées au démarrage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('piccola_venezia_orders');
        localStorage.removeItem('piccola_venezia_reservations');
        localStorage.removeItem('piccola_venezia_cart');
      } catch {
        // Ignorer les erreurs d'accès à localStorage (navigation privée restreinte)
      }
    }

    // 2. Lecture et validation stricte du panier pv_panier_v2
    if (typeof window === 'undefined') return [];

    try {
      const raw = localStorage.getItem(STORAGE_CART_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return [];

      // Vérification de la date d'expiration (24 heures)
      const timestamp = parsed.timestamp;
      if (typeof timestamp !== 'number' || Date.now() - timestamp > CART_EXPIRATION_MS) {
        localStorage.removeItem(STORAGE_CART_KEY);
        return [];
      }

      if (!Array.isArray(parsed.items)) return [];

      const validItems: CartItem[] = [];
      let totalCount = 0;

      for (const entry of parsed.items) {
        if (!entry || typeof entry !== 'object') continue;
        const id = typeof entry.id === 'string' ? entry.id : '';
        const found = MENU_INDEX[id];
        if (!found || typeof found.plat.prix !== 'number' || found.plat.prix <= 0) {
          // Ignore les plats disparus ou sans prix
          continue;
        }

        // Quantité de 1 à 20 par ligne
        let q = typeof entry.quantite === 'number' ? Math.floor(entry.quantite) : 1;
        if (q < 1) q = 1;
        if (q > 20) q = 20;

        // Limite globale de 40 articles
        if (totalCount + q > 40) {
          q = Math.max(0, 40 - totalCount);
          if (q === 0) break;
        }

        // Validation des options et remarques
        let options: string[] | undefined = undefined;
        if (Array.isArray(entry.options)) {
          options = entry.options
            .filter((o: unknown): o is string => typeof o === 'string')
            .map((o: string) => nettoyerTexte(o, 60));
        }

        let remarque: string | undefined = undefined;
        if (typeof entry.remarque === 'string' && entry.remarque.trim()) {
          remarque = nettoyerTexte(entry.remarque, 120, { multiligne: false });
        }

        validItems.push({
          id,
          platNom: found.plat.nom,
          categorie: found.categorie,
          prix: found.plat.prix,
          quantite: q,
          options,
          remarque
        });

        totalCount += q;
      }

      return validItems;
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sauvegarde systématique dans pv_panier_v2 uniquement
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (items.length === 0) {
        localStorage.removeItem(STORAGE_CART_KEY);
      } else {
        const payload = {
          timestamp: Date.now(),
          items: items.map(item => ({
            id: item.id,
            quantite: item.quantite,
            options: item.options,
            remarque: item.remarque
          }))
        };
        localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(payload));
      }
    } catch (e) {
      console.warn('Impossible d’enregistrer le panier localement :', e);
    }
  }, [items]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(prev => (prev === message ? null : prev));
    }, 2400);
  };

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantite, 0);
  const totalPlats = calculerTotal(items);

  const addItem = (
    plat: Plat,
    categorie: string,
    options?: string[],
    remarque?: string,
    quantite: number = 1
  ): { success: boolean; error?: string } => {
    const id = `${categorie}::${plat.nom}`;
    const qtyToAdd = Math.max(1, Math.min(20, Math.floor(quantite)));
    const cleanRemarque = remarque ? nettoyerTexte(remarque, 120, { multiligne: false }) : undefined;

    if (totalItemsCount + qtyToAdd > 40) {
      const msg = 'Le panier ne peut pas contenir plus de 40 articles au total.';
      showToast(msg);
      return { success: false, error: msg };
    }

    let errorResult: string | undefined = undefined;

    setItems(prev => {
      const existingIdx = prev.findIndex(
        i =>
          i.id === id &&
          areOptionsIdentical(i.options, options) &&
          (i.remarque || '') === (cleanRemarque || '')
      );

      if (existingIdx >= 0) {
        const currentQty = prev[existingIdx].quantite;
        const newQty = currentQty + qtyToAdd;
        if (newQty > 20) {
          errorResult = 'La quantité maximale pour un plat est de 20.';
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantite: newQty
        };
        return updated;
      }

      return [
        ...prev,
        {
          id,
          platNom: plat.nom,
          categorie,
          prix: plat.prix,
          quantite: qtyToAdd,
          options,
          remarque: cleanRemarque
        }
      ];
    });

    if (errorResult) {
      showToast(errorResult);
      return { success: false, error: errorResult };
    }

    showToast(`✓ ${plat.nom} ajouté au panier`);
    return { success: true };
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateQuantity = (index: number, delta: number): { success: boolean; error?: string } => {
    let errorResult: string | undefined = undefined;

    setItems(prev => {
      if (index < 0 || index >= prev.length) return prev;
      const item = prev[index];
      const newQty = item.quantite + delta;

      if (newQty <= 0) {
        return prev.filter((_, idx) => idx !== index);
      }

      if (newQty > 20) {
        errorResult = 'La quantité maximale pour un plat est de 20.';
        return prev;
      }

      if (delta > 0 && totalItemsCount + delta > 40) {
        errorResult = 'Le panier ne peut pas contenir plus de 40 articles au total.';
        return prev;
      }

      const updated = [...prev];
      updated[index] = { ...item, quantite: newQty };
      return updated;
    });

    if (errorResult) {
      showToast(errorResult);
      return { success: false, error: errorResult };
    }
    return { success: true };
  };

  const setQuantity = (index: number, quantite: number): { success: boolean; error?: string } => {
    if (quantite <= 0) {
      removeItem(index);
      return { success: true };
    }

    let errorResult: string | undefined = undefined;

    setItems(prev => {
      if (index < 0 || index >= prev.length) return prev;
      const targetQty = Math.floor(quantite);
      if (targetQty > 20) {
        errorResult = 'La quantité maximale pour un plat est de 20.';
        return prev;
      }

      const otherItemsCount = prev.reduce(
        (sum, it, idx) => (idx === index ? sum : sum + it.quantite),
        0
      );
      if (otherItemsCount + targetQty > 40) {
        errorResult = 'Le panier ne peut pas contenir plus de 40 articles au total.';
        return prev;
      }

      const updated = [...prev];
      updated[index] = { ...prev[index], quantite: targetQty };
      return updated;
    });

    if (errorResult) {
      showToast(errorResult);
      return { success: false, error: errorResult };
    }
    return { success: true };
  };

  const updateRemarque = (index: number, rawRemarque: string) => {
    const cleaned = nettoyerTexte(rawRemarque, 120, { multiligne: false });
    setItems(prev => {
      if (index < 0 || index >= prev.length) return prev;
      const updated = [...prev];
      updated[index] = { ...updated[index], remarque: cleaned || undefined };
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen(prev => !prev);

  const openCheckout = () => {
    setIsOpen(false);
    setIsCheckoutOpen(true);
  };
  const closeCheckout = () => setIsCheckoutOpen(false);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        removeItem,
        updateQuantity,
        setQuantity,
        updateRemarque,
        clearCart,
        totalItemsCount,
        totalPlats,
        toastMessage,
        isCheckoutOpen,
        openCheckout,
        closeCheckout
      }}
    >
      {children}

      {/* Notification Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#2B1A12] text-[#FBF6EE] px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium shadow-xl border border-[#EB7F36]/40 flex items-center gap-2 transition-all duration-300"
        >
          <span className="w-2 h-2 rounded-full bg-[#EB7F36]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
