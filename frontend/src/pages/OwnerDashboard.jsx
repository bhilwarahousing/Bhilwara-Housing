import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ChangePasswordCard from '../components/common/ChangePasswordCard';
import {
  LayoutDashboard,
  Building,
  Plus,
  MessageSquare,
  BarChart3,
  User,
  LogOut,
  Search,
  CheckCircle2,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Trash2,
  Phone,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Menu,
  X,
  RotateCcw,
  Check,
  Filter,
  Calendar,
  CalendarCheck,
  CalendarX,
  UserCheck,
  Lock,
  Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { ownerAPI, apiRequest } from '../services/api';
import { formatPrice } from '../utils/formatters';
import MultiStepAddProperty from '../components/owner/MultiStepAddProperty';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = usePreferences();

  const [activeTab, setActiveTab] = useState('properties'); // 'properties' | 'enquiries' | 'analytics' | 'profile'
  const [showAddWizard, setShowAddWizard] = useState(false);

  const [properties, setProperties] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [enquiryFilter, setEnquiryFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'DONE'
  const [visitFilter, setVisitFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  const [updatingEnquiryId, setUpdatingEnquiryId] = useState(null);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState(null);
  const [selectedLocationEnquiry, setSelectedLocationEnquiry] = useState(null);
  const [stats, setStats] = useState({
    total_properties: 0,
    active_listings: 0,
    pending_approval: 0,
    total_enquiries: 0,
  });
  const [analytics, setAnalytics] = useState({
    total_properties: 0,
    active_listings: 0,
    pending_approval: 0,
    rejected_listings: 0,
    total_enquiries: 0,
    pending_enquiries: 0,
    done_enquiries: 0,
    total_favorites: 0,
    total_visits: 0,
    property_breakdown: [],
  });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadOwnerData = async () => {
    setLoading(true);
    try {
      const [props, enqs, appts, st, an] = await Promise.all([
        ownerAPI.getProperties().catch(() => []),
        ownerAPI.getEnquiries().catch(() => []),
        ownerAPI.getAppointments().catch(() => []),
        ownerAPI.getStats().catch(() => ({})),
        ownerAPI.getAnalytics().catch(() => ({})),
      ]);
      setProperties(props);
      setEnquiries(enqs);
      setAppointments(appts);
      setStats(st);
      if (an && Object.keys(an).length > 0) setAnalytics(an);
    } catch (err) {
      console.error('Error loading owner data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

  const handleMarkEnquiryStatus = async (enquiryId, newStatus) => {
    setUpdatingEnquiryId(enquiryId);
    try {
      await ownerAPI.updateEnquiryStatus(enquiryId, newStatus);
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiryId ? { ...e, status: newStatus } : e))
      );
    } catch (err) {
      alert(err.message || 'Failed to update enquiry status.');
    } finally {
      setUpdatingEnquiryId(null);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, newStatus) => {
    setUpdatingAppointmentId(appointmentId);
    try {
      await ownerAPI.updateAppointmentStatus(appointmentId, newStatus);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      alert(err.message || 'Failed to update appointment status.');
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  const handleMarkSold = async (propertyId, listingType) => {
    try {
      await ownerAPI.markSold(propertyId);
      loadOwnerData();
      alert(`🎉 Property marked as ${listingType === 'Rent' ? 'RENTED' : 'SOLD'}!`);
    } catch (err) {
      alert(err.message || 'Failed to update property status.');
    }
  };

  const handleMarkAvailable = async (propertyId) => {
    try {
      await ownerAPI.markAvailable(propertyId);
      loadOwnerData();
      alert('✓ Property status updated to Ready to Buy / Available!');
    } catch (err) {
      alert(err.message || 'Failed to update property status.');
    }
  };

  const handleWizardSuccess = () => {
    setShowAddWizard(false);
    loadOwnerData();
    alert('🎉 Property submitted successfully! It is now PENDING approval from the platform administrator.');
  };

  const handleAddPropertyClick = () => {
    if (!user?.is_verified && user?.role !== 'ADMIN') {
      alert('⚠️ Verification Required: Your owner account is pending verification by the platform administrator. Once verified, you will be able to add property listings.');
      return;
    }
    setShowAddWizard(true);
  };

  const getStatusBadge = (status) => {
    if (status === 'APPROVED') {
      return (
        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <CheckCircle2 size={12} /> Ready to Buy
        </span>
      );
    }
    if (status === 'SOLD') {
      return (
        <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Tag size={12} /> SOLD
        </span>
      );
    }
    if (status === 'RENTED') {
      return (
        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Tag size={12} /> RENTED
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Clock size={12} /> Pending Approval
        </span>
      );
    }
    if (status === 'ARCHIVED') {
      return (
        <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <ShieldCheck size={12} /> Archived (Security Log)
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <AlertCircle size={12} /> Rejected
        </span>
      );
    }
    return (
      <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row">
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

      {/* ─── Sidebar ─── */}
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
              <p className="text-[10px] text-gold-400 font-semibold">Owner Portal</p>
            </div>
          </Link>

          {/* Owner Identity */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-400 text-navy-900 font-bold flex items-center justify-center text-sm">
              {user?.name ? user.name[0].toUpperCase() : 'O'}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-xs truncate text-white">{user?.name || 'Property Owner'}</p>
              {user?.is_verified ? (
                <p className="text-[11px] text-green-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck size={11} /> Verified Owner ✓
                </p>
              ) : (
                <p className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                  <Clock size={11} /> Pending Verification
                </p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {[
              { id: 'properties', label: 'My Properties', icon: Building, count: properties.length },
              { id: 'enquiries', label: 'Enquiries', icon: MessageSquare, count: enquiries.length },
              { id: 'visits', label: 'Site Visits', icon: Calendar, count: appointments.filter(a => a.status === 'PENDING').length },
              { id: 'analytics', label: 'Analytics & Views', icon: BarChart3 },
              { id: 'profile', label: 'Owner Profile', icon: User },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && !showAddWizard;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setShowAddWizard(false);
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
            <Search size={14} /> Public Marketplace
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full flex items-center gap-2.5 text-xs text-red-300 hover:text-red-200 py-2 px-3 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl w-full mx-auto">
        {/* Top Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-3xl font-bold text-navy-900 flex items-center gap-2">
              <span>Welcome, {user?.name || 'Property Owner'}</span>
              {user?.is_verified && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full" title="Verified Partner">
                  <ShieldCheck size={13} className="text-green-600" /> Verified
                </span>
              )}
            </h1>
            <p className="text-gray-500 text-xs mt-1">Manage your luxury real estate listings and buyer enquiries</p>
          </div>

          <button
            onClick={handleAddPropertyClick}
            className={`font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-colors shrink-0 ${
              user?.is_verified
                ? 'bg-gold-400 hover:bg-gold-500 text-navy-900'
                : 'bg-gray-200 dark:bg-navy-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300'
            }`}
          >
            {user?.is_verified ? <Plus size={16} /> : <Lock size={14} />}
            <span>Add Property</span>
          </button>
        </div>

        {/* ⚠️ Pending Verification Notice for Unverified Owners */}
        {user && !user.is_verified && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-8 flex items-start gap-3 shadow-xs animate-slideUp">
            <AlertCircle size={20} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-amber-900 text-sm">Account Verification Pending</p>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                Your owner profile is currently awaiting administrative partner verification. 
                Accounts that remain unverified for more than <strong>10 days</strong> from registration are automatically cleaned up. 
                Our team will verify your account shortly.
              </p>
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Properties</p>
            <p className="font-serif text-3xl font-bold text-navy-900 mt-1">{stats.total_properties || properties.length}</p>
            <p className="text-[11px] text-gray-500 mt-1">Total listings created</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Active Listings</p>
            <p className="font-serif text-3xl font-bold text-green-600 mt-1">{stats.active_listings || 0}</p>
            <p className="text-[11px] text-gray-500 mt-1">Live in marketplace</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending Approval</p>
            <p className="font-serif text-3xl font-bold text-amber-600 mt-1">{stats.pending_approval || 0}</p>
            <p className="text-[11px] text-gray-500 mt-1">Awaiting admin review</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Enquiries</p>
            <p className="font-serif text-3xl font-bold text-indigo-600 mt-1">{stats.total_enquiries || enquiries.length}</p>
            <p className="text-[11px] text-gray-500 mt-1">Buyer inquiries received</p>
          </div>
        </div>

        {/* ─── ADD PROPERTY WIZARD OR TABS ─── */}
        {showAddWizard ? (
          <MultiStepAddProperty
            onSuccess={handleWizardSuccess}
            onCancel={() => setShowAddWizard(false)}
          />
        ) : (
          <>
            {/* ─── TAB 1: MY PROPERTIES ─── */}
            {activeTab === 'properties' && (
              <div className="space-y-6 animate-slideUp">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-navy-900">My Properties</h2>
                    <p className="text-gray-500 text-xs">All properties under your owner account</p>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="bg-white p-6 rounded-2xl border border-gray-200 animate-pulse h-24" />
                    ))}
                  </div>
                ) : properties.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
                    <Building size={32} className="text-gray-300 mx-auto mb-3" />
                    <h3 className="font-serif text-lg font-bold text-navy-900 mb-1">No Properties Listed Yet</h3>
                    <p className="text-gray-500 text-xs mb-6 max-w-sm mx-auto">
                      List your first property to start receiving verified buyer enquiries and booking site visits.
                    </p>
                    <button
                      onClick={handleAddPropertyClick}
                      className="bg-navy-900 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center justify-center gap-2 mx-auto"
                    >
                      {user?.is_verified ? <Plus size={14} /> : <Lock size={13} />}
                      <span>Add Your First Property</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200 font-bold">
                          <tr>
                            <th className="p-4">Property</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {properties.map((prop) => {
                            const coverImg =
                              prop.images?.[0]?.image_url ||
                              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80';
                            return (
                              <tr key={prop.id} className="hover:bg-gray-50/80 transition-colors">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={coverImg}
                                      alt={prop.title}
                                      className="w-14 h-11 object-cover rounded-lg shrink-0"
                                    />
                                    <div>
                                      <p className="font-bold text-navy-900 text-xs line-clamp-1">{prop.title}</p>
                                      <p className="text-gray-400 text-[11px] flex items-center gap-1">
                                        <MapPin size={11} className="text-gold-500" /> {prop.address}, {prop.city}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 font-semibold text-gray-700">
                                  {prop.property_type} ({prop.listing_type})
                                </td>
                                <td className="p-4 font-serif font-bold text-navy-900">
                                  {formatPrice(prop.price, prop.listing_type)}
                                </td>
                                <td className="p-4">
                                  {getStatusBadge(prop.status)}
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Link
                                      to={`/properties/${prop.id}`}
                                      className="p-2 bg-gray-100 hover:bg-navy-900 hover:text-white rounded-lg text-gray-600 transition-colors"
                                      title="View Details"
                                    >
                                      <Eye size={14} />
                                    </Link>

                                    {prop.status === 'APPROVED' && (
                                      <button
                                        onClick={() => handleMarkSold(prop.id, prop.listing_type)}
                                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-purple-200"
                                        title={`Mark property as ${prop.listing_type === 'Rent' ? 'RENTED' : 'SOLD'}`}
                                      >
                                        <Tag size={13} />
                                        <span>Mark {prop.listing_type === 'Rent' ? 'Rented' : 'Sold'}</span>
                                      </button>
                                    )}

                                    {(prop.status === 'SOLD' || prop.status === 'RENTED') && (
                                      <button
                                        onClick={() => handleMarkAvailable(prop.id)}
                                        className="px-3 py-1.5 bg-green-50 hover:bg-green-600 text-green-700 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-green-200"
                                        title="Mark property back as Ready to Buy / Available"
                                      >
                                        <CheckCircle2 size={13} />
                                        <span>Ready to Buy</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 2: ENQUIRIES ─── */}
            {activeTab === 'enquiries' && (
              <div className="space-y-6 animate-slideUp">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-navy-900 dark:text-white">{t('owner.tab_enquiries')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Direct inquiries received for your listings</p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-navy-800 p-1 rounded-xl shrink-0 self-start sm:self-auto">
                    {[
                      { id: 'ALL', label: t('owner.filter_all'), count: enquiries.length },
                      { id: 'PENDING', label: t('owner.filter_pending'), count: enquiries.filter((e) => e.status !== 'DONE').length },
                      { id: 'DONE', label: t('owner.filter_done'), count: enquiries.filter((e) => e.status === 'DONE').length },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setEnquiryFilter(f.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          enquiryFilter === f.id
                            ? 'bg-white dark:bg-gold-400 text-navy-900 shadow-sm font-bold'
                            : 'text-gray-500 dark:text-gray-400 hover:text-navy-900 dark:hover:text-white'
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          enquiryFilter === f.id
                            ? 'bg-navy-900 text-gold-400 dark:bg-navy-950 dark:text-gold-300'
                            : 'bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {enquiries.length === 0 ? (
                  <div className="bg-white dark:bg-navy-900 rounded-2xl p-12 border border-gray-200 dark:border-white/10 text-center">
                    <MessageSquare size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <h3 className="font-serif text-lg font-bold text-navy-900 dark:text-white mb-1">No Enquiries Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs max-w-sm mx-auto">
                      When buyers view your active listings and submit an enquiry form, their details and messages will show up here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enquiries
                      .filter((enq) => {
                        if (enquiryFilter === 'PENDING') return enq.status !== 'DONE';
                        if (enquiryFilter === 'DONE') return enq.status === 'DONE';
                        return true;
                      })
                      .map((enq) => {
                        const isDone = enq.status === 'DONE';
                        const isUpdating = updatingEnquiryId === enq.id;

                        return (
                          <div
                            key={enq.id}
                            className={`bg-white dark:bg-navy-900 rounded-2xl p-6 border shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                              isDone
                                ? 'border-green-200 dark:border-green-900/40 bg-green-50/20 dark:bg-green-950/10'
                                : 'border-gray-200 dark:border-white/10 hover:border-gold-400/50'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <Link
                                  to={`/properties/${enq.property_id}`}
                                  className="bg-navy-900 dark:bg-navy-800 text-gold-400 hover:text-gold-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-gold-400/20 flex items-center gap-1 transition-colors"
                                >
                                  <span>{enq.property_title || `Property #${enq.property_id}`}</span>
                                  <Eye size={10} />
                                </Link>
                                
                                {isDone ? (
                                  <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle size={11} className="text-green-600 dark:text-green-400" />
                                    {t('owner.done_badge')}
                                  </span>
                                ) : (
                                  <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <Clock size={11} className="text-amber-600 dark:text-amber-400" />
                                    {t('owner.pending_badge')}
                                  </span>
                                )}

                                <span className="text-gray-400 text-xs">
                                  {new Date(enq.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>

                              {/* Property Location Bar */}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-300 mb-3 bg-gray-50/80 dark:bg-navy-800/40 px-3 py-2 rounded-xl border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-1.5 font-medium">
                                  <MapPin size={13} className="text-gold-500 shrink-0" />
                                  <span>
                                    {enq.property_address ? `${enq.property_address}, ${enq.property_city || 'Bhilwara'}` : 'Bhilwara, Rajasthan'}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setSelectedLocationEnquiry(enq)}
                                  className="text-xs font-bold text-indigo-600 dark:text-gold-400 hover:underline flex items-center gap-1 shrink-0 ml-auto sm:ml-0"
                                >
                                  <span>{t('owner.view_map')}</span>
                                  <Eye size={11} />
                                </button>
                              </div>

                              <p className="text-gray-800 dark:text-gray-200 text-xs sm:text-sm font-medium mb-3 leading-relaxed bg-white dark:bg-navy-800/80 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                                "{enq.message}"
                              </p>

                              {enq.phone && (
                                <p className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                                  <Phone size={13} className="text-green-600 dark:text-green-400" /> Buyer Phone: 
                                  <a href={`tel:${enq.phone}`} className="text-indigo-600 dark:text-gold-400 hover:underline font-semibold">
                                    {enq.phone}
                                  </a>
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 self-stretch sm:self-center">
                              {/* Location preview button */}
                              <button
                                onClick={() => setSelectedLocationEnquiry(enq)}
                                className="bg-gray-100 hover:bg-gray-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-navy-900 dark:text-gray-200 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                                title="Open Location Map"
                              >
                                <MapPin size={13} className="text-gold-500" />
                                <span>{t('owner.view_map')}</span>
                              </button>

                              {/* Mark as Done / Reopen Button */}
                              {isDone ? (
                                <button
                                  onClick={() => handleMarkEnquiryStatus(enq.id, 'PENDING')}
                                  disabled={isUpdating}
                                  className="bg-gray-100 hover:bg-gray-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-gray-700 dark:text-gray-300 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                  title="Mark back as pending"
                                >
                                  <RotateCcw size={13} className={isUpdating ? 'animate-spin' : ''} />
                                  <span>{t('owner.reopen')}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleMarkEnquiryStatus(enq.id, 'DONE')}
                                  disabled={isUpdating}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 hover:shadow"
                                  title="Mark enquiry as resolved"
                                >
                                  <Check size={14} className={isUpdating ? 'animate-spin' : ''} />
                                  <span>{t('owner.mark_done')}</span>
                                </button>
                              )}

                              {/* Call Buyer CTA */}
                              {enq.phone && (
                                <a
                                  href={`tel:${enq.phone}`}
                                  className="bg-navy-900 hover:bg-navy-800 dark:bg-gold-400 dark:hover:bg-gold-500 text-white dark:text-navy-900 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                  <Phone size={13} /> {t('owner.call_buyer')}
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB: SITE VISITS ─── */}
            {activeTab === 'visits' && (
              <div className="space-y-6 animate-slideUp">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-navy-900 dark:text-white">Site Visit Requests</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Buyers who want to visit your properties</p>
                  </div>

                  {/* Visit Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-navy-800 p-1 rounded-xl shrink-0 self-start sm:self-auto flex-wrap">
                    {[
                      { id: 'ALL', label: 'All', count: appointments.length },
                      { id: 'PENDING', label: 'Pending', count: appointments.filter(a => a.status === 'PENDING').length },
                      { id: 'CONFIRMED', label: 'Confirmed', count: appointments.filter(a => a.status === 'CONFIRMED').length },
                      { id: 'COMPLETED', label: 'Completed', count: appointments.filter(a => a.status === 'COMPLETED').length },
                      { id: 'CANCELLED', label: 'Cancelled', count: appointments.filter(a => a.status === 'CANCELLED').length },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setVisitFilter(f.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          visitFilter === f.id
                            ? 'bg-white dark:bg-gold-400 text-navy-900 shadow-sm font-bold'
                            : 'text-gray-500 dark:text-gray-400 hover:text-navy-900 dark:hover:text-white'
                        }`}
                      >
                        <span>{f.label}</span>
                        {f.count > 0 && (
                          <span className={`text-[10px] px-1.5 rounded-full ${
                            visitFilter === f.id
                              ? 'bg-navy-900 text-gold-400 dark:bg-navy-950 dark:text-gold-300'
                              : 'bg-gray-200 dark:bg-navy-700 text-gray-700 dark:text-gray-300'
                          }`}>{f.count}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {appointments.length === 0 ? (
                  <div className="bg-white dark:bg-navy-900 rounded-2xl p-12 border border-gray-200 dark:border-white/10 text-center">
                    <Calendar size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <h3 className="font-serif text-lg font-bold text-navy-900 dark:text-white mb-1">No Visit Requests Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs max-w-sm mx-auto">
                      When buyers schedule a site visit for your active listings, the requests will appear here for you to confirm or reject.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments
                      .filter((a) => visitFilter === 'ALL' || a.status === visitFilter)
                      .map((appt) => {
                        const isUpdating = updatingAppointmentId === appt.id;
                        const isPending = appt.status === 'PENDING';
                        const isConfirmed = appt.status === 'CONFIRMED';
                        const isCancelled = appt.status === 'CANCELLED';
                        const isCompleted = appt.status === 'COMPLETED';

                        const visitDate = new Date(appt.appointment_date);
                        const isPast = visitDate < new Date();

                        return (
                          <div
                            key={appt.id}
                            className={`bg-white dark:bg-navy-900 rounded-2xl p-6 border shadow-sm transition-all ${
                              isConfirmed ? 'border-blue-200 dark:border-blue-900/40'
                              : isCancelled ? 'border-red-100 dark:border-red-900/30 opacity-70'
                              : isCompleted ? 'border-green-200 dark:border-green-900/40'
                              : 'border-amber-200 dark:border-amber-900/40 hover:border-gold-400/50'
                            }`}
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                              {/* Visit Info */}
                              <div className="flex-1 space-y-3">
                                {/* Header Row */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link
                                    to={`/properties/${appt.property_id}`}
                                    className="bg-navy-900 dark:bg-navy-800 text-gold-400 hover:text-gold-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-gold-400/20 flex items-center gap-1"
                                  >
                                    <span>{appt.property_title || `Property #${appt.property_id}`}</span>
                                    <Eye size={10} />
                                  </Link>

                                  {/* Status Badge */}
                                  {isPending && (
                                    <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                      <Clock size={11} /> Awaiting Confirmation
                                    </span>
                                  )}
                                  {isConfirmed && (
                                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                      <CalendarCheck size={11} /> Confirmed
                                    </span>
                                  )}
                                  {isCompleted && (
                                    <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                      <CheckCircle size={11} /> Completed
                                    </span>
                                  )}
                                  {isCancelled && (
                                    <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                      <CalendarX size={11} /> Cancelled
                                    </span>
                                  )}

                                  <span className="text-gray-400 text-xs ml-auto">
                                    Requested {new Date(appt.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>

                                {/* Visit Date & Location */}
                                <div className="flex flex-wrap gap-4 bg-gray-50 dark:bg-navy-800/60 rounded-xl px-4 py-3 border border-gray-100 dark:border-white/5">
                                  <div className="flex items-center gap-2">
                                    <Calendar size={14} className={`shrink-0 ${isPast ? 'text-gray-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
                                    <div>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase">Visit Date & Time</p>
                                      <p className={`font-bold text-xs ${isPast && !isCompleted ? 'text-gray-400' : 'text-navy-900 dark:text-white'}`}>
                                        {visitDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })} at{' '}
                                        {visitDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        {isPast && !isCompleted && <span className="ml-1 text-gray-400 font-normal">(Past)</span>}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-gold-500 shrink-0" />
                                    <div>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase">Location</p>
                                      <p className="font-bold text-xs text-navy-900 dark:text-white">
                                        {appt.property_address ? `${appt.property_address}, ${appt.property_city || 'Bhilwara'}` : `${appt.property_city || 'Bhilwara'}, Rajasthan`}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Buyer Info */}
                                <div className="flex flex-wrap gap-3 text-xs text-gray-700 dark:text-gray-300">
                                  <div className="flex items-center gap-1.5 font-semibold">
                                    <UserCheck size={13} className="text-gold-500" />
                                    <span>{appt.buyer_name || 'Verified Buyer'}</span>
                                  </div>
                                  {appt.buyer_phone && (
                                    <a href={`tel:${appt.buyer_phone}`} className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-gold-400 hover:underline">
                                      <Phone size={13} />
                                      <span>{appt.buyer_phone}</span>
                                    </a>
                                  )}
                                  {appt.buyer_email && (
                                    <span className="text-gray-500 dark:text-gray-400">{appt.buyer_email}</span>
                                  )}
                                </div>

                                {/* Notes */}
                                {appt.notes && (
                                  <p className="text-xs text-gray-600 dark:text-gray-300 italic bg-gray-50 dark:bg-navy-800/60 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-white/5">
                                    "{appt.notes}"
                                  </p>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                                {isPending && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateAppointmentStatus(appt.id, 'CONFIRMED')}
                                      disabled={isUpdating}
                                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 transition-colors"
                                    >
                                      <CalendarCheck size={14} className={isUpdating ? 'animate-spin' : ''} />
                                      <span>Confirm Visit</span>
                                    </button>
                                    <button
                                      onClick={() => handleUpdateAppointmentStatus(appt.id, 'CANCELLED')}
                                      disabled={isUpdating}
                                      className="bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                                    >
                                      <CalendarX size={13} />
                                      <span>Reject Visit</span>
                                    </button>
                                  </>
                                )}
                                {isConfirmed && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateAppointmentStatus(appt.id, 'COMPLETED')}
                                      disabled={isUpdating}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 transition-colors"
                                    >
                                      <CheckCircle size={14} className={isUpdating ? 'animate-spin' : ''} />
                                      <span>Mark Completed</span>
                                    </button>
                                    <button
                                      onClick={() => handleUpdateAppointmentStatus(appt.id, 'CANCELLED')}
                                      disabled={isUpdating}
                                      className="bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                                    >
                                      <CalendarX size={13} />
                                      <span>Cancel Visit</span>
                                    </button>
                                  </>
                                )}
                                {(isCancelled || isCompleted) && (
                                  <button
                                    onClick={() => handleUpdateAppointmentStatus(appt.id, 'PENDING')}
                                    disabled={isUpdating}
                                    className="bg-gray-100 hover:bg-gray-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-gray-600 dark:text-gray-300 font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                                  >
                                    <RotateCcw size={13} className={isUpdating ? 'animate-spin' : ''} />
                                    <span>Reopen</span>
                                  </button>
                                )}

                                {appt.buyer_phone && (
                                  <a
                                    href={`tel:${appt.buyer_phone}`}
                                    className="bg-navy-900 hover:bg-navy-800 dark:bg-gold-400 dark:hover:bg-gold-500 text-white dark:text-navy-900 font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                                  >
                                    <Phone size={13} /> Call Buyer
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 3: REAL-TIME ANALYTICS ─── */}
            {activeTab === 'analytics' && (
              <div className="space-y-8 animate-slideUp">
                <div>
                  <h2 className="font-serif text-xl font-bold text-navy-900 dark:text-white">Listing Performance & Analytics</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Real-time engagement, buyer enquiries, and visit metrics for your portfolio</p>
                </div>

                {/* Real-time Metric Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                  <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Listings</p>
                    <p className="font-serif text-2xl font-bold text-navy-900 dark:text-white mt-1">
                      {analytics.total_properties || properties.length}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">In your account</p>
                  </div>

                  <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active Live</p>
                    <p className="font-serif text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {analytics.active_listings || properties.filter(p => p.status === 'APPROVED').length}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">Live in marketplace</p>
                  </div>

                  <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Enquiries</p>
                    <p className="font-serif text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                      {analytics.total_enquiries || enquiries.length}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {analytics.done_enquiries || enquiries.filter(e => e.status === 'DONE').length} resolved
                    </p>
                  </div>

                  <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Buyer Saves</p>
                    <p className="font-serif text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                      {analytics.total_favorites || 0}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">Saved to favorites</p>
                  </div>

                  <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Site Visits</p>
                    <p className="font-serif text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {analytics.total_visits || 0}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">Scheduled appointments</p>
                  </div>

                  <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Review</p>
                    <p className="font-serif text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                      {analytics.pending_approval || properties.filter(p => p.status === 'PENDING').length}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">Admin review queue</p>
                  </div>
                </div>

                {/* Per-Property Performance Breakdown Table */}
                <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-base text-navy-900 dark:text-white">Property Performance Breakdown</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Individual metrics per listed property</p>
                    </div>
                    <span className="text-xs text-gray-400 font-semibold">
                      {analytics.property_breakdown?.length || properties.length} Properties
                    </span>
                  </div>

                  {properties.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-xs">
                      No property analytics available yet. Add properties to view live engagement metrics.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 dark:bg-navy-800 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold border-b border-gray-100 dark:border-white/10">
                          <tr>
                            <th className="p-4">Property</th>
                            <th className="p-4">Type & Pricing</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Enquiries</th>
                            <th className="p-4 text-center">Favorites</th>
                            <th className="p-4 text-center">Site Visits</th>
                            <th className="p-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                          {(analytics.property_breakdown?.length ? analytics.property_breakdown : properties).map((item) => {
                            const enqsCount = item.enquiries_count !== undefined 
                              ? item.enquiries_count 
                              : enquiries.filter((e) => e.property_id === item.id).length;
                            const favsCount = item.favorites_count || 0;
                            const visitsCount = item.visits_count || 0;

                            return (
                              <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-navy-800/40 transition-colors">
                                <td className="p-4">
                                  <p className="font-bold text-navy-900 dark:text-white text-xs line-clamp-1">{item.title}</p>
                                  <p className="text-gray-400 text-[11px] flex items-center gap-1 mt-0.5">
                                    <MapPin size={11} className="text-gold-500 shrink-0" />
                                    <span>{item.address || item.city || 'Bhilwara'}</span>
                                  </p>
                                </td>
                                <td className="p-4">
                                  <p className="font-semibold text-gray-700 dark:text-gray-300">{item.property_type} ({item.listing_type})</p>
                                  <p className="font-serif font-bold text-navy-900 dark:text-gold-400 text-xs mt-0.5">
                                    {formatPrice(item.price, item.listing_type)}
                                  </p>
                                </td>
                                <td className="p-4">
                                  {getStatusBadge(item.status)}
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`inline-block font-bold px-2.5 py-1 rounded-full text-xs ${
                                    enqsCount > 0 
                                      ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold' 
                                      : 'text-gray-400'
                                  }`}>
                                    {enqsCount}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`inline-block font-bold px-2.5 py-1 rounded-full text-xs ${
                                    favsCount > 0 
                                      ? 'bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' 
                                      : 'text-gray-400'
                                  }`}>
                                    {favsCount}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`inline-block font-bold px-2.5 py-1 rounded-full text-xs ${
                                    visitsCount > 0 
                                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' 
                                      : 'text-gray-400'
                                  }`}>
                                    {visitsCount}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <Link
                                    to={`/properties/${item.id}`}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-gold-400 hover:underline p-1.5"
                                  >
                                    <span>View</span>
                                    <Eye size={12} />
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── TAB 4: OWNER PROFILE ─── */}
            {activeTab === 'profile' && (
              <div className="space-y-6 max-w-xl animate-slideUp">
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                  <h2 className="font-serif text-xl font-bold text-navy-900 mb-1">Owner Profile</h2>
                  <p className="text-gray-500 text-xs mb-6">Your verified owner credentials on Bhilwara Housing</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Owner Name</label>
                      <input type="text" disabled value={user?.name || ''} className="input-field text-xs bg-gray-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
                      <input type="email" disabled value={user?.email || ''} className="input-field text-xs bg-gray-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Account Role</label>
                      <span className="inline-block bg-gold-100 text-gold-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                        Verified Property Owner (OWNER)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Change Password Card */}
                <ChangePasswordCard />
              </div>
            )}
          </>
        )}
      </main>

      {/* ─── Location & Map Modal ─── */}
      {selectedLocationEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedLocationEnquiry(null)}
          />

          <div className="relative bg-white dark:bg-navy-900 border border-gray-100 dark:border-white/10 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl z-10 animate-scaleUp">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-400/10 text-gold-500 flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-navy-900 dark:text-white">
                    {t('owner.location_modal_title')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedLocationEnquiry.property_title}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLocationEnquiry(null)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-navy-800 text-gray-500 hover:text-navy-900 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Map & Details */}
            <div className="p-6 space-y-5">
              {/* Address Strip */}
              <div className="bg-gray-50 dark:bg-navy-800/80 p-4 rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Location Address</p>
                  <p className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                    <MapPin size={15} className="text-gold-500 shrink-0" />
                    <span>
                      {selectedLocationEnquiry.property_address || 'Sector 5, Shastri Nagar'}, {selectedLocationEnquiry.property_city || 'Bhilwara'}, {selectedLocationEnquiry.property_state || 'Rajasthan'}
                    </span>
                  </p>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${selectedLocationEnquiry.property_address || ''} ${selectedLocationEnquiry.property_city || 'Bhilwara'} Rajasthan`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-navy-900 dark:bg-gold-400 text-white dark:text-navy-900 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow"
                >
                  <span>Open in Google Maps</span>
                  <Eye size={13} />
                </a>
              </div>

              {/* Embedded Google Map */}
              <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-inner">
                <iframe
                  title="Enquiry Property Map"
                  src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d57568.40234395014!2d74.5888!3d25.3505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396f97f0aa8ce3e9%3A0x63e3b5c4f9ae2b11!2s${encodeURIComponent(
                    selectedLocationEnquiry.property_city || 'Bhilwara'
                  )}%2C%20Rajasthan!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin`}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Quick Specs / Action bar */}
              <div className="flex items-center justify-between pt-2">
                <Link
                  to={`/properties/${selectedLocationEnquiry.property_id}`}
                  className="text-xs font-bold text-indigo-600 dark:text-gold-400 hover:underline flex items-center gap-1"
                >
                  <span>{t('owner.view_listing')} →</span>
                </Link>

                <button
                  onClick={() => setSelectedLocationEnquiry(null)}
                  className="bg-gray-100 dark:bg-navy-800 text-navy-900 dark:text-white font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-gray-200 dark:hover:bg-navy-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

