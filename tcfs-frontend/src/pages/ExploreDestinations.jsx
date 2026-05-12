import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Heart, User, Calendar } from 'lucide-react';
import { getToken, getUser } from '../services/auth';

const MAX_BUDGET = 50000;
const API_URL = import.meta.env.VITE_API_URL || '';

const normalizeToStartOfDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const ExploreDestinations = () => {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [searchType, setSearchType] = useState('Trips');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [guidedTrips, setGuidedTrips] = useState(true);
  const [coTravel, setCoTravel] = useState(true);
  const [departureMonth, setDepartureMonth] = useState('All months');
  const [duration, setDuration] = useState(15);
  const [budget, setBudget] = useState(MAX_BUDGET);
  const [continent, setContinent] = useState('All');
  const [sortBy, setSortBy] = useState('Recommended');
  const [bookmarked, setBookmarked] = useState({});
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [requestingId, setRequestingId] = useState('');
  const [requestStatus, setRequestStatus] = useState({});
  const [outgoingRequests, setOutgoingRequests] = useState({});


  const getRangeBackground = (value, max) => {
    const percent = Math.round((value / max) * 100);
    return {
      background: `linear-gradient(90deg, #10b981 ${percent}%, #334155 ${percent}%)`,
    };
  };



  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Dates TBD';
    const startText = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endText = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startText} - ${endText}`;
  };

  const getDaysRemaining = (endDate) => {
    const today = normalizeToStartOfDay(new Date());
    const tripEnd = normalizeToStartOfDay(endDate);
    if (!today || !tripEnd) return null;
    return Math.ceil((tripEnd.getTime() - today.getTime()) / 86400000);
  };

  const inferTripImage = (destination = '') => {
    const lower = destination.toLowerCase();
    if (lower.includes('lahore')) return 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80';
    if (lower.includes('skardu')) return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80';
    if (lower.includes('hunza')) return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80';
    if (lower.includes('islamabad')) return 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80';
    if (lower.includes('karachi')) return 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80';
    return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80';
  };

  const getTripImage = (image, destination) => {
    const src = String(image || '').trim();
    if (!src) return inferTripImage(destination);
    if (src.startsWith('data:image/')) return src;
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('//')) return `https:${src}`;
    if (src.startsWith('/')) return `${API_URL}${src}`;
    return inferTripImage(destination);
  };



  useEffect(() => {
    let cancelled = false;

    const loadTrips = async () => {
      try {
        setLoading(true);
        setFeedback('');
        const token = getToken();
        const [response, outgoingResponse] = await Promise.all([
          fetch('/api/trips/discover', {
            headers: {}
          }),
          token
            ? fetch('/api/requests/outgoing', {
                headers: { Authorization: `Bearer ${token}` }
              })
            : Promise.resolve(null)
        ]);
        const data = await response.json().catch(() => ({}));
        const outgoingData = outgoingResponse
          ? await outgoingResponse.json().catch(() => ({}))
          : { success: true, requests: [] };
        if (!response.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load trips');
        }

        const mappedTrips = (data.items || []).map((trip) => {
          const start = new Date(trip.start_date);
          const end = new Date(trip.end_date);
          const durationDays = Math.max(
            1,
            trip.durationDays || Math.ceil((end.getTime() - start.getTime()) / 86400000)
          );
          const creatorName = trip.creator_id?.name || 'Trip Organizer';
          const initials = creatorName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('') || 'TG';
          const participantsCount = Array.isArray(trip.participants) ? trip.participants.length : 1;

          return {
            id: trip.id,
            destination: trip.destination,
            image: getTripImage(trip.image, trip.destination),
            title: trip.title || `${trip.destination} Trip`,
            duration: durationDays,
            dates: formatDateRange(trip.start_date, trip.end_date),
            startDate: trip.start_date,
            endDate: trip.end_date,
            daysRemaining: getDaysRemaining(trip.end_date),
            organizer: {
              name: creatorName,
              role: 'Trip Organizer',
              initials
            },
            groupSize: {
              current: participantsCount,
              max: 12
            },
            price: trip.budget,
            tags: Array.isArray(trip.interests) && trip.interests.length
              ? trip.interests.slice(0, 3)
              : ['Travel', 'Explore'],
            continent: 'Asia',
            creatorId: trip.creator_id?._id || trip.creator_id?.id || trip.creator_id
          };
        });

        if (!cancelled) {
          setTrips(mappedTrips);
          const outgoingMap = {};
          (outgoingData.requests || []).forEach((request) => {
            outgoingMap[String(request.trip_id)] = request.status;
          });
          setOutgoingRequests(outgoingMap);
        }
      } catch (error) {
        if (!cancelled) {
          setTrips([]);
          setFeedback(error.message || 'Failed to load trips');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTrips();
    return () => {
      cancelled = true;
    };
  }, []);



  const filteredTrips = useMemo(() => {
    const monthMap = {
      January: 'Jan',
      February: 'Feb',
      March: 'Mar',
      April: 'Apr',
      May: 'May',
      June: 'Jun',
      July: 'Jul',
      August: 'Aug',
      September: 'Sep',
      October: 'Oct',
      November: 'Nov',
      December: 'Dec',
      'All months': 'All months',
    };

    const startMonthToken = monthMap[departureMonth] || 'All months';
    let list = trips.filter((trip) => {
      const isExpired = trip.daysRemaining != null && trip.daysRemaining < 0;
      const matchDest = !destinationSearch.trim()
        || trip.destination.toLowerCase().includes(destinationSearch.toLowerCase());
      const matchDuration = duration === 15 || trip.duration <= duration;
      const matchBudget = budget >= MAX_BUDGET || trip.price <= budget;
      const monthToken = trip.dates.split(' ')[0];
      const matchMonth = startMonthToken === 'All months' || monthToken === startMonthToken;
      const matchContinent = continent === 'All' || trip.continent === continent;
      return !isExpired && matchDest && matchDuration && matchBudget && matchMonth && matchContinent;
    });

    switch (sortBy) {
      case 'Price: Low to High':
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case 'Price: High to Low':
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case 'Duration: Shortest':
        list = [...list].sort((a, b) => a.duration - b.duration);
        break;
      case 'Duration: Longest':
        list = [...list].sort((a, b) => b.duration - a.duration);
        break;
      default:
        break;
    }

    return list;
  }, [budget, continent, departureMonth, destinationSearch, duration, sortBy, trips]);



  const toggleBookmark = (tripId) => {
    setBookmarked((prev) => ({
      ...prev,
      [tripId]: !prev[tripId]
    }));
  };

  const handleJoinRequest = async (trip) => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setRequestingId(String(trip.id));
    setFeedback('');
    setRequestStatus((prev) => ({
      ...prev,
      [trip.id]: { type: 'pending', message: 'Sending request...' }
    }));
    try {
      const response = await fetch('/api/requests/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          trip_id: trip.id,
          message: `I'd like to join your trip to ${trip.destination}.`
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to send request');
      }
      const successMessage = `Request sent to ${trip.organizer.name} for ${trip.destination}.`;
      setFeedback(successMessage);
      setRequestStatus((prev) => ({
        ...prev,
        [trip.id]: { type: 'success', message: successMessage }
      }));
    } catch (error) {
      const errorMessage = error.message || 'Failed to send request';
      setFeedback(errorMessage);
      setRequestStatus((prev) => ({
        ...prev,
        [trip.id]: { type: 'error', message: errorMessage }
      }));
    } finally {
      setRequestingId('');
    }
  };



  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-['Plus_Jakarta_Sans']">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-6">
          <div>
            <h1 className="text-5xl font-black font-['Sora'] mb-2">
              <span className="text-[#2563eb]">Explore</span>
              <span className="text-[#10b981]"> Destinations</span>
            </h1>
            <p className="text-[#94a3b8] text-lg">Discover your next big adventure</p>
          </div>
          <div className="flex items-center gap-4">

            <button
              aria-label="Create Trip"
              onClick={() => navigate('/dashboard/trips/create')}
              className="flex items-center gap-2 px-6 py-3 bg-[#10b981] hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#10b981]/30"
            >
              <Plus className="w-5 h-5" />
              Create Trip
            </button>
            <button
              aria-label="Open profile"
              onClick={() => navigate('/dashboard/settings')}
              className="w-11 h-11 bg-[#1e293b] hover:bg-slate-800 rounded-xl flex items-center justify-center transition-colors"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
          <aside className="bg-[#1e293b] rounded-3xl p-7 h-fit sticky top-6">
            <div className="space-y-6">
              <div>
                <label className="block text-slate-300 font-semibold text-sm mb-3">Search Type</label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-white focus:outline-none focus:border-[#2563eb] transition-colors"
                >
                  <option className="bg-slate-900">Trips</option>
                  <option className="bg-slate-900">Companions</option>
                  <option className="bg-slate-900">Destinations</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold text-sm mb-3">Destination</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search destination..."
                    value={destinationSearch}
                    onChange={(e) => setDestinationSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#2563eb] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guidedTrips}
                    onChange={(e) => setGuidedTrips(e.target.checked)}
                    className="w-5 h-5 text-green-500 bg-[#1e293b] border-[#334155] rounded focus:ring-green-500"
                  />
                  <span className="text-slate-300 text-sm">Guided Trips</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={coTravel}
                    onChange={(e) => setCoTravel(e.target.checked)}
                    className="w-5 h-5 text-green-500 bg-[#1e293b] border-[#334155] rounded focus:ring-green-500"
                  />
                  <span className="text-slate-300 text-sm">Co-Travel</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold text-sm mb-3">Departure Month</label>
                <select
                  value={departureMonth}
                  onChange={(e) => setDepartureMonth(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-white focus:outline-none focus:border-[#2563eb] transition-colors"
                >
                  <option className="bg-slate-900">All months</option>
                  <option className="bg-slate-900">January</option>
                  <option className="bg-slate-900">February</option>
                  <option className="bg-slate-900">March</option>
                  <option className="bg-slate-900">April</option>
                  <option className="bg-slate-900">May</option>
                  <option className="bg-slate-900">June</option>
                  <option className="bg-slate-900">July</option>
                  <option className="bg-slate-900">August</option>
                  <option className="bg-slate-900">September</option>
                  <option className="bg-slate-900">October</option>
                  <option className="bg-slate-900">November</option>
                  <option className="bg-slate-900">December</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold text-sm mb-3">
                  Duration: {duration === 15 ? 'any' : `${duration} days`}
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                  style={getRangeBackground(duration, 30)}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold text-sm mb-3">
                  Budget: {budget >= MAX_BUDGET ? 'Any' : `$${budget}`}
                </label>
                <input
                  type="range"
                  min="0"
                  max={MAX_BUDGET}
                  step="100"
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value, 10))}
                  style={getRangeBackground(budget, MAX_BUDGET)}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold text-sm mb-3">Continent</label>
                <select
                  value={continent}
                  onChange={(e) => setContinent(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1e293b] border border-[#334155] rounded-xl text-white focus:outline-none focus:border-[#2563eb] transition-colors"
                >
                  <option className="bg-slate-900">All</option>
                  <option className="bg-slate-900">Asia</option>
                  <option className="bg-slate-900">Europe</option>
                  <option className="bg-slate-900">Africa</option>
                  <option className="bg-slate-900">Americas</option>
                  <option className="bg-slate-900">Oceania</option>
                </select>
              </div>

              <button className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-[#2563eb]/30 flex items-center justify-center gap-2">
                <Search className="w-5 h-5" />
                Search
              </button>
            </div>
          </aside>

          <main>
            <div className="flex items-center justify-between mb-6">
              <div className="text-slate-400">
                <strong className="text-white font-bold text-lg">{filteredTrips.length}</strong> trips
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-xl text-white text-sm focus:outline-none focus:border-[#2563eb] transition-colors"
              >
                <option className="bg-slate-800">Recommended</option>
                <option className="bg-slate-800">Price: Low to High</option>
                <option className="bg-slate-800">Price: High to Low</option>
                <option className="bg-slate-800">Duration: Shortest</option>
                <option className="bg-slate-800">Duration: Longest</option>
              </select>
            </div>

            {feedback ? (
              <div className="mb-5 rounded-2xl border border-[#334155] bg-[#1e293b] px-4 py-3 text-sm text-slate-200">
                {feedback}
              </div>
            ) : null}

            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-3xl bg-[#1e293b]">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-[#2563eb]" />
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="rounded-3xl bg-[#1e293b] px-6 py-16 text-center text-slate-300">
                No trips found in the database yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTrips.map((trip) => {
                  const isOwnTrip = String(trip.creatorId) === String(currentUser?.id || currentUser?.userId || currentUser?._id);
                  const tripStatus = requestStatus[trip.id];
                  const outgoingStatus = outgoingRequests[String(trip.id)];
                  const isRequestLocked = outgoingStatus === 'pending' || outgoingStatus === 'accepted';
                  const daysRemainingLabel = trip.daysRemaining === 0
                    ? 'Ends today'
                    : trip.daysRemaining === 1
                      ? '1 day remaining'
                      : `${trip.daysRemaining} days remaining`;
                  const tripImage = getTripImage(trip.image, trip.destination);
                  return (
                    <div
                      key={trip.id}
                      className="group overflow-hidden rounded-[2rem] bg-[#111827] shadow-[0_28px_60px_-25px_rgba(0,0,0,0.65)] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                    >
                      <div className="relative h-72 overflow-hidden">
                        <img
                          src={tripImage}
                          alt={`${trip.destination} scenic view`}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = inferTripImage(trip.destination);
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent" />

                        <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-200 backdrop-blur">
                          {trip.continent}
                        </div>

                        <div className="absolute right-5 top-5 rounded-2xl bg-emerald-500/95 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20">
                          ${trip.price}
                        </div>

                        <div className="absolute left-5 bottom-5 right-5 rounded-[2rem] border border-white/10 bg-black/30 p-5 backdrop-blur">
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Explore Destination</p>
                          <h3 className="mt-2 text-3xl font-semibold text-white">{trip.destination}</h3>
                          <p className="mt-2 text-sm text-slate-300 line-clamp-2">{trip.title}</p>
                        </div>
                      </div>

                      <div className="space-y-5 p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-slate-300 text-sm">
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2">
                            <Calendar className="h-4 w-4" /> {trip.duration} days
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2">
                            {trip.dates}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Organizer</div>
                            <div className="mt-3 flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 text-sm font-bold text-white">
                                {trip.organizer.initials}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">{trip.organizer.name}</p>
                                <p className="text-xs text-slate-400">{trip.organizer.role}</p>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Availability</div>
                            <div className="mt-3 text-sm text-white">{trip.groupSize.current}/{trip.groupSize.max} spots</div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full bg-emerald-400 transition-all duration-300"
                                style={{ width: `${(trip.groupSize.current / trip.groupSize.max) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {trip.tags.map((tag, index) => (
                            <span
                              key={`${trip.id}-${tag}-${index}`}
                              className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinRequest(trip);
                            }}
                            disabled={isOwnTrip || isRequestLocked || requestingId === String(trip.id)}
                            className="min-h-[52px] flex-1 rounded-3xl bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:bg-slate-800 disabled:text-slate-400"
                          >
                            {isOwnTrip
                              ? 'Your Trip'
                              : outgoingStatus === 'accepted'
                                ? 'Accepted'
                                : outgoingStatus === 'pending'
                                  ? 'Request Sent'
                                  : requestingId === String(trip.id)
                                    ? 'Sending...'
                                    : 'Request to Join'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(trip.id);
                            }}
                            className={`flex h-14 w-14 items-center justify-center rounded-3xl border text-white transition ${
                              bookmarked[trip.id]
                                ? 'border-red-500 bg-red-500/15 text-red-300'
                                : 'border-white/10 bg-white/5 hover:border-emerald-400'
                            }`}
                          >
                            <Heart className={`h-5 w-5 ${bookmarked[trip.id] ? 'fill-red-400 text-red-400' : 'text-slate-300'}`} />
                          </button>
                        </div>

                        {tripStatus ? (
                          <div className={`rounded-3xl border p-4 text-sm ${
                            tripStatus.type === 'success'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                              : tripStatus.type === 'error'
                                ? 'border-red-500/30 bg-red-500/10 text-red-200'
                                : 'border-white/10 bg-slate-950 text-slate-300'
                          }`}>
                            {tripStatus.message}
                          </div>
                        ) : outgoingStatus === 'pending' ? (
                          <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                            You already sent a join request for this trip.
                          </div>
                        ) : outgoingStatus === 'accepted' ? (
                          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                            Your request for this trip has already been accepted.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>


    </div>
  );
};

export default ExploreDestinations;
