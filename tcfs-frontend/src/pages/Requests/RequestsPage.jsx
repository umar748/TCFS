import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCalendar,
  FaCheck,
  FaHourglassHalf,
  FaMapMarkerAlt,
  FaPlus,
  FaTimes,
  FaTrashAlt
} from 'react-icons/fa';
import { getToken } from '../../services/auth';
import { socket } from '../../socket';

const tabs = [
  { key: 'all', label: 'All Requests' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' }
];

export default function RequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const token = getToken();

  const normalizeTripRequest = (item) => ({
    ...item,
    requestKind: 'trip'
  });

  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) {
        setRequests([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };
        const [tripResponse, notificationResponse] = await Promise.all([
          fetch('/api/requests/incoming', { headers }),
          fetch('/api/notifications', { headers })
        ]);
        const tripData = await tripResponse.json().catch(() => ({}));
        const notificationData = await notificationResponse.json().catch(() => ({}));

        const tripRequests = tripData.success
          ? (tripData.requests || []).map(normalizeTripRequest)
          : [];

        const matchRequests = notificationData.success
          ? (notificationData.items || [])
              .filter((item) => item.type === 'Match Request')
              .map((item) => ({
                _id: item._id,
                status: item.read ? 'accepted' : 'pending',
                message: item.message,
                createdAt: item.createdAt,
                from_user_id: {
                  _id: item.fromUserId,
                  name: extractMatchSenderName(item.message),
                  profilePicture: ''
                },
                senderName: extractMatchSenderName(item.message),
                destination: 'Direct connection request',
                requestKind: 'match',
                notificationId: item._id
              }))
          : [];

        setRequests(
          [...tripRequests, ...matchRequests].sort(
            (a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)
          )
        );
      } catch (error) {
        console.error('Error fetching requests:', error);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;

    const handleIncomingTripRequest = (payload) => {
      if (!payload?.request?._id) return;
      const normalized = normalizeTripRequest(payload.request);

      setRequests((prev) => {
        const existing = prev.some((item) => item._id === normalized._id);
        if (existing) return prev;
        return [normalized, ...prev];
      });
    };

    socket.on('requestSent', handleIncomingTripRequest);
    return () => {
      socket.off('requestSent', handleIncomingTripRequest);
    };
  }, [token]);

  const handleAcceptRequest = async (request) => {
    setActioningId(request._id);
    try {
      if (request.requestKind === 'match') {
        const response = await fetch(`/api/notifications/${request.notificationId || request._id}/accept`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setRequests((prev) => prev.map((item) => (
            item._id === request._id ? { ...item, status: 'accepted' } : item
          )));
          if (data.partner?.id) {
            navigate(`/dashboard/messages?conversationId=${data.conversationId || data.threadId || ''}&partnerId=${data.partner.id}`);
          }
        }
      } else {
        const response = await fetch(`/api/requests/${request._id}/action`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'accepted' })
        });

        const data = await response.json();
        if (data.success) {
          setRequests((prev) => prev.map((item) => (
            item._id === request._id ? { ...item, status: 'accepted' } : item
          )));

          if (data.chat_id) {
            navigate(`/dashboard/messages?chatId=${data.chat_id}`);
          }
        }
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Request accept nahi ho saki');
    } finally {
      setActioningId(null);
    }
  };

  const handleRejectRequest = async (request) => {
    setActioningId(request._id);
    try {
      if (request.requestKind === 'match') {
        setRequests((prev) => prev.map((item) => (
          item._id === request._id ? { ...item, status: 'rejected' } : item
        )));
      } else {
        const response = await fetch(`/api/requests/${request._id}/action`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'rejected' })
        });

        const data = await response.json();
        if (data.success) {
          setRequests((prev) => prev.map((item) => (
            item._id === request._id ? { ...item, status: 'rejected' } : item
          )));
        }
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Request reject nahi ho saki');
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteRequest = async (request) => {
    setActioningId(request._id);
    try {
      if (request.requestKind === 'match') {
        setRequests((prev) => prev.filter((item) => item._id !== request._id));
      } else {
        const response = await fetch(`/api/requests/${request._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setRequests((prev) => prev.filter((item) => item._id !== request._id));
        }
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Delete fail');
    } finally {
      setActioningId(null);
    }
  };

  const handleViewTrip = (request) => {
    if (request.requestKind === 'match') {
      navigate('/dashboard/messages');
      return;
    }
    const tripId = request.tripId || request.trip_id?._id || request.trip_id;
    navigate(tripId ? `/dashboard/trips?focusTrip=${tripId}` : '/dashboard/trips');
  };

  const handleCreateTrip = () => {
    navigate('/dashboard/trips/create');
  };

  const formatDate = (date) => {
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return 'Date TBD';
    return value.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (date) => {
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return 'Recently';

    const now = new Date();
    const diffMs = now - value;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  const getSenderName = (request) => request.from_user_id?.name || request.senderName || 'Unknown User';
  const getSenderProfilePicture = (request) => request.from_user_id?.profilePicture || request.senderImage;
  const getTripDestination = (request) => request.trip_id?.destination || request.destination || 'Unknown Destination';
  const getRequestTitle = (request) => request.requestKind === 'match' ? 'Connection Request' : 'Destination';
  const getDateTitle = (request) => request.requestKind === 'match' ? 'Request Type' : 'Travel Dates';

  function extractMatchSenderName(message = '') {
    const match = String(message).match(/Match request from\s+(.+?)\s+</i);
    return match?.[1]?.trim() || 'Unknown User';
  }

  const pendingRequests = requests.filter((request) => request.status === 'pending');
  const acceptedRequests = requests.filter((request) => request.status === 'accepted');
  const rejectedRequests = requests.filter((request) => request.status === 'rejected');

  const counts = {
    all: requests.length,
    pending: pendingRequests.length,
    accepted: acceptedRequests.length,
    rejected: rejectedRequests.length
  };

  const filteredRequests = activeTab === 'all'
    ? requests
    : requests.filter((request) => request.status === activeTab);

  const statusMeta = {
    pending: {
      label: 'Pending',
      badge: 'Pending Review',
      border: 'border-amber-500/20',
      badgeClass: 'bg-amber-500/12 text-amber-200 border border-amber-400/20',
      iconClass: 'bg-amber-500/14 text-amber-200'
    },
    accepted: {
      label: 'Accepted',
      badge: 'Accepted',
      border: 'border-emerald-500/20',
      badgeClass: 'bg-emerald-500/12 text-emerald-200 border border-emerald-400/20',
      iconClass: 'bg-emerald-500/14 text-emerald-200'
    },
    rejected: {
      label: 'Rejected',
      badge: 'Rejected',
      border: 'border-rose-500/20',
      badgeClass: 'bg-rose-500/12 text-rose-200 border border-rose-400/20',
      iconClass: 'bg-rose-500/14 text-rose-200'
    }
  };

  const renderAvatar = (request) => {
    const image = getSenderProfilePicture(request);
    const name = getSenderName(request);

    if (image && /^https?:|^data:|^\//.test(image)) {
      return <img src={image} alt={name} className="h-full w-full object-cover" />;
    }

    return (
      <span className="text-lg font-bold text-white">
        {name.charAt(0).toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#121b2f] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="animate-fade-in">
          <h1 className="text-5xl font-extrabold tracking-[-0.04em] text-white">
            Incoming <span className="text-[#3d73ff]">Requests</span>
          </h1>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[22px] border border-[#354764] bg-[#243148] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition duration-300 ease-out hover:-translate-y-1 hover:border-[#48628d] hover:shadow-[0_24px_50px_rgba(0,0,0,0.24)]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4e4730] text-xl text-[#ffd882]">
                <FaHourglassHalf />
              </div>
              <div>
                <div className="text-5xl font-extrabold leading-none text-white">{counts.pending}</div>
                <div className="mt-1 text-sm font-medium uppercase tracking-[0.12em] text-[#90a5d1]">Pending</div>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-[#354764] bg-[#243148] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition duration-300 ease-out hover:-translate-y-1 hover:border-[#48628d] hover:shadow-[0_24px_50px_rgba(0,0,0,0.24)]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#183e43] text-xl text-[#22d3a6]">
                <FaCheck />
              </div>
              <div>
                <div className="text-5xl font-extrabold leading-none text-white">{counts.accepted}</div>
                <div className="mt-1 text-sm font-medium uppercase tracking-[0.12em] text-[#90a5d1]">Accepted</div>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-[#354764] bg-[#243148] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition duration-300 ease-out hover:-translate-y-1 hover:border-[#48628d] hover:shadow-[0_24px_50px_rgba(0,0,0,0.24)]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4b2f45] text-xl text-[#ff6666]">
                <FaTimes />
              </div>
              <div>
                <div className="text-5xl font-extrabold leading-none text-white">{counts.rejected}</div>
                <div className="mt-1 text-sm font-medium uppercase tracking-[0.12em] text-[#90a5d1]">Rejected</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 border-b border-[#34455f] pb-5">
          {tabs.map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-3 rounded-2xl px-6 py-3 text-lg font-semibold transition duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 ${
                  selected
                    ? 'bg-gradient-to-r from-[#2f66ef] to-[#3a73ff] text-white shadow-[0_16px_36px_rgba(61,115,255,0.34)]'
                    : 'text-[#a6b7da] hover:bg-white/4 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-sm ${
                  selected ? 'bg-white/15 text-white' : 'bg-white/8 text-[#c4d0e7]'
                }`}>
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="mt-8 flex min-h-[420px] items-center justify-center rounded-[30px] border border-[#34455f] bg-[#243148]">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#46587a] border-t-[#3f73ff]" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="mt-8 rounded-[30px] border border-[#34455f] bg-[#243148] px-6 py-16 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            <div className="mx-auto flex max-w-xl flex-col items-center text-center">
              <div className="mb-8 flex h-30 w-30 items-center justify-center rounded-full bg-[#151f38] text-[4.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.22)] animate-float">
                👀
              </div>
              <h2 className="text-5xl font-extrabold tracking-[-0.04em] text-white">Koi requests nahi hain</h2>
              <p className="mt-6 max-w-lg text-2xl leading-10 text-[#96a9d1]">
                Trip requests and match requests from other users will appear here. You&apos;ll be able to review and accept them from one place.
              </p>
              <button
                type="button"
                onClick={handleCreateTrip}
                className="group relative mt-10 inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#2f66ef] to-[#3a73ff] px-8 text-lg font-bold text-white shadow-[0_18px_42px_rgba(61,115,255,0.34)] transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_24px_52px_rgba(61,115,255,0.42)] active:translate-y-0 active:scale-[0.99]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition duration-700 ease-out group-hover:translate-x-full" />
                <FaPlus className="relative transition duration-300 group-hover:rotate-90" />
                <span className="relative">Create New Trip</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {filteredRequests.map((request, index) => {
              const status = statusMeta[request.status] || statusMeta.pending;
              const senderName = getSenderName(request);
              const destination = getTripDestination(request);
              const trip = request.trip_id;

              return (
                <div
                  key={request._id}
                  className={`animate-slide-up rounded-[28px] border bg-[#243148] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_28px_55px_rgba(0,0,0,0.24)] ${status.border}`}
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-4">
                        <div className="h-15 w-15 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#3a73ff] to-[#7a5cff] shadow-[0_14px_28px_rgba(61,115,255,0.2)]">
                          {renderAvatar(request)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-bold text-white">{senderName}</h3>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${status.badgeClass}`}>
                              {status.badge}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[#8fa3cc]">{formatTimeAgo(request.created_at || request.createdAt)}</p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-[#34455f] bg-[#172238] p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7c93bf]">
                            <FaMapMarkerAlt className="text-[#ff7f66]" />
                            {getRequestTitle(request)}
                          </div>
                          <div className="mt-2 text-lg font-semibold text-white">{destination}</div>
                        </div>

                        <div className="rounded-2xl border border-[#34455f] bg-[#172238] p-4">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7c93bf]">
                            <FaCalendar className="text-[#8bffcd]" />
                            {getDateTitle(request)}
                          </div>
                          <div className="mt-2 text-lg font-semibold text-white">
                            {request.requestKind === 'match'
                              ? 'Direct user request'
                              : (
                                <>
                                  {trip?.start_date ? formatDate(trip.start_date) : formatDate(request.startDate)}
                                  {' '}
                                  {trip?.end_date || request.endDate ? `- ${formatDate(trip?.end_date || request.endDate)}` : ''}
                                </>
                              )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-[#34455f] bg-[#172238] p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c93bf]">Message</div>
                        <p className="mt-2 text-base leading-8 text-[#d7e0f3]">
                          {request.message || 'No message provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 lg:w-[220px]">
                      {request.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAcceptRequest(request)}
                            disabled={actioningId === request._id}
                            className="group inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#18b985] to-[#10d3a1] px-4 text-sm font-bold text-white shadow-[0_16px_30px_rgba(16,211,161,0.22)] transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(16,211,161,0.3)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <FaCheck className="transition duration-300 group-hover:scale-110" />
                            <span>{actioningId === request._id ? 'Working...' : 'Accept'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRejectRequest(request)}
                            disabled={actioningId === request._id}
                            className="group inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#d44d61] to-[#ff6674] px-4 text-sm font-bold text-white shadow-[0_16px_30px_rgba(255,102,116,0.2)] transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(255,102,116,0.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <FaTimes className="transition duration-300 group-hover:rotate-90" />
                            <span>{actioningId === request._id ? 'Working...' : 'Reject'}</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleViewTrip(request)}
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#41567b] bg-[#172238] px-4 text-sm font-bold text-[#dbe5fb] transition duration-300 ease-out hover:-translate-y-0.5 hover:border-[#5671a3] hover:bg-[#1c2943] hover:text-white active:translate-y-0"
                      >
                        {request.requestKind === 'match' ? 'Open Messages' : 'View Trip'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(request)}
                        disabled={actioningId === request._id}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#4a3f57] bg-[#271f33] px-4 text-sm font-bold text-[#f5d8df] transition duration-300 ease-out hover:-translate-y-0.5 hover:border-[#6e597d] hover:bg-[#302646] hover:text-white active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FaTrashAlt />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
