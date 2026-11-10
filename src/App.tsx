import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MenuSection } from './components/MenuSection';
import { ReservationSection } from './components/ReservationSection';
import { AmbianceStrip } from './components/AmbianceStrip';
import { LocationSection } from './components/LocationSection';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { OrderCheckoutModal } from './components/OrderCheckoutModal';
import { FloatingCartButton } from './components/FloatingCartButton';
import { PrivacyModal } from './components/PrivacyModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CartProvider } from './context/CartContext';

export default function App() {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <ErrorBoundary>
      <CartProvider>
        <div className="min-h-screen bg-[#FBF6EE] text-[#2B1A12] font-sans selection:bg-[#EB7F36] selection:text-[#2B1A12] relative">
          {/* Navigation */}
          <Navbar />

          {/* Main Content */}
          <main>
            <Hero />

            <MenuSection />

            {/* Section dédiée : Réserver une table */}
            <ReservationSection onOpenPrivacy={() => setIsPrivacyOpen(true)} />

            {/* Bande d'ambiance (affichée uniquement si la vidéo existe) */}
            <AmbianceStrip />

            <LocationSection />
          </main>

          {/* Footer avec lien Confidentialité */}
          <Footer onOpenPrivacy={() => setIsPrivacyOpen(true)} />

          {/* Tiroir du panier et modale de commande */}
          <CartDrawer />
          <OrderCheckoutModal onOpenPrivacy={() => setIsPrivacyOpen(true)} />

          {/* Bouton d'accès rapide flottant au panier */}
          <FloatingCartButton />

          {/* Modale de Confidentialité */}
          <PrivacyModal
            isOpen={isPrivacyOpen}
            onClose={() => setIsPrivacyOpen(false)}
          />
        </div>
      </CartProvider>
    </ErrorBoundary>
  );
}
