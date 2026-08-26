import React from 'react';
import { Check, Sparkles } from 'lucide-react';

/**
 * First-Time Visitor Language Preference Selection Modal
 * Displays automatically when a user visits the website without any saved language preference in cookies/localStorage.
 */
export default function FirstTimeLangModal({ isOpen, onSelectLanguage }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-navy-900/85 backdrop-blur-xl animate-fadeIn">
      <div className="bg-navy-900 border border-gold-400/30 rounded-3xl p-8 max-w-lg w-full shadow-2xl text-center relative overflow-hidden animate-slideUp">
        {/* Decorative ambient background blur */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-white p-2.5 flex items-center justify-center mx-auto mb-5 shadow-lg border border-white/20">
          <img src="/favicon.png" alt="Bhilwara Housing" className="w-full h-full object-contain" />
        </div>

        {/* Dual Language Header */}
        <div className="space-y-1 mb-6">
          <p className="text-gold-400 text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
            <Sparkles size={13} /> Welcome • स्वागत है
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
            Select Preferred Language
          </h2>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-gold-300 leading-tight">
            अपनी पसंदीदा भाषा चुनें
          </h3>
          <p className="text-white/60 text-xs mt-3 max-w-xs mx-auto leading-relaxed">
            Choose your language preference to browse luxury properties in Bhilwara. You can change this anytime from the top bar.
          </p>
        </div>

        {/* Language Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {/* English Option */}
          <button
            type="button"
            onClick={() => onSelectLanguage('en')}
            className="group relative bg-white/5 hover:bg-gold-400 hover:text-navy-900 border border-white/15 hover:border-gold-400 rounded-2xl p-5 text-left transition-all duration-300 shadow-md hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">🇬🇧</span>
                <span className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-navy-900 group-hover:text-gold-400 text-white flex items-center justify-center transition-colors">
                  <Check size={14} />
                </span>
              </div>
              <h4 className="font-bold text-lg text-white group-hover:text-navy-900 transition-colors">
                English
              </h4>
              <p className="text-xs text-white/60 group-hover:text-navy-900/80 transition-colors mt-1 leading-relaxed">
                Browse properties & details in English
              </p>
            </div>
          </button>

          {/* Hindi Option */}
          <button
            type="button"
            onClick={() => onSelectLanguage('hi')}
            className="group relative bg-white/5 hover:bg-gold-400 hover:text-navy-900 border border-white/15 hover:border-gold-400 rounded-2xl p-5 text-left transition-all duration-300 shadow-md hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">🇮🇳</span>
                <span className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-navy-900 group-hover:text-gold-400 text-white flex items-center justify-center transition-colors">
                  <Check size={14} />
                </span>
              </div>
              <h4 className="font-bold text-lg text-white group-hover:text-navy-900 transition-colors">
                हिन्दी (Hindi)
              </h4>
              <p className="text-xs text-white/60 group-hover:text-navy-900/80 transition-colors mt-1 leading-relaxed">
                भीलवाड़ा में संपत्तियां हिंदी भाषा में देखें
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
