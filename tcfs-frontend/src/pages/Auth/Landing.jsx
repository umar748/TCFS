import { useEffect, useState } from 'react';
import {
  FaCalendarAlt,
  FaGlobe,
  FaHeadset,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPlaneDeparture,
  FaSearch,
  FaStar,
  FaUserFriends,
  FaUsers
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const featureSections = [
  {
    title: 'Real and Verified Travelers Only!',
    description:
      'Join MyTrip connects passionate travelers from all around. Explore, learn, and create memories in a safe and welcoming community. Simple, secure, and fun.',
    image:
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80',
    reverse: false
  },
  {
    title: 'Travel with the Perfect Clique',
    description:
      'Explore destinations with like-minded companions. Find your ideal group based on interests and travel style, and plan unforgettable trips together.',
    image:
      'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80',
    reverse: true
  }
];

const reasons = [
  {
    title: 'Memorably Unique',
    description: "Trip plans you'll never forget, made by travelers who love exploring.",
    icon: FaStar,
    iconClass: 'text-amber-300'
  },
  {
    title: 'Incredibly Authentic',
    description: 'Experience places the real way with fellow adventurers and local insights.',
    icon: FaGlobe,
    iconClass: 'text-emerald-300'
  },
  {
    title: '24/7 Support',
    description: 'Help whenever you need it, so you can focus on the journey.',
    icon: FaHeadset,
    iconClass: 'text-sky-300'
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [travellers, setTravellers] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const formatDate = (value) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 'Date TBD';
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const loadTravellers = async () => {
      try {
        const [usersResponse, tripsResponse] = await Promise.all([
          fetch('/api/users/search'),
          fetch('/api/trips/discover')
        ]);

        const usersData = await usersResponse.json().catch(() => ({}));
        const tripsData = await tripsResponse.json().catch(() => ({}));
        if (!usersResponse.ok || !usersData?.success) return;

        const tripsByCreator = new Map();
        (tripsData.items || []).forEach((trip) => {
          const creatorId = String(trip.creator_id?._id || trip.creator_id?.id || trip.creator_id || '');
          if (!creatorId) return;
          if (!tripsByCreator.has(creatorId)) tripsByCreator.set(creatorId, []);
          tripsByCreator.get(creatorId).push(trip);
        });

        const mapped = (usersData.users || []).slice(0, 4).map((user, index) => {
          const userId = String(user._id || user.id || '');
          const userTrips = tripsByCreator.get(userId) || [];
          const featuredTrip = userTrips[0];
          const profileImage = user.profilePicture || user.profileImage || '';
          const tripCount = userTrips.length;
          const rating = (4.2 + Math.min(tripCount, 8) * 0.08).toFixed(2);

          return {
            id: userId || `traveller-${index}`,
            name: user.name || 'Traveler',
            location: user.location || 'Location not added',
            description: user.bio || `${user.name || 'Traveler'} is looking for compatible travel companions.`,
            image: profileImage,
            rating,
            trips: String(tripCount || 0),
            badge: user.travelStyle || 'Travel',
            tripTitle: featuredTrip?.title || `${featuredTrip?.destination || 'Open'} Trip`,
            tripDate: featuredTrip ? formatDate(featuredTrip.start_date) : 'Date TBD',
            country: featuredTrip?.destination || 'Destination TBD',
            spots: `${featuredTrip?.participants?.length || 1} spots`
          };
        });

        if (!cancelled) {
          setTravellers(mapped);
        }
      } catch (error) {
        if (!cancelled) {
          setTravellers([]);
        }
      }
    };

    loadTravellers();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const params = query.trim() ? `?destination=${encodeURIComponent(query.trim())}` : '';
    navigate(`/search${params}`);
  };

  return (
    <div className="min-h-screen bg-[#121b2d] font-['Plus_Jakarta_Sans'] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0f1726]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 font-['Sora'] text-xl font-extrabold tracking-tight text-white transition duration-300 hover:scale-[1.02] hover:text-[#8fc0ff]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-[#4f6cff] to-[#835cff] transition duration-300 hover:rotate-[-8deg]">
              <FaPlaneDeparture className="-rotate-45 text-lg text-white" />
            </div>
            JoinMyTrip
          </Link>
          <nav className="hidden items-center gap-8 text-[14px] font-semibold text-slate-400 md:flex">
            <a href="#features" className="transition duration-300 hover:-translate-y-0.5 hover:text-white">Features</a>
            <a href="#travelers" className="transition duration-300 hover:-translate-y-0.5 hover:text-white">Travelers</a>
            <a href="#about" className="transition duration-300 hover:-translate-y-0.5 hover:text-white">About</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-gradient-to-r from-[#5f6fff] to-[#8c64ff] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(99,102,241,0.35)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(99,102,241,0.45)]"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(rgba(33,42,79,0.74), rgba(22,31,58,0.84)), url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80')"
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(127,153,255,0.24),transparent_35%),linear-gradient(180deg,rgba(15,23,38,0.2),rgba(15,23,38,0.85))]" />
        <div className="pointer-events-none absolute left-[-4rem] top-24 h-44 w-44 rounded-full bg-[#6f7cff]/15 blur-3xl animate-float" />
        <div className="pointer-events-none absolute right-[-3rem] top-16 h-56 w-56 rounded-full bg-[#20d497]/10 blur-3xl animate-float" />

        <div className="relative mx-auto flex min-h-[46rem] max-w-7xl items-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-4xl animate-fade-in">
            <h1 className="animate-slide-up font-['Sora'] text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
              Find Travel <span className="text-[#8fc0ff]">Buddy</span>
            </h1>
            <p className="animate-slide-up delay-100 mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
              Discover a new and authentic way of traveling. Find travel buddies who fit your travel style and discover the world together.
            </p>

            <form
              onSubmit={handleSearch}
              className="animate-slide-up delay-200 mx-auto mt-10 max-w-3xl rounded-[26px] border border-white/10 bg-[#1c2740]/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(0,0,0,0.34)]"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <FaMapMarkerAlt className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Where do you want to go? (e.g. London, Paris, Tokyo)"
                    className="h-14 w-full rounded-2xl border border-white/10 bg-[#11192c] px-11 text-sm text-white outline-none transition duration-300 placeholder:text-slate-500 focus:border-[#687dff] focus:shadow-[0_0_0_4px_rgba(104,125,255,0.12)]"
                  />
                </div>
                <button
                  type="submit"
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5f6fff] to-[#845cff] px-8 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_18px_30px_rgba(95,111,255,0.38)]"
                >
                  <FaSearch size={13} />
                  Search
                </button>
              </div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-4 h-14 w-full rounded-2xl bg-[#19c58b] text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:scale-[1.005] hover:bg-[#20d497] hover:shadow-[0_18px_30px_rgba(25,197,139,0.26)]"
              >
                Go to Dashboard
              </button>
            </form>
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#1a2437]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="space-y-20">
            {featureSections.map((section, index) => (
              <div
                key={section.title}
                className={`animate-slide-up grid items-center gap-10 lg:grid-cols-2 ${index === 0 ? 'delay-100' : 'delay-200'} ${section.reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}
              >
                <div className="max-w-xl">
                  <h2 className="font-['Sora'] text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                    {section.title}
                  </h2>
                  <p className="mt-6 text-lg leading-8 text-slate-300">{section.description}</p>
                </div>
                <div>
                  <img
                    src={section.image}
                    alt={section.title}
                    className="h-[20rem] w-full rounded-[28px] object-cover shadow-[0_24px_60px_rgba(0,0,0,0.28)] transition duration-500 hover:-translate-y-2 hover:scale-[1.015] hover:shadow-[0_28px_75px_rgba(0,0,0,0.34)] sm:h-[24rem]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#11192b]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-center font-['Sora'] text-4xl font-extrabold text-white sm:text-5xl">
            Why JoinMyTrip
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {reasons.map((reason, index) => {
              const Icon = reason.icon;
              return (
                <div
                  key={reason.title}
                  className={`animate-slide-up rounded-[22px] border border-white/10 bg-[#202b41] p-8 text-center shadow-[0_10px_24px_rgba(0,0,0,0.12)] transition duration-300 hover:-translate-y-2 hover:border-white/20 hover:bg-[#24324d] hover:shadow-[0_20px_40px_rgba(0,0,0,0.18)] ${index === 0 ? 'delay-100' : index === 1 ? 'delay-200' : 'delay-300'}`}
                >
                  <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-4xl transition duration-300 group-hover:scale-110 ${reason.iconClass}`}>
                    <Icon />
                  </div>
                  <h3 className="mt-5 text-2xl font-extrabold text-white">{reason.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{reason.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="travelers" className="bg-[#232f45]">
        <div className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-center font-['Sora'] text-[2.6rem] font-extrabold leading-tight text-white sm:text-[3.4rem]">
            Find your next Travel Buddy right here!
          </h2>

          <div className="animate-slide-up delay-100 mt-10 grid gap-4 lg:grid-cols-4">
            <input
              type="text"
              placeholder="Where are you going?"
              className="h-14 rounded-2xl border border-[#425272] bg-[#131c30] px-4 text-base text-white outline-none transition duration-300 placeholder:text-slate-500 focus:border-[#667cff] focus:shadow-[0_0_0_4px_rgba(102,124,255,0.12)]"
            />
            <select className="h-14 rounded-2xl border border-[#425272] bg-[#131c30] px-4 text-base text-white outline-none transition duration-300 focus:border-[#667cff] focus:shadow-[0_0_0_4px_rgba(102,124,255,0.12)]">
              <option>Any destination</option>
              <option>Europe</option>
              <option>Asia</option>
              <option>Middle East</option>
            </select>
            <input
              type="date"
              className="h-14 rounded-2xl border border-[#425272] bg-[#131c30] px-4 text-base text-white outline-none transition duration-300 focus:border-[#667cff] focus:shadow-[0_0_0_4px_rgba(102,124,255,0.12)]"
            />
            <select className="h-14 rounded-2xl border border-[#425272] bg-[#131c30] px-4 text-base text-white outline-none transition duration-300 focus:border-[#667cff] focus:shadow-[0_0_0_4px_rgba(102,124,255,0.12)]">
              <option>Any preferences</option>
              <option>Budget</option>
              <option>Adventure</option>
              <option>City Tour</option>
            </select>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {travellers.map((traveller, index) => (
              <article
                key={traveller.id || traveller.name}
                className={`animate-slide-up group flex min-h-[544px] flex-col overflow-hidden rounded-[26px] border border-[#44536f] bg-[#11192c] shadow-[0_20px_44px_rgba(7,12,24,0.18)] transition duration-300 hover:-translate-y-2 hover:border-[#5473ff] hover:shadow-[0_24px_55px_rgba(7,12,24,0.26)] ${index === 0 ? 'delay-100' : index === 1 ? 'delay-200' : index === 2 ? 'delay-300' : 'delay-400'}`}
              >
                <div className={!traveller.image ? 'h-[222px] bg-gradient-to-br from-[#6875ff] to-[#825bff]' : ''}>
                  {traveller.image ? (
                    <img
                      src={traveller.image}
                      alt={traveller.name}
                      className="h-[222px] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-[222px] items-center justify-center bg-gradient-to-br from-[#6875ff] to-[#825bff] font-['Sora'] text-6xl font-extrabold text-white">
                      {(traveller.name || 'T').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-['Sora'] text-[18px] font-extrabold leading-none text-white">{traveller.name}</h3>
                      <p className="mt-2 flex items-center gap-1 text-[12px] text-slate-400">
                        <FaMapMarkerAlt size={10} className="text-[#ff875f]" />
                        <span className="truncate">{traveller.location}</span>
                      </p>
                    </div>
                    <span className="shrink-0 rounded-[10px] border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-300 transition duration-300 group-hover:border-emerald-300/40 group-hover:bg-emerald-300/10">
                      Verified
                    </span>
                  </div>

                  <p className="mt-4 min-h-[72px] text-[14px] leading-7 text-slate-300">{traveller.description}</p>

                  <div className="mt-4 flex flex-wrap gap-4 text-[13px] text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <FaStar size={11} className="text-amber-300" />
                      {traveller.rating}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FaPlaneDeparture size={11} className="text-sky-300" />
                      Trips {traveller.trips}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FaMoneyBillWave size={11} className="text-emerald-300" />
                      {traveller.badge}
                    </span>
                  </div>

                  <div className="mt-4 rounded-[16px] bg-[#202b40] px-4 py-3 transition duration-300 group-hover:bg-[#24324a]">
                    <p className="min-h-[40px] text-[14px] font-bold leading-5 text-white">{traveller.tripTitle}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <FaCalendarAlt size={11} />
                        {traveller.tripDate}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FaGlobe size={11} />
                        {traveller.country}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FaUsers size={11} />
                        {traveller.spots}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="mt-auto flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#19c58b] text-[15px] font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-[#20d497] hover:shadow-[0_16px_28px_rgba(25,197,139,0.24)]"
                  >
                    <FaUserFriends size={13} />
                    Join the Trip
                  </button>
                </div>
              </article>
            ))}
          </div>
          {travellers.length === 0 ? (
            <div className="mt-10 rounded-[26px] border border-[#44536f] bg-[#11192c] px-6 py-12 text-center text-slate-300">
              No traveler profiles found in the database yet.
            </div>
          ) : null}
        </div>
      </section>

      <section id="about" className="bg-[#1c2446]">
        <div className="mx-auto max-w-[1240px] px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="font-['Sora'] text-[3rem] font-extrabold leading-tight text-white sm:text-[4.55rem]">
            Ready to Start Your Adventure?
          </h2>

          <div className="animate-slide-up delay-200 rounded-[28px] border border-white/10 bg-[#1b2345] px-6 py-14">
            <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
              <Link
                to="/register"
                className="flex h-[60px] min-w-[228px] items-center justify-center rounded-2xl bg-gradient-to-r from-[#426ff6] to-[#7f5cff] px-8 text-[18px] font-bold text-white transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_20px_36px_rgba(79,108,255,0.32)]"
              >
                Get Started Free
              </Link>
              <Link
                to="/blogs"
                className="flex h-[60px] min-w-[190px] items-center justify-center rounded-2xl border border-[#394866] px-8 text-[18px] font-bold text-white transition duration-300 hover:-translate-y-1 hover:border-[#54688f] hover:bg-white/5"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#253148]">
        <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.55fr_0.85fr_0.85fr_0.85fr]">
            <div>
              <Link to="/" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[#4f6cff] to-[#835cff]">
                  <FaPlaneDeparture className="-rotate-45 text-white" />
                </div>
                <span className="font-['Sora'] text-[22px] font-extrabold text-white">JoinMyTrip</span>
              </Link>
              <p className="mt-6 max-w-sm text-[14px] leading-8 text-slate-300">
                Connecting passionate travelers from around the world. Start your journey with us today.
              </p>
            </div>

            <div>
              <h3 className="font-['Sora'] text-[18px] font-bold text-white">Company</h3>
              <div className="mt-6 space-y-4 text-[14px] text-slate-300">
                <div>About Us</div>
                <div>Careers</div>
                <div>Press</div>
                <div>Blog</div>
              </div>
            </div>

            <div>
              <h3 className="font-['Sora'] text-[18px] font-bold text-white">Support</h3>
              <div className="mt-6 space-y-4 text-[14px] text-slate-300">
                <div>Help Center</div>
                <div>Safety</div>
                <div>Contact Us</div>
                <div>FAQ</div>
              </div>
            </div>

            <div>
              <h3 className="font-['Sora'] text-[18px] font-bold text-white">Legal</h3>
              <div className="mt-6 space-y-4 text-[14px] text-slate-300">
                <div>Terms of Service</div>
                <div>Privacy Policy</div>
                <div>Cookie Policy</div>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-8 text-center text-[14px] text-slate-400">
            Copyright 2025 JoinMyTrip. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
