import React, { useState, useMemo, useRef } from 'react';
import { Calendar, Clock, Users, Send, Phone, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { RESERVATION_SETTINGS, RESTAURANT_WHATSAPP_DISPLAY } from '../config';
import { RESTAURANT_DATA } from '../data/restaurantData';
import {
  nettoyerTexte,
  validateNom,
  validateCameroonPhone,
  getPhoneDigits
} from '../lib/securite';
import {
  buildWhatsAppUrl,
  buildSimpleWhatsAppUrl,
  isWhatsAppUrlTooLong,
  openWhatsApp
} from '../lib/whatsapp';

interface ReservationSectionProps {
  onOpenPrivacy?: () => void;
}

/**
 * Analyse la chaîne d'horaires (ex: "11:30 - 22:30", "11h30 – 23h")
 * et génère les créneaux par pas de 30 min jusqu'à 60 min avant la fermeture.
 */
function genererCreneauxHoraires(horairesStr: string): string[] {
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
  if (dernierCreneauMins <= debutMins) return [];

  const slots: string[] = [];
  for (let m = debutMins; m <= dernierCreneauMins; m += 30) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    slots.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }

  return slots;
}

export const ReservationSection: React.FC<ReservationSectionProps> = ({ onOpenPrivacy }) => {
  const lieu = RESTAURANT_DATA.lieux[0];
  const telRestaurantDigits = getPhoneDigits(lieu.telephone);

  // Calcul des dates min et max
  const { todayIso, maxDateIso, nowMinutes } = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const maxDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const minutes = now.getHours() * 60 + now.getMinutes();
    return { todayIso: today, maxDateIso: maxDate, nowMinutes: minutes };
  }, []);

  // Génération des créneaux
  const allSlots = useMemo(() => {
    return genererCreneauxHoraires(lieu.horaires);
  }, [lieu.horaires]);

  // Formulaire
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [date, setDate] = useState(todayIso);
  const [heure, setHeure] = useState('');
  const [heureManuelle, setHeureManuelle] = useState('');
  const [personnes, setPersonnes] = useState(2);
  const [occasion, setOccasion] = useState(RESERVATION_SETTINGS.occasions[0]);
  const [demandes, setDemandes] = useState('');

  const [errors, setErrors] = useState<{
    nom?: string;
    telephone?: string;
    date?: string;
    heure?: string;
  }>({});

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [preparedMessage, setPreparedMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Filtrage des créneaux disponibles selon la date choisie
  const availableSlots = useMemo(() => {
    if (date === todayIso) {
      // Masque les créneaux qui commencent dans moins de 60 minutes
      const seuilMins = nowMinutes + 60;
      return allSlots.filter(s => {
        const [h, m] = s.split(':').map(Number);
        return h * 60 + m >= seuilMins;
      });
    }
    return allSlots;
  }, [date, todayIso, nowMinutes, allSlots]);

  // Sélectionne par défaut le premier créneau disponible si non sélectionné
  React.useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.includes(heure)) {
      setHeure(availableSlots[0]);
    }
  }, [availableSlots, heure]);

  const validateForm = (): boolean => {
    const newErrors: { nom?: string; telephone?: string; date?: string; heure?: string } = {};

    const nomVal = validateNom(nom);
    if (!nomVal.isValid) {
      newErrors.nom = nomVal.error;
    }

    const phoneVal = validateCameroonPhone(telephone);
    if (!phoneVal.isValid) {
      newErrors.telephone = phoneVal.error;
    }

    if (!date || date < todayIso || date > maxDateIso) {
      newErrors.date = 'Veuillez choisir une date valide (entre aujourd’hui et 60 jours).';
    }

    const finalHeure = allSlots.length > 0 ? heure : heureManuelle;
    if (!finalHeure) {
      newErrors.heure = 'Veuillez sélectionner ou indiquer une heure.';
    } else if (allSlots.length === 0 && !/^([01]\d|2[0-3]):[0-5]\d$/.test(finalHeure)) {
      newErrors.heure = 'Format d’heure invalide (HH:MM attendu).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const cleanNom = nettoyerTexte(nom, 60);
    const phoneVal = validateCameroonPhone(telephone);
    const cleanPhone = phoneVal.isValid ? phoneVal.formatted : telephone;
    const finalHeure = allSlots.length > 0 ? heure : heureManuelle;
    const cleanOccasion = occasion !== 'Repas classique' ? nettoyerTexte(occasion, 60) : '';
    const cleanDemandes = nettoyerTexte(demandes, 300, { multiligne: true });

    // Formatage de la date en français (ex. 12 novembre 2026)
    const [y, m, d] = date.split('-');
    const dateFormatee = `${d}/${m}/${y}`;

    // Message sans emoji selon Bloc D.6
    const lignes: (string | null)[] = [
      `Bonjour, je souhaite réserver une table pour ${personnes} personne${personnes > 1 ? 's' : ''} le ${dateFormatee} à ${finalHeure}.`,
      `Nom : ${cleanNom}`,
      `Téléphone : ${cleanPhone}`,
      cleanOccasion ? `Occasion : ${cleanOccasion}` : null,
      cleanDemandes ? `Demandes particulières : ${cleanDemandes}` : null,
      'Merci de me confirmer la disponibilité.'
    ];

    const message = lignes.filter(Boolean).join('\n');
    setPreparedMessage(message);

    const isTooLong = isWhatsAppUrlTooLong(message);
    const fullUrl = buildWhatsAppUrl(message);
    const simpleUrl = buildSimpleWhatsAppUrl();

    if (isTooLong) {
      if (simpleUrl) openWhatsApp(simpleUrl);
    } else if (fullUrl) {
      openWhatsApp(fullUrl);
    }

    setIsSubmitted(true);
  };

  const handleCopy = async () => {
    if (!preparedMessage) return;
    try {
      await navigator.clipboard.writeText(preparedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <section
      id="reservation"
      aria-label="Réserver une table"
      className="scroll-mt-16 py-14 px-4 sm:px-6 bg-[#FBF6EE] text-[#2B1A12] border-t border-[#EADFCF]"
    >
      {/* Ancre de compatibilité #reserver */}
      <div id="reserver" className="sr-only" />

      <div className="max-w-3xl mx-auto space-y-8">
        {/* En-tête */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-block">
            <span className="text-xs font-semibold text-[#A84A15] bg-[#F0E6D8] px-3.5 py-1 rounded-full border border-[#EADFCF]">
              Accueil & Réservation
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2B1A12] tracking-tight">
            Réserver une table
          </h2>
          <p className="text-xs sm:text-sm text-[#6B5446] leading-relaxed">
            Envoyez votre demande sur WhatsApp. La table n'est réservée qu'après confirmation du restaurant.
          </p>
        </div>

        {isSubmitted ? (
          /* Confirmation d'envoi */
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#EADFCF] shadow-sm text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#F0E6D8] border border-[#EADFCF] flex items-center justify-center mx-auto text-[#A84A15]">
              <Send className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif font-bold text-xl text-[#2B1A12]">
                Votre demande est prête dans WhatsApp
              </h3>
              <p className="text-xs sm:text-sm text-[#6B5446] max-w-md mx-auto leading-relaxed">
                Il reste une étape : envoyez le message pré-rempli dans l'application WhatsApp. La réservation sera effective dès réception de la réponse du restaurant.
              </p>
            </div>

            {/* Aperçu du message */}
            <div className="text-left space-y-1.5 max-w-md mx-auto">
              <div className="flex justify-between items-center text-xs font-semibold text-[#6B5446]">
                <span>Texte du message :</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[#A84A15] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
              <pre className="p-3 bg-[#FBF6EE] rounded-lg border border-[#D9C8B4] text-[11px] text-[#2B1A12] whitespace-pre-wrap font-sans">
                {preparedMessage}
              </pre>
            </div>

            {/* 3 Secours visibles (Bloc B.4) */}
            <div className="p-4 rounded-xl bg-[#F0E6D8]/70 border border-[#EADFCF] space-y-3 max-w-md mx-auto text-left">
              <div className="text-xs font-bold text-[#2B1A12]">Options de secours :</div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full py-2.5 px-3 rounded-lg bg-white border border-[#D9C8B4] text-xs font-semibold text-[#2B1A12] flex items-center justify-center gap-2 hover:bg-[#FBF6EE] transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-[#A84A15]" />
                  <span>{copied ? 'Message copié !' : 'Copier le message'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const url = buildWhatsAppUrl(preparedMessage) || buildSimpleWhatsAppUrl();
                    if (url) openWhatsApp(url);
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-white border border-[#D9C8B4] text-xs font-semibold text-[#2B1A12] flex items-center justify-center gap-2 hover:bg-[#FBF6EE] transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#A84A15]" />
                  <span>Ouvrir WhatsApp</span>
                </button>

                <a
                  href={`tel:${telRestaurantDigits}`}
                  className="w-full py-2.5 px-3 rounded-lg bg-white border border-[#D9C8B4] text-xs font-semibold text-[#2B1A12] flex items-center justify-center gap-2 hover:bg-[#FBF6EE] transition text-center"
                >
                  <Phone className="w-3.5 h-3.5 text-[#A84A15]" />
                  <span>Appeler le {RESTAURANT_WHATSAPP_DISPLAY}</span>
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="text-xs text-[#6B5446] hover:text-[#2B1A12] underline cursor-pointer"
              >
                ← Faire une autre demande de réservation
              </button>
            </div>
          </div>
        ) : (
          /* Formulaire de réservation */
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 rounded-2xl bg-white border border-[#EADFCF] shadow-sm space-y-6"
          >
            {/* Ligne Nom & Téléphone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="res-nom" className="block text-xs font-bold uppercase tracking-wider text-[#2B1A12]">
                  Nom complet *
                </label>
                <input
                  id="res-nom"
                  type="text"
                  maxLength={60}
                  required
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  placeholder="Ex. Christian Mbida"
                  aria-invalid={Boolean(errors.nom)}
                  aria-describedby={errors.nom ? 'res-nom-err' : undefined}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-xs sm:text-sm text-[#2B1A12] placeholder-[#8C7565] focus:outline-none focus:border-[#A84A15] transition"
                />
                {errors.nom && (
                  <p id="res-nom-err" role="alert" className="text-[11px] text-red-600 font-medium">
                    {errors.nom}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="res-tel" className="block text-xs font-bold uppercase tracking-wider text-[#2B1A12]">
                  Téléphone (Cameroun) *
                </label>
                <input
                  id="res-tel"
                  type="tel"
                  maxLength={20}
                  required
                  value={telephone}
                  onChange={e => setTelephone(e.target.value)}
                  placeholder="Ex. 6 99 93 17 21"
                  aria-invalid={Boolean(errors.telephone)}
                  aria-describedby={errors.telephone ? 'res-tel-err' : undefined}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-xs sm:text-sm text-[#2B1A12] placeholder-[#8C7565] focus:outline-none focus:border-[#A84A15] transition"
                />
                {errors.telephone && (
                  <p id="res-tel-err" role="alert" className="text-[11px] text-red-600 font-medium">
                    {errors.telephone}
                  </p>
                )}
              </div>
            </div>

            {/* Ligne Date & Nombre de couverts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="res-date" className="block text-xs font-bold uppercase tracking-wider text-[#2B1A12]">
                  Date de réservation *
                </label>
                <input
                  id="res-date"
                  type="date"
                  required
                  min={todayIso}
                  max={maxDateIso}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  aria-invalid={Boolean(errors.date)}
                  aria-describedby={errors.date ? 'res-date-err' : undefined}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-xs sm:text-sm text-[#2B1A12] focus:outline-none focus:border-[#A84A15] transition"
                />
                {errors.date && (
                  <p id="res-date-err" role="alert" className="text-[11px] text-red-600 font-medium">
                    {errors.date}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="res-personnes" className="block text-xs font-bold uppercase tracking-wider text-[#2B1A12]">
                  Nombre de personnes (1 à 12) *
                </label>
                <select
                  id="res-personnes"
                  value={personnes}
                  onChange={e => setPersonnes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-xs sm:text-sm text-[#2B1A12] focus:outline-none focus:border-[#A84A15] transition"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                    <option key={n} value={n}>
                      {n} personne{n > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#6B5446] pt-0.5">
                  Au-delà de 12 personnes,{' '}
                  <a href={`tel:${telRestaurantDigits}`} className="text-[#A84A15] underline font-semibold">
                    appelez-nous au {lieu.telephone}
                  </a>.
                </p>
              </div>
            </div>

            {/* Heure / Créneaux */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2B1A12]">
                Heure de réservation *
              </label>

              {allSlots.length > 0 ? (
                availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {availableSlots.map(s => {
                      const isSelected = heure === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setHeure(s)}
                          className={`py-2 px-1 text-xs rounded-lg border font-semibold tabular-nums transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#A84A15] text-white border-[#A84A15]'
                              : 'bg-white text-[#2B1A12] border-[#D9C8B4] hover:bg-[#F0E6D8]'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    Aucun créneau disponible pour aujourd'hui (fermeture proche ou délai de 60 minutes). Veuillez choisir une autre date ou{' '}
                    <a href={`tel:${telRestaurantDigits}`} className="font-bold underline">
                      appeler le restaurant
                    </a>.
                  </p>
                )
              ) : (
                <div>
                  <input
                    type="time"
                    required
                    value={heureManuelle}
                    onChange={e => setHeureManuelle(e.target.value)}
                    className="w-full sm:w-48 px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-xs sm:text-sm text-[#2B1A12] focus:outline-none focus:border-[#A84A15]"
                  />
                </div>
              )}
              {errors.heure && (
                <p role="alert" className="text-[11px] text-red-600 font-medium">
                  {errors.heure}
                </p>
              )}
            </div>

            {/* Occasion & Demandes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="res-occasion" className="block text-xs font-bold uppercase tracking-wider text-[#2B1A12]">
                  Occasion (facultatif)
                </label>
                <select
                  id="res-occasion"
                  value={occasion}
                  onChange={e => setOccasion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-xs sm:text-sm text-[#2B1A12] focus:outline-none focus:border-[#A84A15] transition"
                >
                  {RESERVATION_SETTINGS.occasions.map(occ => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="res-demandes" className="block text-xs font-bold uppercase tracking-wider text-[#2B1A12]">
                  Demandes particulières (facultatif)
                </label>
                <input
                  id="res-demandes"
                  type="text"
                  maxLength={300}
                  value={demandes}
                  onChange={e => setDemandes(e.target.value)}
                  placeholder="Ex. table en terrasse, chaise bébé..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-xs sm:text-sm text-[#2B1A12] placeholder-[#8C7565] focus:outline-none focus:border-[#A84A15] transition"
                />
              </div>
            </div>

            {/* Renvoi confidentialité */}
            <p className="text-[11px] text-[#6B5446]">
              Vos coordonnées servent uniquement à préparer le message WhatsApp.{' '}
              {onOpenPrivacy && (
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="text-[#A84A15] underline cursor-pointer"
                >
                  Consultez notre politique de confidentialité
                </button>
              )}
            </p>

            {/* Bouton d'action */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-[#EB7F36] hover:bg-[#D76E27] text-[#2B1A12] font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Envoyer ma demande sur WhatsApp</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
