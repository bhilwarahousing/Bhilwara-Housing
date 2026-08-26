import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

// Luxury property hero image — Unsplash free-to-use coastal villa
const HERO_IMAGE = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1920&q=80';

export default function Hero({ onSearch }) {
  const [query, setQuery] = useState('');
  const { t } = usePreferences();

  const handleFind = () => {
    onSearch(query);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleFind();
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-start justify-end pb-24 px-5 sm:px-10 lg:px-20"
      style={{
        backgroundImage: `url(${HERO_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
    >
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/50 via-navy-900/40 to-navy-900/85 z-0" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Headline */}
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white font-bold leading-tight mb-8">
          {t('hero.title_pre')}<br />
          <span className="italic font-normal text-gold-400">{t('hero.title_italic')}</span>{' '}
          {t('hero.title_post')}
        </h1>

        {/* Search Bar */}
        <div className="flex items-stretch bg-white/10 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden shadow-2xl">
          {/* Location pin icon */}
          <div className="flex items-center pl-4 text-white/50">
            <MapPin size={18} />
          </div>

          {/* Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('hero.search_placeholder')}
            className="flex-1 bg-transparent text-white placeholder-white/50 text-sm px-4 py-4 focus:outline-none min-w-0"
          />

          {/* Find button */}
          <button
            onClick={handleFind}
            className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-sm tracking-widest uppercase px-7 py-4 transition-colors duration-200 shrink-0"
          >
            {t('hero.find_btn')}
          </button>
        </div>

        {/* Subtle hint tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { label: t('hero.buy'), q: 'Buy' },
            { label: t('hero.rent'), q: 'Rent' },
            { label: t('hero.commercial'), q: 'Commercial' },
            { label: t('hero.plots'), q: 'Plots' },
          ].map((tag) => (
            <button
              key={tag.q}
              onClick={() => { setQuery(tag.q); onSearch(tag.q); }}
              className="text-xs text-white/70 border border-white/20 rounded-full px-3.5 py-1 hover:border-gold-400 hover:text-gold-400 transition-all duration-200"
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-navy-900 to-transparent z-10 pointer-events-none" />
    </section>
  );
}
