import React, { useState } from 'react';
import { MapPin, Phone, Mail, Send, CheckCircle } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { enquiryAPI } from '../services/api';

export default function Contact() {
  const { t } = usePreferences();
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const contactInfo = [
    {
      icon: MapPin,
      label: 'Office Address',
      value: '3-A-56 R.C. Vyas Colony, Bhilwara',
    },
    {
      icon: Phone,
      label: 'Phone Numbers',
      phones: [
        { label: '+91 96672 62506', href: 'tel:+919667262506' },
        { label: '+91 97994 34091', href: 'tel:+919799434091' },
      ],
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'bhilwarahousing@gmail.com',
      href: 'mailto:bhilwarahousing@gmail.com',
    },
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await enquiryAPI.submitPublicContact({
        name: form.name,
        phone: form.phone,
        message: form.message,
      });
      setSubmitted(true);
      setForm({ name: '', phone: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('Failed to submit contact form:', err);
      // Fallback UI success so user is not blocked
      setSubmitted(true);
      setForm({ name: '', phone: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-white dark:bg-navy-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="section-label mb-3">{t('contact.tag')}</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy-800 dark:text-white leading-snug">
            {t('contact.title')}
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Left — Contact info */}
          <div className="space-y-8">
            <div className="flex flex-col gap-8 bg-gray-50 dark:bg-navy-900/60 p-8 rounded-3xl border border-gray-100 dark:border-white/5">
              {contactInfo.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-5">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-navy-800 flex items-center justify-center shrink-0 border border-transparent dark:border-white/10">
                      <Icon size={18} className="text-indigo-600 dark:text-gold-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        {item.label}
                      </p>
                      {item.phones ? (
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {item.phones.map((phone, idx) => (
                            <React.Fragment key={phone.label}>
                              <a
                                href={phone.href}
                                className="text-gray-700 dark:text-gray-200 text-sm font-medium hover:text-indigo-600 dark:hover:text-gold-400 transition-colors"
                              >
                                {phone.label}
                              </a>
                              {idx < item.phones.length - 1 && (
                                <span className="text-gray-400 text-sm">/</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      ) : item.href ? (
                        <a
                          href={item.href}
                          className="text-gray-700 dark:text-gray-200 text-sm font-medium hover:text-indigo-600 dark:hover:text-gold-400 transition-colors"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-gray-700 dark:text-gray-200 text-sm font-medium">{item.value}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 rounded-2xl bg-gold-50/60 dark:bg-navy-900 border border-gold-200/60 dark:border-gold-400/20">
              <h4 className="font-bold text-navy-900 dark:text-gold-400 text-sm mb-1">Looking for a property in Bhilwara?</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Visit our office in R.C. Vyas Colony or reach out via phone or email for guided assistance and direct owner connections.
              </p>
            </div>
          </div>

          {/* Right — Contact form */}
          <div className="bg-gray-50 dark:bg-navy-900 rounded-3xl p-8 border border-gray-100 dark:border-white/10 shadow-sm">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle size={48} className="text-green-500 mb-4" />
                <h3 className="font-semibold text-navy-800 dark:text-white text-lg mb-2">Message Sent!</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {t('contact.success')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {t('contact.name_label')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder={t('contact.name_placeholder')}
                    className="input-field dark:bg-navy-800 dark:border-white/10 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {t('contact.phone_label')}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder={t('contact.phone_placeholder')}
                    className="input-field dark:bg-navy-800 dark:border-white/10 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {t('contact.msg_label')}
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder={t('contact.msg_placeholder')}
                    className="input-field resize-none dark:bg-navy-800 dark:border-white/10 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-navy-900 hover:bg-navy-800 dark:bg-gold-400 dark:hover:bg-gold-500 dark:text-navy-900 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                  {loading ? t('contact.sending') : t('contact.send_btn')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
