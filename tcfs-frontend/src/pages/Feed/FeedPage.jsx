import { useEffect, useState } from 'react';
import {
  FaComment,
  FaHeart,
  FaImage,
  FaMapMarkerAlt,
  FaRegComment,
  FaRegHeart,
  FaRegImage,
  FaRegSmile,
  FaShareAlt,
} from 'react-icons/fa';

const avatarPalette = [
  'from-blue-500 to-cyan-400',
  'from-fuchsia-500 to-pink-500',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-500',
];

function Avatar({ name, className = 'h-12 w-12 text-xl' }) {
  const initial = (name || 'A').charAt(0).toUpperCase();
  const tone = avatarPalette[(initial.charCodeAt(0) || 0) % avatarPalette.length];

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br ${tone} font-bold text-white ${className}`}
    >
      {initial}
    </div>
  );
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}h ago`.replace('0h', '1m ago');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [showCommentBox, setShowCommentBox] = useState({});
  const [likes, setLikes] = useState({});
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const mockPosts = [
      {
        _id: '1',
        author: { name: 'Ali Khan' },
        content: 'Just completed an amazing trek through the Northern Areas! The views were breathtaking.',
        image: '/register-bg.png.PNG',
        location: 'Hunza Valley, Pakistan',
        timestamp: new Date(Date.now() - 3600000),
        likes: 45,
        comments: [
          { _id: '1c1', author: 'Sara Ahmed', text: 'Looks amazing! I want to go there!' },
          { _id: '1c2', author: 'Hassan Ali', text: 'The scenery is incredible!' },
        ],
        liked: false,
      },
      {
        _id: '2',
        author: { name: 'Sara Ahmed' },
        content: 'Looking for travel buddies for a Lahore city tour next month. Interested in history and food!',
        image: null,
        location: 'Lahore, Pakistan',
        timestamp: new Date(Date.now() - 10800000),
        likes: 32,
        comments: [{ _id: '2c1', author: 'Fatima Zahra', text: "I'm interested! When exactly?" }],
        liked: false,
      },
      {
        _id: '3',
        author: { name: 'Hassan Ali' },
        content: 'Travel tip: Always verify your travel companions before booking. Safety first!',
        image: null,
        location: '',
        timestamp: new Date(Date.now() - 5 * 3600000),
        likes: 78,
        comments: [],
        liked: false,
      },
      {
        _id: '4',
        author: { name: 'Fatima Zahra' },
        content: 'Just returned from Skardu! The best decision ever. Weather was perfect, locals were super friendly.',
        image: null,
        location: 'Skardu, Gilgit-Baltistan',
        timestamp: new Date(Date.now() - 4 * 3600000),
        likes: 61,
        comments: [{ _id: '4c1', author: 'Ahmed Hassan', text: 'Skardu is on my bucket list!' }],
        liked: false,
      },
    ];

    setPosts(mockPosts);
    setLikes(
      mockPosts.reduce((acc, post) => {
        acc[post._id] = post.likes;
        return acc;
      }, {})
    );
  }, []);

  const handlePostSubmit = async (event) => {
    event.preventDefault();
    if (!newPost.trim()) return;

    setLoading(true);
    try {
      const createdPost = {
        _id: Date.now().toString(),
        author: { name: user.name || 'Anonymous' },
        content: newPost.trim(),
        image: null,
        location: user.location || '',
        timestamp: new Date(),
        likes: 0,
        comments: [],
        liked: false,
      };

      setPosts((prev) => [createdPost, ...prev]);
      setLikes((prev) => ({ ...prev, [createdPost._id]: 0 }));
      setNewPost('');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (postId) => {
    const target = posts.find((post) => post._id === postId);
    if (!target) return;

    setPosts((prev) =>
      prev.map((post) => (post._id === postId ? { ...post, liked: !post.liked } : post))
    );

    setLikes((prev) => ({
      ...prev,
      [postId]: Math.max(0, (prev[postId] || 0) + (target.liked ? -1 : 1)),
    }));
  };

  const handleAddComment = (postId, commentText) => {
    if (!commentText.trim()) return;

    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                { _id: `${postId}-${Date.now()}`, author: user.name || 'You', text: commentText.trim() },
              ],
            }
          : post
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172c] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <h1 className="text-5xl font-black tracking-tight">
            <span className="text-blue-500">Travel </span>
            <span className="text-emerald-400">Feed</span>
          </h1>
          <p className="mt-4 text-xl text-slate-400">
            Share your travel experiences and discover stories from other travelers
          </p>
        </div>

        <div className="mb-8 rounded-[1.6rem] border border-white/10 bg-[#20283d] p-6 shadow-[0_18px_50px_rgba(5,10,22,0.25)]">
          <div className="flex gap-4">
            <Avatar name={user.name || 'A'} className="h-12 w-12 text-2xl" />
            <form onSubmit={handlePostSubmit} className="flex-1">
              <textarea
                placeholder="Share your travel story..."
                value={newPost}
                onChange={(event) => setNewPost(event.target.value)}
                className="min-h-[5rem] w-full resize-none rounded-2xl border border-[#3a4968] bg-[#11192f] px-5 py-4 text-lg text-white placeholder:text-slate-400 outline-none transition focus:border-blue-400"
              />
              <div className="mt-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#42506d] bg-[#11192f] text-slate-300 transition hover:border-blue-400/40 hover:text-white"
                  >
                    <FaRegImage size={22} />
                  </button>
                  <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#42506d] bg-[#11192f] text-slate-300 transition hover:border-blue-400/40 hover:text-white"
                  >
                    <FaRegSmile size={22} />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading || !newPost.trim()}
                  className="rounded-2xl bg-blue-600 px-8 py-3 text-lg font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-600"
                >
                  {loading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post._id}
              className="rounded-[1.8rem] border border-white/5 bg-[#20283d] p-8 shadow-[0_18px_50px_rgba(5,10,22,0.24)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Avatar name={post.author.name} className="h-12 w-12 text-2xl" />
                  <div>
                    <h2 className="text-[2rem] font-extrabold leading-none text-white">{post.author.name}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-lg text-slate-400">
                      <span>{timeAgo(post.timestamp)}</span>
                      {post.location ? <span>•</span> : null}
                      {post.location ? (
                        <span className="inline-flex items-center gap-2">
                          <FaMapMarkerAlt className="text-sm" />
                          {post.location}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-[#11192f] hover:text-white"
                >
                  <span className="text-3xl leading-none">⋮</span>
                </button>
              </div>

              <div className="mt-8">
                <p className="text-[1.15rem] leading-9 text-slate-200">{post.content}</p>
                {post.image ? (
                  <img
                    src={post.image}
                    alt="Post"
                    className="mt-6 h-[300px] w-full rounded-[1.35rem] object-cover"
                  />
                ) : null}
              </div>

              <div className="mt-8 flex items-center gap-6 text-lg text-slate-400">
                <span>{likes[post._id] || 0} likes</span>
                <span>{post.comments?.length || 0} comments</span>
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center justify-center gap-3 rounded-2xl border px-6 py-4 text-lg font-semibold transition ${
                      post.liked
                        ? 'border-red-400/40 bg-red-500/10 text-red-300'
                        : 'border-[#42506d] bg-[#11192f] text-slate-300 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {post.liked ? <FaHeart /> : <FaRegHeart />}
                    Like
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setShowCommentBox((prev) => ({
                        ...prev,
                        [post._id]: !prev[post._id],
                      }))
                    }
                    className="flex items-center justify-center gap-3 rounded-2xl border border-[#42506d] bg-[#11192f] px-6 py-4 text-lg font-semibold text-slate-300 transition hover:border-white/20 hover:text-white"
                  >
                    <FaRegComment />
                    Comment
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-3 rounded-2xl border border-[#42506d] bg-[#11192f] px-6 py-4 text-lg font-semibold text-slate-300 transition hover:border-white/20 hover:text-white"
                  >
                    <FaShareAlt />
                    Share
                  </button>
                </div>
              </div>

              {post.comments?.length ? (
                <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
                  {post.comments.map((comment) => (
                    <div key={comment._id} className="flex gap-3">
                      <Avatar name={comment.author} className="h-9 w-9 text-sm" />
                      <div className="flex-1 rounded-2xl bg-[#11192f] px-4 py-3">
                        <p className="text-sm font-semibold text-white">{comment.author}</p>
                        <p className="mt-1 text-sm text-slate-300">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {showCommentBox[post._id] ? (
                <div className="mt-5 flex gap-3 border-t border-white/10 pt-5">
                  <Avatar name={user.name || 'Y'} className="h-9 w-9 text-sm" />
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      const input = event.target.querySelector('input');
                      handleAddComment(post._id, input.value);
                      input.value = '';
                    }}
                    className="flex flex-1 gap-3"
                  >
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      className="flex-1 rounded-2xl border border-[#42506d] bg-[#11192f] px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none focus:border-blue-400"
                    />
                    <button
                      type="submit"
                      className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                    >
                      Post
                    </button>
                  </form>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        {!posts.length ? (
          <div className="py-16 text-center text-slate-400">
            No posts yet. Be the first to share your travel story.
          </div>
        ) : null}
      </div>
    </div>
  );
}
