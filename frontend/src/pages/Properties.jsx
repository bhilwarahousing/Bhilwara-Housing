import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, RotateCcw, Home, Sparkles, LayoutDashboard } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AuthModal from '../components/AuthModal';
import PropertyCard from '../components/common/PropertyCard';
import { propertyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';

const PROPERTY_TYPES = ['All', 'Villa', 'Apartment', 'Penthouse', 'Commercial', 'Plot'];
const LISTING_TYPES = ['All', 'Buy', 'Rent'];
const BEDROOM_OPTIONS = ['All', '1', '2', '3', '4', '5+'];
const FURNISHED_OPTIONS = ['All', 'Fully Furnished', 'Semi-Furnished', 'Unfurnished'];

export default function Properties() {
  const { user, isAuthenticated, getDashboardRoute } = useAuth();
  const { t } = usePreferences();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters state
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || 'All');
  const [listingType, setListingType] = useState(searchParams.get('listing') || 'All');
  const [bedrooms, setBedrooms] = useState(searchParams.get('bhk') || 'All');
  const [furnished, setFurnished] = useState('All');
  const [maxPrice, setMaxPrice] = useState('');

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login' });

  // Fetch properties from backend API
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = {};
      if (keyword.trim()) params.q = keyword.trim();
      if (propertyType !== 'All') params.property_type = propertyType;
      if (listingType !== 'All') params.listing_type = listingType;
      if (bedrooms !== 'All') params.bedrooms = parseInt(bedrooms);
      if (furnished !== 'All') params.furnished = furnished;
      if (maxPrice) params.max_price = parseFloat(maxPrice);

      const data = await propertyAPI.search(params);
      setProperties(data);
    } catch (err) {
      console.error('Failed to load properties', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [propertyType, listingType, bedrooms, furnished, maxPrice]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  const handleResetFilters = () => {
    setKeyword('');
    setPropertyType('All');
    setListingType('All');
    setBedrooms('All');
    setFurnished('All');
    setMaxPrice('');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 text-gray-900 dark:text-gray-100 flex flex-col justify-between">
      {/* Header */}
      <div className="bg-navy-900 pb-16 pt-28 px-5 sm:px-8 border-b border-white/10">
        <Navbar
          onLoginClick={() => setAuthModal({ open: true, mode: 'login' })}
          onSearchClick={() => {}}
        />

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-gold-400 text-xs font-semibold uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Sparkles size={14} /> Premier Real Estate Marketplace
                </p>
                {isAuthenticated && (
                  <Link
                    to={getDashboardRoute(user?.role)}
                    className="bg-gold-400/20 hover:bg-gold-400/30 border border-gold-400/40 text-gold-300 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 transition-colors"
                  >
                    <LayoutDashboard size={12} /> Go to My Dashboard →
                  </Link>
                )}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white font-bold">
                Luxury Properties in Bhilwara
              </h1>
              <p className="text-white/60 text-sm mt-2 max-w-xl">
                Explore handpicked villas, duplex penthouses, and premium apartments across prime locations in Rajasthan.
              </p>
            </div>

            {/* Quick search input */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md w-full">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search by location, title…"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none focus:border-gold-400 focus:bg-white/15"
                />
              </div>
              <button
                type="submit"
                className="bg-gold-400 hover:bg-gold-500 text-navy-900 font-bold px-6 py-3 rounded-xl text-sm transition-colors shrink-0"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 w-full flex-1 dark:bg-navy-950 transition-colors duration-300">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ─── Desktop Filter Sidebar ─── */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-sm sticky top-24 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2 font-bold text-navy-900 dark:text-white text-sm">
                  <Filter size={16} className="text-gold-500" />
                  <span>{t('catalog.filter_title')}</span>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-gray-400 hover:text-gold-600 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={12} /> {t('catalog.reset')}
                </button>
              </div>

              {/* Listing Type (Buy/Rent) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2.5">
                  {t('catalog.listing')}
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-gray-100 dark:bg-navy-800 p-1 rounded-xl">
                  {LISTING_TYPES.map((lt) => (
                    <button
                      key={lt}
                      onClick={() => setListingType(lt)}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        listingType === lt
                          ? 'bg-white dark:bg-gold-400 text-navy-900 shadow-sm font-bold'
                          : 'text-gray-500 dark:text-gray-400 hover:text-navy-900 dark:hover:text-white'
                      }`}
                    >
                      {lt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2.5">
                  {t('catalog.type')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map((pt) => (
                    <button
                      key={pt}
                      onClick={() => setPropertyType(pt)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                        propertyType === pt
                          ? 'bg-navy-900 dark:bg-gold-400 text-white dark:text-navy-900 border-navy-900 dark:border-gold-400 font-bold'
                          : 'bg-white dark:bg-navy-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-300'
                      }`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bedrooms / BHK */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2.5">
                  {t('catalog.bedrooms')}
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {BEDROOM_OPTIONS.map((bhk) => (
                    <button
                      key={bhk}
                      onClick={() => setBedrooms(bhk)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border text-center transition-all ${
                        bedrooms === bhk
                          ? 'bg-gold-400 text-navy-900 border-gold-400 font-bold'
                          : 'bg-white dark:bg-navy-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-300'
                      }`}
                    >
                      {bhk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Furnishing Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2.5">
                  {t('catalog.furnishing')}
                </label>
                <select
                  value={furnished}
                  onChange={(e) => setFurnished(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:border-gold-400"
                >
                  {FURNISHED_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* Max Budget */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2.5">
                  {t('catalog.max_price')}
                </label>
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:border-gold-400"
                >
                  <option value="">Any Budget</option>
                  <option value="50000">₹50,000 / mo</option>
                  <option value="100000">₹1,00,000 / mo</option>
                  <option value="5000000">Up to ₹50 Lakh</option>
                  <option value="10000000">Up to ₹1.00 Crore</option>
                  <option value="20000000">Up to ₹2.00 Crore</option>
                  <option value="35000000">Up to ₹3.50 Crore</option>
                  <option value="50000000">Up to ₹5.00 Crore</option>
                </select>
              </div>
            </div>
          </aside>

          {/* ─── Results Section ─── */}
          <main className="flex-1">
            {/* Top results bar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600 text-sm font-medium">
                Showing <span className="font-bold text-navy-900">{properties.length}</span> properties found
              </p>

              {/* Mobile filter toggle */}
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="lg:hidden flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-semibold text-navy-900 shadow-sm"
              >
                <SlidersHorizontal size={14} /> Filters
              </button>
            </div>

            {/* Mobile Filter Drawer */}
            {mobileFilterOpen && (
              <div className="lg:hidden bg-white p-6 rounded-2xl border border-gray-200 shadow-lg mb-6 space-y-4 animate-slideUp">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="font-bold text-sm text-navy-900">Filters</span>
                  <button onClick={handleResetFilters} className="text-xs text-gold-600">Reset</button>
                </div>
                {/* Mobile controls */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs"
                  >
                    {PROPERTY_TYPES.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Looking to</label>
                  <select
                    value={listingType}
                    onChange={(e) => setListingType(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs"
                  >
                    {LISTING_TYPES.map((lt) => <option key={lt} value={lt}>{lt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Bedrooms</label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full border rounded-lg p-2 text-xs"
                  >
                    {BEDROOM_OPTIONS.map((b) => <option key={b} value={b}>{b} BHK</option>)}
                  </select>
                </div>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full bg-navy-900 text-white text-xs font-bold py-2.5 rounded-xl"
                >
                  Apply Filters
                </button>
              </div>
            )}

            {/* Loading state */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse space-y-3">
                    <div className="aspect-[16/10] bg-gray-200 rounded-xl" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              /* Empty state */
              <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 bg-gold-50 dark:bg-navy-800 text-gold-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Home size={28} />
                </div>
                <h3 className="font-serif text-xl font-bold text-navy-900 dark:text-white mb-2">{t('catalog.no_results')}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-6">
                  {t('catalog.subtitle')}
                </p>
                <button
                  onClick={handleResetFilters}
                  className="bg-navy-900 dark:bg-gold-400 dark:text-navy-900 hover:bg-navy-800 text-white font-bold text-xs px-6 py-3 rounded-xl transition-colors"
                >
                  {t('catalog.clear_filters')}
                </button>
              </div>
            ) : (
              /* Properties Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    property={prop}
                    onAuthRequired={() => setAuthModal({ open: true, mode: 'login' })}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />

      {/* Auth Modal for guest actions */}
      <AuthModal
        isOpen={authModal.open}
        mode={authModal.mode}
        onClose={() => setAuthModal({ open: false, mode: 'login' })}
      />
    </div>
  );
}
