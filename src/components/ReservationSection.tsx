import React, { useState } from 'react';
import { Calendar, Clock, Users, Send, CheckCircle2, AlertCircle, Phone, User, Mail, Sparkles, MessageSquare } from 'lucide-react';
import { RESERVATION_SETTINGS, RESTAURANT_WHATSAPP_DISPLAY } from '../config';
import { ReservationData } from '../types/order';
import {
  generateReservationNumber,
  checkSlotAvailability,
  saveReservation,
  generateWhatsAppReservationUrl
} from '../services/reservationService';
import { validateCameroonPhone } from '../services/orderService';

export const ReservationSection: React.FC = () => {
  const todayIso = new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState(todayIso);
  const [heure, setHeure] = useState(RESERVATION_SETTINGS.creneauxMidi[0]);
  const [personnes, setPersonnes] = useState(2);
  const [occasion, setOccasion] = useState(RESERVATION_SETTINGS.occasions[0]);
  const [demandes, setDemandes] = useState('');

  const [errors, setErrors] = useState<{ name?: string; phone?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState<ReservationData | null>(null);

  const validateForm = (): boolean => {
    const newErrors: { name?: string; phone?: string; general?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Veuillez saisir votre nom complet.';
    }

    const phoneValidation = validateCameroonPhone(phone);
    if (!phoneValidation.valid) {
      newErrors.phone = phoneValidation.error;
    }

    if (date < todayIso) {
      newErrors.general = 'Impossible de réserver pour une date passée.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) return;

    setIsSubmitting(true);
    const phoneValidation = validateCameroonPhone(phone);

    const reservation: ReservationData = {
      reservationNumber: generateReservationNumber(),
      clientName: name.trim(),
      clientPhone: phoneValidation.formatted || phone.trim(),
      clientEmail: email.trim() || undefined,
      date,
      heure,
      personnes,
      occasion: occasion || undefined,
      demandes: demandes.trim() || undefined,
      dateCreation: new Date().toISOString()
    };

    const res = await saveReservation(reservation);
    setIsSubmitting(false);

    if (res.success) {
      setConfirmedReservation(reservation);
    } else {
      setErrors({ general: res.error || 'Erreur lors de la réservation.' });
    }
  };

  const handleReset = () => {
    setConfirmedReservation(null);
    setName('');
    setPhone('');
    setEmail('');
    setDemandes('');
    setPersonnes(2);
    setOccasion(RESERVATION_SETTINGS.occasions[0]);
  };

  return (
    <section
      id="reserver"
      aria-label="Réserver une table"
      className="scroll-mt-16 py-14 px-4 sm:px-6 bg-[#FBF6EE] text-[#2B1A12] border-t border-[#EADFCF]"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* En-tête de section */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-block">
            <span className="text-xs font-semibold text-[#A84A15] bg-[#F0E6D8] px-3.5 py-1 rounded-full border border-[#EADFCF]">
              Table & Convivialité
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#2B1A12]">
            Réserver une table
          </h2>
          <p className="text-xs sm:text-sm text-[#6B5446]">
            Partagez un moment d'exception au cœur de Bonapriso. Réservation confirmée instantanément avec envoi WhatsApp.
          </p>
        </div>

        {/* Cadre principal */}
        <div className="bg-[#F0E6D8]/60 border border-[#EADFCF] rounded-2xl p-5 sm:p-8 shadow-sm max-w-2xl mx-auto">
          {confirmedReservation ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-serif font-bold text-[#2B1A12]">
                  Votre table est pré-réservée !
                </h3>
                <p className="text-xs sm:text-sm text-[#6B5446]">
                  Référence : <span className="font-bold text-[#A84A15]">{confirmedReservation.reservationNumber}</span>
                </p>
              </div>

              {/* Fiche récapitulative */}
              <div className="bg-white border border-[#EADFCF] rounded-xl p-4 sm:p-5 text-left text-xs sm:text-sm space-y-2.5 shadow-2xs">
                <div className="flex justify-between border-b border-[#EADFCF] pb-2">
                  <span className="text-[#6B5446]">Nom :</span>
                  <span className="font-semibold text-[#2B1A12]">{confirmedReservation.clientName}</span>
                </div>
                <div className="flex justify-between border-b border-[#EADFCF] pb-2">
                  <span className="text-[#6B5446]">Téléphone :</span>
                  <span className="font-semibold text-[#2B1A12]">{confirmedReservation.clientPhone}</span>
                </div>
                <div className="flex justify-between border-b border-[#EADFCF] pb-2">
                  <span className="text-[#6B5446]">Date & Heure :</span>
                  <span className="font-semibold text-[#A84A15]">
                    {confirmedReservation.date} à {confirmedReservation.heure}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#EADFCF] pb-2">
                  <span className="text-[#6B5446]">Couverts :</span>
                  <span className="font-semibold text-[#2B1A12]">
                    {confirmedReservation.personnes} personne{confirmedReservation.personnes > 1 ? 's' : ''}
                  </span>
                </div>
                {confirmedReservation.occasion && (
                  <div className="flex justify-between border-b border-[#EADFCF] pb-2">
                    <span className="text-[#6B5446]">Occasion :</span>
                    <span className="font-semibold text-[#2B1A12]">{confirmedReservation.occasion}</span>
                  </div>
                )}
                {confirmedReservation.demandes && (
                  <div className="flex justify-between pt-1">
                    <span className="text-[#6B5446]">Demandes :</span>
                    <span className="font-medium text-[#2B1A12] italic">{confirmedReservation.demandes}</span>
                  </div>
                )}
              </div>

              {/* Action WhatsApp */}
              <div className="space-y-3 pt-2">
                <a
                  href={generateWhatsAppReservationUrl(confirmedReservation)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>Confirmer la réservation sur WhatsApp</span>
                </a>

                <p className="text-[11px] text-[#6B5446]">
                  Assistance téléphonique et WhatsApp direct : {RESTAURANT_WHATSAPP_DISPLAY}
                </p>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2 text-xs font-semibold text-[#6B5446] hover:text-[#2B1A12] underline transition"
                >
                  Effectuer une autre réservation
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-xs sm:text-sm">
              {errors.general && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.general}</span>
                </div>
              )}

              {/* 1. Ligne Nom et Téléphone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B5446] mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#A84A15]" />
                    <span>Nom complet <span className="text-[#A84A15]">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex. Emmanuel Eto'o"
                    className={`w-full px-3.5 py-2.5 rounded-lg bg-white border ${
                      errors.name ? 'border-red-500' : 'border-[#D9C8B4]'
                    } text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15] transition`}
                  />
                  {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6B5446] mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#A84A15]" />
                    <span>Téléphone (+237 Cameroun) <span className="text-[#A84A15]">*</span></span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Ex. 699 93 17 21"
                    className={`w-full px-3.5 py-2.5 rounded-lg bg-white border ${
                      errors.phone ? 'border-red-500' : 'border-[#D9C8B4]'
                    } text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15] transition`}
                  />
                  {errors.phone ? (
                    <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>
                  ) : (
                    <p className="text-[10px] text-[#6B5446] mt-0.5">Pour confirmation de disponibilité</p>
                  )}
                </div>
              </div>

              {/* 2. Email (optionnel) et Nombre de personnes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B5446] mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#A84A15]" />
                    <span>Email (facultatif)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="contact@exemple.cm"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6B5446] mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#A84A15]" />
                    <span>Nombre de personnes (1 à 12) <span className="text-[#A84A15]">*</span></span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={RESERVATION_SETTINGS.minPersonnes}
                      max={RESERVATION_SETTINGS.maxPersonnes}
                      value={personnes}
                      onChange={e => setPersonnes(parseInt(e.target.value, 10))}
                      className="flex-1 accent-[#A84A15]"
                    />
                    <span className="w-12 text-center font-serif font-bold text-sm bg-white border border-[#D9C8B4] py-1.5 rounded-lg">
                      {personnes}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Date et Créneaux horaires */}
              <div className="space-y-3 pt-2 border-t border-[#EADFCF]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#6B5446] mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#A84A15]" />
                      <span>Date de réservation <span className="text-[#A84A15]">*</span></span>
                    </label>
                    <input
                      type="date"
                      required
                      min={todayIso}
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#6B5446] mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#A84A15]" />
                      <span>Occasion particulière</span>
                    </label>
                    <select
                      value={occasion}
                      onChange={e => setOccasion(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15]"
                    >
                      {RESERVATION_SETTINGS.occasions.map(occ => (
                        <option key={occ} value={occ}>
                          {occ}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sélecteur de créneaux Midi / Soir */}
                <div>
                  <label className="block text-xs font-medium text-[#6B5446] mb-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#A84A15]" />
                    <span>Créneau horaire souhaité <span className="text-[#A84A15]">*</span></span>
                  </label>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] font-semibold text-[#6B5446] uppercase tracking-wider block mb-1.5">
                        Service du Déjeuner
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {RESERVATION_SETTINGS.creneauxMidi.map(slot => {
                          const { available } = checkSlotAvailability(date, slot);
                          const isSelected = heure === slot;
                          return (
                            <button
                              type="button"
                              key={slot}
                              disabled={!available}
                              onClick={() => setHeure(slot)}
                              className={`py-2 px-1 rounded-lg text-xs font-medium border text-center transition ${
                                isSelected
                                  ? 'bg-[#A84A15] text-white border-[#A84A15] font-bold shadow-xs'
                                  : available
                                  ? 'bg-white text-[#2B1A12] border-[#D9C8B4] hover:bg-[#F0E6D8]'
                                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-[#6B5446] uppercase tracking-wider block mb-1.5">
                        Service du Dîner
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                        {RESERVATION_SETTINGS.creneauxSoir.map(slot => {
                          const { available } = checkSlotAvailability(date, slot);
                          const isSelected = heure === slot;
                          return (
                            <button
                              type="button"
                              key={slot}
                              disabled={!available}
                              onClick={() => setHeure(slot)}
                              className={`py-2 px-1 rounded-lg text-xs font-medium border text-center transition ${
                                isSelected
                                  ? 'bg-[#A84A15] text-white border-[#A84A15] font-bold shadow-xs'
                                  : available
                                  ? 'bg-white text-[#2B1A12] border-[#D9C8B4] hover:bg-[#F0E6D8]'
                                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Demandes particulières */}
              <div className="pt-2 border-t border-[#EADFCF]">
                <label className="block text-xs font-medium text-[#6B5446] mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#A84A15]" />
                  <span>Demandes particulières (table en terrasse, allergies, etc.)</span>
                </label>
                <textarea
                  rows={2}
                  value={demandes}
                  onChange={e => setDemandes(e.target.value)}
                  placeholder="Ex. Préférence pour une table calme, anniversaire surprise, chaise haute..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15]"
                />
              </div>

              {/* Bouton de confirmation */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#A84A15] hover:bg-[#8D3C0F] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{isSubmitting ? 'Validation...' : 'Valider la réservation'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
