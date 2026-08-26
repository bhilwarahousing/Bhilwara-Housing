import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Linkedin, ArrowUp, Mail, Phone, MapPin } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

export default function Footer() {
  const { t } = usePreferences();
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const navLinks = [
    { label: t('nav.properties'), href: '/properties' },
    { label: t('nav.expertise'), href: '/#expertise' },
    { label: t('nav.collection'), href: '/#collection' },
    { label: t('nav.contact'), href: '/#contact' },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Use', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ];

  const socials = [
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter / X' },
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-navy-900 dark:bg-black text-white border-t border-white/5 transition-colors duration-300">
      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand & Direct Contact */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center shadow-md">
                <img src="/favicon.png" alt="Bhilwara Housing Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-white font-bold tracking-wider text-base uppercase">BHILWARA HOUSING</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-5">
              {t('footer.tagline')}
            </p>

            {/* Direct Contact Details */}
            <div className="space-y-2 text-xs text-white/70">
              <div className="flex items-center gap-2.5">
                <Mail size={14} className="text-gold-400 shrink-0" />
                <a href="mailto:bhilwarahousing@gmail.com" className="hover:text-gold-400 transition-colors">
                  bhilwarahousing@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={14} className="text-gold-400 shrink-0" />
                <div className="flex gap-2">
                  <a href="tel:+919667062506" className="hover:text-gold-400 transition-colors">
                    +91 96670 62506
                  </a>
                  <span className="text-white/30">/</span>
                  <a href="tel:+919799434091" className="hover:text-gold-400 transition-colors">
                    +91 97994 34091
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin size={14} className="text-gold-400 shrink-0" />
                <span>RC Vyas Colony, Bhilwara</span>
              </div>
            </div>

            {/* Social icons */}
            <div className="flex gap-3 mt-6">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-gold-400 hover:text-gold-400 transition-all duration-200"
                  >
                    <Icon size={15} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 mb-5">{t('footer.quick_links')}</h4>
            <ul className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-white/60 text-sm hover:text-gold-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 mb-5">{t('footer.legal')}</h4>
            <ul className="flex flex-col gap-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-white/60 text-sm hover:text-gold-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            {/* Back to top */}
            <button
              onClick={scrollToTop}
              className="mt-8 w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-gold-400 hover:text-gold-400 transition-all duration-200"
              aria-label="Back to top"
            >
              <ArrowUp size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Bhilwara Housing. {t('footer.rights')}
          </p>
          <p className="text-white/30 text-xs">
            Crafted with care in Rajasthan, India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
