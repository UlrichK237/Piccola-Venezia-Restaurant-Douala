import React, { useState } from 'react';
import { X, Send, Calendar, Clock, Users, Phone, MessageSquare, Utensils, CheckCircle } from 'lucide-react';
import { RESTAURANT_DATA, Plat } from '../data/restaurantData';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlat?: Plat | null;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  selectedPlat,
}) => {
  const [type, setType] = useState<'reservation' | 'commande'>(selectedPlat ? 'commande' : 'reservation');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('2026-11-09');
  const [time, setTime] = useState('20:00');
  const [guests, setGuests] = useState('2');
  const [platSelection, setPlatSelection] = useState<string>(selectedPlat ? selectedPlat.nom : '');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const phoneDigits = RESTAURANT_DATA.lieux[0].telephone.replace(/[^0-9]/g, '');

  const buildWhatsAppMessage = () => {
    if (type === 'reservation') {
      return `Bonjour Piccola Venezia,\n\nJe souhaite réserver une table pour ${guests} personnes le ${date} à ${time}.\nNom: ${name || '[Mon Nom]'}\nTéléphone: ${phone || '[Mon Numéro]'}\n${notes ? `Remarques: ${notes}\n` : ''}\nMerci de me confirmer la disponibilité.`;
    } else {
      return `Bonjour Piccola Venezia,\n\nJe souhaite commander à emporter :\n- Plat: ${platSelection || 'Sélectionner sur la carte'}\nPour récupération le ${date} vers ${time}.\nNom: ${name || '[Mon Nom]'}\nTéléphone: ${phone || '[Mon Numéro]'}\n${notes ? `Précisions: ${notes}\n` : ''}\nMerci de me confirmer la commande et le total.`;
    }
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(buildWhatsAppMessage());
    window.open(`https://wa.me/${phoneDigits}?text=${text}`, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildWhatsAppMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FBF6EE] border border-[#EADFCF] rounded-2xl shadow-xl overflow-hidden my-auto text-[#2B1A12]">
        {/* Header */}
        <div className="p-5 border-b border-[#EADFCF] bg-[#F0E6D8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[#EADFCF] text-[#A84A15]">
              <MessageSquare className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-serif font-bold text-[#2B1A12]">
                {type === 'reservation' ? 'Réserver une table' : 'Commander à emporter'}
              </h3>
              <p className="text-xs text-[#6B5446]">
                {RESTAURANT_DATA.restaurant.nom} • {RESTAURANT_DATA.lieux[0].quartier}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6B5446] hover:text-[#2B1A12] rounded-lg hover:bg-[#EADFCF] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle Mode */}
        <div className="flex border-b border-[#EADFCF] p-2 bg-[#F0E6D8]/50 gap-2">
          <button
            onClick={() => setType('reservation')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
              type === 'reservation'
                ? 'bg-[#A84A15] text-white'
                : 'text-[#6B5446] hover:text-[#2B1A12] hover:bg-[#F0E6D8]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Réserver une table
          </button>
          <button
            onClick={() => setType('commande')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
              type === 'commande'
                ? 'bg-[#A84A15] text-white'
                : 'text-[#6B5446] hover:text-[#2B1A12] hover:bg-[#F0E6D8]'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            Commander à emporter
          </button>
        </div>

        {/* Form fields */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto text-xs sm:text-sm">
          {type === 'commande' && (
            <div>
              <label className="block text-xs font-medium text-[#6B5446] mb-1">
                Plat sélectionné
              </label>
              <input
                type="text"
                value={platSelection}
                onChange={(e) => setPlatSelection(e.target.value)}
                placeholder="Nom du plat..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15]"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6B5446] mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#A84A15]" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#D9C8B4] text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B5446] mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#A84A15]" /> Heure
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="12:30 ou 20:00"
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#D9C8B4] text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6B5446] mb-1">
                Votre nom
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                className="w-full px-3 py-2 rounded-lg bg-white border border-[#D9C8B4] text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15]"
              />
            </div>
            {type === 'reservation' ? (
              <div>
                <label className="block text-xs font-medium text-[#6B5446] mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#A84A15]" /> Nombre de personnes
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#D9C8B4] text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15]"
                >
                  <option value="1">1 personne</option>
                  <option value="2">2 personnes</option>
                  <option value="3">3 personnes</option>
                  <option value="4">4 personnes</option>
                  <option value="5">5 personnes</option>
                  <option value="6">6 personnes</option>
                  <option value="8+">8+ personnes</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-[#6B5446] mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#A84A15]" /> Votre téléphone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Numéro de contact"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-[#D9C8B4] text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15]"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6B5446] mb-1">
              Précisions (facultatif)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Remarques particulières..."
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#D9C8B4] text-[#2B1A12] text-xs focus:outline-none focus:border-[#A84A15]"
            />
          </div>

          {/* Aperçu du message */}
          <div className="bg-[#F0E6D8] p-3 rounded-lg border border-[#EADFCF] text-xs">
            <span className="text-[#6B5446] block mb-1 font-medium">Message généré :</span>
            <p className="text-[#2B1A12] font-sans whitespace-pre-line leading-relaxed italic">
              {buildWhatsAppMessage()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-[#F0E6D8] border-t border-[#EADFCF] flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 px-3 rounded-lg bg-white hover:bg-[#FBF6EE] text-[#2B1A12] text-xs font-medium flex items-center justify-center gap-2 transition border border-[#D9C8B4]"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-[#A84A15]" />
                Copié dans le presse-papier !
              </>
            ) : (
              'Copier le message'
            )}
          </button>
          <button
            onClick={handleSendWhatsApp}
            className="flex-1 py-2.5 px-4 rounded-lg bg-[#A84A15] hover:bg-[#8D3C0F] text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Send className="w-4 h-4" />
            Envoyer sur WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};
