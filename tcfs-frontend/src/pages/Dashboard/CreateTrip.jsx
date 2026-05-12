import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TopNav from '../../components/layout/TopNav';
import Sidebar from '../../components/layout/Sidebar';
import { getToken } from '../../services/auth';
import { FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaInfoCircle, FaTags, FaArrowLeft, FaArrowRight, FaSearch, FaBell } from 'react-icons/fa';

const getLocalDateInputValue = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().split('T')[0];
};

export default function CreateTrip() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    destination: '',
    start_date: '',
    end_date: '',
    budget: '',
    description: '',
    interests: '',
    image: ''
  });
  const [tags, setTags] = useState(['Hiking', 'Photography', 'Food Tours', 'Beach', 'Nightlife', 'Culture']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  const today = getLocalDateInputValue();
  const [imagePreview, setImagePreview] = useState('');
  const [loadingTrip, setLoadingTrip] = useState(false);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const params = new URLSearchParams(location.search);
  const tripId = params.get('tripId');
  const isEditMode = Boolean(tripId);
  const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  useEffect(() => {
    const s = Number(params.get('step') || '1');
    if (s >= 1 && s <= 4) setActiveStep(s);
  }, [location.search]);

  useEffect(() => {
    if (!tripId) return;

    let cancelled = false;
    const loadTrip = async () => {
      try {
        setLoadingTrip(true);
        setError('');
        const token = getToken();
        const response = await fetch(`/api/trips/${tripId}`, {
          headers: {
            Authorization: `Bearer ${token || ''}`
          }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load trip');
        }
        if (cancelled) return;
        const trip = data.trip;
        setFormData({
          destination: trip.destination || '',
          start_date: trip.start_date ? new Date(trip.start_date).toISOString().split('T')[0] : '',
          end_date: trip.end_date ? new Date(trip.end_date).toISOString().split('T')[0] : '',
          budget: String(trip.budget || ''),
          description: trip.description || '',
          interests: '',
          image: trip.image || ''
        });
        setTags(Array.isArray(trip.interests) && trip.interests.length ? trip.interests : []);
        setImagePreview(trip.image || '');
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load trip');
        }
      } finally {
        if (!cancelled) setLoadingTrip(false);
      }
    };

    loadTrip();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const goToStep = (n) => {
    navigate(`/dashboard/trips/create?step=${n}${tripId ? `&tripId=${tripId}` : ''}`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For date fields, validate the format
    if ((name === 'start_date' || name === 'end_date') && value) {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (!regex.test(value)) return; // Don't update if format is invalid
      
      const [year, month, day] = value.split('-').map(Number);
      // Prevent invalid months (must be 1-12)
      if (month < 1 || month > 12) return;
      // Prevent invalid days (must be 1-31)
      if (day < 1 || day > 31) return;
    }
    
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'start_date' && prev.end_date && value && prev.end_date < value) {
        next.end_date = value;
      }
      return next;
    });
  };

  const handleTagInputKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = (formData.interests || '').trim();
      if (!val) return;
      const parts = val.split(',').map(t => t.trim()).filter(Boolean);
      if (parts.length === 0) return;
      setTags(prev => {
        const set = new Set(prev);
        parts.forEach(p => set.add(p));
        return Array.from(set);
      });
      setFormData(prev => ({ ...prev, interests: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setError('Supported formats: JPG, PNG, WEBP, GIF');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setFormData((prev) => ({ ...prev, image: result }));
      setImagePreview(result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const openDatePicker = (inputRef) => {
    const input = inputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
    input.focus();
    input.click();
  };

  const saveDraft = () => {
    alert('Draft saved');
  };

  const validateDate = (dateStr) => {
    if (!dateStr) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const [year, month, day] = dateStr.split('-').map(Number);
    // Validate month is 1-12
    if (month < 1 || month > 12) return false;
    // Validate day is 1-31
    if (day < 1 || day > 31) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.destination || !formData.start_date || !formData.end_date || !formData.budget || !formData.description) {
      setError('Please fill all required fields');
      return;
    }

    // Validate date format and values
    if (!validateDate(formData.start_date)) {
      setError('Invalid start date format. Use YYYY-MM-DD');
      return;
    }

    if (!validateDate(formData.end_date)) {
      setError('Invalid end date format. Use YYYY-MM-DD');
      return;
    }

    if (formData.start_date < today) {
      setError('Start date must be today or a future date');
      return;
    }

    if (formData.end_date < today) {
      setError('End date must be today or a future date');
      return;
    }

    if (formData.end_date < formData.start_date) {
      setError('End date must be the same as or after the start date');
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(isEditMode ? `/api/trips/${tripId}` : '/api/trips', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({ 
          ...formData,
          budget: Number(formData.budget),
          interests: tags 
        })
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.message || (isEditMode ? 'Failed to update trip' : 'Failed to create trip'));
        return;
      }
      alert(isEditMode ? 'Trip updated successfully!' : 'Trip created successfully!');
      navigate('/dashboard/trips');
    } catch (e) {
      console.error('Trip creation error:', e);
      setError(e?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <TopNav onToggleSidebar={() => setSidebarOpen(s => !s)} hideSearch hideNotifications hideProfile />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6">
        <Sidebar className={!sidebarOpen ? 'hidden' : ''} />

        <main className="flex-1 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate(-1)}
                  className="px-3 py-2 rounded-xl bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:bg-slate-800 hover:text-white transition-all inline-flex items-center gap-2"
                  aria-label="Go back"
                >
                  <FaArrowLeft />
                  <span className="text-sm font-semibold">Back</span>
                </button>
                <h1 className="text-5xl font-black bg-gradient-to-r from-[#2563eb] to-[#10b981] bg-clip-text text-transparent">{isEditMode ? 'Edit Trip' : 'Plan a New Trip'}</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  aria-label="Search"
                  title="Search"
                  onClick={() => navigate('/search')}
                  className="w-10 h-10 bg-[#1e293b] border border-[#334155] hover:bg-slate-800 rounded-xl flex items-center justify-center transition-colors"
                >
                  <FaSearch className="text-[#94a3b8]" />
                </button>
                <button
                  aria-label="Notifications"
                  title="Notifications"
                  onClick={() => navigate('/dashboard/notifications')}
                  className="w-10 h-10 bg-[#1e293b] border border-[#334155] hover:bg-slate-800 rounded-xl flex items-center justify-center transition-colors"
                >
                  <FaBell className="text-[#94a3b8]" />
                </button>
              </div>
            </div>
            <p className="text-[#94a3b8] mb-8">{isEditMode ? 'Update your trip details and card image' : 'Create an amazing journey and find the perfect travel companions'}</p>

            <div className="mb-6">
              <div className="flex items-center">
                {[
                  { n: 1, label: 'Details' },
                  { n: 2, label: 'Schedule' },
                  { n: 3, label: 'Preferences' },
                  { n: 4, label: 'Review' },
                ].map((s, idx, arr) => (
                  <div key={s.n} className="flex items-center flex-1">
                    <div className="flex flex-col items-start">
                      <button
                        type="button"
                        onClick={() => goToStep(s.n)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        s.n === activeStep
                          ? 'bg-[#1e293b] text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] ring-2 ring-[#2563eb]'
                          : 'bg-[#1e293b] text-[#94a3b8] ring-2 ring-[#334155]'
                      }`}
                        aria-label={s.label}
                        title={s.label}
                      >
                        {s.n}
                      </button>
                      <button
                        type="button"
                        onClick={() => goToStep(s.n)}
                        className="mt-2 text-left text-xs font-semibold text-[#94a3b8] hover:text-white transition-colors"
                        aria-label={s.label}
                        title={s.label}
                      >
                        {s.label}
                      </button>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="flex-1 mx-4 h-1 rounded-full bg-[#1e293b]">
                        <div className={`${activeStep > s.n ? 'bg-gradient-to-r from-[#2563eb] to-[#10b981]' : 'bg-transparent'} h-full rounded-full`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={submit} className="space-y-6">
              <div className="bg-[#1e293b] p-8 rounded-3xl shadow-2xl border border-[#334155]">
                {loadingTrip ? (
                  <div className="flex min-h-[320px] items-center justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#334155] border-t-[#2563eb]" />
                  </div>
                ) : (
                <>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <FaMapMarkerAlt className="text-[#2563eb]" />
                      Destination
                    </label>
                    <div className="text-xs text-[#94a3b8]">Where do you want to go?</div>
                    <div className="relative">
                      <input 
                        type="text" 
                        name="destination"
                        value={formData.destination}
                        onChange={handleChange}
                        placeholder="e.g., Paris, Bali, Tokyo..."
                        className="w-full bg-[#0f172a] border border-[#334155] text-white text-sm rounded-xl focus:outline-none focus:border-[#2563eb] block p-3.5 placeholder-[#94a3b8] transition-all duration-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <FaInfoCircle className="text-[#10b981]" />
                      Trip Card Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full bg-[#0f172a] border border-[#334155] text-white text-sm rounded-xl focus:outline-none focus:border-[#10b981] block p-3.5 file:mr-4 file:rounded-lg file:border-0 file:bg-[#10b981] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                    />
                    {imagePreview ? (
                      <div className="overflow-hidden rounded-2xl border border-[#334155] bg-[#0f172a]">
                        <img
                          src={imagePreview}
                          alt="Trip preview"
                          className="h-48 w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#334155] bg-[#0f172a] px-4 py-8 text-center text-sm text-[#94a3b8]">
                        Upload an image for the destination cards.
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <FaCalendarAlt className="text-[#2563eb]" />
                        Start Date
                      </label>
                      <div className="relative">
                        <input 
                          ref={startDateRef}
                          type="date" 
                          name="start_date"
                          value={formData.start_date}
                          onChange={handleChange}
                          min={today}
                          onClick={() => openDatePicker(startDateRef)}
                          className="w-full cursor-pointer bg-[#0f172a] border border-[#334155] text-white text-sm rounded-xl focus:outline-none focus:border-[#2563eb] block p-3.5 placeholder-[#94a3b8] transition-all duration-300 pr-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => openDatePicker(startDateRef)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2563eb] transition hover:text-blue-300"
                          aria-label="Open start date calendar"
                        >
                          <FaCalendarAlt />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <FaCalendarAlt className="text-[#10b981]" />
                        End Date
                      </label>
                      <div className="relative">
                        <input 
                          ref={endDateRef}
                          type="date" 
                          name="end_date"
                          value={formData.end_date}
                          onChange={handleChange}
                          min={formData.start_date || today}
                          onClick={() => openDatePicker(endDateRef)}
                          className="w-full cursor-pointer bg-[#0f172a] border border-[#334155] text-white text-sm rounded-xl focus:outline-none focus:border-[#10b981] block p-3.5 placeholder-[#94a3b8] transition-all duration-300 pr-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => openDatePicker(endDateRef)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#10b981] transition hover:text-emerald-300"
                          aria-label="Open end date calendar"
                        >
                          <FaCalendarAlt />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <FaDollarSign className="text-[#10b981]" />
                      Budget
                    </label>
                    <div className="text-xs text-[#94a3b8]">Estimated Budget ($) per person</div>
                    <input 
                      type="number" 
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="e.g., 1500"
                      className="w-full bg-[#0f172a] border border-[#334155] text-white text-sm rounded-xl focus:outline-none focus:border-[#10b981] block p-3.5 placeholder-[#94a3b8] transition-all duration-300"
                      required
                    />
                    <div className="text-xs text-[#94a3b8]">This helps match you with compatible travelers</div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <FaInfoCircle className="text-[#2563eb]" />
                      Trip Description
                    </label>
                    <div className="text-xs text-[#94a3b8]">What's the plan?</div>
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Mention details about activities, pace, and what you're looking for in a companion..."
                      className="w-full bg-[#0f172a] border border-[#334155] text-white text-sm rounded-xl focus:outline-none focus:border-[#2563eb] block p-3.5 placeholder-[#94a3b8] transition-all duration-300 resize-none"
                      required
                    />
                    <div className="text-xs text-[#94a3b8]">Be specific to attract the right travel companions</div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <FaTags className="text-[#10b981]" />
                      Interests
                    </label>
                    <div className="text-xs text-[#94a3b8]">What activities are you interested in? (comma separated)</div>
                    <input 
                      type="text" 
                      name="interests"
                      value={formData.interests}
                      onChange={handleChange}
                      onKeyDown={handleTagInputKey}
                      placeholder="Type and press Enter..."
                      className="w-full bg-[#0f172a] border border-[#334155] text-white text-sm rounded-xl focus:outline-none focus:border-[#10b981] block p-3.5 placeholder-[#94a3b8] transition-all duration-300"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map(t => (
                        <span key={t} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-medium text-blue-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-6 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 text-sm text-center font-medium">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-3 mt-8">
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:bg-slate-800 hover:text-white transition-all"
                  >
                    Save as Draft
                  </button>
                  <button 
                    type="submit"
                    disabled={loading || loadingTrip}
                    className="w-full sm:flex-1 text-white bg-gradient-to-r from-[#2563eb] to-[#10b981] hover:from-blue-600 hover:to-emerald-500 font-bold rounded-xl text-sm px-5 py-3.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#2563eb]/40 flex items-center justify-center gap-2"
                  >
                    {loading ? (isEditMode ? 'Updating Trip...' : 'Creating Trip...') : <>{isEditMode ? 'Update Trip' : 'Create Trip'} <FaArrowRight /></>}
                  </button>
                </div>
                </>
                )}
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
