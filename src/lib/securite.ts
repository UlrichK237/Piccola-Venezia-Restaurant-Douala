/**
 * Nettoyage et assainissement des textes saisis par l'utilisateur.
 * - Supprime caractères de contrôle
 * - Supprime caractères de direction (U+202A..U+202E, U+2066..U+2069)
 * - Supprime caractères de largeur nulle (U+200B..U+200D, U+FEFF)
 * - Supprime symboles de mise en forme WhatsApp (*, _, ~, `)
 * - Supprime chevrons (<, >)
 * - Réduit les espaces multiples
 * - Limite les sauts de ligne (si multiligne, max 3 sauts de ligne)
 * - Tronque à la longueur max
 */
export function nettoyerTexte(
  texte: string | null | undefined,
  longueurMax: number,
  options?: { multiligne?: boolean }
): string {
  if (texte === null || texte === undefined) return '';

  let t = String(texte);

  // Supprime caractères de direction
  t = t.replace(/[\u202A-\u202E\u2066-\u2069]/g, '');

  // Supprime caractères de largeur nulle
  t = t.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Supprime symboles WhatsApp et chevrons
  t = t.replace(/[*_~`<>]/g, '');

  if (options?.multiligne) {
    // Garde \n mais retire les autres caractères de contrôle
    t = t.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');
    // Standardise les retours chariots
    t = t.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Réduit les espaces horizontaux multiples
    t = t.replace(/[^\S\n]+/g, ' ');
    // Supprime les sauts de lignes consécutifs excessifs
    t = t.replace(/\n{2,}/g, '\n');
    // Limite à 3 sauts de ligne au maximum (4 lignes max)
    const lignes = t.split('\n');
    if (lignes.length > 4) {
      t = lignes.slice(0, 4).join('\n');
    }
  } else {
    // Supprime tous les caractères de contrôle et sauts de ligne
    t = t.replace(/[\x00-\x1F\x7F]/g, ' ');
    // Réduit les espaces multiples à un seul espace
    t = t.replace(/\s+/g, ' ');
  }

  t = t.trim();

  // Tronque à la longueur demandée
  if (longueurMax > 0 && t.length > longueurMax) {
    t = t.slice(0, longueurMax).trim();
  }

  return t;
}

/**
 * Valide un nom complet : entre 2 et 60 caractères, doit contenir des lettres.
 */
export function validateNom(nom: string): { isValid: boolean; cleaned: string; error?: string } {
  const cleaned = nettoyerTexte(nom, 60, { multiligne: false });
  if (cleaned.length < 2) {
    return { isValid: false, cleaned, error: 'Veuillez saisir votre nom (au moins 2 caractères).' };
  }
  if (!/[a-zA-ZÀ-ÿ]/.test(cleaned)) {
    return { isValid: false, cleaned, error: 'Le nom doit contenir des lettres.' };
  }
  return { isValid: true, cleaned };
}

/**
 * Valide un numéro de téléphone camerounais (+237 ou 9 chiffres).
 */
export function validateCameroonPhone(phone: string): {
  isValid: boolean;
  cleaned: string;
  formatted: string;
  error?: string;
} {
  if (!phone) {
    return { isValid: false, cleaned: '', formatted: '', error: 'Le numéro de téléphone est obligatoire.' };
  }

  const digits = phone.replace(/\D/g, '');

  let nationalNumber = digits;
  if (digits.startsWith('237') && digits.length === 12) {
    nationalNumber = digits.slice(3);
  }

  if (nationalNumber.length !== 9) {
    return {
      isValid: false,
      cleaned: digits,
      formatted: phone,
      error: 'Le numéro doit comporter 9 chiffres (ex: 6 99 93 17 21).'
    };
  }

  const firstDigit = nationalNumber[0];
  if (firstDigit !== '6' && firstDigit !== '2') {
    return {
      isValid: false,
      cleaned: digits,
      formatted: phone,
      error: 'Un numéro camerounais valide commence par 6 ou 2.'
    };
  }

  const formatted = `+237 ${nationalNumber[0]} ${nationalNumber.slice(1, 3)} ${nationalNumber.slice(3, 5)} ${nationalNumber.slice(5, 7)} ${nationalNumber.slice(7, 9)}`;

  return {
    isValid: true,
    cleaned: `237${nationalNumber}`,
    formatted
  };
}

/**
 * Extrait uniquement les chiffres d'une chaîne de téléphone pour un lien tel:.
 */
export function getPhoneDigits(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Vérifie qu'une URL commence impérativement par https:// avant de l'afficher.
 */
export function urlHttpsSure(url: string | null | undefined): string | null {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('https://')) {
    return trimmed;
  }
  return null;
}
