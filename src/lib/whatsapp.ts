import { RESTAURANT_WHATSAPP } from '../config';

/**
 * Renvoie les chiffres du numéro WhatsApp s'il en compte entre 8 et 15, sinon null.
 */
export function getWhatsappDigits(): string | null {
  if (!RESTAURANT_WHATSAPP) return null;
  const digits = RESTAURANT_WHATSAPP.replace(/\D/g, '');
  if (digits.length >= 8 && digits.length <= 15) {
    return digits;
  }
  return null;
}

/**
 * Renvoie l'URL simple vers la discussion WhatsApp du restaurant sans texte pré-rempli.
 */
export function buildSimpleWhatsAppUrl(): string | null {
  const digits = getWhatsappDigits();
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

/**
 * Renvoie "https://wa.me/<chiffres>?text=" suivi du message encodé,
 * ou null si le numéro est invalide.
 */
export function buildWhatsAppUrl(message: string): string | null {
  const digits = getWhatsappDigits();
  if (!digits) return null;
  if (!message || message.trim() === '') {
    return `https://wa.me/${digits}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * Vérifie si l'URL complète avec le message encodé dépasse le seuil de 1800 caractères.
 */
export function isWhatsAppUrlTooLong(message: string): boolean {
  const url = buildWhatsAppUrl(message);
  return url ? url.length > 1800 : false;
}

/**
 * Ouvre l'URL WhatsApp dans un nouvel onglet sécurisé.
 */
export function openWhatsApp(url: string): void {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
