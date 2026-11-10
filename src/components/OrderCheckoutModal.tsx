import React, { useState } from 'react';
import { X, Send, ShoppingBag, MapPin, CreditCard, CheckCircle2, User, Phone, FileText } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ModeReception, ModePaiement, OrderData } from '../types/order';
import { formatFCFA, DELIVERY_SETTINGS, RESTAURANT_WHATSAPP_DISPLAY } from '../config';
import {
  validateCameroonPhone,
  generateOrderNumber,
  saveOrder,
  generateWhatsAppOrderUrl,
  getModeReceptionLabel,
  getModePaiementLabel
} from '../services/orderService';

export const OrderCheckoutModal: React.FC = () => {
  const { items, subtotal, isCheckoutOpen, closeCheckout, clearCart } = useCart();

  // État du formulaire
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [modeReception, setModeReception] = useState<ModeReception>('livraison');
  const [quartier, setQuartier] = useState(DELIVERY_SETTINGS.quartiersDouala[0]);
  const [adresse, setAdresse] = useState('');
  const [notes, setNotes] = useState('');
  const [modePaiement, setModePaiement] = useState<ModePaiement>('especes');

  // Gestion des erreurs
  const [errors, setErrors] = useState<{ name?: string; phone?: string; adresse?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Commande confirmée
  const [confirmedOrder, setConfirmedOrder] = useState<OrderData | null>(null);

  if (!isCheckoutOpen) return null;

  const fraisLivraison = modeReception === 'livraison' ? DELIVERY_SETTINGS.fraisLivraisonFCFA : 0;
  const total = subtotal + fraisLivraison;

  const validateForm = (): boolean => {
    const newErrors: { name?: string; phone?: string; adresse?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Veuillez saisir votre nom complet.';
    }

    const phoneValidation = validateCameroonPhone(phone);
    if (!phoneValidation.valid) {
      newErrors.phone = phoneValidation.error;
    }

    if (modeReception === 'livraison' && !adresse.trim()) {
      newErrors.adresse = 'Veuillez préciser la rue, le repère ou l’immeuble de livraison.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const phoneValidation = validateCameroonPhone(phone);

    const order: OrderData = {
      orderNumber: generateOrderNumber(),
      clientName: name.trim(),
      clientPhone: phoneValidation.formatted || phone.trim(),
      modeReception,
      quartier: modeReception === 'livraison' ? quartier : undefined,
      adresse: modeReception === 'livraison' ? adresse.trim() : undefined,
      notes: notes.trim() || undefined,
      modePaiement,
      items: [...items],
      sousTotal: subtotal,
      fraisLivraison,
      total,
      dateCreation: new Date().toISOString()
    };

    const res = await saveOrder(order);
    setIsSubmitting(false);

    if (res.success) {
      setConfirmedOrder(order);
      clearCart();
    }
  };

  const handleClose = () => {
    setConfirmedOrder(null);
    closeCheckout();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Finaliser la commande"
    >
      <div className="relative w-full max-w-lg bg-[#FBF6EE] border border-[#EADFCF] rounded-2xl shadow-2xl overflow-hidden my-auto text-[#2B1A12] max-h-[92vh] flex flex-col">
        {/* En-tête de la modale */}
        <div className="p-4 sm:p-5 border-b border-[#EADFCF] bg-[#F0E6D8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#EB7F36]/20 text-[#A84A15]">
              <ShoppingBag className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#2B1A12]">
                {confirmedOrder ? 'Commande Confirmée' : 'Finaliser votre commande'}
              </h3>
              <p className="text-xs text-[#6B5446]">
                {confirmedOrder
                  ? `Réf : ${confirmedOrder.orderNumber}`
                  : `${items.length} produit(s) • Total : ${formatFCFA(total)}`}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label="Fermer"
            className="p-1.5 text-[#6B5446] hover:text-[#2B1A12] rounded-lg hover:bg-[#EADFCF] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps : Soit le Récapitulatif de confirmation, soit le Formulaire */}
        {confirmedOrder ? (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-serif font-bold text-[#2B1A12]">
                Merci pour votre commande !
              </h4>
              <p className="text-xs sm:text-sm text-[#6B5446]">
                Votre commande a été enregistrée avec succès. Vous pouvez dès maintenant l’envoyer sur WhatsApp au restaurant pour accélérer sa préparation.
              </p>
            </div>

            {/* Fiche récapitulative */}
            <div className="bg-[#F0E6D8]/70 border border-[#EADFCF] rounded-xl p-4 text-left text-xs space-y-2.5">
              <div className="flex justify-between items-baseline border-b border-[#EADFCF] pb-2 font-bold text-[#A84A15]">
                <span>Numéro de commande</span>
                <span>{confirmedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B5446]">Client :</span>
                <span className="font-semibold text-[#2B1A12]">{confirmedOrder.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B5446]">Téléphone :</span>
                <span className="font-semibold text-[#2B1A12]">{confirmedOrder.clientPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B5446]">Réception :</span>
                <span className="font-semibold text-[#2B1A12]">{getModeReceptionLabel(confirmedOrder.modeReception)}</span>
              </div>
              {confirmedOrder.quartier && (
                <div className="flex justify-between">
                  <span className="text-[#6B5446]">Zone de livraison :</span>
                  <span className="font-semibold text-[#2B1A12]">{confirmedOrder.quartier}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#6B5446]">Paiement :</span>
                <span className="font-semibold text-[#2B1A12]">{getModePaiementLabel(confirmedOrder.modePaiement)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-[#EADFCF] font-bold text-sm text-[#2B1A12]">
                <span>Total à régler :</span>
                <span>{formatFCFA(confirmedOrder.total)}</span>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="space-y-2 pt-2">
              <a
                href={generateWhatsAppOrderUrl(confirmedOrder)}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Envoyer la commande sur WhatsApp</span>
              </a>

              <p className="text-[11px] text-[#6B5446]">
                Numéro WhatsApp officiel du restaurant : {RESTAURANT_WHATSAPP_DISPLAY}
              </p>

              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-lg border border-[#D9C8B4] hover:bg-[#F0E6D8] text-xs font-semibold text-[#2B1A12] transition"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
            {/* 1. Informations client */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#A84A15] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Coordonnées du client</span>
              </h4>

              <div>
                <label className="block text-xs font-medium text-[#6B5446] mb-1">
                  Nom complet <span className="text-[#A84A15]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex. Jean-Paul Mbarga"
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-white border ${
                    errors.name ? 'border-red-500' : 'border-[#D9C8B4]'
                  } text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15] transition`}
                />
                {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B5446] mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#A84A15]" />
                  <span>Numéro de téléphone (Cameroun) <span className="text-[#A84A15]">*</span></span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ex. 699 93 17 21 ou +237 6..."
                  className={`w-full px-3.5 py-2.5 rounded-lg bg-white border ${
                    errors.phone ? 'border-red-500' : 'border-[#D9C8B4]'
                  } text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15] transition`}
                />
                {errors.phone ? (
                  <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>
                ) : (
                  <p className="text-[10px] text-[#6B5446] mt-0.5">Format 9 chiffres : MTN, Orange ou Camtel</p>
                )}
              </div>
            </div>

            {/* 2. Mode de réception */}
            <div className="space-y-2 pt-2 border-t border-[#EADFCF]">
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#A84A15] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Mode de réception</span>
              </h4>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'livraison', label: 'Livraison', sub: `+${formatFCFA(DELIVERY_SETTINGS.fraisLivraisonFCFA)}` },
                  { id: 'a_emporter', label: 'À emporter', sub: 'Retrait sur place' },
                  { id: 'sur_place', label: 'Sur place', sub: 'À table' }
                ].map(tab => (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setModeReception(tab.id as ModeReception)}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                      modeReception === tab.id
                        ? 'border-[#A84A15] bg-[#EB7F36]/15 font-bold text-[#A84A15]'
                        : 'border-[#D9C8B4] bg-white text-[#6B5446] hover:bg-[#F0E6D8]'
                    }`}
                  >
                    <span className="text-xs">{tab.label}</span>
                    <span className="text-[10px] opacity-80 mt-0.5">{tab.sub}</span>
                  </button>
                ))}
              </div>

              {/* Champs conditionnels si livraison */}
              {modeReception === 'livraison' && (
                <div className="p-3 bg-[#F0E6D8]/60 border border-[#EADFCF] rounded-xl space-y-2.5 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-[#6B5446] mb-1">
                      Quartier à Douala
                    </label>
                    <select
                      value={quartier}
                      onChange={e => setQuartier(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#D9C8B4] text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15]"
                    >
                      {DELIVERY_SETTINGS.quartiersDouala.map(q => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#6B5446] mb-1">
                      Adresse précise & repère <span className="text-[#A84A15]">*</span>
                    </label>
                    <input
                      type="text"
                      value={adresse}
                      onChange={e => setAdresse(e.target.value)}
                      placeholder="Ex. Rue Toyota, face pharmacie, Immeuble blanc 2e ét."
                      className={`w-full px-3 py-2 rounded-lg bg-white border ${
                        errors.adresse ? 'border-red-500' : 'border-[#D9C8B4]'
                      } text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15]`}
                    />
                    {errors.adresse && (
                      <p className="text-[11px] text-red-600 mt-1">{errors.adresse}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Mode de paiement */}
            <div className="space-y-2 pt-2 border-t border-[#EADFCF]">
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#A84A15] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Mode de paiement souhaité</span>
              </h4>

              <div className="space-y-1.5">
                {DELIVERY_SETTINGS.modesPaiement.map(p => (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                      modePaiement === p.id
                        ? 'border-[#A84A15] bg-[#EB7F36]/10 font-semibold'
                        : 'border-[#D9C8B4] bg-white hover:bg-[#F0E6D8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modePaiement"
                      value={p.id}
                      checked={modePaiement === p.id}
                      onChange={() => setModePaiement(p.id as ModePaiement)}
                      className="accent-[#A84A15]"
                    />
                    <span className="text-xs text-[#2B1A12]">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Instructions / Remarques */}
            <div className="pt-2 border-t border-[#EADFCF]">
              <label className="block text-xs font-medium text-[#6B5446] mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#A84A15]" />
                <span>Instructions spéciales (allergies, cuisson, sauce, etc.)</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex. Piment à part, bien cuit, pas d'oignons..."
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#D9C8B4] text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15]"
              />
            </div>

            {/* 5. Récapitulatif chiffré */}
            <div className="p-3.5 bg-[#F0E6D8] border border-[#EADFCF] rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6B5446]">Sous-total ({items.length} articles) :</span>
                <span className="font-semibold text-[#2B1A12]">{formatFCFA(subtotal)}</span>
              </div>
              {modeReception === 'livraison' && (
                <div className="flex justify-between">
                  <span className="text-[#6B5446]">Frais de livraison :</span>
                  <span className="font-semibold text-[#2B1A12]">{formatFCFA(fraisLivraison)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1.5 border-t border-[#EADFCF] text-sm font-bold text-[#2B1A12]">
                <span>Total :</span>
                <span className="text-[#A84A15]">{formatFCFA(total)}</span>
              </div>
            </div>

            {/* Bouton de validation */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#EB7F36] hover:bg-[#D76E27] text-[#2B1A12] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isSubmitting ? 'Traitement en cours...' : `Confirmer la commande (${formatFCFA(total)})`}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
