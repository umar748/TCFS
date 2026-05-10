import { useState } from 'react';
import { FaSearch, FaArrowRight, FaCalendarAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const allBlogs = [
  {
    id: 1,
    title: "5 Best Travel Hacks for 2025: Save Money, Travel Smarter",
    description: "The ultimate list of the top travel hacks for 2025: save on flights, hotels, insurance, tech, and essential travel...",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop",
    date: "Dec 12, 2024"
  },
  {
    id: 2,
    title: "How to Choose the Right Accommodation: Hotels, Hostels & Vacation Rentals",
    description: "Discover how to choose the best accommodation for your trip — from budget hostels and boutique hotels to...",
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop",
    date: "Dec 10, 2024"
  },
  {
    id: 3,
    title: "The Ultimate Couchsurfing Guide – How to Travel the World for Free & Meet Locals",
    description: "Discover how Couchsurfing works, find safe hosts, meet locals, and explore the world on a budget. Learn the secrets o...",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop",
    date: "Dec 08, 2024"
  },
  {
    id: 4,
    title: "Best VPNs for Travelers 2025",
    description: "Find the best VPNs for travelers in 2025. Stay safe on public Wi-Fi, unlock global content, and keep your online privacy...",
    image: "https://images.unsplash.com/photo-1512756290469-ec264b7fbf87?q=80&w=2053&auto=format&fit=crop",
    date: "Dec 05, 2024"
  },
  {
    id: 5,
    title: "The Best Flight Comparison Sites to Find Cheap Flights & Exclusive Deals (2025)",
    description: "Find the best flight comparison sites to save money on airfare, discover cheap flights, compare airline ticket prices,...",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop",
    date: "Nov 28, 2024"
  },
  {
    id: 6,
    title: "Choose Your Travel Insurance",
    description: "A complete guide to why travel insurance matters, what to look for, and how to choose the right coverage...",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop",
    date: "Nov 25, 2024"
  },
  {
    id: 7,
    title: "How to Use eSIM While Traveling 2025",
    description: "Discover how to use eSIMs while traveling in 2025. Stay connected, avoid roaming charges, and eam...",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop",
    date: "Nov 22, 2024"
  },
  {
    id: 8,
    title: "How to Organize a Group Trip (Step-by-Step)",
    description: "Organize the perfect group trip with ease. Discover tips for planning, budgeting, and collaboration, and...",
    image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=2066&auto=format&fit=crop",
    date: "Nov 18, 2024"
  },
  {
    id: 9,
    title: "Travel on Budget",
    description: "Discover the best tips for traveling on a tight budget. Learn how to save on flights, accommodation, and activitie...",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop",
    date: "Nov 15, 2024"
  },
  {
    id: 10,
    title: "Digital Nomad Guide 2025",
    description: "Digital Nomad Guide 2025: excel in digital distractions, banish struggle snumpit, protect mind and stat...",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop",
    date: "Nov 12, 2024"
  },
  {
    id: 11,
    title: "How to Pack Light Smart for Your Next Adventure",
    description: "Travel light and smart with proven packing tips for your next trip. Maximize space, reduce stress, and carry only...",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070&auto=format&fit=crop",
    date: "Nov 10, 2024"
  },
  {
    id: 12,
    title: "Top Travel Safety Tips for Every Explorer",
    description: "Stay safe while traveling with essential safety tips. Protect yourself, avoid risks, and enjoy every adventure around th...",
    image: "https://images.unsplash.com/photo-1476900543704-4312b78632f8?q=80&w=2070&auto=format&fit=crop",
    date: "Nov 05, 2024"
  },
  {
    id: 13,
    title: "Top Hiking Trails You Can't Miss",
    description: "Explore the most breathtaking hiking trails around the world, from majestic mountains to coastal paths, perfect fo...",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070&auto=format&fit=crop",
    date: "Oct 28, 2024"
  },
  {
    id: 14,
    title: "Sustainable Travel Tips for Eco-Conscious Explorers",
    description: "Travel responsibly with practical eco-friendly tips. Reduce your footprint, support local communities, and make...",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop",
    date: "Oct 25, 2024"
  },
  {
    id: 15,
    title: "How to Find Authentic Local Experiences",
    description: "Learn how to find authentic local experiences: connect with communities, explore hidden markets...",
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1974&auto=format&fit=crop",
    date: "Oct 20, 2024"
  },
  {
    id: 16,
    title: "How to Find Fellow Travelers Online",
    description: "Find and connect with travelers who share your passions. From backpacking hubs to road tripping...",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2076&auto=format&fit=crop",
    date: "Oct 15, 2024"
  },
  {
    id: 17,
    title: "The Ultimate Summer Travel Packing List for 2025",
    description: "Your ultimate 2025 summer travel packing list: essentials, smart gadgets, and apps to stay organized, earn...",
    image: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=2070&auto=format&fit=crop",
    date: "Oct 10, 2024"
  },
  {
    id: 18,
    title: "Why Social Travel is the Next Big Trend",
    description: "Discover why social travel is the next big trend: make new friends on the road and connect with travelers...",
    image: "https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?q=80&w=2070&auto=format&fit=crop",
    date: "Oct 05, 2024"
  },
  {
    id: 19,
    title: "10 Ways to Make Friends While Traveling",
    description: "Practical tips to meet people while traveling: from group tours to apps, and how SoloTrip helps you create...",
    image: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=2070&auto=format&fit=crop",
    date: "Oct 01, 2024"
  },
  {
    id: 20,
    title: "Tips to Meet Travel Buddies Online Safely",
    description: "Meet travel buddies online and connect with fellow explorers. Use SoloTrip tools to find friends, share...",
    image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop",
    date: "Sep 28, 2024"
  }
];

export default function Blogs() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredBlogs = allBlogs.filter(blog => 
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-100">
      {/* Header Section */}
      <div className="bg-green-400/10 py-16 px-6 text-center border-b border-gray-800">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4">
             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
             </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-white">Blogs&Tips</h1>
          <p className="text-gray-300 text-lg">Explore travel tips</p>
          
          {/* Search Bar */}
          <div className="relative mt-8 w-full max-w-md">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-gray-900 rounded-full py-3 px-12 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
            />
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredBlogs.map((blog) => (
            <div key={blog.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full group">
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={blog.image} 
                  alt={blog.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg text-gray-800 text-xs font-semibold shadow-sm">
                  <FaCalendarAlt />
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-gray-900 font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {blog.title}
                </h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-3 flex-1">
                  {blog.description}
                </p>
                
                <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded-full w-fit transition-colors mt-auto">
                  Read more <FaArrowRight className="text-xs" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {filteredBlogs.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No blogs found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
