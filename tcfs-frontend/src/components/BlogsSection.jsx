import { useRef } from 'react';
import { FaChevronLeft, FaChevronRight, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const blogs = [
  {
    id: 1,
    title: "5 Best Travel Hacks You Need to Know",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "How to Choose the Perfect Destination",
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "The Ultimate Couchsurfing Guide",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Best VPNs for Traveling Abroad",
    image: "https://images.unsplash.com/photo-1512756290469-ec264b7fbf87?q=80&w=2053&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "The Best Flight Comparison Sites",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "Choose Your Travel Insurance Wisely",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 7,
    title: "How to Use eSIM While Traveling",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: 8,
    title: "How to Organize a Group Trip",
    image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=2066&auto=format&fit=crop",
  }
];

export default function BlogsSection() {
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = 300;
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full py-16 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-3xl font-bold text-blue-500 mb-2">Blogs&Tips</h2>
          <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
        </div>

        {/* Carousel Container */}
        <div className="relative group px-4">
          {/* Left Arrow */}
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 z-10 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-700 shadow-lg border border-gray-700"
          >
            <FaChevronLeft />
          </button>

          {/* Scrollable Area */}
          <div 
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-8 snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {blogs.map((blog) => (
              <div 
                key={blog.id} 
                className="min-w-[200px] md:min-w-[240px] lg:min-w-[260px] snap-start"
              >
                <div className="bg-gray-950 rounded-xl overflow-hidden shadow-lg border border-gray-800 hover:border-blue-500/50 transition-colors group/card cursor-pointer h-full flex flex-col relative aspect-[3/4]">
                  <img 
                    src={blog.image} 
                    alt={blog.title} 
                    className="absolute inset-0 w-full h-full object-cover transform group-hover/card:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                  
                  <div className="relative flex-1 flex flex-col justify-end p-4">
                    <h3 className="text-white font-bold text-sm md:text-base leading-snug group-hover/card:text-blue-400 transition-colors">
                      {blog.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 z-10 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-700 shadow-lg border border-gray-700"
          >
            <FaChevronRight />
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-4">
          <button 
            onClick={() => navigate('/blogs')}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium text-sm border border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-blue-500 px-5 py-2.5 rounded-lg transition-all"
          >
            Show more blogs <FaArrowRight className="text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
}
