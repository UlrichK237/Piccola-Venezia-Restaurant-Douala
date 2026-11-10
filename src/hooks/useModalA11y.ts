import { useEffect, useRef } from 'react';

interface UseModalA11yOptions {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

export function useModalA11y({
  isOpen,
  onClose,
  triggerRef,
  initialFocusRef
}: UseModalA11yOptions) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Blocage du défilement de la page en arrière-plan
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Piège du focus, touche Échap et retour du focus au déclencheur
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (initialFocusRef && initialFocusRef.current) {
        initialFocusRef.current.focus();
      } else if (containerRef.current) {
        const firstFocusable = containerRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!containerRef.current) return;
        const focusables = containerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      if (triggerRef && triggerRef.current) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose, triggerRef, initialFocusRef]);

  return { containerRef };
}
