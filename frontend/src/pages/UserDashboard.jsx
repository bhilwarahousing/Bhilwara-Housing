import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ChangePasswordCard from '../components/common/ChangePasswordCard';
import {
  LayoutDashboard,
  Heart,
  MessageSquare,
  Calendar,
  User,
  Settings,
  LogOut,
  Search,
  Building,
  ArrowRight,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Clock,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { userAPI, propertyAPI, authAPI, apiRequest } from '../services/api';
import { formatPrice, formatArea } from '../utils/formatters';
import PropertyCard from '../components/common/PropertyCard';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = usePreferences();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'saved' | 'enquiries' | 'visits' | 'profile'
  const [savedProperties, setSavedProperties] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Profile form state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Quick search
  const [searchQuery, setSearchQuery] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [favs, enqs, appts, props] = await Promise.all([
        userAPI.getFavorites().catch(() => []),
        userAPI.getEnquiries().catch(() => []),
        userAPI.getAppointments().catch(() => []),
        propertyAPI.search({ limit: 4 }).catch(() => []),
      ]);
      setSavedProperties(favs);
      setEnquiries(enqs);
      setAppointments(appts);
      setRecommended(props.slice(0, 3));
    } catch (err) {
      console.error('Error loading dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/properties${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: profileName, phone: profilePhone }),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { id: 'overview', label: t('user.tab_overview'), icon: LayoutDashboard },
    { id: 'saved', label: t('user.tab_favorites'), icon: Heart, count: savedProperties.length },
    { id: 'enquiries', label: t('user.tab_enquiries'), icon: MessageSquare, count: enquiries.length },
    { id: 'visits', label: t('user.tab_visits'), icon: Calendar, count: appointments.length },
    { id: 'profile', label: t('user.tab_profile'), icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 flex flex-col md:flex-row transition-colors duration-300">
      {/* ─── Mobile Header ─── */}
      <div className="md:hidden bg-navy-900 text-white p-4 flex items-center justify-between border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center">
            <img src="/favicon.png" alt="Bhilwara Housing" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-xs tracking-wider uppercase">Bhilwara Housing</span>
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-white/80">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ─── Dashboard Sidebar ─── */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-navy-900 text-white flex flex-col justify-between p-6 z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Brand */}
          <Link to="/" className="flex items-center gap-3 mb-8 group">
            <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center shadow group-hover:scale-105 transition-transform">
              <img src="/favicon.png" alt="Bhilwara Housing" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-bold text-xs tracking-wider uppercase">Bhilwara Housing</p>
              <p className="text-[10px] text-gold-400 font-semibold">{t('user.buyer_badge')}</p>
            </div>
          </Link>

          {/* User Mini Profile */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-400 text-navy-900 font-bold flex items-center justify-center text-sm">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-xs truncate text-white">{user?.name || 'Valued Buyer'}</p>
              <p className="text-[11px] text-white/50 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gold-400 text-navy-900 font-bold shadow-md'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-navy-900 text-gold-400' : 'bg-white/15 text-white'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-white/10 space-y-2">
          <Link
            to="/properties"
            className="flex items-center gap-2.5 text-xs text-white/60 hover:text-gold-400 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Search size={14} /> {t('nav.browse_properties')}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 text-xs text-red-300 hover:text-red-200 py-2 px-3 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} /> {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl w-full mx-auto">
        {/* Top welcome banner */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <span className="bg-gold-400/20 text-gold-400 border border-gold-400/30 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 mb-3">
              <Sparkles size={13} /> {t('user.buyer_badge')}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2">
              {t('user.welcome')}, {user?.name?.split(' ')[0] || 'Tyson'}!
            </h1>
            <p className="text-white/60 text-sm max-w-xl mb-6">
              Track your saved properties, check responses from owners, and schedule private property tours.
            </p>

            {/* Quick Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search properties in Shastri Nagar, RC Vyas, Villas…"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 text-xs sm:text-sm focus:outline-none focus:border-gold-400 focus:bg-white/15"
                />
              </div>
              <button
                type="submit"
                className="bg-gold-400 hover:bg-gold-500 text-navy-900 font-bold px-5 sm:px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors shrink-0"
              >
                Find
              </button>
            </form>
          </div>
        </div>

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-slideUp">
            {/* Quick Actions Grid */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/properties')}
                  className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-gold-400 shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Search size={18} />
                  </div>
                  <h3 className="font-bold text-navy-900 text-sm mb-1">Explore Properties</h3>
                  <p className="text-gray-500 text-xs">Search luxury listings across Bhilwara</p>
                </button>

                <button
                  onClick={() => setActiveTab('saved')}
                  className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-gold-400 shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Heart size={18} />
                  </div>
                  <h3 className="font-bold text-navy-900 text-sm mb-1">Saved Properties ({savedProperties.length})</h3>
                  <p className="text-gray-500 text-xs">View all shortlisted favorite homes</p>
                </button>

                <button
                  onClick={() => setActiveTab('enquiries')}
                  className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-gold-400 shadow-sm hover:shadow-md transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <MessageSquare size={18} />
                  </div>
                  <h3 className="font-bold text-navy-900 text-sm mb-1">My Enquiries ({enquiries.length})</h3>
                  <p className="text-gray-500 text-xs">Track responses & quotes from owners</p>
                </button>
              </div>
            </div>

            {/* Recommended Luxury Properties */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-navy-900">Recommended For You</h2>
                  <p className="text-gray-500 text-xs">Curated luxury listings in top localities</p>
                </div>
                <Link to="/properties" className="text-gold-600 hover:text-gold-700 text-xs font-bold flex items-center gap-1">
                  View All <ChevronRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommended.map((prop) => (
                  <PropertyCard key={prop.id} property={prop} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: SAVED PROPERTIES ─── */}
        {activeTab === 'saved' && (
          <div className="space-y-6 animate-slideUp">
            <div>
              <h2 className="font-serif text-2xl font-bold text-navy-900">My Saved Properties</h2>
              <p className="text-gray-500 text-xs">Shortlisted properties you've bookmarked</p>
            </div>

            {savedProperties.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Heart size={24} />
                </div>
                <h3 className="font-serif text-lg font-bold text-navy-900 mb-1">No Saved Properties Yet</h3>
                <p className="text-gray-500 text-xs max-w-sm mx-auto mb-6">
                  Browse our luxury catalog and click the heart icon on any property to save it here.
                </p>
                <Link to="/properties" className="bg-navy-900 text-white font-semibold text-xs px-6 py-2.5 rounded-xl">
                  Explore Properties
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProperties.map((prop) => (
                  <PropertyCard key={prop.id} property={prop} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: MY ENQUIRIES ─── */}
        {activeTab === 'enquiries' && (
          <div className="space-y-6 animate-slideUp">
            <div>
              <h2 className="font-serif text-2xl font-bold text-navy-900">My Property Enquiries</h2>
              <p className="text-gray-500 text-xs">Direct enquiries sent to verified owners</p>
            </div>

            {enquiries.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={24} />
                </div>
                <h3 className="font-serif text-lg font-bold text-navy-900 mb-1">No Enquiries Sent</h3>
                <p className="text-gray-500 text-xs max-w-sm mx-auto mb-6">
                  When you send an enquiry on any property page, you can track owner replies here.
                </p>
                <Link to="/properties" className="bg-navy-900 text-white font-semibold text-xs px-6 py-2.5 rounded-xl">
                  Browse Properties
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enquiries.map((enq) => (
                  <div key={enq.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          enq.status === 'RESPONDED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {enq.status}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(enq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-navy-900 font-bold text-sm mb-1">Property Enquiry #{enq.id}</p>
                      <p className="text-gray-600 text-xs max-w-xl italic">"{enq.message}"</p>
                    </div>

                    <Link
                      to={`/properties/${enq.property_id}`}
                      className="bg-gray-50 hover:bg-navy-900 text-navy-900 hover:text-white text-xs font-semibold px-4 py-2 rounded-xl border border-gray-200 transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      View Property <ArrowRight size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: SCHEDULED VISITS ─── */}
        {activeTab === 'visits' && (
          <div className="space-y-6 animate-slideUp">
            <div>
              <h2 className="font-serif text-2xl font-bold text-navy-900">Scheduled Property Visits</h2>
              <p className="text-gray-500 text-xs">Your confirmed site visits and appointments</p>
            </div>

            {appointments.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar size={24} />
                </div>
                <h3 className="font-serif text-lg font-bold text-navy-900 mb-1">No Upcoming Visits</h3>
                <p className="text-gray-500 text-xs max-w-sm mx-auto mb-6">
                  Schedule physical tours directly from any property detail page.
                </p>
                <Link to="/properties" className="bg-navy-900 text-white font-semibold text-xs px-6 py-2.5 rounded-xl">
                  Browse Properties
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt) => (
                  <div key={appt.id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            {appt.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-navy-900">
                          {new Date(appt.appointment_date).toLocaleString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </h4>
                        {appt.notes && <p className="text-gray-500 text-xs mt-1">Notes: {appt.notes}</p>}
                      </div>
                    </div>

                    <Link
                      to={`/properties/${appt.property_id}`}
                      className="bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0 text-center"
                    >
                      View Property
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 5: PROFILE & SETTINGS ─── */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-slideUp max-w-xl">
            <div>
              <h2 className="font-serif text-2xl font-bold text-navy-900">Profile & Settings</h2>
              <p className="text-gray-500 text-xs">Manage your contact details and account preferences</p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              {profileSaved && (
                <div className="mb-5 p-3.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-800 text-xs">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                  <span>Profile details updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Email Address (Read-only)</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="input-field text-xs bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Account Role</label>
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
                    {user?.role} (Buyer Account)
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full bg-gold-400 hover:bg-gold-500 text-navy-900 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-60 shadow"
                >
                  {profileLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* Change Password Card */}
            <ChangePasswordCard />
          </div>
        )}
      </main>
    </div>
  );
}
