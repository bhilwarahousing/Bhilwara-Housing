import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authAPI } from '../../services/api';
import { usePreferences } from '../../context/PreferencesContext';

export default function ChangePasswordCard() {
  const { t } = usePreferences();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError(t('auth.current_pass_req', 'Please enter your current password.'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.pass_min_length', 'New password must be at least 6 characters.'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.pass_mismatch', 'New passwords do not match.'));
      return;
    }

    try {
      setLoading(true);
      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setSuccess(t('auth.pass_change_success', 'Password updated successfully!'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || t('auth.pass_change_failed', 'Failed to update password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-white/10 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gold-400/20 text-gold-500 flex items-center justify-center shrink-0">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h3 className="font-serif text-lg font-bold text-navy-900 dark:text-white">
            {t('auth.change_pass_title', 'Security & Password')}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('auth.change_pass_sub', 'Update your password regularly to keep your account safe')}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-5 p-3.5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {/* Current Password */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
            {t('auth.current_pass_label', 'Current Password')}
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showCurrent ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t('auth.enter_current_pass', 'Enter current password')}
              className="input-field text-sm pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
            {t('auth.new_pass_label', 'New Password')}
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showNew ? 'text' : 'password'}
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('auth.enter_new_pass', 'Enter new password (min 6 chars)')}
              className="input-field text-sm pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
            {t('auth.confirm_new_pass_label', 'Confirm New Password')}
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showConfirm ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('auth.reenter_new_pass', 'Re-enter new password')}
              className="input-field text-sm pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-navy-900 dark:bg-gold-400 hover:bg-gold-500 dark:hover:bg-gold-500 text-white dark:text-navy-900 font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>{t('auth.updating_pass', 'Updating Password…')}</span>
            </>
          ) : (
            t('auth.update_pass_btn', 'Update Password')
          )}
        </button>
      </form>
    </div>
  );
}
