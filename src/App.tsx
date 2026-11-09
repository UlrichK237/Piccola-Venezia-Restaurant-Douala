import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MenuSection } from './components/MenuSection';
import { AmbianceStrip } from './components/AmbianceStrip';
import { LocationSection } from './components/LocationSection';
import { Footer } from './components/Footer';
import { ReservationModal } from './components/ReservationModal';
import { Plat } from './data/restaurantData';

export default function App() {
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [selectedPlatForOrder, setSelectedPlatForOrder] = useState<Plat | null>(null);

  const handleSelectPlat = (plat: Plat) => {
    setSelectedPlatForOrder(plat);
    setIsReservationOpen(true);
  };

  const handleOpenReservation = () => {
    setSelectedPlatForOrder(null);
    setIsReservationOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FBF6EE] text-[#2B1A12] font-sans selection:bg-[#EB7F36] selection:text-[#2B1A12] relative">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main>
        <Hero />

        <MenuSection onSelectPlat={handleSelectPlat} />

        {/* Bande d'ambiance (affichée uniquement si la vidéo existe) */}
        <AmbianceStrip />

        <LocationSection onOpenReservation={handleOpenReservation} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Modal de Réservation / Commande WhatsApp */}
      <ReservationModal
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
        selectedPlat={selectedPlatForOrder}
      />
    </div>
  );
}
