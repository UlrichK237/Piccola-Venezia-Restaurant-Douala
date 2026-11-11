/**
 * Application des corrections orthographiques.
 * Sans aucun import.
 */

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remplace chaque clé du dictionnaire par sa valeur dans le texte en traitant
 * d'abord les clés les plus longues, avec respect des frontières de mots
 * pour éviter de modifier des mots plus longs qui contiennent la clé.
 * Renvoie "" si le texte est nul ou indéfini.
 */
export function appliquerCorrections(
  texte: string | null | undefined,
  dictionnaire: Record<string, string>
): string {
  if (texte === null || texte === undefined) {
    return '';
  }

  if (!dictionnaire || typeof dictionnaire !== 'object') {
    return texte;
  }

  const cles = Object.keys(dictionnaire).sort((a, b) => b.length - a.length);
  if (cles.length === 0) {
    return texte;
  }

  // Si le texte ne contient aucune clé, le renvoyer tel quel sans traitement lourd
  const contientUneCle = cles.some((cle) => cle && texte.includes(cle));
  if (!contientUneCle) {
    return texte;
  }

  let resultat = texte;
  for (const cle of cles) {
    if (!cle || !resultat.includes(cle)) continue;
    const valeur = dictionnaire[cle];
    const escaped = escapeRegex(cle);

    const firstIsLetter = /^\p{L}/u.test(cle);
    const lastIsLetter = /\p{L}$/u.test(cle);

    const prefix = firstIsLetter ? '(?<!\\p{L})' : '';
    const suffix = lastIsLetter ? '(?!\\p{L})' : '';

    const regex = new RegExp(`${prefix}${escaped}${suffix}`, 'gu');
    resultat = resultat.replace(regex, valeur);
  }

  return resultat;
}
