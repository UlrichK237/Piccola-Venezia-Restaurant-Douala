import React, { useState, useRef } from 'react';
import { X, Send, ShoppingBag, Phone, Copy, Check, ExternalLink } from 'lucide-react';
import { useCart, calculerTotal } from '../context/CartContext';
import { ModeReception } from '../types/order';
import {
  formatFCFA,
  CONDITIONS
} from '../config';
import {
  nettoyerTexte,
  validateNom,
  validatePhone,
  getPhoneDigits
} from '../lib/securite';
import {
  buildWhatsAppUrl,
  buildSimpleWhatsAppUrl,
  getWhatsappDigits,
  isWhatsAppUrlTooLong,
  openWhatsApp
} from '../lib/whatsapp';
import { useModalA11y } from '../hooks/useModalA11y';
import { useCopier } from '../hooks/useCopier';
import { applyCorrection } from './MenuSection';
import { RESTAURANT_DATA } from '../data/restaurantData';

interface OrderCheckoutModalProps {
  onOpenPrivacy?: () => void;
}

export const OrderCheckoutModal: React.FC<OrderCheckoutModalProps> = ({ onOpenPrivacy }) => {
  const { items, isCheckoutOpen, closeCheckout, clearCart } = useCart();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { containerRef } = useModalA11y({
    isOpen: isCheckoutOpen,
    onClose: closeCheckout,
    initialFocusRef: closeBtnRef
  });

  // Étape du parcours : 1 = Coordonnées, 2 = Récapitulatif, 3 = Confirmation d'envoi
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Formulaire de coordonnées
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [modeReception, setModeReception] = useState<ModeReception>('a_emporter');
  const [quartier, setQuartier] = useState('');
  const [adresse, setAdresse] = useState('');
  const [heureSouhaitee, setHeureSouhaitee] = useState('');
  const [remarquesGenerales, setRemarquesGenerales] = useState('');

  // Gestion des erreurs de saisie
  const [errors, setErrors] = useState<{
    nom?: string;
    telephone?: string;
    quartier?: string;
    adresse?: string;
  }>({});

  const { copier, copieStatut } = useCopier();
  const whatsappDigits = getWhatsappDigits();

  if (!isCheckoutOpen) return null;

  const totalPlats = calculerTotal(items);
  const fraisLivraison =
    modeReception === 'livraison' && typeof CONDITIONS.fraisLivraisonFCFA === 'number'
      ? CONDITIONS.fraisLivraisonFCFA
      : 0;
  const totalGeneral = totalPlats + fraisLivraison;

  const lieu = RESTAURANT_DATA.lieux[0];
  const telRestaurantDigits = getPhoneDigits(lieu.telephone);

  // Validation des champs
  const handleValidateStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: {
      nom?: string;
      telephone?: string;
      quartier?: string;
      adresse?: string;
    } = {};

    const nomVal = validateNom(nom);
    if (!nomVal.isValid) {
      newErrors.nom = nomVal.error;
    }

    const phoneVal = validatePhone(telephone);
    if (!phoneVal.isValid) {
      newErrors.telephone = phoneVal.error;
    }

    if (modeReception === 'livraison') {
      const cleanQuartier = nettoyerTexte(quartier, 120);
      if (cleanQuartier.length < 2) {
        newErrors.quartier = 'Veuillez préciser votre quartier à Douala.';
      }
      const cleanAdresse = nettoyerTexte(adresse, 120);
      if (cleanAdresse.length < 2) {
        newErrors.adresse = 'Veuillez préciser une adresse ou un repère de livraison.';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setStep(2);
    }
  };

  // Construction du message WhatsApp selon Bloc E.7
  const buildOrderMessage = (): string => {
    const cleanNom = nettoyerTexte(nom, 60);
    const phoneVal = validatePhone(telephone);
    const cleanPhone = phoneVal.isValid ? phoneVal.formatted : telephone;
    const cleanQuartier = nettoyerTexte(quartier, 120);
    const cleanAdresse = nettoyerTexte(adresse, 120);
    const cleanHeure = nettoyerTexte(heureSouhaitee, 30);
    const cleanRemarques = nettoyerTexte(remarquesGenerales, 300, { multiligne: true });

    const lignesPlats = items.map(item => {
      let txt = `- ${item.quantite} x ${applyCorrection(item.platNom)} : ${formatFCFA(item.prix * item.quantite)}`;
      if (item.options && item.options.length > 0) {
        txt += `\n  Options : ${item.options.join(', ')}`;
      }
      if (item.remarque) {
        txt += `\n  Remarque : ${item.remarque}`;
      }
      return txt;
    }).join('\n');

    const lignes: (string | null)[] = [
      'Bonjour, je souhaite passer commande :',
      lignesPlats,
      `Total des plats : ${formatFCFA(totalPlats)}`,
      modeReception === 'livraison' && CONDITIONS.fraisLivraisonFCFA !== null
        ? `Frais de livraison : ${formatFCFA(CONDITIONS.fraisLivraisonFCFA)}`
        : null,
      `Mode : ${modeReception === 'livraison' ? 'Livraison' : 'À emporter'}`,
      modeReception === 'livraison' ? `Quartier : ${cleanQuartier}` : null,
      modeReception === 'livraison' ? `Adresse ou repère : ${cleanAdresse}` : null,
      cleanHeure ? `Heure souhaitée : ${cleanHeure}` : null,
      `Nom : ${cleanNom}`,
      `Téléphone : ${cleanPhone}`,
      cleanRemarques ? `Remarques générales : ${cleanRemarques}` : null,
      'Merci de me confirmer la commande, le total et l’heure.'
    ];

    return lignes.filter(Boolean).join('\n');
  };

  const messageCommande = buildOrderMessage();
  const isMessageTooLongForUrl = isWhatsAppUrlTooLong(messageCommande);
  const whatsappUrl = buildWhatsAppUrl(messageCommande);
  const simpleWhatsappUrl = buildSimpleWhatsAppUrl();

  const handleCopyMessage = async () => {
    await copier(messageCommande);
  };

  const handleSendWhatsApp = () => {
    if (isMessageTooLongForUrl) {
      // Message trop long : ne pas ouvrir directement avec text, ouvrir la discussion simple
      if (simpleWhatsappUrl) {
        openWhatsApp(simpleWhatsappUrl);
      }
    } else if (whatsappUrl) {
      openWhatsApp(whatsappUrl);
    }
    setStep(3);
  };

  const handleClose = () => {
    setStep(1);
    closeCheckout();
  };

  return (
    <div
      role="presentation"
      onClick={e => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-3 sm:p-4 overflow-y-auto"
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        className="relative w-full max-w-lg bg-[#FBF6EE] border border-[#EADFCF] rounded-2xl shadow-2xl overflow-y-auto max-h-[92vh] flex flex-col text-[#2B1A12]"
      >
        {/* En-tête */}
        <div className="sticky top-0 bg-[#FBF6EE]/95 backdrop-blur-md px-5 py-4 border-b border-[#EADFCF] flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#A84A15]" aria-hidden="true" />
            <h2 id="checkout-title" className="font-serif font-bold text-base sm:text-lg text-[#2B1A12]">
              {step === 1 && 'Commander — Vos coordonnées'}
              {step === 2 && 'Récapitulatif de votre commande'}
              {step === 3 && 'Votre commande est prête à être envoyée'}
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={handleClose}
            aria-label="Fermer la fenêtre de commande"
            className="p-1.5 rounded-lg text-[#6B5446] hover:text-[#2B1A12] hover:bg-[#F0E6D8] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ÉTAPE 1 : COORDONNÉES */}
        {step === 1 && (
          <form onSubmit={handleValidateStep1} className="p-5 sm:p-6 space-y-4">
            <p className="text-xs text-[#6B5446]">
              Renseignez vos coordonnées pour préparer le message de commande à envoyer sur WhatsApp.
            </p>

            {/* Nom */}
            <div className="space-y-1">
              <label htmlFor="cmd-nom" className="block text-xs font-bold uppercase tracking-wider text-[#2B1A12]">
                Nom complet *
              </label>
              <input
                id="cmd-nom"
                type="text"
                maxLength={60}
                required
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Ex. Jean Dupont"
                aria-invalid={Boolean(errors.nom)}
                aria-describedby={errors.nom ? 'cmd-nom-err' : undefined}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-xs sm:text-sm text-[#2B1A12] placeholder-[#8C7565] focus:outline-none focus:border-[#A84A15] transition"
              />
              {errors.nom && (
                <p id="cmd-nom-err" role="alert" className="text-[11px] text-red-600 font-medium">
                  {errors.nom}
                </p>
              )}
            </div>

            {/* Téléphone */}
            <div className="space-y-1">
              <label htmlFor="cmd-tel" className="block text-xs font-bold uppercase tracking-wider text-[#2B1A12]">
                Téléphone *
              </label>
              <input
                id="cmd-tel"
                type="tel"
                maxLength={25}
                required
                value={telephone}
                onChange={e => setTelephone(e.target.value)}
                placeholder="Ex. 6 99 93 17 21 ou +33 6 12 34 56 78"
                aria-invalid={Boolean(errors.telephone)}
                aria-describedby={errors.telephone ? 'cmd-tel-err' : 'cmd-tel-help'}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-xs sm:text-sm text-[#2B1A12] placeholder-[#8C7565] focus:outline-none focus:border-[#A84A15] transition"
              />
              <p id="cmd-tel-help" className="text-[11px] text-[#6B5446]">
                Numéro camerounais ou international avec indicatif
              </p>
              {errors.telephone && (
                <p id="cmd-tel-err" role="alert" className="text-[11px] text-red-600 font-medium">
                  {errors.telephone}
                </p>
              )}
            </div>

            {/* Mode de réception : À emporter ou Livraison */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2B1A12]">
                Mode de réception *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModeReception('a_emporter')}
                  className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold transition text-left cursor-pointer ${
                    modeReception === 'a_emporter'
                      ? 'border-[#A84A15] bg-[#F0E6D8] text-[#2B1A12]'
                      : 'border-[#D9C8B4] bg-white text-[#6B5446] hover:bg-[#FBF6EE]'
                  }`}
                >
                  À emporter
                </button>
                <button
                  type="button"
                  onClick={() => setModeReception('livraison')}
                  className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold transition text-left cursor-pointer ${
                    modeReception === 'livraison'
                      ? 'border-[#A84A15] bg-[#F0E6D8] text-[#2B1A12]'
                      : 'border-[#D9C8B4] bg-white text-[#6B5446] hover:bg-[#FBF6EE]'
                  }`}
                >
                  Livraison
                </button>
              </div>
              <p className="text-[11px] text-[#6B5446] leading-relaxed italic">
                Le restaurant confirme par WhatsApp ou par téléphone s'il peut livrer à votre adresse, et les frais éventuels.
              </p>
            </div>

            {/* Champs livraison */}
            {modeReception === 'livraison' && (
              <div className="p-3.5 bg-[#F0E6D8]/60 rounded-xl border border-[#EADFCF] space-y-3">
                <div className="space-y-1">
                  <label htmlFor="cmd-quartier" className="block text-xs font-bold uppercase tracking-wider text-[#2B1A12]">
                    Quartier à Douala *
                  </label>
                  <input
                    id="cmd-quartier"
                    type="text"
                    maxLength={120}
                    required
                    value={quartier}
                    onChange={e => setQuartier(e.target.value)}
                    placeholder="Ex. Bonapriso, Akwa, Bonanjo, Bali..."
                    aria-invalid={Boolean(errors.quartier)}
                    aria-describedby={errors.quartier ? 'cmd-quartier-err' : undefined}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-xs sm:text-sm text-[#2B1A12] placeholder-[#8C7565] focus:outline-none focus:border-[#A84A15] transition"
                  />
                  {errors.quartier && (
                    <p id="cmd-quartier-err" role="alert" className="text-[11px] text-red-600 font-medium">
                      {errors.quartier}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="cmd-adresse" className="block text-xs font-bold uppercase tracking-wider text-[#2B1A12]">
                    Adresse ou repère précis *
                  </label>
                  <input
                    id="cmd-adresse"
                    type="text"
                    maxLength={120}
                    required
                    value={adresse}
                    onChange={e => setAdresse(e.target.value)}
                    placeholder="Ex. Rue Toyota, face pharmacie, Immeuble..."
                    aria-invalid={Boolean(errors.adresse)}
                    aria-describedby={errors.adresse ? 'cmd-adresse-err' : undefined}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-xs sm:text-sm text-[#2B1A12] placeholder-[#8C7565] focus:outline-none focus:border-[#A84A15] transition"
                  />
                  {errors.adresse && (
                    <p id="cmd-adresse-err" role="alert" className="text-[11px] text-red-600 font-medium">
                      {errors.adresse}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Heure souhaitée facultative */}
            <div className="space-y-1">
              <label htmlFor="cmd-heure" className="block text-xs font-bold uppercase tracking-wider text-[#2B1A12]">
                Heure souhaitée (facultatif)
              </label>
              <input
                id="cmd-heure"
                type="text"
                maxLength={30}
                value={heureSouhaitee}
                onChange={e => setHeureSouhaitee(e.target.value)}
                placeholder="Ex. Dès que possible ou 13:00"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-xs sm:text-sm text-[#2B1A12] placeholder-[#8C7565] focus:outline-none focus:border-[#A84A15] transition"
              />
            </div>

            {/* Remarques générales */}
            <div className="space-y-1">
              <label htmlFor="cmd-remarques" className="block text-xs font-bold uppercase tracking-wider text-[#2B1A12]">
                Remarques générales (facultatif)
              </label>
              <textarea
                id="cmd-remarques"
                rows={2}
                maxLength={300}
                value={remarquesGenerales}
                onChange={e => setRemarquesGenerales(e.target.value)}
                placeholder="Précisions pour la cuisine ou la livraison..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-xs sm:text-sm text-[#2B1A12] placeholder-[#8C7565] focus:outline-none focus:border-[#A84A15] transition resize-none"
              />
            </div>

            {/* Condition de règlement */}
            <p className="text-[11px] text-[#6B5446] pt-1">
              Le règlement se fait directement avec le restaurant, selon ses modalités.
            </p>

            {/* Renvoi confidentialité */}
            <p className="text-[11px] text-[#6B5446]">
              Vos données ne sont ni conservées sur un serveur ni vendues.{' '}
              {onOpenPrivacy && (
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="text-[#A84A15] underline cursor-pointer"
                >
                  Voir la politique de confidentialité
                </button>
              )}
            </p>

            <div className="pt-3 border-t border-[#EADFCF] flex items-center justify-between">
              <div className="text-xs">
                <span className="text-[#6B5446]">Total des plats : </span>
                <span className="font-bold text-[#2B1A12] text-sm tabular-nums">
                  {formatFCFA(totalPlats)}
                </span>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#EB7F36] hover:bg-[#D76E27] text-[#2B1A12] text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer"
              >
                Suivant (Récapitulatif)
              </button>
            </div>
          </form>
        )}

        {/* ÉTAPE 2 : RÉCAPITULATIF */}
        {step === 2 && (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#F0E6D8] border border-[#EADFCF] text-xs sm:text-sm space-y-1.5">
                <div className="font-bold text-[#2B1A12]">{nettoyerTexte(nom, 60)}</div>
                <div className="text-[#6B5446]">Téléphone : {telephone}</div>
                <div className="text-[#6B5446]">
                  Mode : {modeReception === 'livraison' ? 'Livraison' : 'À emporter'}
                </div>
                {modeReception === 'livraison' && (
                  <div className="text-[#6B5446]">
                    Quartier : {nettoyerTexte(quartier, 120)} • {nettoyerTexte(adresse, 120)}
                  </div>
                )}
                {heureSouhaitee && (
                  <div className="text-[#6B5446]">
                    Heure souhaitée : {nettoyerTexte(heureSouhaitee, 30)}
                  </div>
                )}
                {remarquesGenerales && (
                  <div className="text-[#6B5446] italic">
                    « {nettoyerTexte(remarquesGenerales, 300)} »
                  </div>
                )}
              </div>

              {/* Liste récapitulative des plats */}
              <div className="border border-[#EADFCF] rounded-xl p-3.5 bg-white divide-y divide-[#EADFCF] space-y-2 text-xs">
                {items.map((it, idx) => (
                  <div key={idx} className="pt-2 first:pt-0">
                    <div className="flex justify-between font-medium text-[#2B1A12]">
                      <span>
                        {it.quantite} x {applyCorrection(it.platNom)}
                      </span>
                      <span className="tabular-nums font-semibold">
                        {formatFCFA(it.prix * it.quantite)}
                      </span>
                    </div>
                    {it.options && it.options.length > 0 && (
                      <div className="text-[11px] text-[#A84A15]">
                        Options : {it.options.join(', ')}
                      </div>
                    )}
                    {it.remarque && (
                      <div className="text-[11px] text-[#6B5446] italic">
                        « {it.remarque} »
                      </div>
                    )}
                  </div>
                ))}

                <div className="pt-3 flex justify-between items-baseline font-bold text-sm text-[#2B1A12]">
                  <span>Total des plats :</span>
                  <span className="tabular-nums text-[#A84A15]">{formatFCFA(totalPlats)}</span>
                </div>
              </div>

              <p className="text-[11px] text-[#6B5446] italic">
                Le règlement se fait directement avec le restaurant, selon ses modalités.
              </p>
            </div>

            {/* Avertissement message long si URL > 1800 car. (Bloc B.3) */}
            {isMessageTooLongForUrl && (
              <div role="alert" className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 text-xs space-y-2">
                <p className="font-semibold">
                  Votre message est long : copiez-le, puis collez-le dans WhatsApp.
                </p>
              </div>
            )}

            {/* Aperçu du message textuel */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-[#6B5446]">
                <span>Message préparé :</span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-[#A84A15] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier</span>
                </button>
              </div>
              <textarea
                readOnly
                aria-label="Message prêt à copier"
                value={messageCommande}
                rows={6}
                className="w-full p-3 bg-white rounded-lg border border-[#D9C8B4] text-[11px] text-[#2B1A12] font-sans resize-none focus:outline-none focus:border-[#A84A15]"
              />
              {copieStatut === 'ok' && (
                <p role="status" className="text-xs text-green-700 font-medium">
                  Message copié
                </p>
              )}
              {copieStatut === 'echec' && (
                <p role="status" className="text-xs text-red-600 font-medium">
                  Copie impossible : sélectionnez le texte ci-dessus et copiez-le.
                </p>
              )}
            </div>

            {/* Boutons d'action et secours */}
            <div className="space-y-2.5 pt-2 border-t border-[#EADFCF]">
              {whatsappDigits ? (
                <>
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="w-full py-3 px-4 rounded-xl bg-[#EB7F36] hover:bg-[#D76E27] text-[#2B1A12] font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Ouvrir WhatsApp pour envoyer</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="py-2.5 px-3 rounded-lg border border-[#D9C8B4] bg-white hover:bg-[#F0E6D8] text-[#2B1A12] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#A84A15]" />
                      <span>Copier le message</span>
                    </button>

                    <a
                      href={`tel:${telRestaurantDigits}`}
                      className="py-2.5 px-3 rounded-lg border border-[#D9C8B4] bg-white hover:bg-[#F0E6D8] text-[#2B1A12] font-medium flex items-center justify-center gap-1.5 transition text-center"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#A84A15]" />
                      <span>Appeler le restaurant</span>
                    </a>
                  </div>
                </>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                  <p className="text-xs sm:text-sm text-[#6B5446]">
                    L'envoi par WhatsApp n'est pas disponible pour le moment. Copiez le message ou appelez le restaurant.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="py-2.5 px-3 rounded-lg border border-[#D9C8B4] bg-white hover:bg-[#F0E6D8] text-[#2B1A12] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#A84A15]" />
                      <span>Copier le message</span>
                    </button>

                    <a
                      href={`tel:${telRestaurantDigits}`}
                      className="py-2.5 px-3 rounded-lg border border-[#D9C8B4] bg-white hover:bg-[#F0E6D8] text-[#2B1A12] font-medium flex items-center justify-center gap-1.5 transition text-center"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#A84A15]" />
                      <span>Appeler</span>
                    </a>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[#6B5446] hover:text-[#2B1A12] underline cursor-pointer"
                >
                  ← Modifier mes coordonnées
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : CONFIRMATION D'ENVOI */}
        {step === 3 && (
          <div className="p-6 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#F0E6D8] border border-[#EADFCF] flex items-center justify-center mx-auto text-[#A84A15]">
              <Send className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif font-bold text-lg text-[#2B1A12]">
                Message prêt dans WhatsApp
              </h3>
              <p className="text-xs sm:text-sm text-[#6B5446] max-w-sm mx-auto leading-relaxed">
                Il reste une étape : envoyez le message sur WhatsApp. Votre commande n'est prise en compte qu'après la réponse du restaurant.
              </p>
            </div>

            {/* Secours visibles */}
            <div className="p-4 rounded-xl bg-[#F0E6D8]/70 border border-[#EADFCF] space-y-3 text-left">
              <div className="text-xs font-bold text-[#2B1A12]">Options de secours :</div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="w-full py-2.5 px-3 rounded-lg bg-white border border-[#D9C8B4] text-xs font-semibold text-[#2B1A12] flex items-center justify-center gap-2 hover:bg-[#FBF6EE] transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-[#A84A15]" />
                  <span>Copier le message</span>
                </button>

                {simpleWhatsappUrl && (
                  <button
                    type="button"
                    onClick={() => openWhatsApp(simpleWhatsappUrl)}
                    className="w-full py-2.5 px-3 rounded-lg bg-white border border-[#D9C8B4] text-xs font-semibold text-[#2B1A12] flex items-center justify-center gap-2 hover:bg-[#FBF6EE] transition cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#A84A15]" />
                    <span>Ouvrir WhatsApp</span>
                  </button>
                )}

                <a
                  href={`tel:${telRestaurantDigits}`}
                  className="w-full py-2.5 px-3 rounded-lg bg-white border border-[#D9C8B4] text-xs font-semibold text-[#2B1A12] flex items-center justify-center gap-2 hover:bg-[#FBF6EE] transition text-center"
                >
                  <Phone className="w-3.5 h-3.5 text-[#A84A15]" />
                  <span>Appeler</span>
                </a>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  handleClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#A84A15] hover:bg-[#8D3C0F] text-white text-xs font-semibold transition cursor-pointer"
              >
                Vider le panier et fermer
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#D9C8B4] hover:bg-[#F0E6D8] text-[#2B1A12] text-xs font-semibold transition cursor-pointer"
              >
                Garder le panier et fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
