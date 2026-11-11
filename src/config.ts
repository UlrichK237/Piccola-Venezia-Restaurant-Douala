// ============================================================================
// CONFIGURATION DU RESTAURANT PICCOLA VENEZIA (DOUALA, CAMEROUN)
// ============================================================================

// ----------------------------------------------------------------------------
// 1. WHATSAPP & CONTACT (SEULE SOURCE DU NUMÉRO WHATSAPP)
// ----------------------------------------------------------------------------
// Numéro WhatsApp pour la réception des commandes et réservations lu depuis l'environnement
const rawWhatsAppEnv = import.meta.env.VITE_WHATSAPP_NUMBER;
const rawWhatsAppDigits = typeof rawWhatsAppEnv === 'string' ? rawWhatsAppEnv.replace(/\D/g, '') : '';
export const RESTAURANT_WHATSAPP: string | null = rawWhatsAppDigits.length > 0 ? rawWhatsAppDigits : null;

// ----------------------------------------------------------------------------
// 2. PARAMÈTRES DES RÉSERVATIONS
// ----------------------------------------------------------------------------
export const RESERVATION_SETTINGS = {
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
// 3. CONDITIONS COMMERCIALES ET LIVRAISON
// ----------------------------------------------------------------------------
// Mettre un montant en FCFA seulement si le restaurant l'a confirmé. null : aucun montant n'est affiché.
export const CONDITIONS = {
  fraisLivraisonFCFA: null as number | null
};

// ----------------------------------------------------------------------------
// 4. FORMATAGE DES PRIX EN FCFA (SÉPARATEUR DE MILLIERS)
// ----------------------------------------------------------------------------
export function formatFCFA(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 FCFA';
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}
