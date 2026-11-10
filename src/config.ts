// ============================================================================
// CONFIGURATION DU RESTAURANT PICCOLA VENEZIA (DOUALA, CAMEROUN)
// ============================================================================

// true : affiche la mention discrète dans le pied de page. Mettre false quand le restaurant a acheté le site.
export const MODE_DEMO = true;

// true : affiche aussi le bandeau orange tout en haut de la page.
export const BANDEAU_DEMO_HAUT = false;

// Quand le restaurant achète le site, supprimer aussi la balise noindex de index.html (ligne 8).

// ----------------------------------------------------------------------------
// 1. WHATSAPP & CONTACT (MODIFIABLE FACILEMENT)
// ----------------------------------------------------------------------------
// Numéro WhatsApp pour la réception des commandes et réservations (sans + ni espaces)
// Ex. pour le Cameroun : 237699931721
export const RESTAURANT_WHATSAPP = '237699931721';

// Format d'affichage pour les clients
export const RESTAURANT_WHATSAPP_DISPLAY = '+237 6 99 93 17 21';

// ----------------------------------------------------------------------------
// 2. PARAMÈTRES DES RÉSERVATIONS
// ----------------------------------------------------------------------------
export const RESERVATION_SETTINGS = {
  // Créneaux horaires d'ouverture disponibles à la réservation
  creneauxMidi: ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30'],
  creneauxSoir: ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'],
  // Nombre maximum de réservations acceptées par créneau horaire (côté navigateur)
  maxReservationsParCreneau: 4,
  // Limites de couverts par table
  minPersonnes: 1,
  maxPersonnes: 12,
  // Liste des occasions proposées
  occasions: [
    'Repas classique',
    'Dîner romantique',
    'Anniversaire',
    'Déjeuner / Dîner d’affaires',
    'Fête de famille',
    'Autre occasion'
  ]
};

// ----------------------------------------------------------------------------
// 3. PARAMÈTRES DE COMMANDE ET LIVRAISON (DOUALA)
// ----------------------------------------------------------------------------
export const DELIVERY_SETTINGS = {
  // Frais de livraison forfaitaires en FCFA (0 pour retrait ou sur place)
  fraisLivraisonFCFA: 1500,
  // Principaux quartiers de Douala desservis
  quartiersDouala: [
    'Bonapriso (Quartier du restaurant)',
    'Bonanjo',
    'Akwa',
    'Bali',
    'Deido',
    'Koumassi',
    'Makepe',
    'Bonamoussadi',
    'Denver',
    'Kotto',
    'Logpom',
    'Bassa',
    'Autre quartier (à préciser)'
  ],
  // Modes de paiement indicatifs
  modesPaiement: [
    { id: 'especes', label: 'Paiement à la livraison / au retrait (Espèces)' },
    { id: 'momo', label: 'MTN Mobile Money (+237)' },
    { id: 'om', label: 'Orange Money Cameroun (+237)' }
  ]
};

// ----------------------------------------------------------------------------
// 4. FORMATAGE DES PRIX EN FCFA (SÉPARATEUR DE MILLIERS)
// ----------------------------------------------------------------------------
export function formatFCFA(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 FCFA';
  // Formate avec un espace comme séparateur de milliers (ex. 12 500 FCFA)
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}
