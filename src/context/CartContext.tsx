import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from '../types/order';

const STORAGE_CART_KEY = 'piccola_venezia_cart';

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (plat: { nom: string; categorie: string; prix: number; image?: string }, quantite?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  setQuantity: (id: string, quantite: number) => void;
  getItemQuantity: (id: string) => number;
  clearCart: () => void;
  totalItemsCount: number;
  subtotal: number;
  toastMessage: string | null;
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sauvegarde systématique dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Impossible de sauvegarder le panier dans localStorage:', e);
    }
  }, [items]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(prev => (prev === message ? null : prev));
    }, 2400);
  };

  const addItem = (plat: { nom: string; categorie: string; prix: number; image?: string }, quantite: number = 1) => {
    const id = `${plat.categorie}::${plat.nom}`;
    setItems(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item =>
          item.id === id ? { ...item, quantite: item.quantite + quantite } : item
        );
      }
      return [
        ...prev,
        {
          id,
          platNom: plat.nom,
          categorie: plat.categorie,
          prix: plat.prix,
          quantite,
          image: plat.image
        }
      ];
    });

    showToast(`✓ ${plat.nom} ajouté au panier`);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev =>
      prev
        .map(item => {
          if (item.id === id) {
            const nextQty = item.quantite + delta;
            return nextQty > 0 ? { ...item, quantite: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const setQuantity = (id: string, quantite: number) => {
    if (quantite <= 0) {
      removeItem(id);
      return;
    }
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, quantite } : item))
    );
  };

  const getItemQuantity = (id: string): number => {
    const item = items.find(i => i.id === id);
    return item ? item.quantite : 0;
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

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantite, 0);
  const subtotal = items.reduce((acc, item) => acc + item.prix * item.quantite, 0);

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
        getItemQuantity,
        clearCart,
        totalItemsCount,
        subtotal,
        toastMessage,
        isCheckoutOpen,
        openCheckout,
        closeCheckout
      }}
    >
      {children}

      {/* Toast notification globale */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#2B1A12] text-[#FBF6EE] px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium shadow-xl border border-[#EB7F36]/40 flex items-center gap-2 animate-bounce transition-all duration-300"
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
