import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ArrowUp, Camera, Plus, Minus } from 'lucide-react';
import { RESTAURANT_DATA, Plat, CategorieMenu } from '../data/restaurantData';
import corrections from '../data/corrections.json';
import platPhotosData from '../data/platPhotos.json';
import { PlatModal, PlatPhotoInfo } from './PlatModal';
import { OptionModal } from './OptionModal';
import { useCart } from '../context/CartContext';

/**
 * Normalise une chaîne pour une recherche insensible à la casse et aux accents.
 */
const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

/**
 * Applique le dictionnaire corrections.json au rendu si une correspondance existe.
 * Exemple : "Cappriciosa" -> "Capricciosa".
 */
export const applyCorrection = (text: string | null): string => {
  if (!text) return '';
  const dict = corrections as Record<string, string>;
  return dict[text] || text;
};

/**
 * Formate le prix en FCFA avec une espace insécable fine (\u202F) comme séparateur de milliers.
 * Ex: 6000 -> "6 000 FCFA"
 */
export const formatPrice = (price: number): string => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F') + '\u202FFCFA';
};

/**
 * Sépare la description de l'accompagnement lorsque le texte se termine par
 * "Accompagnement : ..." ou "Servie avec : ..." (insensible à la casse).
 */
export const parseDescription = (desc: string | null): { mainText: string; accompagnement: string | null } => {
  if (!desc) return { mainText: '', accompagnement: null };
  const regex = /^(.*?)(?:\s*\.?\s*)((?:Accompagnement|Servie\s+avec)\s*:.*)$/i;
  const match = desc.match(regex);
  if (match) {
    return {
      mainText: match[1].trim(),
      accompagnement: match[2].trim(),
    };
  }
  return { mainText: desc, accompagnement: null };
};

/**
 * Détermine si la note doit être affichée :
 * N'affiche une note que si son texte n'est pas déjà contenu dans la description
 * (comparaison sans tenir compte de la casse ni de la ponctuation).
 */
export const shouldDisplayNote = (note?: string | null, description?: string | null): boolean => {
  if (!note) return false;
  if (!description) return true;
  const clean = (s: string) => s.toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, '');
  const cleanNote = clean(note);
  const cleanDesc = clean(description);
  if (!cleanNote) return false;
  return !cleanDesc.includes(cleanNote);
};

/**
 * Génère un identifiant URL sécurisé à partir du nom d'une catégorie.
 */
const getCategorySlug = (catName: string): string => {
  return 'cat-' + catName.toLowerCase().replace(/[^a-z0-9]/g, '-');
};

export const MenuSection: React.FC = () => {
  const { items, addItem, updateQuantity } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Gestion de la modale de photo de plat
  const [selectedModalPlat, setSelectedModalPlat] = useState<Plat | null>(null);
  const [selectedModalPhoto, setSelectedModalPhoto] = useState<PlatPhotoInfo | null>(null);
  const activeTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Gestion de la modale d'options de plat
  const [selectedOptionPlat, setSelectedOptionPlat] = useState<{ plat: Plat; categorie: string } | null>(null);
  const [isOptionOpen, setIsOptionOpen] = useState(false);
  const optionTriggerRef = useRef<HTMLButtonElement | null>(null);

  const platPhotosMap = platPhotosData as Record<string, PlatPhotoInfo>;

  const platNeedsOptionModal = (p: Plat): boolean => {
    if (p.options && p.options.length > 0) return true;
    if (
      p.description &&
      (p.description.toLowerCase().includes('au choix') ||
        p.description.toLowerCase().includes('du jour'))
    ) {
      return true;
    }
    return false;
  };

  const handleAddPlat = (plat: Plat, categorie: string, triggerBtn?: HTMLButtonElement | null) => {
    if (platNeedsOptionModal(plat)) {
      optionTriggerRef.current = triggerBtn || null;
      setSelectedOptionPlat({ plat, categorie });
      setIsOptionOpen(true);
    } else {
      addItem(plat, categorie);
    }
  };

  const handleMinusPlat = (platId: string) => {
    let lastIdx = -1;
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].id === platId) {
        lastIdx = i;
        break;
      }
    }
    if (lastIdx >= 0) {
      updateQuantity(lastIdx, -1);
    }
  };

  const menuCategories = RESTAURANT_DATA.menu;

  // Filtrage insensible à la casse et aux accents
  const filteredCategories = useMemo(() => {
    const q = normalizeText(searchQuery.trim());
    if (!q) return menuCategories;

    return menuCategories
      .map(category => {
        const matchingPlats = category.plats.filter(plat => {
          const matchNom = normalizeText(plat.nom).includes(q);
          const matchDesc = plat.description ? normalizeText(plat.description).includes(q) : false;
          return matchNom || matchDesc;
        });

        return {
          ...category,
          plats: matchingPlats,
        };
      })
      .filter(category => category.plats.length > 0);
  }, [menuCategories, searchQuery]);

  // Initialisation de la catégorie active
  useEffect(() => {
    if (filteredCategories.length > 0 && !activeCategory) {
      setActiveCategory(getCategorySlug(filteredCategories[0].categorie));
    }
  }, [filteredCategories, activeCategory]);

  // Détection de la catégorie visible au scroll (IntersectionObserver)
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-140px 0px -60% 0px',
        threshold: 0,
      }
    );

    Object.values(sectionRefs.current).forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [filteredCategories]);

  // Gestion de l'affichage du bouton "Haut de page"
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 450);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCategory = (slug: string) => {
    const el = document.getElementById(slug);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveCategory(slug);
    }
  };

  const scrollToTopMenu = () => {
    const menuEl = document.getElementById('menu');
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="menu"
      aria-label="Menu"
      className="scroll-mt-16 py-14 px-4 sm:px-6 bg-[#FBF6EE] text-[#2B1A12] border-t border-[#EADFCF]"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* En-tête de section avec au maximum une pastille */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-block">
            <span className="text-xs font-medium text-[#2B1A12] bg-[#F0E6D8] px-3 py-1 rounded-full">
              Carte
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#2B1A12]">
            Menu
          </h2>
        </div>

        {/* Champ de recherche rapide */}
        <div className="relative max-w-md mx-auto">
          <label htmlFor="menu-search-input" className="sr-only">
            Rechercher un plat
          </label>
          <div className="relative">
            <Search
              className="w-4 h-4 text-[#6B5446] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="menu-search-input"
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher un plat..."
              className="w-full pl-10 pr-9 py-2.5 rounded-lg bg-white border border-[#D9C8B4] text-[#2B1A12] placeholder-[#6B5446] text-xs sm:text-sm focus:outline-none focus:border-[#A84A15] transition min-h-[44px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Effacer la recherche"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5446] hover:text-[#2B1A12] text-xs p-1 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Barre de catégories collante (surface #EB7F36 avec texte #2B1A12 dessus) */}
        <nav
          aria-label="Catégories du menu"
          className="sticky top-16 z-30 bg-[#F0E6D8]/95 backdrop-blur-md border-y border-[#EADFCF] -mx-4 sm:-mx-6 px-4 sm:px-6 shadow-sm"
        >
          <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
            {menuCategories.map(cat => {
              const slug = getCategorySlug(cat.categorie);
              const isActive = activeCategory === slug;
              const isAvailable = filteredCategories.some(fc => fc.categorie === cat.categorie);

              if (!isAvailable && searchQuery) return null;

              return (
                <button
                  key={cat.categorie}
                  onClick={() => scrollToCategory(slug)}
                  className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap transition min-h-[44px] flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#A84A15] focus-visible:outline-none ${
                    isActive
                      ? 'bg-[#EB7F36] text-[#2B1A12] font-semibold'
                      : 'text-[#6B5446] hover:text-[#2B1A12] hover:bg-[#F0E6D8] font-medium'
                  }`}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span>{cat.categorie}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-[#D76E27] text-[#2B1A12]' : 'bg-[#F0E6D8] text-[#6B5446]'
                    }`}
                  >
                    {cat.plats.length}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* État vide si aucun résultat de recherche */}
        {filteredCategories.length === 0 && (
          <div className="py-16 text-center bg-[#F0E6D8]/50 rounded-lg border border-[#EADFCF] p-8 space-y-3">
            <p className="text-base font-semibold text-[#2B1A12]">Aucun plat trouvé</p>
            <p className="text-xs text-[#6B5446] max-w-sm mx-auto">
              Aucun résultat ne correspond à "{searchQuery}".
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 px-4 py-2.5 rounded-lg bg-[#A84A15] text-white font-semibold text-xs min-h-[44px] inline-flex items-center justify-center transition hover:bg-[#8D3C0F]"
            >
              Réinitialiser la recherche
            </button>
          </div>
        )}

        {/* Sections des Catégories Dynamiques */}
        <div className="space-y-14 pt-2">
          {filteredCategories.map(cat => {
            const slug = getCategorySlug(cat.categorie);
            const headingId = `${slug}-heading`;

            return (
              <section
                key={cat.categorie}
                id={slug}
                ref={el => {
                  sectionRefs.current[slug] = el;
                }}
                aria-labelledby={headingId}
                className="scroll-mt-32 space-y-6"
              >
                {/* En-tête de catégorie : Titre en #A84A15, libellé français en #6B5446, séparateur décoratif */}
                <div className="border-b border-[#EADFCF] pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1.5">
                    <h3
                      id={headingId}
                      className="text-xl sm:text-2xl font-serif font-bold text-[#A84A15]"
                    >
                      {cat.categorie}
                    </h3>
                    {cat.libelle_fr && (
                      <span className="text-xs sm:text-sm font-sans uppercase tracking-wider text-[#6B5446] font-medium">
                        {cat.libelle_fr}
                      </span>
                    )}
                  </div>
                  {/* Séparateur décoratif */}
                  <div className="flex items-center gap-2 mt-2" aria-hidden="true">
                    <span className="h-px w-8 bg-[#A84A15]" />
                    <span className="text-[#A84A15] text-[10px]">♦</span>
                    <span className="h-px flex-1 bg-[#EADFCF]" />
                  </div>
                </div>

                {/* Liste des Plats : 1 colonne mobile, 2 colonnes dès ~900px avec break-inside: avoid */}
                <ul
                  role="list"
                  className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-x-12 gap-y-7 list-none p-0 m-0"
                >
                  {cat.plats.map((plat, idx) => {
                    const correctedNom = applyCorrection(plat.nom);
                    const { mainText, accompagnement } = parseDescription(plat.description);
                    const photoKey = `${cat.categorie}::${plat.nom}`;
                    const photoInfo = platPhotosMap[photoKey] || null;

                    return (
                      <li
                        key={`${plat.nom}-${idx}`}
                        className="break-inside-avoid flex flex-col justify-between"
                      >
                        {/* Ligne 1 : Nom + Pointillés + Prix en police normale du site, couleur --texte, poids 600, sans fond ni bordure ni monospace */}
                        <div className="flex items-baseline justify-between gap-2 w-full">
                          {photoInfo ? (
                            <button
                              type="button"
                              onClick={e => {
                                activeTriggerRef.current = e.currentTarget;
                                setSelectedModalPlat(plat);
                                setSelectedModalPhoto(photoInfo);
                              }}
                              aria-haspopup="dialog"
                              className="group text-left font-serif font-bold text-[#2B1A12] text-[15px] sm:text-base leading-snug break-words shrink min-w-0 inline-flex items-center gap-1.5 hover:text-[#A84A15] transition cursor-pointer focus-visible:ring-2 focus-visible:ring-[#EB7F36] focus-visible:outline-none rounded"
                            >
                              <span className="group-hover:underline decoration-[#A84A15]/40 underline-offset-2">
                                {correctedNom}
                              </span>
                              <Camera
                                className="w-3.5 h-3.5 text-[#A84A15] shrink-0 opacity-80 group-hover:opacity-100"
                                aria-label="Voir la photo d'illustration"
                              />
                            </button>
                          ) : (
                            <span className="font-serif font-bold text-[#2B1A12] text-[15px] sm:text-base leading-snug break-words shrink min-w-0">
                              {correctedNom}
                            </span>
                          )}

                          {/* Ligne pointillée qui ne s'affiche que s'il y a de la place */}
                          <span
                            className="flex-1 border-b border-dotted border-[#D9C8B4] mb-1 min-w-[8px] overflow-hidden"
                            aria-hidden="true"
                          />

                          {/* Prix : font-sans, poids 600, couleur --texte, tabular-nums */}
                          <span className="font-sans font-semibold text-[#2B1A12] text-sm sm:text-base whitespace-nowrap tabular-nums shrink-0 ml-auto pl-2">
                            {formatPrice(plat.prix)}
                          </span>
                        </div>

                        {/* Description du plat (sans coupure, limitée à environ 60 caractères de lecture) */}
                        {mainText && (
                          <p className="text-xs sm:text-sm text-[#6B5446] leading-relaxed max-w-[60ch] mt-1 font-normal">
                            {mainText}
                          </p>
                        )}

                        {/* Accompagnement séparé sur une ligne distincte en italique */}
                        {accompagnement && (
                          <p className="text-xs sm:text-sm italic text-[#6B5446] leading-relaxed max-w-[60ch] mt-0.5">
                            {accompagnement}
                          </p>
                        )}

                        {/* Note discrète sous la description (affichée uniquement si non redondante) */}
                        {shouldDisplayNote(plat.note, plat.description) && (
                          <span className="block text-[11px] sm:text-xs text-[#A84A15] italic font-sans mt-1">
                            ({plat.note})
                          </span>
                        )}

                        {/* Barre d'action Panier : Bouton Ajouter au panier & Sélecteur de quantité (+ / −) */}
                        {(() => {
                          const currentQty = items
                            .filter(it => it.id === photoKey)
                            .reduce((sum, it) => sum + it.quantite, 0);

                          return (
                            <div className="mt-2.5 pt-2 border-t border-[#EADFCF]/60 flex items-center justify-between gap-2">
                              <span className="text-[11px] text-[#6B5446]">
                                {currentQty > 0 ? (
                                  <span className="inline-flex items-center gap-1 font-semibold text-[#A84A15]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#A84A15]" />
                                    {currentQty} dans le panier
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[#6B5446]/60">Spécialité maison</span>
                                )}
                              </span>

                              <div className="inline-flex items-center gap-1.5 ml-auto">
                                {currentQty === 0 ? (
                                  <button
                                    type="button"
                                    onClick={e => handleAddPlat(plat, cat.categorie, e.currentTarget)}
                                    aria-label={`Ajouter ${correctedNom} au panier`}
                                    className="px-3 py-1.5 rounded-lg bg-[#EB7F36]/20 hover:bg-[#EB7F36] text-[#2B1A12] text-xs font-semibold inline-flex items-center gap-1.5 transition border border-[#EB7F36]/40 cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-[#A84A15]" />
                                    <span>Ajouter au panier</span>
                                  </button>
                                ) : (
                                  <div className="inline-flex items-center rounded-lg border border-[#EB7F36] bg-white overflow-hidden shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() => handleMinusPlat(photoKey)}
                                      aria-label={`Diminuer la quantité de ${correctedNom}`}
                                      className="p-1 px-2.5 text-[#6B5446] hover:text-[#2B1A12] hover:bg-[#F0E6D8] transition cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="px-2.5 py-0.5 text-xs font-bold text-[#A84A15] tabular-nums min-w-[24px] text-center bg-[#EB7F36]/15">
                                      {currentQty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={e => handleAddPlat(plat, cat.categorie, e.currentTarget)}
                                      aria-label={`Ajouter ${correctedNom}`}
                                      className="p-1 px-2.5 text-[#6B5446] hover:text-[#2B1A12] hover:bg-[#F0E6D8] transition cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        {/* Pied de section : Mentions légales obligatoires */}
        <div className="pt-10 border-t border-[#EADFCF] text-center text-xs text-[#6B5446]">
          <p></p>
        </div>
      </div>

      {/* Bouton flottant "Haut de page" après défilement */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTopMenu}
          aria-label="Retourner en haut du menu"
          className="fixed bottom-5 left-4 sm:left-6 z-30 p-3 rounded-full bg-white border border-[#D9C8B4] text-[#A84A15] shadow-md hover:bg-[#F0E6D8] transition min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#A84A15] focus-visible:outline-none cursor-pointer"
        >
          <ArrowUp className="w-5 h-5" aria-hidden="true" />
        </button>
      )}

      {/* Modale d'illustration détaillée du plat */}
      <PlatModal
        isOpen={!!selectedModalPlat}
        onClose={() => {
          setSelectedModalPlat(null);
          setSelectedModalPhoto(null);
        }}
        plat={selectedModalPlat}
        photoInfo={selectedModalPhoto}
        triggerRef={activeTriggerRef}
      />

      {/* Modale de choix d'options pour les plats */}
      <OptionModal
        isOpen={isOptionOpen}
        onClose={() => {
          setIsOptionOpen(false);
          setSelectedOptionPlat(null);
        }}
        plat={selectedOptionPlat?.plat || null}
        categorie={selectedOptionPlat?.categorie || ''}
        triggerRef={optionTriggerRef}
        onConfirm={(options, remarque) => {
          if (selectedOptionPlat) {
            addItem(selectedOptionPlat.plat, selectedOptionPlat.categorie, options, remarque, 1);
          }
        }}
      />
    </section>
  );
};
