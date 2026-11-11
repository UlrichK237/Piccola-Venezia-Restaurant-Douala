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

  // Supprime les balises HTML complètes
  t = t.replace(/<[^>]*>/g, '');

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
 * Refuse explicitement balises HTML, scripts et chevrons.
 */
export function validateNom(nom: string): {
  isValid: boolean;
  valide: boolean;
  cleaned: string;
  error?: string;
  erreur?: string;
} {
  if (!nom || typeof nom !== 'string') {
    return {
      isValid: false,
      valide: false,
      cleaned: '',
      error: 'Veuillez saisir votre nom (au moins 2 caractères).',
      erreur: 'Veuillez saisir votre nom (au moins 2 caractères).'
    };
  }

  if (nom.includes('<') || nom.includes('>') || /<[^>]+>/i.test(nom) || /script/i.test(nom)) {
    return {
      isValid: false,
      valide: false,
      cleaned: '',
      error: 'Le nom ne peut pas contenir de balises HTML ou caractères non autorisés.',
      erreur: 'Le nom ne peut pas contenir de balises HTML ou caractères non autorisés.'
    };
  }

  const cleaned = nettoyerTexte(nom, 60, { multiligne: false });
  if (cleaned.length < 2) {
    return {
      isValid: false,
      valide: false,
      cleaned,
      error: 'Veuillez saisir votre nom (au moins 2 caractères).',
      erreur: 'Veuillez saisir votre nom (au moins 2 caractères).'
    };
  }
  if (!/\p{L}/u.test(cleaned)) {
    return {
      isValid: false,
      valide: false,
      cleaned,
      error: 'Le nom doit contenir des lettres.',
      erreur: 'Le nom doit contenir des lettres.'
    };
  }
  return { isValid: true, valide: true, cleaned };
}

/**
 * Valide un numéro de téléphone camerounais ou international.
 */
export function validatePhone(phone: string): {
  isValid: boolean;
  valide: boolean;
  telephoneE164: string;
  telephoneNormalise: string;
  cleaned: string;
  formatted: string;
  error?: string;
  erreur?: string;
} {
  if (!phone || typeof phone !== 'string') {
    const msg = 'Le numéro de téléphone est obligatoire.';
    return {
      isValid: false,
      valide: false,
      telephoneE164: '',
      telephoneNormalise: '',
      cleaned: '',
      formatted: '',
      error: msg,
      erreur: msg
    };
  }

  // Retirer les espaces, points, tirets et parenthèses
  let s = phone.replace(/[\s.\-()]/g, '');

  if (!s) {
    const msg = 'Le numéro de téléphone est obligatoire.';
    return {
      isValid: false,
      valide: false,
      telephoneE164: '',
      telephoneNormalise: '',
      cleaned: '',
      formatted: '',
      error: msg,
      erreur: msg
    };
  }

  // Un numéro qui commence par "00" voit ce préfixe remplacé par "+"
  if (s.startsWith('00')) {
    s = '+' + s.slice(2);
  }

  if (s.startsWith('+')) {
    const digits = s.slice(1);
    if (!/^\d+$/.test(digits) || digits.length < 8 || digits.length > 15 || digits[0] === '0') {
      const msg = 'Numéro international invalide : 8 à 15 chiffres requis avec indicatif.';
      return {
        isValid: false,
        valide: false,
        telephoneE164: '',
        telephoneNormalise: '',
        cleaned: digits,
        formatted: phone,
        error: msg,
        erreur: msg
      };
    }

    if (digits.startsWith('237')) {
      const national = digits.slice(3);
      if (national.length !== 9) {
        const msg = 'Le numéro doit comporter 9 chiffres (ex : 6 99 93 17 21).';
        return {
          isValid: false,
          valide: false,
          telephoneE164: '',
          telephoneNormalise: '',
          cleaned: digits,
          formatted: phone,
          error: msg,
          erreur: msg
        };
      }
      if (national[0] !== '6' && national[0] !== '2') {
        const msg = "Un numéro camerounais commence par 6 ou 2. Pour un numéro étranger, écrivez-le avec l'indicatif (ex : +33 6 12 34 56 78).";
        return {
          isValid: false,
          valide: false,
          telephoneE164: '',
          telephoneNormalise: '',
          cleaned: digits,
          formatted: phone,
          error: msg,
          erreur: msg
        };
      }
      const formatted = `+237 ${national[0]} ${national.slice(1, 3)} ${national.slice(3, 5)} ${national.slice(5, 7)} ${national.slice(7, 9)}`;
      return {
        isValid: true,
        valide: true,
        telephoneE164: `+237${national}`,
        telephoneNormalise: national,
        cleaned: `237${national}`,
        formatted
      };
    }

    return {
      isValid: true,
      valide: true,
      telephoneE164: `+${digits}`,
      telephoneNormalise: digits,
      cleaned: digits,
      formatted: `+${digits}`
    };
  }

  // Un numéro sans préfixe est un numéro camerounais
  if (!/^\d+$/.test(s)) {
    const msg = 'Le numéro doit comporter 9 chiffres (ex : 6 99 93 17 21).';
    return {
      isValid: false,
      valide: false,
      telephoneE164: '',
      telephoneNormalise: '',
      cleaned: s,
      formatted: phone,
      error: msg,
      erreur: msg
    };
  }

  let nationalNumber = s;
  if (s.startsWith('237') && s.length === 12) {
    nationalNumber = s.slice(3);
  }

  if (nationalNumber.length !== 9) {
    const msg = 'Le numéro doit comporter 9 chiffres (ex : 6 99 93 17 21).';
    return {
      isValid: false,
      valide: false,
      telephoneE164: '',
      telephoneNormalise: '',
      cleaned: s,
      formatted: phone,
      error: msg,
      erreur: msg
    };
  }

  const firstDigit = nationalNumber[0];
  if (firstDigit !== '6' && firstDigit !== '2') {
    const msg = "Un numéro camerounais commence par 6 ou 2. Pour un numéro étranger, écrivez-le avec l'indicatif (ex : +33 6 12 34 56 78).";
    return {
      isValid: false,
      valide: false,
      telephoneE164: '',
      telephoneNormalise: '',
      cleaned: s,
      formatted: phone,
      error: msg,
      erreur: msg
    };
  }

  const formatted = `+237 ${nationalNumber[0]} ${nationalNumber.slice(1, 3)} ${nationalNumber.slice(3, 5)} ${nationalNumber.slice(5, 7)} ${nationalNumber.slice(7, 9)}`;

  return {
    isValid: true,
    valide: true,
    telephoneE164: `+237${nationalNumber}`,
    telephoneNormalise: nationalNumber,
    cleaned: `237${nationalNumber}`,
    formatted
  };
}

export const validateCameroonPhone = validatePhone;

/**
 * Assainit un texte : neutralise balises HTML et sauts de ligne excessifs.
 */
export function sanitizeText(texte: string | null | undefined): string {
  if (texte === null || texte === undefined) return '';
  return nettoyerTexte(texte, 2000, { multiligne: true });
}

/**
 * Construit une URL WhatsApp sécurisée en vérifiant le numéro et encodant le message.
 */
export function buildWhatsAppUrl(destinataireOuMessage: string, messageOptionnel?: string): string | null {
  let phone = '';
  let msg = '';

  if (messageOptionnel !== undefined) {
    phone = destinataireOuMessage;
    msg = messageOptionnel;
  } else {
    const digitsOnly = destinataireOuMessage.replace(/\D/g, '');
    if (digitsOnly.length >= 8 && digitsOnly.length <= 15 && (destinataireOuMessage.startsWith('+') || /^\d+$/.test(destinataireOuMessage.trim()))) {
      phone = destinataireOuMessage;
      msg = '';
    } else {
      msg = destinataireOuMessage;
    }
  }

  const digits = phone.replace(/\D/g, '');
  if (!digits || digits.length < 8 || digits.length > 15) {
    return null;
  }

  const domain = ['wa', 'me'].join('.');
  if (!msg || msg.trim() === '') {
    return `https://${domain}/${digits}`;
  }

  const safeMsg = sanitizeText(msg);
  return `https://${domain}/${digits}?text=${encodeURIComponent(safeMsg)}`;
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
