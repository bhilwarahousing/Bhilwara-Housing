import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Eye, Star } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';

const COLLECTION_BG = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80';

export default function LuxuryCollection({ onExplore }) {
  const { t } = usePreferences();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleExploreClick = () => {
    if (isAuthenticated) {
      navigate('/properties');
    } else if (onExplore) {
      onExplore();
    }
  };

  const features = [
    {
      icon: MapPin,
      title: t('collection.feat1_title'),
      desc: t('collection.feat1_desc'),
    },
    {
      icon: Eye,
      title: t('collection.feat2_title'),
      desc: t('collection.feat2_desc'),
    },
    {
      icon: Star,
      title: t('collection.feat3_title'),
      desc: t('collection.feat3_desc'),
    },
  ];

  return (
    <section
      id="collection"
      className="relative py-28 overflow-hidden"
      style={{
        backgroundImage: `url(${COLLECTION_BG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Deep dark overlay */}
      <div className="absolute inset-0 bg-navy-900/90 dark:bg-black/92 z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — Text */}
          <div>
            <p className="section-label-light mb-4">{t('collection.tag')}</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
              {t('collection.title')}
            </h2>
            <p className="text-white/60 text-sm leading-loose max-w-md mb-10">
              {t('collection.desc')}
            </p>

            <button onClick={handleExploreClick} className="btn-outline-gold inline-block text-center cursor-pointer">
              {t('collection.explore_btn')}
            </button>
          </div>

          {/* Right — Feature list */}
          <div className="flex flex-col gap-8">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex items-start gap-5 group">
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-full border border-gold-400/40 flex items-center justify-center shrink-0 group-hover:border-gold-400 group-hover:bg-gold-400/10 transition-all duration-300">
                    <Icon size={18} className="text-gold-400" />
                  </div>
                  {/* Text */}
                  <div>
                    <h3 className="text-white font-semibold text-base mb-1">{f.title}</h3>
                    <p className="text-white/55 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
