import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Share2,
  ArrowLeft,
  Clock,
  Sparkles,
  Send,
  Building,
  LayoutDashboard,
  Layers
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AuthModal from '../components/AuthModal';
import { propertyAPI, userAPI, apiRequest } from '../services/api';
import { formatPrice, formatArea } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';

export default function PropertyDetail() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, getDashboardRoute } = useAuth();
  const { t } = usePreferences();

  const [property, setProperty] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login' });

  // Enquiry & Appointment state
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState(user?.phone || '');
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);

  // Appointment schedule state
  const [visitDate, setVisitDate] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitSuccess, setVisitSuccess] = useState(false);
  const [submittingVisit, setSubmittingVisit] = useState(false);
  const [activeTab, setActiveTab] = useState('enquiry'); // 'enquiry' | 'visit'

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await propertyAPI.getDetail(propertyId);
        setProperty(data);
        setIsFavorited(data.is_favorited || false);
      } catch (err) {
        setError(err.message || 'Property not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [propertyId]);

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      setAuthModal({ open: true, mode: 'login' });
      return;
    }
    try {
      const res = await userAPI.toggleFavorite(property.id);
      setIsFavorited(res.saved);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendEnquiry = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setAuthModal({ open: true, mode: 'login' });
      return;
    }

    setSubmittingEnquiry(true);
    try {
      await apiRequest('/enquiries', {
        method: 'POST',
        body: JSON.stringify({
          property_id: property.id,
          message: enquiryMsg,
          phone: enquiryPhone,
        }),
      });
      setEnquirySuccess(true);
      setEnquiryMsg('');
      setTimeout(() => setEnquirySuccess(false), 5000);
    } catch (err) {
      alert(err.message || 'Failed to submit enquiry.');
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  const handleScheduleVisit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setAuthModal({ open: true, mode: 'login' });
      return;
    }

    if (!visitDate) {
      alert('Please select a visit date and time.');
      return;
    }

    setSubmittingVisit(true);
    try {
      await apiRequest('/enquiries/appointments', {
        method: 'POST',
        body: JSON.stringify({
          property_id: property.id,
          appointment_date: new Date(visitDate).toISOString(),
          notes: visitNotes,
        }),
      });
      setVisitSuccess(true);
      setVisitDate('');
      setVisitNotes('');
      setTimeout(() => setVisitSuccess(false), 5000);
    } catch (err) {
      alert(err.message || 'Failed to schedule appointment.');
    } finally {
      setSubmittingVisit(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Property link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold-400/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <h2 className="text-2xl font-bold text-navy-900 mb-2">Property Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">{error || 'The requested property does not exist or is pending approval.'}</p>
          <Link to="/properties" className="inline-block bg-navy-900 text-white font-semibold px-6 py-2.5 rounded-xl text-sm">
            Browse All Properties
          </Link>
        </div>
      </div>
    );
  }

  const images = property.images && property.images.length > 0
    ? property.images.map((i) => i.image_url)
    : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'];

  const amenitiesList = property.amenities
    ? property.amenities.split(',').map((a) => a.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <div className="bg-navy-900 pb-6 pt-24 px-5 sm:px-8 border-b border-white/10">
        <Navbar
          onLoginClick={() => setAuthModal({ open: true, mode: 'login' })}
          onSearchClick={() => {}}
        />

        {/* Breadcrumbs */}
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-white/50">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link to="/properties" className="hover:text-white transition-colors">Properties</Link>
            <span>/</span>
            <span className="text-gold-400 truncate max-w-xs">{property.title}</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <Link
                to={getDashboardRoute(user?.role)}
                className="hidden sm:flex items-center gap-1.5 bg-gold-400/20 hover:bg-gold-400/30 border border-gold-400/30 text-gold-300 font-bold px-3 py-1 rounded-full text-xs transition-colors"
              >
                <LayoutDashboard size={12} /> My Dashboard
              </Link>
            )}
            <Link to="/properties" className="hidden sm:flex items-center gap-1.5 text-white/70 hover:text-gold-400 font-medium transition-colors">
              <ArrowLeft size={14} /> Back to Search
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 w-full flex-1">
        {/* Header Title + Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-navy-900 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {property.property_type}
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                property.listing_type === 'Rent'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gold-400 text-navy-900'
              }`}>
                For {property.listing_type}
              </span>
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck size={13} /> Verified Listing
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-navy-900 font-bold leading-tight">
              {property.title}
            </h1>
            <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-2">
              <MapPin size={15} className="text-gold-500" />
              <span>{property.address}, {property.city}, {property.state}</span>
            </p>
          </div>

          {/* Price & Quick Actions */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Price</p>
              <p className="font-serif text-3xl font-bold text-navy-900">
                {formatPrice(property.price, property.listing_type)}
              </p>
            </div>

            <button
              onClick={handleFavoriteToggle}
              className={`p-3 rounded-xl border transition-all ${
                isFavorited
                  ? 'bg-red-50 border-red-200 text-red-500 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-500'
              }`}
              title="Save Property"
            >
              <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={handleShare}
              className="p-3 rounded-xl border bg-white border-gray-200 text-gray-600 hover:text-navy-900 transition-colors"
              title="Share"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {/* ─── Gallery Section ─── */}
        <div className="mb-10">
          {/* Main Large Image */}
          <div className="aspect-[21/9] sm:aspect-[16/8] rounded-2xl overflow-hidden bg-gray-900 shadow-xl mb-4 relative">
            <img
              src={images[selectedImage]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-28 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    selectedImage === idx
                      ? 'border-gold-500 scale-105 shadow-md'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Two-Column Details Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left 2 Columns: Specs, Description, Amenities, Location */}
          <div className="lg:col-span-2 space-y-8">
            {/* Key Specs Strip */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 border border-gray-100 dark:border-white/10 shadow-sm grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-navy-800 text-indigo-600 dark:text-gold-400 flex items-center justify-center shrink-0">
                  <Bed size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">{t('catalog.bedrooms')}</p>
                  <p className="text-sm font-bold text-navy-900 dark:text-white">{property.bedrooms} BHK</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-navy-800 text-blue-600 dark:text-gold-400 flex items-center justify-center shrink-0">
                  <Bath size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Bathrooms</p>
                  <p className="text-sm font-bold text-navy-900 dark:text-white">{property.bathrooms} Baths</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-navy-800 text-purple-600 dark:text-gold-400 flex items-center justify-center shrink-0">
                  <Layers size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Total Floors</p>
                  <p className="text-sm font-bold text-navy-900 dark:text-white">{property.total_floors || 1} {property.total_floors === 1 ? 'Floor' : 'Floors'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-navy-800 text-amber-600 dark:text-gold-400 flex items-center justify-center shrink-0">
                  <Maximize2 size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Super Area</p>
                  <p className="text-sm font-bold text-navy-900 dark:text-white">{formatArea(property.area)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-navy-800 text-green-600 dark:text-gold-400 flex items-center justify-center shrink-0">
                  <Building size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase">{t('catalog.furnishing')}</p>
                  <p className="text-sm font-bold text-navy-900 dark:text-white">{property.furnished || 'Semi-Furnished'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl p-8 border border-gray-100 dark:border-white/10 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-navy-900 dark:text-white mb-4">{t('detail.overview')}</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {property.description || 'Experience luxurious living in this meticulously designed property with premium fixtures, open floor plans, and unmatched convenience in Bhilwara.'}
              </p>
            </div>

            {/* Amenities */}
            {amenitiesList.length > 0 && (
              <div className="bg-white dark:bg-navy-900 rounded-2xl p-8 border border-gray-100 dark:border-white/10 shadow-sm">
                <h2 className="font-serif text-xl font-bold text-navy-900 dark:text-white mb-4">{t('detail.amenities')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenitiesList.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-100 dark:border-white/10 rounded-xl p-3 text-xs text-gray-700 dark:text-gray-200 font-medium"
                    >
                      <CheckCircle2 size={16} className="text-gold-500 shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location & Map Preview */}
            <div className="bg-white dark:bg-navy-900 rounded-2xl p-8 border border-gray-100 dark:border-white/10 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="font-serif text-xl font-bold text-navy-900 dark:text-white">{t('detail.location')}</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{property.address}, {property.city}, {property.state}</p>
                </div>
                <a
                  href={
                    property.latitude && property.longitude
                      ? `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address + ', ' + property.city)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-900 dark:bg-gold-400 text-gold-400 dark:text-navy-900 text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition-opacity shrink-0"
                >
                  <MapPin size={13} />
                  <span>Open in Google Maps ↗</span>
                </a>
              </div>
              <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm">
                <iframe
                  title={`Location of ${property.title}`}
                  src={
                    property.latitude && property.longitude
                      ? `https://maps.google.com/maps?q=${property.latitude},${property.longitude}&hl=en&z=16&output=embed`
                      : `https://maps.google.com/maps?q=${encodeURIComponent(property.address + ', ' + property.city + ', Rajasthan')}&hl=en&z=16&output=embed`
                  }
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Owner Card & Enquiry / Schedule Visit Forms */}
          <div className="space-y-6">
            {/* Owner & Verified Agent Card */}
            <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-xl border border-white/10">
              <p className="text-gold-400 text-xs font-semibold uppercase tracking-wider mb-3">Listed By</p>
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gold-400 text-navy-900 font-bold flex items-center justify-center text-lg">
                  {property.owner_name ? property.owner_name[0].toUpperCase() : 'O'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {property.owner_name || 'Bhilwara Housing Partner'}
                  </h4>
                  {property.is_owner_verified ? (
                    <p className="text-green-400 text-xs flex items-center gap-1 font-semibold mt-0.5">
                      <ShieldCheck size={13} /> Verified Property Owner ✓
                    </p>
                  ) : (
                    <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
                      <ShieldCheck size={13} className="text-gold-400" /> Property Owner
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <a
                  href={property.owner_phone ? `tel:${property.owner_phone}` : "tel:+919667262506"}
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 py-2.5 rounded-xl text-white font-semibold transition-colors"
                >
                  <Phone size={13} /> {t('owner.call_buyer')}
                </a>
                <button
                  onClick={() => {
                    setActiveTab('enquiry');
                    document.getElementById('action-card')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex items-center justify-center gap-2 bg-gold-400 hover:bg-gold-500 py-2.5 rounded-xl text-navy-900 font-bold transition-colors"
                >
                  <Mail size={13} /> {t('detail.send_enquiry')}
                </button>
              </div>
            </div>

            {/* Interaction Card (Enquiry vs Schedule Visit) */}
            <div id="action-card" className="bg-white dark:bg-navy-900 rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-sm sticky top-24">
              {/* Tab Switcher */}
              <div className="flex border-b border-gray-100 dark:border-white/10 pb-3 mb-5 gap-2">
                <button
                  onClick={() => setActiveTab('enquiry')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === 'enquiry'
                      ? 'bg-navy-900 dark:bg-gold-400 text-white dark:text-navy-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-white bg-gray-50 dark:bg-navy-800'
                  }`}
                >
                  {t('detail.send_enquiry')}
                </button>
                <button
                  onClick={() => setActiveTab('visit')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    activeTab === 'visit'
                      ? 'bg-navy-900 dark:bg-gold-400 text-white dark:text-navy-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-white bg-gray-50 dark:bg-navy-800'
                  }`}
                >
                  {t('detail.schedule_visit')}
                </button>
              </div>

              {/* ─── TAB 1: SEND ENQUIRY ─── */}
              {activeTab === 'enquiry' && (
                <div>
                  {enquirySuccess ? (
                    <div className="text-center py-8">
                      <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
                      <h4 className="font-bold text-navy-900 text-sm">Enquiry Sent Successfully!</h4>
                      <p className="text-gray-500 text-xs mt-1">The owner will contact you shortly.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendEnquiry} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={enquiryPhone}
                          onChange={(e) => setEnquiryPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="input-field text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Your Message</label>
                        <textarea
                          rows={4}
                          required
                          value={enquiryMsg}
                          onChange={(e) => setEnquiryMsg(e.target.value)}
                          placeholder="I am interested in this property. Please share more details regarding pricing, site visit, and floor plan…"
                          className="input-field text-xs resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingEnquiry}
                        className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow"
                      >
                        {submittingEnquiry ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send size={13} /> Send Enquiry Now
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* ─── TAB 2: SCHEDULE VISIT ─── */}
              {activeTab === 'visit' && (
                <div>
                  {visitSuccess ? (
                    <div className="text-center py-8">
                      <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
                      <h4 className="font-bold text-navy-900 text-sm">Visit Booked!</h4>
                      <p className="text-gray-500 text-xs mt-1">Our executive will confirm your appointment time.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleScheduleVisit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Preferred Date & Time</label>
                        <input
                          type="datetime-local"
                          required
                          value={visitDate}
                          onChange={(e) => setVisitDate(e.target.value)}
                          className="input-field text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Special Requests (Optional)</label>
                        <textarea
                          rows={3}
                          value={visitNotes}
                          onChange={(e) => setVisitNotes(e.target.value)}
                          placeholder="e.g. Please arrange car parking; visiting with family…"
                          className="input-field text-xs resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingVisit}
                        className="w-full bg-gold-400 hover:bg-gold-500 text-navy-900 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow"
                      >
                        {submittingVisit ? (
                          <span className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
                        ) : (
                          <>
                            <Calendar size={14} /> Confirm Visit Booking
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Auth Modal for guest interactions */}
      <AuthModal
        isOpen={authModal.open}
        mode={authModal.mode}
        onClose={() => setAuthModal({ open: false, mode: 'login' })}
      />
    </div>
  );
}
