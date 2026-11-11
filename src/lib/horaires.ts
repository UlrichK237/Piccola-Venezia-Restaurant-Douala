/**
 * Gestion des horaires, fuseau horaire de Douala et calcul des créneaux.
 * Sans aucune dépendance externe.
 */

/**
 * Renvoie la date ISO (AAAA-MM-JJ) et les minutes écoulées depuis minuit
 * dans le fuseau horaire officiel du restaurant : "Africa/Douala".
 */
export function maintenantDouala(dateRef: Date = new Date()): { dateIso: string; minutes: number; fuseau: string } {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Douala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });

  const parts = dtf.formatToParts(dateRef);
  let year = '';
  let month = '';
  let day = '';
  let hour = 0;
  let minute = 0;

  for (const part of parts) {
    if (part.type === 'year') year = part.value;
    else if (part.type === 'month') month = part.value;
    else if (part.type === 'day') day = part.value;
    else if (part.type === 'hour') hour = parseInt(part.value, 10);
    else if (part.type === 'minute') minute = parseInt(part.value, 10);
  }

  const dateIso = `${year}-${month}-${day}`;
  const minutes = hour * 60 + minute;
  const fuseau = '+01:00';

  return { dateIso, minutes, fuseau };
}

/**
 * Calcule la date maximale autorisée (par ex. aujourd'hui + 60 jours)
 * par arithmétique sur la date ISO.
 */
export function calculerDateMax(dateIso: string, nbJours: number = 60): string {
  const [yStr, mStr, dStr] = dateIso.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10) - 1;
  const d = parseInt(dStr, 10);
  const dateObj = new Date(Date.UTC(y, m, d + nbJours));
  return dateObj.toISOString().split('T')[0];
}

export const calculerDateMaxIso = calculerDateMax;

/**
 * Analyse la chaîne d'horaires (ex: "11:30 - 22:30", "11h30 – 23h")
 * et génère les créneaux par pas de 30 min jusqu'à 60 min avant la fermeture.
 * Renvoie un tableau vide si format invalide ou fermeture après minuit.
 */
export function genererCreneauxHoraires(arg1: string, arg2?: string): string[] {
  let dateDemandeIso: string | undefined;
  let horairesStr = '';

  if (arg2 !== undefined) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(arg1)) {
      dateDemandeIso = arg1;
      horairesStr = arg2;
    } else {
      horairesStr = arg1;
      dateDemandeIso = arg2;
    }
  } else {
    horairesStr = arg1;
  }

  if (!horairesStr) return [];

  const match = horairesStr.match(/(\d{1,2})[h:]?(\d{2})?\s*[-—–]\s*(\d{1,2})[h:]?(\d{2})?/i);
  if (!match) return [];

  const hDebut = parseInt(match[1], 10);
  const mDebut = match[2] ? parseInt(match[2], 10) : 0;
  const hFin = parseInt(match[3], 10);
  const mFin = match[4] ? parseInt(match[4], 10) : 0;

  if (isNaN(hDebut) || isNaN(hFin)) return [];

  const debutMins = hDebut * 60 + mDebut;
  const finMins = hFin * 60 + mFin;

  // Créneaux jusqu'à 60 min avant la fermeture
  const dernierCreneauMins = finMins - 60;
  if (finMins <= debutMins || dernierCreneauMins < debutMins) return [];

  const slots: string[] = [];
  for (let m = debutMins; m <= dernierCreneauMins; m += 30) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    slots.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }

  if (dateDemandeIso) {
    const now = maintenantDouala();
    if (dateDemandeIso === now.dateIso) {
      return slots.filter((slot) => {
        const [h, m] = slot.split(':').map(Number);
        return h * 60 + m > now.minutes;
      });
    }
  }

  return slots;
}
