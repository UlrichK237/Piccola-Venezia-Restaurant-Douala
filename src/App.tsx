import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MenuSection } from './components/MenuSection';
import { ReservationSection } from './components/ReservationSection';
import { AmbianceStrip } from './components/AmbianceStrip';
import { LocationSection } from './components/LocationSection';
import { Footer } from './components/Footer';
import { ReservationModal } from './components/ReservationModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderCheckoutModal } from './components/OrderCheckoutModal';
import { FloatingCartButton } from './components/FloatingCartButton';
import { CartProvider } from './context/CartContext';
import { Plat, RESTAURANT_DATA } from './data/restaurantData';

export default function App() {
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [selectedPlatForOrder, setSelectedPlatForOrder] = useState<Plat | null>(null);

  const whatsappDigits = (RESTAURANT_DATA.lieux[0].whatsapp || '').replace(/[^0-9]/g, '');
  const hasWhatsapp = Boolean(RESTAURANT_DATA.lieux[0].whatsapp && whatsappDigits.length > 0);

  const handleSelectPlat = (plat: Plat) => {
    setSelectedPlatForOrder(plat);
    setIsReservationOpen(true);
  };

  const handleOpenReservation = () => {
    setSelectedPlatForOrder(null);
    setIsReservationOpen(true);
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-[#FBF6EE] text-[#2B1A12] font-sans selection:bg-[#EB7F36] selection:text-[#2B1A12] relative">
        {/* Navigation */}
        <Navbar />

        {/* Main Content */}
        <main>
          <Hero />

          <MenuSection onSelectPlat={handleSelectPlat} />

          {/* Section dédiée : Réserver une table */}
          <ReservationSection />

          {/* Bande d'ambiance (affichée uniquement si la vidéo existe) */}
          <AmbianceStrip />

          <LocationSection onOpenReservation={handleOpenReservation} />
        </main>

        {/* Footer */}
        <Footer />

        {/* Tiroir du panier et modale de commande */}
        <CartDrawer />
        <OrderCheckoutModal />

        {/* Bouton d'accès rapide flottant au panier */}
        <FloatingCartButton />

        {/* Modal de Réservation / Commande WhatsApp de secours (affiché uniquement si whatsapp n'est pas null) */}
        {hasWhatsapp && (
          <ReservationModal
            isOpen={isReservationOpen}
            onClose={() => setIsReservationOpen(false)}
            selectedPlat={selectedPlatForOrder}
          />
        )}
      </div>
    </CartProvider>
  );
}
