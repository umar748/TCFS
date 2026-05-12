import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Plus, Search, Heart, User, Calendar } from 'lucide-react';
import { getToken, getUser } from '../services/auth';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';

const MAX_BUDGET = 50000;

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
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState([33.6844, 73.0479]);
  const [mapZoom, setMapZoom] = useState(13);
  const [userMarker, setUserMarker] = useState(null);
  const [tripMarkers, setTripMarkers] = useState([]);
  const [geoError, setGeoError] = useState('');
  const [liveGpsId, setLiveGpsId] = useState(null);
  const [liveGpsActive, setLiveGpsActive] = useState(false);

  const getRangeBackground = (value, max) => {
    const percent = Math.round((value / max) * 100);
    return {
      background: `linear-gradient(90deg, #10b981 ${percent}%, #334155 ${percent}%)`,
    };
  };

  const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const MapRecenter = ({ center, zoom }) => {
    const map = useMapEvents({});
    useEffect(() => {
      if (Array.isArray(center) && center.length === 2) {
        map.setView(center, zoom || map.getZoom());
      }
    }, [center, zoom, map]);
    return null;
  };

  const combinedMarkers = [
    ...(userMarker ? [userMarker] : []),
    ...tripMarkersWithDistance
  ];

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

  const computeDistanceKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  const tripMarkersWithDistance = useMemo(() => {
    if (!userMarker) return tripMarkers;
    return [...tripMarkers]
      .map((marker) => ({
        ...marker,
        distanceKm: computeDistanceKm(userMarker.lat, userMarker.lon, marker.lat, marker.lon)
      }))
      .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }, [tripMarkers, userMarker]);

  const nearestTrip = tripMarkersWithDistance.length > 0 ? tripMarkersWithDistance[0] : null;

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
            image: trip.image || inferTripImage(trip.destination),
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

  useEffect(() => {
    return () => {
      if (liveGpsId != null) navigator.geolocation.clearWatch(liveGpsId);
    };
  }, [liveGpsId]);

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

  useEffect(() => {
    if (!showMap || filteredTrips.length === 0) return;

    let cancelled = false;

    const geocodeTrips = async () => {
      try {
        const uniqueTrips = filteredTrips.slice(0, 12);
        const results = await Promise.all(
          uniqueTrips.map(async (trip) => {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trip.destination)}&limit=1`,
                { headers: { Accept: 'application/json' } }
              );
              const data = await response.json().catch(() => []);
              if (!Array.isArray(data) || data.length === 0) return null;
              return {
                lat: Number(data[0].lat),
                lon: Number(data[0].lon),
                label: trip.destination,
                kind: 'trip',
                trip
              };
            } catch {
              return null;
            }
          })
        );

        if (!cancelled) {
          setTripMarkers(results.filter(Boolean));
        }
      } catch {
        if (!cancelled) {
          setTripMarkers([]);
        }
      }
    };

    geocodeTrips();
    return () => {
      cancelled = true;
    };
  }, [showMap, filteredTrips]);

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

  const handleOpenWorldMap = () => {
    setShowMap(true);
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported on this device.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setMapCenter([lat, lon]);
        setMapZoom(15);
        setUserMarker({ lat, lon, label: 'You are here', kind: 'user' });
      },
      () => {
        setGeoError('Location permission denied or unavailable.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startLiveTracking = () => {
    if (!navigator.geolocation || liveGpsActive) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setMapCenter([lat, lon]);
        setMapZoom(15);
        setUserMarker({ lat, lon, label: 'Live location', kind: 'user' });
        setGeoError('');
      },
      () => {
        setGeoError('Unable to track live location.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    setLiveGpsId(id);
    setLiveGpsActive(true);
  };

  const stopLiveTracking = () => {
    if (liveGpsId != null) navigator.geolocation.clearWatch(liveGpsId);
    setLiveGpsId(null);
    setLiveGpsActive(false);
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
              aria-label="Open World Map"
              onClick={handleOpenWorldMap}
              className="flex items-center gap-2 px-6 py-3 bg-[#2563eb] hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#2563eb]/30"
            >
              <Map className="w-5 h-5" />
              World Map
            </button>
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
                  return (
                    <div
                      key={trip.id}
                      className="bg-[#1e293b] rounded-3xl overflow-hidden transition-all duration-400 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/50 cursor-pointer border-2 border-transparent hover:border-[#2563eb]/50"
                    >
                      <div
                        className="relative h-56 bg-cover bg-center"
                        style={{ backgroundImage: `url(${trip.image})` }}
                        role="img"
                        aria-label={`${trip.destination} scenic view`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
                        <div className="absolute bottom-4 left-6 right-6">
                          <h3 className="text-3xl font-bold font-['Sora']">{trip.destination}</h3>
                        </div>
                      </div>

                      <div className="p-6">
                        <h4 className="text-lg font-bold mb-4 text-white">{trip.title}</h4>

                        <div className="flex items-center gap-4 mb-4 text-slate-400 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{trip.duration} days</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{trip.dates}</span>
                          </div>
                        </div>

                        {trip.daysRemaining != null && (
                          <div className="mb-4 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                            {daysRemainingLabel}
                          </div>
                        )}

                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-700">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-bold text-sm">
                            {trip.organizer.initials}
                          </div>
                          <div>
                            <div className="text-white font-semibold text-sm">{trip.organizer.name}</div>
                            <div className="text-slate-400 text-xs">{trip.organizer.role}</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {trip.tags.map((tag, index) => (
                            <span
                              key={`${trip.id}-${tag}-${index}`}
                              className="px-3 py-1 bg-blue-500/15 border border-blue-500/30 rounded-full text-xs font-medium text-blue-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-3 mb-5 bg-green-500/15 rounded-lg p-3">
                          <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all duration-300"
                              style={{ width: `${(trip.groupSize.current / trip.groupSize.max) * 100}%` }}
                            />
                          </div>
                          <span className="text-green-400 font-semibold text-sm">
                            {trip.groupSize.current}/{trip.groupSize.max} spots
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-slate-400 text-xs uppercase tracking-wide font-semibold">From</div>
                            <div className="text-2xl font-bold text-green-400 font-['Sora']">${trip.price}</div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(trip.id);
                              }}
                              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                bookmarked[trip.id]
                                  ? 'bg-red-500/20 border-2 border-red-500'
                                  : 'bg-slate-700 border-2 border-slate-600 hover:border-red-500'
                              }`}
                            >
                              <Heart
                                className={`w-5 h-5 transition-colors ${
                                  bookmarked[trip.id] ? 'fill-red-500 text-red-500' : 'text-slate-400'
                                }`}
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinRequest(trip);
                              }}
                              disabled={isOwnTrip || isRequestLocked || requestingId === String(trip.id)}
                              className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold py-3 px-5 rounded-xl transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-[#2563eb]/30"
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
                          </div>
                        </div>

                        {tripStatus ? (
                          <div
                            className={`mt-4 rounded-xl border px-3 py-2 text-xs ${
                              tripStatus.type === 'success'
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                : tripStatus.type === 'error'
                                  ? 'border-red-500/30 bg-red-500/10 text-red-200'
                                  : 'border-[#334155] bg-[#0f172a] text-slate-300'
                            }`}
                          >
                            {tripStatus.message}
                          </div>
                        ) : outgoingStatus === 'pending' ? (
                          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                            You already sent a join request for this trip.
                          </div>
                        ) : outgoingStatus === 'accepted' ? (
                          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
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

      {showMap ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-6xl overflow-hidden rounded-3xl border border-[#334155] bg-[#1e293b] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#334155] px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Live World Map</h2>
                <p className="text-sm text-slate-400">Track your current location in real time.</p>
              </div>
              <div className="flex items-center gap-3">
                {liveGpsActive ? (
                  <button
                    onClick={stopLiveTracking}
                    className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                  >
                    Stop Tracking
                  </button>
                ) : (
                  <button
                    onClick={startLiveTracking}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                  >
                    Start Live Tracking
                  </button>
                )}
                <button
                  onClick={() => {
                    stopLiveTracking();
                    setShowMap(false);
                  }}
                  className="rounded-xl border border-[#334155] bg-[#0f172a] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>

            {geoError ? (
              <div className="border-b border-[#334155] bg-red-500/10 px-6 py-3 text-sm text-red-300">
                {geoError}
              </div>
            ) : null}

            <div className="border-b border-[#334155] px-6 py-4 text-sm text-slate-300 bg-[#111827]/80">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Your Coordinates</p>
                  <p className="mt-2 text-sm text-white">
                    {userMarker ? `${userMarker.lat.toFixed(5)}, ${userMarker.lon.toFixed(5)}` : 'Waiting for location...'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Nearest Trip</p>
                  <p className="mt-2 text-sm text-white">
                    {nearestTrip ? `${nearestTrip.label} (${nearestTrip.distanceKm} km)` : 'No trips available'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Destination coordinates</p>
                  <p className="mt-2 text-sm text-white">
                    {nearestTrip ? `${nearestTrip.lat.toFixed(5)}, ${nearestTrip.lon.toFixed(5)}` : 'Select a trip marker'}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[70vh] w-full">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                scrollWheelZoom
                className="h-full w-full"
                >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <MapRecenter center={mapCenter} zoom={mapZoom} />
                {userMarker && nearestTrip ? (
                  <Polyline
                    pathOptions={{ color: '#60a5fa', weight: 3, opacity: 0.75 }}
                    positions={[[userMarker.lat, userMarker.lon], [nearestTrip.lat, nearestTrip.lon]]}
                  />
                ) : null}
                {combinedMarkers.map((marker, index) => (
                  <Marker
                    key={`${marker.lat}-${marker.lon}-${index}`}
                    position={[Number(marker.lat), Number(marker.lon)]}
                    icon={defaultIcon}
                  >
                    <Popup>
                      {marker.kind === 'trip' ? (
                        <div className="min-w-[180px] text-slate-900">
                          <div className="font-bold">{marker.trip.destination}</div>
                          <div className="mt-1 text-sm">{marker.trip.title}</div>
                          <div className="mt-1 text-sm">By {marker.trip.organizer.name}</div>
                          <div className="mt-1 text-sm">${marker.trip.price}</div>
                          <div className="mt-2 text-xs uppercase tracking-[0.15em] text-slate-500">Coordinates</div>
                          <div className="text-sm">{marker.lat.toFixed(5)}, {marker.lon.toFixed(5)}</div>
                          {marker.distanceKm != null ? (
                            <div className="mt-2 text-sm font-semibold text-slate-700">{marker.distanceKm} km away</div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="min-w-[160px] text-slate-900">
                          <div className="font-bold">{marker.label}</div>
                          <div className="mt-2 text-xs uppercase tracking-[0.15em] text-slate-500">Your location</div>
                          <div className="text-sm">{marker.lat.toFixed(5)}, {marker.lon.toFixed(5)}</div>
                        </div>
                      )}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ExploreDestinations;
