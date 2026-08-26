import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Maximize2, ArrowRight, CheckCircle2, Layers } from 'lucide-react';
import { formatPrice, formatArea } from '../../utils/formatters';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/PreferencesContext';

export default function PropertyCard({ property, onAuthRequired }) {
  const { isAuthenticated } = useAuth();
  const { t } = usePreferences();
  const [isFavorited, setIsFavorited] = useState(property.is_favorited || false);
  const [saving, setSaving] = useState(false);

  const primaryImage =
    property.images?.find((img) => img.is_primary)?.image_url ||
    property.images?.[0]?.image_url ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

  const handleFavoriteToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      if (onAuthRequired) onAuthRequired();
      return;
    }

    setSaving(true);
    try {
      const res = await userAPI.toggleFavorite(property.id);
      setIsFavorited(res.saved);
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="property-card group flex flex-col bg-white dark:bg-navy-800 border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
      {/* Image container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-navy-900">
        <img
          src={primaryImage}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top badges */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
          <span className="bg-navy-900/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
            {property.property_type}
          </span>
          {property.status === 'SOLD' ? (
            <span className="bg-purple-600 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow flex items-center gap-1">
              {t('card.sold', 'SOLD 🏷️')}
            </span>
          ) : property.status === 'RENTED' ? (
            <span className="bg-amber-600 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow flex items-center gap-1">
              {t('card.rented', 'RENTED 🏷️')}
            </span>
          ) : (
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow ${
              property.listing_type === 'Rent'
                ? 'bg-amber-500 text-white'
                : 'bg-gold-400 text-navy-900'
            }`}>
              {property.listing_type === 'Rent' ? t('card.for_rent', 'For Rent') : t('card.for_buy', 'For Buy')}
            </span>
          )}
        </div>

        {/* Favorite heart button */}
        <button
          onClick={handleFavoriteToggle}
          disabled={saving}
          aria-label={isFavorited ? 'Remove from saved' : 'Save property'}
          className={`absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow ${
            isFavorited
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-navy-900/60 text-white hover:bg-navy-900 hover:text-red-400'
          }`}
        >
          <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>

        {/* Bottom Price Tag on Image */}
        <div className="absolute bottom-3.5 left-3.5">
          <span className="bg-navy-900/95 backdrop-blur-md text-gold-400 font-serif text-lg font-bold px-3.5 py-1.5 rounded-lg shadow-lg border border-gold-400/20">
            {formatPrice(property.price, property.listing_type)}
          </span>
        </div>
      </div>

      {/* Details body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Location */}
          <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1.5">
            <MapPin size={13} className="text-gold-500 shrink-0" />
            <span className="truncate">{property.address}, {property.city}</span>
          </div>

          {/* Title */}
          <Link to={`/properties/${property.id}`} className="block">
            <h3 className="font-bold text-navy-900 dark:text-white text-base mb-3 leading-snug line-clamp-1 group-hover:text-gold-500 transition-colors">
              {property.title}
            </h3>
          </Link>

          {/* Specs row (BHK, Baths, Floors, Area) */}
          <div className="grid grid-cols-4 gap-1 py-2.5 border-y border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-300 text-[11px] font-medium mb-3">
            <div className="flex items-center gap-1">
              <Bed size={14} className="text-gray-400 shrink-0" />
              <span className="truncate">{property.bedrooms > 0 ? `${property.bedrooms} BHK` : 'Studio'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath size={14} className="text-gray-400 shrink-0" />
              <span className="truncate">{property.bathrooms} {t('card.bath', 'Bath')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Layers size={14} className="text-gold-500 shrink-0" />
              <span className="truncate">{property.total_floors || 1} {property.total_floors === 1 ? t('card.floor', 'Flr') : t('card.floors', 'Flrs')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Maximize2 size={14} className="text-gray-400 shrink-0" />
              <span className="truncate">{formatArea(property.area)}</span>
            </div>
          </div>

          {/* Listed By Owner Row */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-3 px-0.5">
            <span className="flex items-center gap-1 truncate">
              <span className="text-gray-400">{t('card.by', 'By:')}</span>
              <strong className="text-navy-900 dark:text-gray-200 truncate font-semibold">
                {property.owner_name || t('card.verified_owner', 'Verified Owner')}
              </strong>
            </span>
            {property.is_owner_verified && (
              <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400 font-bold shrink-0 text-[10px] bg-green-50 dark:bg-green-950/40 px-1.5 py-0.5 rounded border border-green-200/50" title="Verified Owner">
                <CheckCircle2 size={10} /> {t('card.verified', 'Verified')}
              </span>
            )}
          </div>
        </div>

        {/* Action button */}
        <Link
          to={`/properties/${property.id}`}
          className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-navy-900 hover:bg-navy-900 dark:hover:bg-gold-400 text-navy-800 dark:text-gray-200 hover:text-white dark:hover:text-navy-900 font-bold text-xs py-2.5 rounded-xl border border-gray-200 dark:border-white/10 transition-all duration-200"
        >
          <span>{t('common.view_details')}</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
