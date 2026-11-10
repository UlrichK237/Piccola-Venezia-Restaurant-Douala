import React, { useState, useEffect, useRef } from 'react';
import { Phone, Navigation, Clock, Play, Pause, Calendar } from 'lucide-react';
import { RESTAURANT_DATA } from '../data/restaurantData';

export const Hero: React.FC = () => {
  const lieu = RESTAURANT_DATA.lieux[0];
  const videoRef = useRef<HTMLVideoElement>(null);

  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPausedByUser, setIsPausedByUser] = useState(false);

  useEffect(() => {
    // Vérification de la connectivité mobile et des préférences d'accessibilité
    const nav = navigator as unknown as {
      connection?: { saveData?: boolean; effectiveType?: string };
      mozConnection?: { saveData?: boolean; effectiveType?: string };
      webkitConnection?: { saveData?: boolean; effectiveType?: string };
    };
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    const isSaveData = connection?.saveData === true;
    const isSlow = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Ne charge pas la vidéo si mode éco, réseau 2G/lent ou réduction de mouvement
    if (isSaveData || isSlow || prefersReducedMotion) {
      return;
    }

    const scheduleLoad = () => {
      if ('requestIdleCallback' in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(
          () => setShouldLoadVideo(true),
          { timeout: 3000 }
        );
      } else {
        setTimeout(() => setShouldLoadVideo(true), 500);
      }
    };

    if (document.readyState === 'complete') {
      scheduleLoad();
    } else {
      window.addEventListener('load', scheduleLoad, { once: true });
      return () => window.removeEventListener('load', scheduleLoad);
    }
  }, []);

  // IntersectionObserver : pause hors champ, relance au retour
  useEffect(() => {
    if (!videoRef.current || !shouldLoadVideo) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!isPausedByUser) {
              videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
            }
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [shouldLoadVideo, isPausedByUser]);

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setIsPausedByUser(true);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setIsPausedByUser(false);
      }).catch(() => {});
    }
  };

  return (
    <section
      id="hero"
      aria-label="Présentation"
      className="relative w-full min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden py-16 px-4 sm:px-6"
    >
      {/* 1. Fond statique par défaut (dégradé très léger crème et orange) */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#FDF9F3] via-[#F6E3D3] to-[#E8A572]"
        aria-hidden="true"
      />

      {/* 2. Vidéo décorative de fond (affichée uniquement si chargée) */}
      {shouldLoadVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          poster="/assets/videos/hero-poster.jpg"
          onLoadedData={() => {
            setIsVideoLoaded(true);
            setIsPlaying(true);
          }}
          onError={() => {
            setIsVideoLoaded(false);
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src="/assets/videos/hero.mp4" type="video/mp4" />
        </video>
      )}

      {/* 3. Calque de lisibilité : dégradé de #2B1A12 à ~70 % d'opacité */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#2B1A12]/80 via-[#2B1A12]/70 to-[#2B1A12]/60 backdrop-blur-[0.5px]"
        aria-hidden="true"
      />

      {/* 4. Contenu centré : contraste >= 4.5:1 garanti */}
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white tracking-tight drop-shadow-sm">
            {RESTAURANT_DATA.restaurant.nom}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[#FBF6EE]/95 font-medium">
            Cuisine italienne à Bonapriso, Douala
          </p>
        </div>

        {/* Horaires sobres */}
        {lieu.horaires && (
          <div className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm text-[#FBF6EE]/90 bg-white/10 px-4 py-1.5 rounded-full border border-white/15 backdrop-blur-sm">
            <Clock className="w-4 h-4 text-[#EB7F36]" aria-hidden="true" />
            <span>{lieu.horaires}</span>
          </div>
        )}

        {/* Boutons d'action concrets */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#reserver"
            className="px-6 py-3 rounded-lg bg-[#EB7F36] hover:bg-[#D76E27] text-[#2B1A12] text-sm font-bold inline-flex items-center gap-2 transition shadow-md"
          >
            <Calendar className="w-4 h-4 text-[#2B1A12]" aria-hidden="true" />
            <span>Réserver une table</span>
          </a>

          <a
            href={`tel:${lieu.telephone}`}
            className="px-6 py-3 rounded-lg bg-[#A84A15] hover:bg-[#8D3C0F] text-white text-sm font-semibold inline-flex items-center gap-2 transition shadow-sm"
          >
            <Phone className="w-4 h-4" aria-hidden="true" />
            <span>Appeler</span>
          </a>

          <a
            href={lieu.maps_url}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-lg border border-white/80 hover:bg-white/15 text-white text-sm font-semibold inline-flex items-center gap-2 transition backdrop-blur-sm"
          >
            <Navigation className="w-4 h-4 text-[#EB7F36]" aria-hidden="true" />
            <span>Itinéraire</span>
          </a>

          {lieu.whatsapp && (
            <a
              href={`https://wa.me/${lieu.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-lg bg-[#EB7F36] hover:bg-[#D76E27] text-[#2B1A12] text-sm font-semibold inline-flex items-center gap-2 transition"
            >
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {/* 5. Bouton Pause/Lecture accessible en bas à droite (zone tactile de 44 px, focus visible) */}
      {isVideoLoaded && (
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={isPlaying ? "Mettre en pause la vidéo d'ambiance" : "Lancer la vidéo d'ambiance"}
          className="absolute bottom-4 right-4 z-20 min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/25 transition backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-[#EB7F36] focus-visible:outline-none"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" aria-hidden="true" />
          )}
        </button>
      )}
    </section>
  );
};
