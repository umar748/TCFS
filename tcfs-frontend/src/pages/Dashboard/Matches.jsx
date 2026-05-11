import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCheckCircle,
  FaFire,
  FaHeart,
  FaMapMarkerAlt,
  FaSlidersH,
  FaStar,
} from 'react-icons/fa';
import { getToken, getUser } from '../../services/auth';

const filters = ['All Matches', 'High Score (90%+)', 'Recent', 'Verified Only'];
const sortOptions = ['Match Score', 'Most Recent', 'Most Trips'];
const avatarTones = [
  'from-violet-500 to-indigo-500',
  'from-blue-500 to-indigo-500',
  'from-cyan-500 to-blue-500',
  'from-rose-500 to-orange-400',
  'from-emerald-500 to-teal-500',
  'from-fuchsia-500 to-pink-500',
];

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function formatRelativeTime(value) {
  if (!value) return 'Recently';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return 'Recently';
  const diffMs = Date.now() - then;
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function deriveActiveLabel(createdAt) {
  const then = new Date(createdAt).getTime();
  if (Number.isNaN(then)) return null;
  const diffHours = (Date.now() - then) / 3600000;
  if (diffHours < 1) return 'Active now';
  if (diffHours < 12) return 'Online today';
  return null;
}

function inferLanguages(location = '') {
  const lower = location.toLowerCase();
  if (lower.includes('france')) return ['French', 'English'];
  if (lower.includes('spain')) return ['Spanish', 'English'];
  if (lower.includes('singapore')) return ['English', 'Mandarin'];
  if (lower.includes('pakistan')) return ['Urdu', 'English'];
  if (lower.includes('china')) return ['Mandarin', 'English'];
  if (lower.includes('usa') || lower.includes('united states')) return ['English'];
  return ['English'];
}

function buildHeaderTags(interests = [], travelStyle = '') {
  if (interests.length && travelStyle) return ['Interests', 'Budget', 'Style'];
  if (travelStyle) return ['Budget', 'Style'];
  if (interests.length) return ['Interests', 'Style'];
  return ['Budget', 'Style'];
}

function computeMatchScore(currentUser, candidate) {
  let score = 58;
  const currentInterests = new Set(
    Array.isArray(currentUser?.interests)
      ? currentUser.interests.map((item) => String(item).toLowerCase())
      : []
  );
  const candidateInterests = Array.isArray(candidate?.interests) ? candidate.interests : [];
  const overlap = candidateInterests.filter((item) => currentInterests.has(String(item).toLowerCase()));

  score += overlap.length * 10;
  score += Math.round((candidate.profileCompletion || 0) / 8);

  if (candidate.verificationStatus === 'Verified') score += 8;
  if (candidate.travelStyle && currentUser?.travelStyle && candidate.travelStyle === currentUser.travelStyle) score += 8;
  if (candidate.location && currentUser?.location && candidate.location === currentUser.location) score += 4;
  if (candidate.bio) score += 4;
  if (candidate.profilePicture) score += 2;

  return {
    score: clamp(score, 72, 98),
    overlapCount: overlap.length,
  };
}

function hasInterestOverlap(currentUser, candidate) {
  const currentInterests = Array.isArray(currentUser?.interests)
    ? currentUser.interests
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean)
    : [];

  const candidateInterests = Array.isArray(candidate?.interests)
    ? candidate.interests
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean)
    : [];

  if (!currentInterests.length) return true;
  if (!candidateInterests.length) return false;

  const currentSet = new Set(currentInterests);
  return candidateInterests.some((interest) => currentSet.has(interest));
}

function mapUserToMatch(user, index, currentUser, tripCountMap) {
  const { score, overlapCount } = computeMatchScore(currentUser, user);
  const verification = user.verificationStatus === 'Verified';
  const interests = Array.isArray(user.interests) && user.interests.length
    ? user.interests.slice(0, 4)
    : ['Travel', 'Explore'];
  const location = user.location || 'Location not added';
  const profileCompletion = user.profileCompletion || 0;
  const headerTags = buildHeaderTags(interests, user.travelStyle);
  const statusBadges = [];
  const tripCount = tripCountMap.get(String(user._id || user.id)) || 0;
  const countryEstimate = clamp(Math.max(1, tripCount + Math.ceil(interests.length / 2)), 1, 25);
  const rating = (4.3 + score / 100).toFixed(1);
  const responseRate = `${clamp(profileCompletion || 78, 78, 99)}%`;

  if (verification) statusBadges.push('Verified');
  if (profileCompletion >= 80) statusBadges.push('Super Host');

  return {
    id: user._id || user.id || `user-${index}`,
    name: user.name || 'Anonymous',
    age: user.age || '--',
    match: score,
    active: deriveActiveLabel(user.createdAt),
    location,
    description: user.bio || `${user.name || 'This traveler'} is building a detailed profile and looking for a compatible companion.`,
    statusBadges,
    headerTags,
    stats: [
      { label: 'Trips', value: String(tripCount) },
      { label: 'Countries', value: String(countryEstimate) },
      { label: 'Rating', value: String(rating) },
      { label: 'Response', value: responseRate },
    ],
    interests,
    languages: inferLanguages(location),
    mutual: overlapCount,
    responseTime: formatRelativeTime(user.createdAt),
    avatarTone: avatarTones[index % avatarTones.length],
    profilePicture: user.profilePicture || '',
    createdAt: user.createdAt || '',
  };
}

export default function Matches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [requestingId, setRequestingId] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Matches');
  const [sortBy, setSortBy] = useState('Match Score');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const currentUser = getUser();

  useEffect(() => {
    let cancelled = false;

    const loadMatches = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        console.log('🔍 Loading matches with token:', token ? '✓ Present' : '✗ Missing');

        const [usersRes, tripsRes] = await Promise.all([
          fetch('/api/users/search', { headers }),
          fetch('/api/trips/discover', { headers }),
        ]);

        console.log('📊 API Responses:', {
          users: { status: usersRes.status, ok: usersRes.ok },
          trips: { status: tripsRes.status, ok: tripsRes.ok }
        });

        const usersData = await usersRes.json().catch(() => null);
        const tripsData = await tripsRes.json().catch(() => null);

        console.log('📦 Parsed data:', {
          usersCount: usersData?.users?.length || 0,
          tripsCount: tripsData?.items?.length || 0
        });

        if (!usersRes.ok || !usersData?.success) {
          throw new Error(usersData?.message || `Failed to load users (${usersRes.status})`);
        }

        const tripCountMap = new Map();
        (tripsData?.items || []).forEach((trip) => {
          const creatorId = trip?.creator_id?._id || trip?.creator_id?.id || trip?.creator_id;
          if (!creatorId) return;
          tripCountMap.set(String(creatorId), (tripCountMap.get(String(creatorId)) || 0) + 1);
        });

        const currentUserId = String(currentUser?.id || currentUser?._id || '');
        const databaseMatches = (usersData.users || [])
          .filter((user) => String(user._id || user.id || '') !== currentUserId)
          .filter((user) => hasInterestOverlap(currentUser, user))
          .map((user, index) => mapUserToMatch(user, index, currentUser, tripCountMap))
          .sort((a, b) => b.match - a.match);

        if (!cancelled) {
          setMatches(databaseMatches);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('❌ Matches Load Error:', {
            message: error.message,
            stack: error.stack,
            usersRes: usersRes ? { status: usersRes.status, ok: usersRes.ok } : 'undefined'
          });
          setMatches([]);
          setLoadError(error.message || 'Failed to load database matches');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMatches();
    return () => {
      cancelled = true;
    };
  }, []);

  let visibleMatches = matches.filter((match) => {
    if (favoritesOnly && match.match < 90) return false;
    if (activeFilter === 'High Score (90%+)' && match.match < 90) return false;
    if (activeFilter === 'Verified Only' && !match.statusBadges.includes('Verified')) return false;
    if (activeFilter === 'Recent') {
      const createdAt = new Date(match.createdAt || '').getTime();
      if (Number.isNaN(createdAt)) return false;
      if ((Date.now() - createdAt) / 86400000 > 14) return false;
    }
    return true;
  });

  visibleMatches = [...visibleMatches].sort((a, b) => {
    if (sortBy === 'Most Trips') return Number(b.stats[0].value) - Number(a.stats[0].value);
    if (sortBy === 'Most Recent') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    return b.match - a.match;
  });

  const handleConnectRequest = async (match) => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setRequestingId(String(match.id));
    setRequestMessage('');
    try {
      const response = await fetch('/api/notifications/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          toUserId: match.id,
          note: `I'd like to connect with you from the Matches page.`
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send request');
      }
      setRequestMessage(`Request sent to ${match.name}.`);
    } catch (error) {
      setRequestMessage(error.message || 'Failed to send request');
    } finally {
      setRequestingId('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172c] px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-800/70 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:bg-slate-800"
            >
              <FaArrowLeft className="text-slate-300" />
              Back
            </button>

            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                <span className="text-blue-500">Your </span>
                <span className="text-emerald-400">Matches</span>
              </h1>
              <div className="flex flex-col gap-3 text-slate-300 sm:flex-row sm:items-center">
                <p className="text-base sm:text-xl">
                  Connected travelers with similar interests and travel styles
                </p>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                  <FaFire className="text-orange-400" />
                  {loading ? 'Loading matches...' : `${visibleMatches.length} matches available`}
                </span>
              </div>
              {loadError ? (
                <p className="text-sm text-amber-300">
                  Unable to load database matches: {loadError}
                </p>
              ) : null}
              {requestMessage ? (
                <p className="text-sm text-emerald-300">{requestMessage}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <button
              type="button"
              onClick={() => setFavoritesOnly((value) => !value)}
              className={`inline-flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                favoritesOnly
                  ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                  : 'border-white/10 bg-slate-800/70 text-slate-200 hover:border-white/20'
              }`}
            >
              <FaStar className={favoritesOnly ? 'text-amber-300' : 'text-slate-300'} />
              Favorites
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-800/70 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20"
            >
              <FaSlidersH className="text-slate-300" />
              Filters
            </button>
          </div>
        </div>

        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                  activeFilter === filter
                    ? 'border-cyan-300/40 bg-gradient-to-r from-blue-500 to-emerald-400 text-white shadow-lg shadow-cyan-500/10'
                    : 'border-white/10 bg-slate-800/70 text-slate-200 hover:border-white/20'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-3 self-start rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 text-sm text-slate-300 lg:self-auto">
            <span className="font-semibold text-white">Sort by:</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="bg-transparent font-semibold text-white outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option} value={option} className="bg-slate-900 text-white">
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <div className="rounded-[1.75rem] border border-white/10 bg-[#202b42] px-6 py-16 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-500 border-t-cyan-300" />
            <p className="text-slate-300">Loading matches from the database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleMatches.map((match) => (
              <article
                key={match.id}
                className="overflow-hidden rounded-[1.5rem] border border-white/5 bg-[#20283d] shadow-[0_14px_32px_rgba(5,10,22,0.24)]"
              >
                <div className="relative overflow-hidden bg-gradient-to-r from-[#2f6fe8] via-[#2798d6] to-[#19c28b] px-4 pb-4 pt-4">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute -left-12 top-0 h-28 w-28 rounded-full bg-white blur-3xl" />
                    <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-200 blur-3xl" />
                  </div>

                  <div className="relative flex items-center justify-between gap-4">
                    {match.active ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/18 px-3 py-1 text-[11px] font-bold text-emerald-100 ring-1 ring-emerald-100/15">
                        <span className="h-2 w-2 rounded-full bg-emerald-300" />
                        {match.active}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3.5 px-5 py-5">
                  <div className="flex items-start gap-3">
                    <div className="relative h-[3.35rem] w-[3.35rem] min-h-[3.35rem] min-w-[3.35rem]">
                      {match.profilePicture ? (
                        <img
                          src={match.profilePicture}
                          alt={match.name}
                          className="h-[3.35rem] w-[3.35rem] rounded-full object-cover shadow-lg ring-4 ring-[#141d31]"
                        />
                      ) : (
                        <div
                          className={`flex h-[3.35rem] w-[3.35rem] items-center justify-center rounded-full bg-gradient-to-br ${match.avatarTone} text-[1.45rem] font-black text-white shadow-lg ring-4 ring-[#141d31]`}
                        >
                          {match.name[0]}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 flex h-[1.1rem] w-[1.1rem] items-center justify-center rounded-full bg-emerald-400 ring-4 ring-[#20283d]">
                        <FaCheckCircle className="text-[9px] text-slate-900" />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-[1.15rem] font-extrabold tracking-tight text-white">
                        {match.name} <span className="text-[1rem] font-medium text-slate-400">{match.age}</span>
                      </h2>
                      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-400">
                        <FaMapMarkerAlt className="text-xs" />
                        {match.location}
                      </p>

                      <p className="mt-1.5 text-[12px] text-slate-400">Last active: {match.responseTime}</p>
                    </div>
                  </div>

                  <div>
                    <p className="line-clamp-2 text-[13px] leading-6 text-slate-300">{match.description}</p>
                    <button type="button" className="mt-2.5 text-[13px] font-bold text-blue-400 transition hover:text-blue-300">
                      Read more
                    </button>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Interests</span>
                      <span className="text-[13px] font-bold text-emerald-400">{match.mutual} mutual</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {match.interests.slice(0, 3).map((interest, index) => (
                        <span
                          key={`${match.id}-${interest}`}
                          className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                            index < 2
                              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                              : 'border-blue-400/30 bg-blue-500/10 text-blue-300'
                          }`}
                        >
                          {interest} {index < 2 ? '+' : ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Languages</div>
                    <div className="flex flex-wrap gap-2">
                      {match.languages.slice(0, 2).map((language) => (
                        <span
                          key={`${match.id}-${language}`}
                          className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-[12px] font-medium text-violet-200"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      className="flex h-[2.6rem] w-[2.8rem] items-center justify-center rounded-xl border-2 border-red-400 bg-transparent text-red-400 transition hover:bg-red-500/10"
                    >
                      <FaTimes />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConnectRequest(match)}
                      disabled={requestingId === String(match.id)}
                      className="flex-1 rounded-xl bg-gradient-to-r from-[#2f6fe8] to-[#19c28b] px-4 py-2.5 text-[14px] font-bold text-white shadow-lg shadow-cyan-500/10 transition hover:brightness-110"
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <FaHeart />
                        {requestingId === String(match.id) ? 'Sending...' : 'Connect Now'}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="flex h-[2.6rem] w-[2.8rem] items-center justify-center rounded-xl border-2 border-white/10 bg-[#121a2f] text-slate-300 transition hover:border-amber-300/40 hover:text-amber-300"
                    >
                      <FaStar />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <section className="mt-12 rounded-[2rem] border border-white/10 bg-[#202b42] px-6 py-12 text-center shadow-[0_20px_50px_rgba(5,10,22,0.25)] sm:px-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-3xl text-slate-900 shadow-lg">
            <FaStar />
          </div>
          <h3 className="text-3xl font-extrabold text-white">Smart Matching Algorithm</h3>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-9 text-slate-300">
            Our matching system now combines real traveler profiles from your database with compatibility scoring
            based on interests, profile strength, verification, and travel style.
          </p>
        </section>
      </div>
    </div>
  );
}
