import React from 'react';
import { Home, Scale, TrendingUp, FileText } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

export default function Expertise() {
  const { t } = usePreferences();

  const services = [
    {
      icon: Home,
      title: t('expertise.card1_title'),
      description: t('expertise.card1_desc'),
      color: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    },
    {
      icon: Scale,
      title: t('expertise.card2_title'),
      description: t('expertise.card2_desc'),
      color: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    },
    {
      icon: TrendingUp,
      title: t('expertise.card3_title'),
      description: t('expertise.card3_desc'),
      color: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    },
    {
      icon: FileText,
      title: t('expertise.card4_title'),
      description: t('expertise.card4_desc'),
      color: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    },
  ];

  return (
    <section id="expertise" className="py-24 bg-gray-50 dark:bg-navy-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="section-label mb-3">{t('expertise.tag')}</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy-800 dark:text-white leading-snug">
            {t('expertise.title')}
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
            {t('expertise.desc')}
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((svc) => {
            const Icon = svc.icon;
            return (
              <div
                key={svc.title}
                className="bg-white dark:bg-navy-800 rounded-2xl p-7 shadow-sm hover:shadow-xl border border-gray-100 dark:border-white/10 transition-all duration-300 group cursor-default"
              >
                {/* Icon box */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${svc.color} group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon size={22} />
                </div>

                {/* Title */}
                <h3 className="font-bold text-navy-800 dark:text-white text-base mb-2 leading-snug">
                  {svc.title}
                </h3>

                {/* Description */}
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  {svc.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom stats strip */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center border-t border-gray-200 dark:border-white/10 pt-12">
          {[
            { value: '500+', label: 'Properties Listed' },
            { value: '1,200+', label: 'Happy Clients' },
            { value: '98%', label: 'Client Satisfaction' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-serif text-3xl font-bold text-indigo-600 dark:text-gold-400">{stat.value}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
