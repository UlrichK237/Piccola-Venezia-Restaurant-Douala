import { CartItem, OrderData, ModeReception, ModePaiement } from '../types/order';
import { RESTAURANT_WHATSAPP, formatFCFA, DELIVERY_SETTINGS } from '../config';

const STORAGE_ORDERS_KEY = 'piccola_venezia_orders';

/**
 * Valide un numéro de téléphone au format camerounais (+237 ou 9 chiffres commençant généralement par 6).
 */
export function validateCameroonPhone(rawPhone: string): { valid: boolean; formatted: string; error?: string } {
  if (!rawPhone || !rawPhone.trim()) {
    return { valid: false, formatted: '', error: 'Le numéro de téléphone est obligatoire.' };
  }

  // Nettoyage des espaces, tirets et signes
  const digits = rawPhone.replace(/\D/g, '');

  // Format avec indicatif international 237 : doit comporter 12 chiffres (237 + 9 chiffres)
  if (digits.startsWith('237')) {
    const localNumber = digits.slice(3);
    if (localNumber.length === 9) {
      return {
        valid: true,
        formatted: `+237 ${localNumber.slice(0, 1)} ${localNumber.slice(1, 3)} ${localNumber.slice(3, 5)} ${localNumber.slice(5, 7)} ${localNumber.slice(7, 9)}`
      };
    }
    return { valid: false, formatted: '', error: 'Le numéro camerounais doit comporter 9 chiffres après +237 (ex. 699 93 17 21).' };
  }

  // Numéro local à 9 chiffres (ex. 699931721)
  if (digits.length === 9) {
    return {
      valid: true,
      formatted: `+237 ${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`
    };
  }

  return { valid: false, formatted: '', error: 'Veuillez saisir un numéro valide à 9 chiffres (ex. 699 93 17 21).' };
}

/**
 * Génère un identifiant unique de commande lisible (ex. "PV-CMD-261110-842")
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `PV-CMD-${year}${month}${day}-${randomSuffix}`;
}

/**
 * Enregistre la commande dans le stockage local (prêt à être branché sur Firebase / API backend).
 */
export async function saveOrder(order: OrderData): Promise<{ success: boolean; orderNumber: string }> {
  try {
    const existingRaw = localStorage.getItem(STORAGE_ORDERS_KEY);
    const existingOrders: OrderData[] = existingRaw ? JSON.parse(existingRaw) : [];
    existingOrders.unshift(order);
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(existingOrders));

    // Simulation d'une persistance asynchrone pour faciliter le branchement futur d'une API
    await new Promise(resolve => setTimeout(resolve, 150));

    return { success: true, orderNumber: order.orderNumber };
  } catch (error) {
    console.error('Erreur lors de l’enregistrement de la commande:', error);
    return { success: false, orderNumber: order.orderNumber };
  }
}

/**
 * Récupère l'historique des commandes depuis le stockage local.
 */
export function getSavedOrders(): OrderData[] {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Traduction lisible des modes de réception et de paiement
 */
export function getModeReceptionLabel(mode: ModeReception): string {
  switch (mode) {
    case 'sur_place':
      return 'Sur place (À table au restaurant)';
    case 'a_emporter':
      return 'À emporter (Retrait au restaurant)';
    case 'livraison':
      return 'Livraison à domicile / bureau';
    default:
      return mode;
  }
}

export function getModePaiementLabel(mode: ModePaiement): string {
  switch (mode) {
    case 'especes':
      return 'Espèces (à la livraison ou au retrait)';
    case 'momo':
      return 'MTN Mobile Money Cameroun (+237)';
    case 'om':
      return 'Orange Money Cameroun (+237)';
    default:
      return mode;
  }
}

/**
 * Construit l'URL WhatsApp (wa.me) avec le message pré-rempli contenant tous les détails de la commande.
 */
export function generateWhatsAppOrderUrl(order: OrderData): string {
  const itemsText = order.items
    .map(item => `• *${item.quantite}x* ${item.platNom} (${formatFCFA(item.prix * item.quantite)})`)
    .join('\n');

  let detailsReception = `📍 *Mode* : ${getModeReceptionLabel(order.modeReception)}`;
  if (order.modeReception === 'livraison') {
    detailsReception += `\n🏠 *Quartier* : ${order.quartier || 'Non précisé'}`;
    if (order.adresse) {
      detailsReception += `\n📍 *Adresse exacte* : ${order.adresse}`;
    }
  }

  const notesText = order.notes ? `\n📝 *Instructions spéciales* : ${order.notes}` : '';

  const message = [
    `🇮🇹 *COMMANDE PICCOLA VENEZIA*`,
    `🔖 *Réf* : ${order.orderNumber}`,
    `----------------------------------------`,
    `👤 *Client* : ${order.clientName}`,
    `📞 *Téléphone* : ${order.clientPhone}`,
    detailsReception,
    `💳 *Paiement souhaité* : ${getModePaiementLabel(order.modePaiement)}`,
    notesText,
    `----------------------------------------`,
    `🍽️ *DÉTAIL DE LA COMMANDE* :`,
    itemsText,
    `----------------------------------------`,
    `Sous-total : ${formatFCFA(order.sousTotal)}`,
    order.modeReception === 'livraison' && order.fraisLivraison > 0
      ? `Frais de livraison : ${formatFCFA(order.fraisLivraison)}`
      : null,
    `*TOTAL À REGLER : ${formatFCFA(order.total)}*`,
    `----------------------------------------`,
    `Bonjour Piccola Venezia, je souhaite confirmer cette commande. Merci de me tenir informé !`
  ]
    .filter(Boolean)
    .join('\n');

  const cleanNumber = RESTAURANT_WHATSAPP.replace(/\D/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
