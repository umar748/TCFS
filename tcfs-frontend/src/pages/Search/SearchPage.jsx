import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaFilter,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaSearch,
  FaTimes,
  FaUser
} from 'react-icons/fa';
import { socket } from '../../socket';
import { getToken, getUser } from '../../services/auth';

const interests = ['Hiking', 'Cultural', 'Adventure', 'Beach', 'Mountain', 'City Tour', 'Food', 'Photography', 'Wildlife', 'Backpacking'];
const baseFilters = {
  destination: '',
  minAge: 18,
  maxAge: 65,
  gender: 'Any',
  interests: [],
  startDate: '',
  endDate: '',
  keyword: ''
};

const formatDate = (value) => {
  if (!value) return 'Date TBD';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date TBD' : date.toLocaleDateString();
};

const fallbackAvatar = (name) => (name || 'T').charAt(0).toUpperCase();

export default function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchType, setSearchType] = useState('users');
  const [filters, setFilters] = useState(baseFilters);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState(null);
  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const token = getToken();
  const user = useMemo(() => getUser() || {}, []);
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const requestedTripId = queryParams.get('tripId');
  const requestedType = queryParams.get('type');

  useEffect(() => {
    if (!token || !user?.id) return undefined;

    socket.emit('join', user.id);

    return () => {
      socket.off('requestSent');
    };
  }, [token, user?.id]);

  useEffect(() => {
    let active = true;

    const loadInitialResults = async () => {
      setLoading(true);
      try {
        const targetType = requestedType === 'trips' ? 'trips' : searchType;
        const endpoint = targetType === 'users' ? '/api/users/search' : '/api/trips/discover';
        const response = await fetch(endpoint);
        const data = await response.json();
        if (!active) return;
        if (targetType !== searchType) {
          setSearchType(targetType);
        }
        const nextResults = targetType === 'trips' ? (data.items || []) : (data.users || []);
        setResults(nextResults);
        if (targetType === 'trips' && requestedTripId) {
          const matchedTrip = nextResults.find((item) => String(item.id || item._id) === String(requestedTripId));
          if (matchedTrip) {
            setSelectedTrip(matchedTrip);
            setShowTripModal(true);
          }
        }
      } catch (error) {
        console.error('Initial search load error:', error);
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInitialResults();

    return () => {
      active = false;
    };
  }, [searchType, requestedTripId, requestedType]);

  useEffect(() => {
    if (searchType !== 'trips') return undefined;

    const handler = (trip) => {
      setResults((prev) => [
        {
          id: trip._id,
          destination: trip.destination,
          start_date: trip.start_date,
          end_date: trip.end_date,
          budget: trip.budget,
          description: trip.description,
          interests: trip.interests,
          participants: trip.participants,
          status: trip.status,
          creator_id: trip.creator_id,
          title: `${trip.destination} Trip`
        },
        ...prev
      ]);
    };

    socket.on('tripCreated', handler);
    return () => socket.off('tripCreated', handler);
  }, [searchType]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest) => {
    setFilters((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((item) => item !== interest)
        : [...prev.interests, interest]
    }));
  };

  const clearFilters = () => {
    setFilters(baseFilters);
    setResults([]);
  };

  const handleSearchMode = (mode) => {
    setSearchType(mode);
    setFilters(baseFilters);
    setResults([]);
    setShowFilters(false);
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const endpoint = searchType === 'users' ? '/api/users/search' : '/api/trips/discover';
      const query = new URLSearchParams();

      if (searchType === 'users') {
        const q = filters.keyword.trim() || filters.destination.trim();
        if (q) query.append('q', q);
        query.append('minAge', String(filters.minAge));
        query.append('maxAge', String(filters.maxAge));
        if (filters.gender !== 'Any') query.append('gender', filters.gender);
        if (filters.interests.length) query.append('interests', filters.interests.join(','));
      } else {
        if (filters.destination.trim()) query.append('q', filters.destination.trim());
        if (filters.startDate) {
          const month = new Date(filters.startDate).getMonth() + 1;
          query.append('startMonth', String(month));
        }
        if (filters.startDate && filters.endDate) {
          const start = new Date(filters.startDate);
          const end = new Date(filters.endDate);
          const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
          query.append('maxDays', String(diffDays));
        }
      }

      const response = await fetch(`${endpoint}?${query.toString()}`);
      const data = await response.json();
      setResults(searchType === 'trips' ? (data.items || []) : (data.users || []));
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTripClick = (trip) => {
    setSelectedTrip(trip);
    setJoinMessage('');
    setRequestStatus(null);
    setShowTripModal(true);
  };

  const handleCloseTripModal = () => {
    setShowTripModal(false);
    setSelectedTrip(null);
    setJoinMessage('');
    setRequestStatus(null);
  };

  const handleCompanionClick = (companion) => {
    setSelectedCompanion(companion);
    setShowCompanionModal(true);
  };

  const handleCloseCompanionModal = () => {
    setShowCompanionModal(false);
    setSelectedCompanion(null);
  };

  const handleDirectMessage = (companion) => {
    const activeToken = getToken();
    if (!activeToken) {
      navigate('/login');
      return;
    }

    const partnerId = companion.id || companion._id;
    const partnerName = companion.name || 'Traveler';
    navigate(`/dashboard/messages?partnerId=${encodeURIComponent(partnerId)}&partnerName=${encodeURIComponent(partnerName)}`);
  };

  const handleSendJoinRequest = async () => {
    if (!token) {
      alert('Please login first to send a request');
      return;
    }

    if (!joinMessage.trim()) {
      alert('Please write a message to send with your request');
      return;
    }

    setSendingRequest(true);
    try {
      const response = await fetch('/api/requests/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          trip_id: selectedTrip.id || selectedTrip._id,
          message: joinMessage
        })
      });

      const data = await response.json();
      if (data.success) {
        setRequestStatus({ type: 'success', message: 'Request sent successfully.' });
        setJoinMessage('');
      } else {
        setRequestStatus({ type: 'error', message: data.message || 'Failed to send request.' });
      }
    } catch (error) {
      console.error('Join request error:', error);
      setRequestStatus({ type: 'error', message: 'Error sending request. Please try again.' });
    } finally {
      setSendingRequest(false);
    }
  };

  const hasActiveUserFilters = Boolean(
    filters.destination || filters.keyword || filters.interests.length || filters.gender !== 'Any' || filters.minAge !== 18 || filters.maxAge !== 65
  );
  const hasActiveTripFilters = Boolean(filters.destination || filters.startDate || filters.endDate);
  const hasActiveFilters = searchType === 'users' ? hasActiveUserFilters : hasActiveTripFilters;

  return (
    <div className="min-h-screen bg-[#0d1424] text-white">
      <div className="min-h-screen lg:grid lg:grid-cols-[268px_minmax(0,1fr)]">
        <aside className={`${showFilters ? 'block' : 'hidden'} border-r border-white/8 bg-[#20293d] lg:block`}>
          <div className="sticky top-0 h-screen overflow-y-auto px-4 py-5">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="max-w-[220px] font-['Sora'] text-[2rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-white">
                  <span className="text-[#4d7dff]">Search</span> Travel Companions & Trips
                </h1>
                <p className="mt-3 max-w-[220px] text-sm leading-6 text-[#8ea0c3]">
                  Find your perfect travel buddy or discover exciting trips
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="rounded-full border border-white/10 p-2 text-[#9ca8c4] lg:hidden"
                aria-label="Close filters"
              >
                <FaTimes size={12} />
              </button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-[#171f31] p-1">
              <button
                type="button"
                onClick={() => handleSearchMode('users')}
                className={`rounded-xl px-4 py-3 text-xs font-semibold transition ${
                  searchType === 'users'
                    ? 'bg-gradient-to-r from-[#4467f6] to-[#7c5cff] text-white shadow-[0_8px_24px_rgba(92,111,255,0.35)]'
                    : 'text-[#b7c2db] hover:bg-white/5 hover:text-white'
                }`}
              >
                Find Companions
              </button>
              <button
                type="button"
                onClick={() => handleSearchMode('trips')}
                className={`rounded-xl px-4 py-3 text-xs font-semibold transition ${
                  searchType === 'trips'
                    ? 'bg-gradient-to-r from-[#4467f6] to-[#7c5cff] text-white shadow-[0_8px_24px_rgba(92,111,255,0.35)]'
                    : 'text-[#b7c2db] hover:bg-white/5 hover:text-white'
                }`}
              >
                Find Trips
              </button>
            </div>

            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <FaFilter className="text-[#7d92bb]" size={12} />
              <span>Filters</span>
            </div>

            <form onSubmit={handleSearch} className="space-y-3">
              <div>
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#7d92bb]">
                  Destination
                </label>
                <input
                  type="text"
                  placeholder="Enter destination..."
                  value={filters.destination}
                  onChange={(e) => handleFilterChange('destination', e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#31425f] bg-[#10192a] px-4 text-sm text-white outline-none placeholder:text-[#66799d] focus:border-[#5e7bff]"
                />
              </div>

              {searchType === 'users' && (
                <div>
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#7d92bb]">
                    Keyword
                  </label>
                  <input
                    type="text"
                    placeholder="Search by interests..."
                    value={filters.keyword}
                    onChange={(e) => handleFilterChange('keyword', e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#31425f] bg-[#10192a] px-4 text-sm text-white outline-none placeholder:text-[#66799d] focus:border-[#5e7bff]"
                  />
                </div>
              )}

              {searchType === 'users' && (
                <div>
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#7d92bb]">
                    Age Range: {filters.minAge} - {filters.maxAge}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={filters.minAge}
                      onChange={(e) => handleFilterChange('minAge', parseInt(e.target.value, 10) || 18)}
                      className="h-10 rounded-xl border border-[#31425f] bg-[#10192a] px-4 text-center text-sm font-semibold text-white outline-none focus:border-[#5e7bff]"
                    />
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={filters.maxAge}
                      onChange={(e) => handleFilterChange('maxAge', parseInt(e.target.value, 10) || 65)}
                      className="h-10 rounded-xl border border-[#31425f] bg-[#10192a] px-4 text-center text-sm font-semibold text-white outline-none focus:border-[#5e7bff]"
                    />
                  </div>
                </div>
              )}

              {searchType === 'users' && (
                <div>
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#7d92bb]">
                    Gender
                  </label>
                  <select
                    value={filters.gender}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#31425f] bg-[#10192a] px-4 text-sm text-white outline-none focus:border-[#5e7bff]"
                  >
                    <option>Any</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              )}

              {searchType === 'users' && (
                <div>
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#7d92bb]">
                    Interests
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {interests.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`flex h-8 items-center justify-center rounded-lg border px-3 text-[10px] font-medium transition ${
                          filters.interests.includes(interest)
                            ? 'border-[#5f73a1] bg-[#1a2740] text-[#eef4ff]'
                            : 'border-[#41506d] bg-[#132039] text-[#d8e2fb] hover:border-[#5a6a88]'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchType === 'trips' && (
                <>
                  <div>
                    <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#7d92bb]">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#31425f] bg-[#10192a] px-4 text-sm text-white outline-none focus:border-[#5e7bff]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-[#7d92bb]">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#31425f] bg-[#10192a] px-4 text-sm text-white outline-none focus:border-[#5e7bff]"
                    />
                  </div>
                </>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4368f6] to-[#875cf8] text-sm font-semibold text-white"
                >
                  <FaSearch size={10} />
                  Search
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 h-11 w-full rounded-xl border border-[#31425f] bg-[#10192a] text-sm font-semibold text-[#d4def5]"
                >
                  Clear Filters
                </button>
              </div>
            </form>
          </div>
        </aside>

        <main className="min-w-0 bg-[#10172a]">
          <div className="border-b border-white/8 px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowFilters(true)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#31425f] bg-[#131d30] px-3 text-xs font-medium text-[#c8d2eb] lg:hidden"
                >
                  <FaFilter size={11} />
                  Filters
                </button>
                <div className="text-xs text-[#8ea0c3]">
                  <span className="font-semibold text-white">{results.length}</span> results found
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#7d92bb]">Sort by:</span>
                <div className="rounded-lg border border-[#31425f] bg-[#131d30] px-3 py-2 text-[10px] text-[#d8e1f5]">
                  Relevance
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-6 sm:px-5">
            {loading && (
              <div className="flex min-h-[70vh] items-center justify-center">
                <div className="h-14 w-14 animate-spin rounded-full border-2 border-[#31425f] border-t-[#6a78ff]" />
              </div>
            )}

            {!loading && results.length === 0 && (
              <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/6 ring-1 ring-white/8">
                  <FaSearch size={28} className="text-[#9aacd0]" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  {hasActiveFilters
                    ? (searchType === 'trips' ? 'No trips match your filters' : 'No companions match your filters')
                    : (searchType === 'trips' ? 'Use the filters to search trips' : 'Use the filters to search companions')}
                </h2>
                <p className="mt-3 max-w-md text-xs leading-6 text-[#8ea0c3]">
                  {searchType === 'trips'
                    ? 'Select your destination and travel dates from the sidebar, then click Search to discover matching trips.'
                    : 'Select your preferences from the sidebar and click Search to find travel companions that match your interests and travel style.'}
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {results.map((item, index) => (
                  <div
                    key={item.id || item._id || `${searchType}-${index}`}
                    className="rounded-[24px] border border-white/8 bg-[#151f33] p-6 text-left transition hover:-translate-y-1 hover:border-[#44557a] hover:bg-[#17233a]"
                  >
                    {searchType === 'users' ? (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-white">{item.name || 'Traveler'}</h3>
                            <p className="mt-2 flex items-center gap-2 text-sm text-[#92a5cb]">
                              <FaUser size={12} />
                              {item.age || 'N/A'} • {item.gender || 'Not specified'}
                            </p>
                          </div>
                          {item.profilePicture ? (
                            <img
                              src={item.profilePicture}
                              alt={item.name || 'Traveler'}
                              className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#26334d] text-lg font-bold text-white">
                              {fallbackAvatar(item.name)}
                            </div>
                          )}
                        </div>

                        {item.bio && <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#c0cae0]">{item.bio}</p>}

                        {item.location && (
                          <p className="mt-4 flex items-center gap-2 text-sm text-[#90a3c8]">
                            <FaMapMarkerAlt size={12} />
                            {item.location}
                          </p>
                        )}

                        {item.interests?.length > 0 && (
                          <div className="mt-5 flex flex-wrap gap-2">
                            {item.interests.slice(0, 4).map((interest) => (
                              <span
                                key={interest}
                                className="rounded-full border border-[#33425d] bg-[#10192a] px-3 py-1.5 text-xs font-medium text-[#cbd5ec]"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => handleCompanionClick(item)}
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#31425f] bg-[#10192a] px-4 text-sm font-semibold text-[#d4def5] transition hover:border-[#4d5f84] hover:text-white"
                          >
                            View Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDirectMessage(item)}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4368f6] to-[#875cf8] px-4 text-sm font-semibold text-white"
                          >
                            <FaEnvelope size={12} />
                            Message
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTripClick(item)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-bold text-white">{item.destination}</h3>
                              <p className="mt-2 flex items-center gap-2 text-sm text-[#92a5cb]">
                                <FaCalendarAlt size={12} />
                                {formatDate(item.start_date)} - {formatDate(item.end_date)}
                              </p>
                            </div>
                            <div className="rounded-full border border-[#31425f] bg-[#10192a] px-3 py-1 text-xs font-semibold text-[#c9d4ee]">
                              {item.participants?.length || 0} participants
                            </div>
                          </div>

                          <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#c0cae0]">
                            {item.description || 'No description provided for this trip yet.'}
                          </p>

                          <div className="mt-5 flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-[#7f94ff]">
                              Budget: ${item.budget || 'N/A'}
                            </div>
                            <div className="rounded-full border border-[#33425d] bg-[#10192a] px-3 py-1 text-xs text-[#c9d4ee]">
                              Open for requests
                            </div>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {showTripModal && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#161f33] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between border-b border-white/8 px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedTrip.destination}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-[#92a5cb]">
                  <FaCalendarAlt size={12} />
                  {formatDate(selectedTrip.start_date)} - {formatDate(selectedTrip.end_date)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseTripModal}
                className="rounded-full border border-white/10 p-2 text-[#9ca8c4] transition hover:text-white"
                aria-label="Close trip details"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {selectedTrip.description && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7d92bb]">About This Trip</h3>
                  <p className="mt-2 text-sm leading-7 text-[#c0cae0]">{selectedTrip.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-[#10192a] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7d92bb]">Budget</div>
                  <div className="mt-2 text-lg font-bold text-white">${selectedTrip.budget || 'N/A'}</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#10192a] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7d92bb]">Participants</div>
                  <div className="mt-2 text-lg font-bold text-white">{selectedTrip.participants?.length || 0}</div>
                </div>
              </div>

              {selectedTrip.interests?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7d92bb]">Interests</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedTrip.interests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full border border-[#33425d] bg-[#10192a] px-3 py-1.5 text-xs font-medium text-[#cbd5ec]"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#d5ddf2]">Message to Trip Creator</label>
                <textarea
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="Tell them why you'd like to join this trip..."
                  className="min-h-28 w-full rounded-2xl border border-[#31425f] bg-[#10192a] px-4 py-3 text-sm text-white outline-none placeholder:text-[#66799d] focus:border-[#5e7bff]"
                />
              </div>

              {requestStatus && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    requestStatus.type === 'success'
                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                      : 'border border-red-500/30 bg-red-500/10 text-red-200'
                  }`}
                >
                  {requestStatus.message}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-white/8 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCloseTripModal}
                disabled={sendingRequest}
                className="h-11 rounded-xl border border-[#31425f] bg-[#10192a] px-5 text-sm font-semibold text-[#d4def5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendJoinRequest}
                disabled={sendingRequest || !joinMessage.trim()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4368f6] to-[#875cf8] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaPaperPlane size={12} />
                {sendingRequest ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompanionModal && selectedCompanion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#161f33] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between border-b border-white/8 px-6 py-5">
              <div className="flex items-center gap-4">
                {selectedCompanion.profilePicture ? (
                  <img
                    src={selectedCompanion.profilePicture}
                    alt={selectedCompanion.name || 'Traveler'}
                    className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#26334d] text-lg font-bold text-white">
                    {fallbackAvatar(selectedCompanion.name)}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedCompanion.name || 'Traveler'}</h2>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[#92a5cb]">
                    <FaUser size={12} />
                    {selectedCompanion.age || 'N/A'} • {selectedCompanion.gender || 'Not specified'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseCompanionModal}
                className="rounded-full border border-white/10 p-2 text-[#9ca8c4] transition hover:text-white"
                aria-label="Close companion details"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-[#10192a] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7d92bb]">Location</div>
                  <div className="mt-2 text-lg font-bold text-white">{selectedCompanion.location || 'Not specified'}</div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#10192a] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7d92bb]">Travel Style</div>
                  <div className="mt-2 text-lg font-bold text-white">{selectedCompanion.travelStyle || 'Not specified'}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7d92bb]">About</h3>
                <p className="mt-2 text-sm leading-7 text-[#c0cae0]">
                  {selectedCompanion.bio || 'This traveler has not added a bio yet.'}
                </p>
              </div>

              {selectedCompanion.interests?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7d92bb]">Interests</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedCompanion.interests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full border border-[#33425d] bg-[#10192a] px-3 py-1.5 text-xs font-medium text-[#cbd5ec]"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-white/8 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCloseCompanionModal}
                className="h-11 rounded-xl border border-[#31425f] bg-[#10192a] px-5 text-sm font-semibold text-[#d4def5]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDirectMessage(selectedCompanion)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4368f6] to-[#875cf8] px-5 text-sm font-semibold text-white"
              >
                <FaEnvelope size={12} />
                Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
