import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, removeToken, getToken } from '../../services/auth';
import { FaBell, FaComments, FaPlane, FaPlus, FaIdCard, FaCog, FaHandshake, FaQuestionCircle, FaSignOutAlt, FaGlobe, FaTimes } from 'react-icons/fa';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const formatDate = (d) => new Date(d).toLocaleDateString();

export default function User() {
  const navigate = useNavigate();
  const user = getUser();
  const [query, setQuery] = useState('');
  const [type, setType] = useState({ guided: true, co: true });
  const [month, setMonth] = useState('All');
  const [continent, setContinent] = useState('All');
  const [duration, setDuration] = useState(0); // 0 means no limit
  const [budget, setBudget] = useState(1500);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [items, setItems] = useState([]);
  const [searchToken, setSearchToken] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('Trips'); // 'Trips' | 'Users'
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const menuRef = useRef(null);

  // Map States
  const [mapQuery, setMapQuery] = useState('london');
  const [place, setPlace] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [markers, setMarkers] = useState([]);
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [liveGpsId, setLiveGpsId] = useState(null);
  const [liveGpsActive, setLiveGpsActive] = useState(false);
  const [favorites, setFavorites] = useState([]);

  const defaultIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setMarkers((prev) => [...prev, { lat, lon: lng, label: 'Dropped' }]);
      },
    });
    return null;
  };

  const MapRecenter = ({ center, zoom }) => {
    const map = useMapEvents({});
    useEffect(() => {
      if (Array.isArray(center) && center.length === 2 && Number.isFinite(center[0]) && Number.isFinite(center[1])) {
        map.setView(center, zoom || map.getZoom());
      }
    }, [center, zoom, map]);
    return null;
  };

  const handleMapSearch = (e) => {
    if (e) e.preventDefault();
    const q = (mapQuery || '').trim();
    if (!q) return;
    setGeoLoading(true);
    setGeoError('');
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`, {
      headers: { 'Accept': 'application/json' }
    })
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) {
          setGeoError('No results found.');
          return;
        }
        const d = data[0];
        const lat = d.lat;
        const lon = d.lon;
        setPlace({ name: d.display_name, lat, lon });
        setMarkers([{ lat, lon, label: d.display_name }]);
        setMapCenter([Number(lat), Number(lon)]);
        setMapZoom(13);
      })
      .catch(() => setGeoError('Lookup failed.'))
      .finally(() => setGeoLoading(false));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setPlace({ name: 'Current Location', lat, lon });
        setMarkers((prev) => [...prev, { lat, lon, label: 'You are here' }]);
        setMapCenter([lat, lon]);
        setMapZoom(13);
      },
      () => setGeoError('Permission denied.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startLiveGps = () => {
    if (!navigator.geolocation || liveGpsActive) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setMarkers((prev) => {
          const others = prev.filter((m) => m.label !== 'You are here');
          return [...others, { lat, lon, label: 'You are here' }];
        });
        setMapCenter([lat, lon]);
      },
      () => setGeoError('Live GPS failed.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
    setLiveGpsId(id);
    setLiveGpsActive(true);
  };

  const stopLiveGps = () => {
    if (liveGpsId != null) navigator.geolocation.clearWatch(liveGpsId);
    setLiveGpsId(null);
    setLiveGpsActive(false);
  };

  const handleAddFavorite = () => {
    if (!place) return;
    const item = { name: place.name, lat: Number(place.lat), lon: Number(place.lon) };
    if (favorites.some(f => f.name === item.name)) return;
    const next = [...favorites, item];
    setFavorites(next);
    localStorage.setItem('favorites', JSON.stringify(next));
  };

  const handleSelectSuggestion = (item) => {
    setPlace({ name: item.name, lat: item.lat, lon: item.lon });
    setMarkers([{ lat: Number(item.lat), lon: Number(item.lon), label: item.name }]);
    setMapCenter([Number(item.lat), Number(item.lon)]);
    setMapZoom(13);
    setSuggestOpen(false);
  };

  useEffect(() => {
    const q = (mapQuery || '').trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }
    setSuggestLoading(true);
    const t = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`)
        .then(r => r.json())
        .then(data => {
          setSuggestions(data.map(d => ({ name: d.display_name, lat: d.lat, lon: d.lon })));
          setSuggestOpen(data.length > 0);
        })
        .finally(() => setSuggestLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [mapQuery]);

  useEffect(() => {
    try {
      const f = JSON.parse(localStorage.getItem('favorites') || '[]');
      if (Array.isArray(f)) setFavorites(f);
    } catch { }
  }, []);

  useEffect(() => {
    return () => {
      if (liveGpsId != null) navigator.geolocation.clearWatch(liveGpsId);
    };
  }, [liveGpsId]);

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (query && query.trim().length > 0) params.set('q', query.trim());
        if (month !== 'All') params.set('startMonth', month);
        if (duration && duration > 0) params.set('maxDays', String(duration));
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`/api/trips/discover?${params.toString()}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          setError(data?.message || `Failed (${res.status})`);
          setItems([]);
          return;
        }
        // backend now returns start_date/end_date fields; map them to frontend naming if needed
        setItems(data.items || []);
      } catch (e) {
        if (e.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(e?.message || 'Network error');
        }
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (query && query.trim().length > 0) params.set('q', query.trim());
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`/api/users/search?${params.toString()}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          setError(data?.message || `Failed (${res.status})`);
          setItems([]);
          return;
        }
        // Normalize to items
        setItems((data.users || []).map(u => ({
          id: u._id || u.id,
          name: u.name || 'Anonymous',
          location: u.location || 'Unknown',
          gender: u.gender || 'Not specified',
          profileCompletion: u.profileCompletion || 0,
          verificationStatus: u.verificationStatus || 'unverified',
          travelPlans: u.travelPlans || []
        })));
      } catch (e) {
        if (e.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(e?.message || 'Network error');
        }
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    if (mode === 'Trips') fetchTrips();
    else fetchUsers();
  }, [searchToken, mode]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const shown = items.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold">
              <span className="text-blue-500">Explore </span>
              <span className="text-green-400">Destinations</span>
            </h1>
            <p className="text-gray-400 text-lg mt-2">Discover your next big adventure</p>
          </div>
          <div className="flex items-center gap-3 relative" ref={menuRef}>
            <button onClick={() => setShowMap(true)} className="text-white bg-blue-600 hover:bg-blue-700 font-bold rounded-lg text-sm px-4 py-2.5 transition-all duration-300 flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/50"><FaGlobe /> World Map</button>
            <button onClick={() => navigate('/dashboard/trips/create')} className="text-white bg-green-600 hover:bg-green-700 font-bold rounded-lg text-sm px-4 py-2.5 transition-all duration-300 flex items-center gap-2 hover:shadow-lg hover:shadow-green-500/50"><FaPlus /> Create Trip</button>
            <button className="relative" onClick={() => setMenuOpen(v => !v)}>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 text-white flex items-center justify-center text-xs font-semibold hover:scale-110 transition-transform duration-300">
                {(user?.name || 'U').split(' ').map(n => n[0]).join('')}
              </div>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-80 bg-gray-950 rounded-xl border border-gray-800 shadow-2xl z-50">
                <div className="p-4 flex items-center justify-between border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold">
                      {(user?.name || 'U').split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{user?.name || 'User'}</div>
                      <button className="text-xs text-blue-400 font-medium hover:text-blue-300 transition-all" onClick={() => { setMenuOpen(false); navigate('/dashboard/edit-profile'); }}>Edit Profile</button>
                    </div>
                  </div>
                  <button className="relative text-gray-400 hover:text-white transition-all">
                    <FaBell />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500"></span>
                  </button>
                </div>
                <div className="border-t border-gray-800 space-y-1">
                  <button className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-900 text-gray-300 hover:text-white transition-all" onClick={() => { setMenuOpen(false); navigate('/dashboard/messages'); }}>
                    <FaComments className="text-blue-400" /> Chat
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-900 text-gray-300 hover:text-white transition-all" onClick={() => { setMenuOpen(false); navigate('/dashboard/trips'); }}>
                    <FaPlane className="text-green-400" /> My Trips
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-900 text-gray-300 hover:text-white transition-all" onClick={() => { setMenuOpen(false); navigate('/dashboard/trips/create'); }}>
                    <FaPlus className="text-blue-400" /> Create a Trip
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-900 text-gray-300 hover:text-white transition-all" onClick={() => { setMenuOpen(false); navigate('/dashboard/edit-profile'); }}>
                    <FaIdCard className="text-purple-400" /> Personal Info
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-900 text-gray-300 hover:text-white transition-all" onClick={() => { setMenuOpen(false); navigate('/dashboard/notifications'); }}>
                    <FaCog className="text-yellow-400" /> Notifications
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-900 text-gray-300 hover:text-white transition-all" onClick={() => { setMenuOpen(false); navigate('/dashboard/settings'); }}>
                    <FaCog className="text-orange-400" /> Settings
                  </button>
                </div>
                <div className="border-t border-gray-800">
                  <button className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-900 text-red-400 hover:text-red-300 transition-all" onClick={() => { setMenuOpen(false); removeToken(); navigate('/login'); }}>
                    <FaSignOutAlt /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-3 bg-gray-950 rounded-xl shadow-2xl p-6 border border-gray-800 h-fit sticky top-6">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-200 block mb-2">Search Type</label>
                <select value={mode} onChange={e => setMode(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all hover:border-gray-600">
                  <option>Trips</option>
                  <option>Users</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-200 block mb-2">Destination</label>
                <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all hover:border-gray-600 placeholder-gray-500" placeholder="Search destination..." />
              </div>

              {mode === 'Trips' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" checked={type.guided} onChange={e => { setType({ ...type, guided: e.target.checked }); setPage(1); }} />
                    Guided Trips
                  </label>
                  <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" checked={type.co} onChange={e => { setType({ ...type, co: e.target.checked }); setPage(1); }} />
                    Co-Travel
                  </label>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-200 block mb-2">Departure Month</label>
                  <select value={month} onChange={e => { setMonth(e.target.value); setPage(1); }} className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all hover:border-gray-600">
                    {['All','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <option key={m} value={m}>{m === 'All' ? 'All months' : m + ' 2026'}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-200 block mb-3">
                    Duration{duration>0? `: ${duration} days` : ': any'}
                  </label>
                  <input type="range" min={0} max={14} value={duration} onChange={e => { setDuration(Number(e.target.value)); setPage(1); }} className="w-full accent-blue-500" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-200 block mb-3">Budget: ${budget}</label>
                  <input type="range" min={300} max={1600} step={50} value={budget} onChange={e => { setBudget(Number(e.target.value)); setPage(1); }} className="w-full accent-green-500" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-200 block mb-2">Continent</label>
                  <select value={continent} onChange={e => { setContinent(e.target.value); setPage(1); }} className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 transition-all hover:border-gray-600">
                    {['All','Asia','Europe','Africa','North America','South America','Oceania'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="pt-3">
                  <button onClick={() => { setPage(1); setSearchToken(t => t + 1); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 font-bold transition-all">Search</button>
                </div>
              </>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-400">
                <span className="font-semibold text-white">{totalItems}</span> {mode.toLowerCase()}
              </div>
              <select className="bg-gray-900 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all hover:border-gray-600">
                <option>Recommended</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Rating</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading && (
                <div className="col-span-full text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading {mode.toLowerCase()}...</p>
                </div>
              )}
              {error && (
                <div className="col-span-full text-center bg-red-500/10 border border-red-500/50 text-red-500 py-6 rounded-lg font-medium">{error}</div>
              )}
              {!loading && !error && shown.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400">No {mode.toLowerCase()} found</div>
              )}
              {!loading && !error && mode === 'Trips' && shown.map(t => (
                <div key={t.id} className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden shadow-2xl hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-500/50 transition-all duration-300 group">
                  <div className="bg-gradient-to-r from-blue-600 to-green-600 p-4 text-white">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold">{t.destination}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/20">{t.status}</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-gray-300 line-clamp-2">{t.title}</p>
                    <div>
                      <p className="text-xs text-gray-500">{t.durationDays} days • {formatDate(t.start_date)} - {formatDate(t.end_date)}</p>
                      <p className="text-xs text-gray-400 mt-1">By {t.creator_id?.name || 'companion'}</p>
                    </div>
                    <button onClick={async () => {
                      try {
                        const token = getToken();
                        const note = window.prompt('Add a note (optional)');
                        const res = await fetch('/api/notifications/request', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                          body: JSON.stringify({ toUserId: t.creator_id?._id, tripId: t.id, note })
                        });
                        const data = await res.json().catch(() => null);
                        if (!res.ok || !data?.success) {
                          alert(data?.message || `Failed (${res.status})`);
                          return;
                        }
                        alert('Request sent!');
                      } catch (e) {
                        alert(e?.message || 'Network error');
                      }
                    }} className="w-full text-white bg-blue-600 hover:bg-blue-700 font-bold rounded-lg text-sm px-3 py-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50">Request to Join</button>
                  </div>
                </div>
              ))}
              {!loading && !error && mode === 'Users' && shown.map(u => (
                <div key={u.id} className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden shadow-2xl hover:shadow-lg hover:shadow-green-500/20 hover:border-green-500/50 transition-all duration-300 group">
                  <div className="bg-gradient-to-r from-blue-600 to-green-600 p-4 text-white">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold">{u.name}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/20 capitalize">{u.verificationStatus}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-400 mb-3">{u.gender} • {u.location || 'Unknown location'}</p>
                    {u.travelPlans && u.travelPlans.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Upcoming plans:</p>
                        <div className="space-y-1">
                          {u.travelPlans.slice(0,2).map((p, idx) => (
                            <p key={idx} className="text-xs text-gray-400">{p.destination} • {p.startDate ? formatDate(p.startDate) : ''}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        try {
                          const token = getToken();
                          const note = window.prompt('Add a note (optional)');
                          const res = await fetch('/api/notifications/request', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
                            body: JSON.stringify({ toUserId: u.id, note })
                          });
                          const data = await res.json().catch(() => null);
                          if (!res.ok || !data?.success) {
                            alert(data?.message || `Failed (${res.status})`);
                            return;
                          }
                          alert('Request sent!');
                        } catch (e) {
                          alert(e?.message || 'Network error');
                        }
                      }} className="flex-1 text-white bg-blue-600 hover:bg-blue-700 font-bold rounded-lg text-sm px-3 py-2 transition-all duration-300">Send Request</button>
                      <button onClick={() => navigate('/dashboard/messages')} className="flex-1 text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 font-bold rounded-lg text-sm px-3 py-2 transition-all duration-300">Message</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && totalItems > 0 && !loading && !error && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>← Prev</button>
                <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
                <button className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next →</button>
              </div>
            )}
          </main>
        </div>
      </div>

      {showMap && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-950 rounded-xl shadow-2xl border border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Explore the World</h2>
              <button onClick={() => setShowMap(false)} className="text-gray-400 hover:text-white transition-all">
                <FaTimes size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 relative">
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-[1000] width-[min(720px, 90%)]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mapQuery}
                    onChange={(e) => setMapQuery(e.target.value)}
                    placeholder="Search worldwide places..."
                    className="flex-1 bg-gray-900 border border-gray-700 text-gray-200 rounded-lg p-3 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                  />
                  <button
                    onClick={handleMapSearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 shadow-lg font-bold transition-all"
                  >
                    Search
                  </button>
                </div>
              </div>

              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '500px', width: '100%', borderRadius: '12px' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                <MapRecenter center={mapCenter} zoom={mapZoom} />
                {markers.map((m, idx) => (
                  <Marker key={idx} position={[Number(m.lat), Number(m.lon)]} icon={defaultIcon}>
                    <Popup>{m.label || 'Marker'}</Popup>
                  </Marker>
                ))}
                <MapClickHandler />
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
