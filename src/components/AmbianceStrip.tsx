import React, { useState, useEffect, useRef } from 'react';

/**
 * Bande d'ambiance facultative de 220 px de haut.
 * N'apparaît que si le fichier vidéo /assets/videos/ambiance.mp4 existe.
 * Pause automatique hors écran et respect des contraintes de débit mobile.
 */
export const AmbianceStrip: React.FC = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Vérification des préférences d'accessibilité et de connectivité mobile
    const nav = navigator as unknown as {
      connection?: { saveData?: boolean; effectiveType?: string };
      mozConnection?: { saveData?: boolean; effectiveType?: string };
      webkitConnection?: { saveData?: boolean; effectiveType?: string };
    };
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    const isSaveData = connection?.saveData === true;
    const isSlow = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isSaveData || isSlow || prefersReducedMotion) {
      return;
    }

    // Vérifie l'existence réelle du fichier vidéo avant d'afficher la bande
    fetch('/assets/videos/ambiance.mp4', { method: 'HEAD' })
      .then(res => {
        if (res.ok) {
          setIsAvailable(true);
        }
      })
      .catch(() => {
        // En cas d'échec ou d'absence du fichier, la bande reste masquée
        setIsAvailable(false);
      });
  }, []);

  useEffect(() => {
    if (!isAvailable) return;

    const scheduleLoad = () => {
      if ('requestIdleCallback' in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(
          () => setShouldLoadVideo(true),
          { timeout: 3000 }
        );
      } else {
        setTimeout(() => setShouldLoadVideo(true), 600);
      }
    };

    if (document.readyState === 'complete') {
      scheduleLoad();
    } else {
      window.addEventListener('load', scheduleLoad, { once: true });
      return () => window.removeEventListener('load', scheduleLoad);
    }
  }, [isAvailable]);

  // Pause la vidéo quand elle sort de l'écran, relance au retour
  useEffect(() => {
    if (!videoRef.current || !shouldLoadVideo) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [shouldLoadVideo]);

  // Si le fichier vidéo n'existe pas, ne rien afficher (pas d'espace vide ni de lecteur vide)
  if (!isAvailable) {
    return null;
  }

  return (
    <aside
      aria-label="Ambiance du restaurant"
      className="relative w-full h-[220px] overflow-hidden flex items-center justify-center border-y border-[#EADFCF]"
    >
      {/* Vidéo décorative en fond */}
      {shouldLoadVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          poster="/assets/videos/ambiance-poster.jpg"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/assets/videos/ambiance.webm" type="video/webm" />
          <source src="/assets/videos/ambiance.mp4" type="video/mp4" />
        </video>
      )}

      {/* Calque de lisibilité #2B1A12 à ~70 % */}
      <div className="absolute inset-0 bg-[#2B1A12]/70 backdrop-blur-[0.5px]" aria-hidden="true" />

      {/* Ligne unique de texte blanc au centre */}
      <p className="relative z-10 font-serif text-lg sm:text-xl md:text-2xl font-bold text-white text-center px-4 tracking-wide drop-shadow-sm">
        Cuisine italienne à Bonapriso, Douala
      </p>
    </aside>
  );
};
