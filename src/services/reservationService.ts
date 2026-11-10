import { ReservationData } from '../types/order';
import { RESTAURANT_WHATSAPP, RESERVATION_SETTINGS } from '../config';

const STORAGE_RESERVATIONS_KEY = 'piccola_venezia_reservations';

/**
 * Génère un numéro de réservation lisible (ex. "RES-261110-318")
 */
export function generateReservationNumber(): string {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `RES-${year}${month}${day}-${randomSuffix}`;
}

/**
 * Récupère toutes les réservations enregistrées
 */
export function getSavedReservations(): ReservationData[] {
  try {
    const raw = localStorage.getItem(STORAGE_RESERVATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Vérifie la disponibilité d'un créneau horaire à une date donnée.
 */
export function checkSlotAvailability(date: string, heure: string): { available: boolean; remaining: number; bookedCount: number } {
  const reservations = getSavedReservations();
  const bookedOnSlot = reservations.filter(r => r.date === date && r.heure === heure).length;
  const max = RESERVATION_SETTINGS.maxReservationsParCreneau;
  const remaining = Math.max(0, max - bookedOnSlot);

  return {
    available: remaining > 0,
    remaining,
    bookedCount: bookedOnSlot
  };
}

/**
 * Vérifie si le même numéro de téléphone a déjà réservé pour la même date et heure (anti-double réservation côté navigateur).
 */
export function isDuplicateReservation(clientPhone: string, date: string, heure: string): boolean {
  const reservations = getSavedReservations();
  const cleanPhone = clientPhone.replace(/\D/g, '');
  return reservations.some(r => {
    const rPhone = r.clientPhone.replace(/\D/g, '');
    return rPhone === cleanPhone && r.date === date && r.heure === heure;
  });
}

/**
 * Sauvegarde une nouvelle réservation (isolé pour faciliter le branchement futur d'une API/Firebase).
 */
export async function saveReservation(reservation: ReservationData): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérification anti-doublon
    if (isDuplicateReservation(reservation.clientPhone, reservation.date, reservation.heure)) {
      return {
        success: false,
        error: 'Une réservation existe déjà pour ce numéro de téléphone à cette même date et heure.'
      };
    }

    // Vérification de capacité
    const { available } = checkSlotAvailability(reservation.date, reservation.heure);
    if (!available) {
      return {
        success: false,
        error: `Ce créneau (${reservation.heure}) est déjà complet pour le ${reservation.date}. Veuillez choisir un autre créneau.`
      };
    }

    const reservations = getSavedReservations();
    reservations.unshift(reservation);
    localStorage.setItem(STORAGE_RESERVATIONS_KEY, JSON.stringify(reservations));

    // Simulation de délai réseau
    await new Promise(resolve => setTimeout(resolve, 150));

    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l’enregistrement de la réservation:', error);
    return { success: false, error: 'Une erreur est survenue lors de l’enregistrement.' };
  }
}

/**
 * Construit l'URL WhatsApp avec le message de réservation pré-rempli.
 */
export function generateWhatsAppReservationUrl(res: ReservationData): string {
  const details = [
    `🍷 *RÉSERVATION DE TABLE - PICCOLA VENEZIA*`,
    `🔖 *Réf* : ${res.reservationNumber}`,
    `----------------------------------------`,
    `👤 *Nom* : ${res.clientName}`,
    `📞 *Téléphone* : ${res.clientPhone}`,
    res.clientEmail ? `📧 *Email* : ${res.clientEmail}` : null,
    `📅 *Date* : ${res.date}`,
    `⏰ *Heure* : ${res.heure}`,
    `👥 *Nombre de personnes* : ${res.personnes} couvert${res.personnes > 1 ? 's' : ''}`,
    res.occasion && res.occasion !== 'Repas classique' ? `🎉 *Occasion* : ${res.occasion}` : null,
    res.demandes ? `📝 *Demandes particulières* : ${res.demandes}` : null,
    `----------------------------------------`,
    `Bonjour Piccola Venezia, je souhaite confirmer cette demande de réservation de table. Merci de m'indiquer la disponibilité !`
  ]
    .filter(Boolean)
    .join('\n');

  const cleanNumber = RESTAURANT_WHATSAPP.replace(/\D/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(details)}`;
}
