import { useState, useCallback } from 'react';

/**
 * Hook de copie dans le presse-papier avec repli document.execCommand.
 * Renvoie "ok" ou "echec".
 */
export function useCopier() {
  const [copieStatut, setCopieStatut] = useState<'ok' | 'echec' | null>(null);

  const copier = useCallback(async (texte: string): Promise<'ok' | 'echec'> => {
    if (!texte) {
      setCopieStatut('echec');
      return 'echec';
    }

    // 1. Tentative avec l'API Clipboard moderne
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(texte);
        setCopieStatut('ok');
        return 'ok';
      } catch {
        // Poursuite vers le repli
      }
    }

    // 2. Secours avec un textarea temporaire en lecture seule
    try {
      const textarea = document.createElement('textarea');
      textarea.value = texte;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const success = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (success) {
        setCopieStatut('ok');
        return 'ok';
      }
    } catch {
      // Échec de la copie
    }

    setCopieStatut('echec');
    return 'echec';
  }, []);

  const resetStatut = useCallback(() => {
    setCopieStatut(null);
  }, []);

  return { copier, copieStatut, resetStatut };
}
