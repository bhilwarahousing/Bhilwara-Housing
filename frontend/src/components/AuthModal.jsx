import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Eye, EyeOff, Lock, Mail, User, Phone, ArrowRight, AlertCircle, Sparkles, KeyRound, RotateCcw, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';

/**
 * Glassmorphism Auth Modal with Email OTP Verification
 * Opens over the blurred homepage.
 * Automatically authenticates and redirects based on RBAC role.
 */
export default function AuthModal({ isOpen, mode = 'login', initialQuery = '', onClose }) {
  const navigate = useNavigate();
  const { login, sendRegisterOTP, verifyOTPAndRegister, getDashboardRoute } = useAuth();
  const { t } = usePreferences();

  const [tab, setTab] = useState(mode === 'register' ? 'register' : 'login');
  const [registerStep, setRegisterStep] = useState('form'); // 'form' | 'otp'
  const [otpValue, setOtpValue] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'USER',
  });

  // Sync mode prop
  useEffect(() => {
    setError('');
    if (mode === 'search') return;
    setTab(mode === 'register' ? 'register' : 'login');
    setRegisterStep('form');
    setOtpValue('');
  }, [mode, isOpen]);

  // Resend Countdown Timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authenticatedUser = await login(loginForm.email, loginForm.password);
      onClose();
      // RBAC redirect
      const targetRoute = getDashboardRoute(authenticatedUser.role);
      navigate(targetRoute);
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Submit Register Form -> Request 6-digit OTP
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendRegisterOTP({
        email: registerForm.email,
        name: registerForm.name,
        role: registerForm.role,
      });
      setRegisterStep('otp');
      setResendTimer(60); // 60 seconds cooldown
      setOtpValue('');
    } catch (err) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP -> Finalize Account Creation
  const handleVerifyOTPSubmit = async (e) => {
    e.preventDefault();
    if (!otpValue || otpValue.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const newUser = await verifyOTPAndRegister({
        email: registerForm.email,
        otp: otpValue,
        name: registerForm.name,
        password: registerForm.password,
        role: registerForm.role,
        phone: registerForm.phone,
      });
      onClose();
      // RBAC redirect
      const targetRoute = getDashboardRoute(newUser.role);
      navigate(targetRoute);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await sendRegisterOTP({
        email: registerForm.email,
        name: registerForm.name,
        role: registerForm.role,
      });
      setResendTimer(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  const handleSearchContinue = () => {
    setTab('login');
  };

  const handleGuestSearch = () => {
    onClose();
    navigate(`/properties${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  return (
    <div className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Blurred dark backdrop */}
      <div
        className="absolute inset-0 bg-navy-900/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="modal-panel relative w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white/60 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-all"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* ─── Search Mode ─── */}
        {mode === 'search' && tab !== 'login' && tab !== 'register' ? (
          <div className="p-8">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-sm">
                <img src="/favicon.png" alt="Bhilwara Housing" className="w-full h-full object-contain" />
              </div>
              <span className="text-white/80 font-bold text-xs tracking-wider uppercase">Bhilwara Housing</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-white mb-1">{t('auth.guest_search_title')}</h2>
            <p className="text-white/50 text-xs mb-6">{t('auth.guest_search_subtitle')}</p>

            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">{t('catalog.keyword')}</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Shastri Nagar, RC Vyas, Villa…"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-gold-400 mb-4"
            />

            <p className="text-white/60 text-xs mb-6 leading-relaxed">
              {t('auth.login_subtitle')}
            </p>

            <button
              onClick={handleSearchContinue}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm py-3 rounded-lg flex items-center justify-center gap-2 mb-3 transition-colors shadow-lg"
            >
              {t('auth.login_to_continue')} <ArrowRight size={15} />
            </button>

            <button
              onClick={handleGuestSearch}
              className="w-full text-white/70 hover:text-white text-xs py-2 transition-colors border border-white/10 rounded-lg hover:bg-white/5"
            >
              {t('auth.continue_as_guest')}
            </button>
          </div>
        ) : (
          <>
            {/* Tab switcher */}
            <div className="flex border-b border-white/10">
              {['login', 'register'].map((tKey) => (
                <button
                  key={tKey}
                  onClick={() => {
                    setTab(tKey);
                    setError('');
                  }}
                  className={`flex-1 py-4 text-sm font-semibold uppercase tracking-wider transition-all duration-200 ${
                    tab === tKey
                      ? 'text-gold-400 border-b-2 border-gold-400 bg-white/5'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {tKey === 'login' ? t('auth.login_tab') : t('auth.register_tab')}
                </button>
              ))}
            </div>

            <div className="p-7">
              {/* Error alert */}
              {error && (
                <div className="mb-5 p-3.5 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center gap-2.5 text-red-200 text-xs">
                  <AlertCircle size={16} className="shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {tab === 'login' ? (
                <>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-sm">
                      <img src="/favicon.png" alt="Bhilwara Housing" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-white/80 font-bold text-xs tracking-wider uppercase">Bhilwara Housing</span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-white mb-1">{t('auth.welcome_back', 'Welcome Back')}</h2>
                  <p className="text-white/50 text-xs mb-6">{t('auth.login_sub', 'Sign in to your Bhilwara Housing account')}</p>

                  <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                    {/* Email */}
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="email"
                        required
                        placeholder={t('auth.email_placeholder', 'Email Address')}
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-gold-400 focus:bg-white/15 transition-all"
                      />
                    </div>

                    {/* Password */}
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder={t('auth.password_placeholder', 'Password')}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-11 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-gold-400 focus:bg-white/15 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gold-400 hover:bg-gold-500 text-navy-900 font-bold text-sm py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-lg mt-1"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                      ) : (
                        t('auth.login_btn', 'Login')
                      )}
                    </button>
                  </form>

                  <p className="text-center text-white/40 text-xs mt-6">
                    {t('auth.no_account', "Don't have an account?")}{' '}
                    <button
                      onClick={() => {
                        setTab('register');
                        setError('');
                      }}
                      className="text-gold-400 hover:underline font-medium"
                    >
                      {t('auth.register_link', 'Register')}
                    </button>
                  </p>
                </>
              ) : registerStep === 'form' ? (
                <>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-sm">
                      <img src="/favicon.png" alt="Bhilwara Housing" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-white/80 font-bold text-xs tracking-wider uppercase">Bhilwara Housing</span>
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-white mb-1">{t('auth.create_account', 'Create Account')}</h2>
                  <p className="text-white/50 text-xs mb-6">{t('auth.register_sub', 'Enter your details to receive an email verification code')}</p>

                  <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
                    {/* Name */}
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        required
                        placeholder={t('auth.full_name', 'Full Name')}
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-gold-400 focus:bg-white/15 transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="email"
                        required
                        placeholder={t('auth.email_placeholder', 'Email Address')}
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-gold-400 focus:bg-white/15 transition-all"
                      />
                    </div>

                    {/* Phone */}
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="tel"
                        placeholder={t('auth.phone_optional', 'Phone Number (optional)')}
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-gold-400 focus:bg-white/15 transition-all"
                      />
                    </div>

                    {/* Password */}
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder={t('auth.create_password', 'Create Password (min 6 chars)')}
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-11 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-gold-400 focus:bg-white/15 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {/* Role select */}
                    <div>
                      <label className="block text-white/50 text-xs mb-2 uppercase tracking-wider">{t('auth.i_am_a', 'I am a…')}</label>
                      <div className="flex gap-3">
                        {[
                          { value: 'USER', label: t('auth.role_buyer_tenant', 'Buyer / Tenant') },
                          { value: 'OWNER', label: t('auth.role_owner_agent', 'Property Owner') },
                        ].map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => setRegisterForm({ ...registerForm, role: r.value })}
                            className={`flex-1 py-2.5 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                              registerForm.role === r.value
                                ? 'bg-gold-400/20 border-gold-400 text-gold-400 shadow-sm font-bold'
                                : 'bg-white/5 border-white/20 text-white/50 hover:border-white/40'
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gold-400 hover:bg-gold-500 text-navy-900 font-bold text-sm py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-lg mt-1"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                          <span>{t('auth.sending_otp', 'Sending Verification Code…')}</span>
                        </>
                      ) : (
                        <>
                          <span>{t('auth.continue_otp', 'Continue with Email OTP')}</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-center text-white/40 text-xs mt-5">
                    {t('auth.already_account', 'Already have an account?')}{' '}
                    <button
                      onClick={() => {
                        setTab('login');
                        setError('');
                      }}
                      className="text-gold-400 hover:underline font-medium"
                    >
                      {t('auth.login_link', 'Login')}
                    </button>
                  </p>
                </>
              ) : (
                /* ── STEP 2: OTP ENTRY ── */
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterStep('form');
                      setError('');
                    }}
                    className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white mb-4 transition-colors"
                  >
                    <ArrowLeft size={14} /> {t('auth.back_to_details', 'Back to details')}
                  </button>

                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gold-400/20 border border-gold-400/40 text-gold-400 flex items-center justify-center mx-auto mb-3">
                      <KeyRound size={22} />
                    </div>
                    <h2 className="font-serif text-2xl font-bold text-white mb-1">{t('auth.verify_email_title', 'Verify Your Email')}</h2>
                    <p className="text-white/60 text-xs max-w-xs mx-auto">
                      {t('auth.verify_email_sub', 'We sent a 6-digit verification code to')} <span className="text-gold-400 font-semibold">{registerForm.email}</span>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOTPSubmit} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-white/60 text-center text-xs uppercase tracking-widest mb-2 font-medium">
                        {t('auth.enter_otp_label', 'Enter 6-Digit Code')}
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        autoFocus
                        required
                        placeholder="• • • • • •"
                        value={otpValue}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setOtpValue(digitsOnly);
                        }}
                        className="w-full bg-white/10 border-2 border-gold-400/50 focus:border-gold-400 rounded-xl py-3.5 text-center text-white text-2xl font-mono tracking-[0.5em] focus:outline-none focus:bg-white/15 transition-all shadow-inner"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpValue.length !== 6}
                      className="w-full bg-gold-400 hover:bg-gold-500 text-navy-900 font-bold text-sm py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg mt-1"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                          <span>{t('auth.verifying_code', 'Verifying Account…')}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>{t('auth.verify_complete_btn', 'Verify & Complete Registration')}</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Resend OTP */}
                  <div className="text-center mt-5 pt-4 border-t border-white/10">
                    {resendTimer > 0 ? (
                      <p className="text-white/40 text-xs flex items-center justify-center gap-1">
                        <RotateCcw size={12} className="animate-spin text-gold-400" />
                        <span>{t('auth.resend_in', 'Resend code in')} <strong className="text-gold-400 font-mono">{resendTimer}s</strong></span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={resending}
                        className="text-gold-400 hover:underline text-xs font-semibold flex items-center justify-center gap-1 mx-auto transition-colors"
                      >
                        <RotateCcw size={12} />
                        <span>{t('auth.resend_code', 'Resend Verification Code')}</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
