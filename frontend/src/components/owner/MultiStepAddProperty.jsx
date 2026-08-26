import React, { useState, useRef, useCallback } from 'react';
import {
  Building,
  MapPin,
  ListFilter,
  CheckSquare,
  Image as ImageIcon,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  Info,
  ShieldAlert,
  Upload,
  X,
  Link as LinkIcon,
} from 'lucide-react';
import { formatPrice, formatArea } from '../../utils/formatters';
import { ownerAPI, uploadImage } from '../../services/api';
import LocationMapPicker from './LocationMapPicker';

const ALL_AMENITIES = [
  'Swimming Pool',
  'Gymnasium',
  '24/7 Security',
  'Reserved Parking',
  'Landscaped Garden',
  'High-speed Elevator',
  '100% Power Backup',
  'Clubhouse',
  'Servant Quarters',
  'Lake View',
  'Modular Kitchen',
  'Smart Home Automation',
];

export default function MultiStepAddProperty({ onSuccess, onCancel }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'Villa',
    listing_type: 'Buy',
    price: '',
    area: '',
    bedrooms: 3,
    bathrooms: 2,
    total_floors: 1,
    city: 'Bhilwara',
    state: 'Rajasthan',
    address: '',
    pincode: '311001',
    latitude: 25.3475,
    longitude: 74.6391,
    furnished: 'Semi-Furnished',
    amenities: ['Swimming Pool', 'Reserved Parking', '24/7 Security'],
    images: [],
  });

  // Image upload state
  const [uploadingFiles, setUploadingFiles] = useState([]); // { id, name, progress, error, url }
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInputMode, setUrlInputMode] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const fileInputRef = useRef(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  // ── Upload files to Supabase via backend ──
  const handleUploadFiles = useCallback(async (files) => {
    const validFiles = Array.from(files).filter((f) =>
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)
    );

    if (validFiles.length === 0) {
      setError('Please select valid image files (JPG, PNG, WebP or GIF).');
      return;
    }

    // Add placeholder entries for each file
    const placeholders = validFiles.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: f.name,
      progress: 'uploading',
      error: null,
      url: null,
    }));
    setUploadingFiles((prev) => [...prev, ...placeholders]);

    // Upload each file independently
    await Promise.all(
      validFiles.map(async (file, idx) => {
        const placeholder = placeholders[idx];
        try {
          const url = await uploadImage(file);
          setFormData((prev) => ({ ...prev, images: [...prev.images, url] }));
          setUploadingFiles((prev) =>
            prev.map((p) => (p.id === placeholder.id ? { ...p, progress: 'done', url } : p))
          );
        } catch (err) {
          setUploadingFiles((prev) =>
            prev.map((p) =>
              p.id === placeholder.id ? { ...p, progress: 'error', error: err.message } : p
            )
          );
        }
      })
    );
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleUploadFiles(e.dataTransfer.files);
  }, [handleUploadFiles]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  const handleAddUrlImage = () => {
    const url = customImageUrl.trim();
    if (!url) return;
    if (!formData.images.includes(url)) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, url] }));
    }
    setCustomImageUrl('');
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSetPrimaryImage = (index) => {
    if (index === 0) return;
    setFormData((prev) => {
      const newImages = [...prev.images];
      const [selected] = newImages.splice(index, 1);
      newImages.unshift(selected);
      return { ...prev, images: newImages };
    });
  };

  const handleNext = () => {
    setError('');
    // Validations
    if (currentStep === 1) {
      if (!formData.title.trim()) {
        setError('Please enter a property title.');
        return;
      }
      if (!formData.description.trim()) {
        setError('Please enter a property description.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.address.trim()) {
        setError('Please enter the street address or locality in Bhilwara.');
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        setError('Please enter a valid price in INR.');
        return;
      }
      if (!formData.area || parseFloat(formData.area) <= 0) {
        setError('Please enter the super area in sq.ft.');
        return;
      }
    }
    if (currentStep === 5) {
      if (formData.images.length === 0) {
        setError('Please add at least one property image.');
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 6));
  };

  const handlePrev = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        property_type: formData.property_type,
        listing_type: formData.listing_type,
        price: parseFloat(formData.price),
        area: parseFloat(formData.area),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        total_floors: parseInt(formData.total_floors) || 1,
        city: formData.city,
        state: formData.state,
        address: formData.address,
        latitude: parseFloat(formData.latitude) || 25.3475,
        longitude: parseFloat(formData.longitude) || 74.6391,
        furnished: formData.furnished,
        amenities: formData.amenities.join(','),
        images: formData.images,
      };

      await ownerAPI.createProperty(payload);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to submit property listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = [
    { num: 1, label: 'Basic Info', icon: Building },
    { num: 2, label: 'Location', icon: MapPin },
    { num: 3, label: 'Specifications', icon: ListFilter },
    { num: 4, label: 'Amenities', icon: CheckSquare },
    { num: 5, label: 'Photos', icon: ImageIcon },
    { num: 6, label: 'Review & Submit', icon: CheckCircle },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-xl max-w-4xl mx-auto">
      {/* ─── Wizard Header & Stepper ─── */}
      <div className="mb-8 pb-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-gold-600 font-bold text-xs uppercase tracking-wider">Property Creation Wizard</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900">List a New Property</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg"
          >
            Cancel
          </button>
        </div>

        {/* Stepper bar */}
        <div className="grid grid-cols-6 gap-2">
          {stepLabels.map((s) => {
            const Icon = s.icon;
            const isPassed = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center text-center">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                    isCurrent
                      ? 'bg-navy-900 text-gold-400 shadow-md ring-2 ring-gold-400/50'
                      : isPassed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isPassed ? '✓' : <Icon size={15} />}
                </div>
                <span className={`text-[10px] hidden sm:block font-medium ${isCurrent ? 'text-navy-900 font-bold' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <Info size={16} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── STEP 1: BASIC INFORMATION ─── */}
      {currentStep === 1 && (
        <div className="space-y-5 animate-slideUp">
          <h3 className="font-bold text-navy-900 text-lg">Step 1 — Basic Information</h3>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Property Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g. Royal Heritage 4 BHK Luxury Villa with Private Garden"
              className="input-field text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Property Type</label>
              <select
                value={formData.property_type}
                onChange={(e) => handleChange('property_type', e.target.value)}
                className="input-field text-sm"
              >
                <option value="Villa">Villa / Bungalow</option>
                <option value="Apartment">Apartment / Flat</option>
                <option value="Penthouse">Duplex Penthouse</option>
                <option value="Commercial">Commercial Retail / Office</option>
                <option value="Plot">Residential Plot / Land</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Listing Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['Buy', 'Rent'].map((lt) => (
                  <button
                    key={lt}
                    type="button"
                    onClick={() => handleChange('listing_type', lt)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      formData.listing_type === lt
                        ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    For {lt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Description</label>
            <textarea
              rows={5}
              required
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the standout features of this property, architectural highlights, neighborhood ambiance, and interior finishes…"
              className="input-field text-xs resize-none"
            />
          </div>
        </div>
      )}

      {/* ─── STEP 2: LOCATION ─── */}
      {currentStep === 2 && (
        <div className="space-y-5 animate-slideUp">
          <h3 className="font-bold text-navy-900 text-lg">Step 2 — Location Details</h3>

          {/* Street Address */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
              Street Address / Locality <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="e.g. Plot 45, Sector 5, Shastri Nagar, Near City Mall"
              className="input-field text-sm"
            />
          </div>

          {/* City / State / Pincode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Pincode</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* ── Interactive Map Picker (click + drag + geolocation) ── */}
          <LocationMapPicker
            lat={formData.latitude}
            lng={formData.longitude}
            onLocationChange={(newLat, newLng) => {
              handleChange('latitude', newLat);
              handleChange('longitude', newLng);
            }}
          />
        </div>
      )}

      {/* ─── STEP 3: PROPERTY DETAILS & SPECS ─── */}
      {currentStep === 3 && (
        <div className="space-y-5 animate-slideUp">
          <h3 className="font-bold text-navy-900 text-lg">Step 3 — Specifications & Pricing</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Price (in ₹ INR) {formData.price && <span className="text-gold-600 font-bold ml-2">({formatPrice(parseFloat(formData.price), formData.listing_type)})</span>}
              </label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="e.g. 25000000 for 2.50 Cr or 45000 for Rent"
                className="input-field text-sm font-bold text-navy-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Super Area (sq.ft)</label>
              <input
                type="number"
                required
                value={formData.area}
                onChange={(e) => handleChange('area', e.target.value)}
                placeholder="e.g. 3500"
                className="input-field text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Bedrooms (BHK)</label>
              <select
                value={formData.bedrooms}
                onChange={(e) => handleChange('bedrooms', e.target.value)}
                className="input-field text-sm"
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((b) => (
                  <option key={b} value={b}>{b === 0 ? 'Studio / None' : `${b} BHK`}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Bathrooms</label>
              <select
                value={formData.bathrooms}
                onChange={(e) => handleChange('bathrooms', e.target.value)}
                className="input-field text-sm"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((b) => (
                  <option key={b} value={b}>{b} Bathrooms</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Total Floors</label>
              <select
                value={formData.total_floors}
                onChange={(e) => handleChange('total_floors', e.target.value)}
                className="input-field text-sm font-semibold"
              >
                <option value="1">1 Floor (Ground)</option>
                <option value="2">2 Floors (G + 1)</option>
                <option value="3">3 Floors (G + 2)</option>
                <option value="4">4 Floors (G + 3)</option>
                <option value="5">5 Floors</option>
                <option value="6">6 Floors</option>
                <option value="7">7+ Floors</option>
                <option value="10">10+ Floors</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Furnished Status</label>
              <select
                value={formData.furnished}
                onChange={(e) => handleChange('furnished', e.target.value)}
                className="input-field text-sm"
              >
                <option value="Fully Furnished">Fully Furnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 4: AMENITIES ─── */}
      {currentStep === 4 && (
        <div className="space-y-5 animate-slideUp">
          <div>
            <h3 className="font-bold text-navy-900 text-lg">Step 4 — Select Amenities</h3>
            <p className="text-gray-500 text-xs mt-1">Check all the features and facilities available with this property.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALL_AMENITIES.map((amenity) => {
              const selected = formData.amenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => handleAmenityToggle(amenity)}
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    selected
                      ? 'bg-gold-50 border-gold-400 text-navy-900 font-bold shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      selected ? 'bg-gold-500 border-gold-500 text-white' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {selected && '✓'}
                  </div>
                  <span className="text-xs">{amenity}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── STEP 5: IMAGES ─── */}
      {currentStep === 5 && (
        <div className="space-y-6 animate-slideUp">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-navy-900 text-lg">Step 5 — Property Photos</h3>
              <p className="text-gray-500 text-xs mt-0.5">Upload high-quality images directly from your computer or mobile device.</p>
            </div>
            <button
              type="button"
              onClick={() => setUrlInputMode(!urlInputMode)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 self-start sm:self-auto"
            >
              <LinkIcon size={12} />
              {urlInputMode ? 'Switch to Local Upload' : 'Paste Image URL instead'}
            </button>
          </div>

          {/* ── Local File Drag & Drop Box ── */}
          {!urlInputMode ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleUploadFiles(e.target.files);
                    e.target.value = ''; // Reset input
                  }
                }}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-gold-500 bg-gold-50/50 scale-[1.01]'
                    : 'border-gray-300 hover:border-gold-400 bg-gray-50/60 hover:bg-gold-50/20'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-200 text-gold-500 flex items-center justify-center mx-auto mb-3.5 group-hover:scale-110 transition-transform">
                  <Upload size={26} />
                </div>
                <h4 className="font-bold text-navy-900 text-sm mb-1">
                  Choose photos or drag & drop here
                </h4>
                <p className="text-gray-500 text-xs max-w-sm mx-auto mb-4">
                  Select JPG, PNG, WebP or GIF photos from your local device (up to 10MB each). You can upload multiple files at once.
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current && fileInputRef.current.click();
                  }}
                  className="bg-navy-900 hover:bg-navy-800 text-gold-400 font-bold text-xs px-5 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Upload size={14} /> Browse Local Files
                </button>
              </div>

              {/* Uploading progress indicators */}
              {uploadingFiles.filter(f => f.progress === 'uploading').length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadingFiles.filter(f => f.progress === 'uploading').map(file => (
                    <div key={file.id} className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-900">
                      <svg className="animate-spin h-4 w-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span className="font-medium truncate flex-1">{file.name}</span>
                      <span className="text-blue-600 font-bold text-[11px]">Uploading…</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── URL Paste Mode ── */
            <div className="space-y-3 p-5 bg-gray-50 rounded-2xl border border-gray-200">
              <label className="block text-xs font-bold text-gray-700 uppercase">Image Web URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://example.com/property-photo.jpg"
                  className="input-field text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  className="bg-navy-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs shrink-0 flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add URL
                </button>
              </div>
            </div>
          )}

          {/* Current Images Gallery */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <p className="text-xs font-bold text-gray-700 uppercase">
                Uploaded Photos ({formData.images.length})
              </p>
              {formData.images.length > 0 && (
                <span className="text-[11px] text-gray-500 font-medium">
                  💡 Click <strong>"Set as Cover"</strong> on any image to make it the main primary thumbnail.
                </span>
              )}
            </div>

            {formData.images.length === 0 ? (
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center text-xs text-amber-800 font-medium">
                ⚠️ Please upload at least one photo of your property from your local device or web URL.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {formData.images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className={`aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100 relative group border shadow-sm transition-all ${
                      idx === 0 ? 'border-gold-500 ring-2 ring-gold-400/30' : 'border-gray-200'
                    }`}
                  >
                    <img src={imgUrl} alt={`Property photo ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 ? (
                      <span className="absolute top-2 left-2 bg-navy-900 text-gold-400 font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow flex items-center gap-1">
                        ★ Primary Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(idx)}
                        className="absolute top-2 left-2 bg-navy-900/90 hover:bg-gold-400 hover:text-navy-900 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow transition-all opacity-90 group-hover:opacity-100"
                        title="Set as Primary Cover Image"
                      >
                        Set as Cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow"
                      title="Remove Photo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── STEP 6: REVIEW & SUBMIT ─── */}
      {currentStep === 6 && (
        <div className="space-y-6 animate-slideUp">
          <div>
            <h3 className="font-bold text-navy-900 text-lg">Step 6 — Review Listing</h3>
            <p className="text-gray-500 text-xs mt-1">Review your property details before submitting for administrative approval.</p>
          </div>

          {/* Preview Card */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-4">
            <div className="aspect-[21/9] rounded-xl overflow-hidden bg-gray-900">
              <img src={formData.images[0]} alt="Preview" className="w-full h-full object-cover" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
              <div>
                <span className="bg-navy-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase mr-2">
                  {formData.property_type}
                </span>
                <span className="bg-gold-400 text-navy-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  For {formData.listing_type}
                </span>
                <h4 className="font-serif text-xl font-bold text-navy-900 mt-1">{formData.title}</h4>
                <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                  <MapPin size={13} className="text-gold-500" /> {formData.address}, {formData.city}
                </p>
              </div>

              <div className="text-right">
                <p className="font-serif text-2xl font-bold text-navy-900">
                  {formatPrice(parseFloat(formData.price), formData.listing_type)}
                </p>
                <p className="text-gray-400 text-xs">{formatArea(parseFloat(formData.area))}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-white rounded-xl border border-gray-200 font-medium">
              <div><span className="text-gray-400 block text-[10px]">BEDROOMS</span>{formData.bedrooms} BHK</div>
              <div><span className="text-gray-400 block text-[10px]">BATHROOMS</span>{formData.bathrooms} Baths</div>
              <div><span className="text-gray-400 block text-[10px]">FURNISHING</span>{formData.furnished}</div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-600 mb-1">Amenities Included ({formData.amenities.length}):</p>
              <p className="text-xs text-gray-500">{formData.amenities.join(' • ')}</p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs">
              <ShieldAlert size={16} className="shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Approval Notice:</strong> Upon submission, your property will enter <span className="underline font-bold">PENDING</span> status for Admin review before becoming publicly visible on the search page.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Navigation Buttons ─── */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handlePrev}
            className="flex items-center gap-2 text-gray-600 hover:text-navy-900 font-bold text-xs px-4 py-2.5 rounded-xl border border-gray-200"
          >
            <ArrowLeft size={14} /> Back
          </button>
        ) : (
          <div />
        )}

        {currentStep < 6 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow transition-colors"
          >
            Continue <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 bg-gold-400 hover:bg-gold-500 text-navy-900 font-bold text-xs px-8 py-3 rounded-xl shadow-lg transition-colors disabled:opacity-60"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle size={15} /> Submit Listing For Approval
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
