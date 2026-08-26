import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, Menu, User, LogOut, LayoutDashboard, Shield, Sun, Moon, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';

export default function Navbar({ onLoginClick, onSearchClick }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, getDashboardRoute } = useAuth();
  const { isDark, toggleTheme, language, isHindi, toggleLanguage, t } = usePreferences();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setUserDropdown(false);
    navigate('/');
  };

  const getRoleBadge = (role) => {
    if (role === 'OWNER') return <span className="bg-gold-400/20 text-gold-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">{t('role.owner', 'Owner')}</span>;
    if (role === 'ADMIN') return <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">{t('role.admin', 'Admin')}</span>;
    return <span className="bg-blue-500/20 text-blue-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">{t('role.buyer', 'Buyer')}</span>;
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
        scrolled
          ? 'bg-navy-900/95 dark:bg-black/95 backdrop-blur-md shadow-lg border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <img src="/favicon.png" alt="Bhilwara Housing" className="w-full h-full object-contain" />
          </div>
          <span className="hidden sm:block text-white font-bold text-sm tracking-wider uppercase">
            Bhilwara Housing
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 text-white/75 text-sm font-medium">
          <Link to="/properties" className="hover:text-gold-400 transition-colors">{t('nav.properties')}</Link>
          <a href="/#expertise" className="hover:text-gold-400 transition-colors">{t('nav.expertise')}</a>
          <a href="/#collection" className="hover:text-gold-400 transition-colors">{t('nav.collection')}</a>
          <a href="/#contact" className="hover:text-gold-400 transition-colors">{t('nav.contact')}</a>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle (EN / HI) */}
          <button
            onClick={toggleLanguage}
            title={isHindi ? 'Switch to English' : 'हिंदी में बदलें'}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1.5 rounded-lg text-white text-xs font-bold transition-all"
          >
            <Globe size={13} className="text-gold-400" />
            <span className="tracking-wide">{isHindi ? 'हिन्दी' : 'EN'}</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={15} className="text-amber-300" /> : <Moon size={15} className="text-gold-300" />}
          </button>

          {/* Search button */}
          <button
            onClick={onSearchClick}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all"
            aria-label="Search properties"
          >
            <Search size={16} />
          </button>

          {/* Authenticated user menu vs Login button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Direct Go To Dashboard Button */}
              <Link
                to={getDashboardRoute(user?.role)}
                className="hidden sm:flex items-center gap-1.5 bg-gold-400 hover:bg-gold-500 text-navy-900 font-bold text-xs px-3.5 py-2 rounded-lg transition-colors shadow-sm uppercase tracking-wider"
              >
                <LayoutDashboard size={14} />
                <span>{t('nav.dashboard')}</span>
              </Link>

              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg py-1.5 px-3 text-white text-xs font-semibold transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-gold-400 text-navy-900 flex items-center justify-center font-bold text-[11px]">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="hidden md:inline">{user?.name?.split(' ')[0]}</span>
                  {getRoleBadge(user?.role)}
                </button>

                {/* User Dropdown Menu */}
                {userDropdown && (
                  <div className="absolute right-0 mt-2 w-52 bg-navy-900/98 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl py-2 z-50 text-white animate-slideUp">
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                      <p className="text-[11px] text-white/50 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to={getDashboardRoute(user?.role)}
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-gold-400 transition-colors"
                    >
                      <LayoutDashboard size={14} />
                      <span>{t('nav.my_dashboard')}</span>
                    </Link>

                    <Link
                      to="/properties"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-gold-400 transition-colors"
                    >
                      <Search size={14} />
                      <span>{t('nav.browse_properties')}</span>
                    </Link>

                    <div className="border-t border-white/10 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-300 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <LogOut size={14} />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="border border-white/40 text-white text-xs font-semibold tracking-[0.15em] uppercase px-4 sm:px-5 py-2 rounded hover:bg-white/10 hover:border-white/70 transition-all duration-200"
            >
              {t('nav.login')}
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white/80 hover:text-white p-1"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-navy-900/98 backdrop-blur-md border-t border-white/10 px-6 py-4 flex flex-col gap-4 text-sm text-white/80">
          <Link to="/properties" onClick={() => setMenuOpen(false)} className="hover:text-gold-400 transition-colors">{t('nav.properties')}</Link>
          <a href="/#expertise" onClick={() => setMenuOpen(false)} className="hover:text-gold-400 transition-colors">{t('nav.expertise')}</a>
          <a href="/#collection" onClick={() => setMenuOpen(false)} className="hover:text-gold-400 transition-colors">{t('nav.collection')}</a>
          <a href="/#contact" onClick={() => setMenuOpen(false)} className="hover:text-gold-400 transition-colors">{t('nav.contact')}</a>

          <div className="flex items-center gap-3 pt-2 border-t border-white/10">
            <button
              onClick={toggleLanguage}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 py-2 rounded-lg text-xs font-bold text-white"
            >
              <Globe size={14} className="text-gold-400" />
              <span>Language: {isHindi ? 'हिन्दी' : 'English'}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center gap-1.5 bg-white/10 px-4 py-2 rounded-lg text-xs font-bold text-white"
            >
              {isDark ? <Sun size={14} className="text-amber-300" /> : <Moon size={14} className="text-gold-300" />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardRoute(user?.role)}
                onClick={() => setMenuOpen(false)}
                className="text-gold-400 font-semibold flex items-center gap-2"
              >
                <LayoutDashboard size={16} /> {t('nav.my_dashboard')}
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="text-left text-red-300 font-medium"
              >
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setMenuOpen(false);
                onLoginClick();
              }}
              className="text-left text-gold-400 font-semibold"
            >
              {t('nav.login')}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
