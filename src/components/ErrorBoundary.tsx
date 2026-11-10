import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RESTAURANT_DATA } from '../data/restaurantData';
import { getPhoneDigits } from '../lib/securite';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Ne logge aucune donnée utilisateur
    console.error('Affichage interrompu :', error.message);
  }

  public render() {
    if (this.state.hasError) {
      const lieu = RESTAURANT_DATA.lieux[0];
      const telDigits = getPhoneDigits(lieu.telephone);

      return (
        <div className="min-h-screen bg-[#FBF6EE] text-[#2B1A12] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-[#EADFCF] shadow-lg text-center space-y-4">
            <h1 className="text-xl font-serif font-bold text-[#2B1A12]">
              Une erreur est survenue
            </h1>
            <p className="text-sm text-[#6B5446]">
              Nous nous excusons pour ce désagrément. Vous pouvez nous joindre directement par téléphone.
            </p>
            <div className="pt-2">
              <a
                href={`tel:${telDigits}`}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#A84A15] hover:bg-[#8D3C0F] text-white font-semibold text-sm transition"
              >
                Appelez-nous au {lieu.telephone}
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
