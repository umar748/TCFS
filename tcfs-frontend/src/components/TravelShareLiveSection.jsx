import React from 'react';

export default function TravelShareLiveSection() {
  return (
    <div className="w-full py-24 bg-black text-white overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
        
        {/* Header */}
        <div className="mb-16 max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Travel. Share. Live.
          </h2>
          <p className="text-gray-400 text-lg md:text-xl font-medium">
            Join a new generation of travelers, explore unique places and connect with inspiring people along the way
          </p>
        </div>

        {/* App Showcase */}
        <div className="relative mb-24 w-full flex justify-center">
          {/* Background Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
          
          {/* Main Phone Image */}
          <div className="relative z-10">
             {/* We use a container to simulate the phone look if we don't have a perfect mockup */}
             <div className="relative w-[280px] md:w-[320px] aspect-[9/19] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden ring-1 ring-gray-700">
                {/* Simulated App Content */}
                <img 
                  src="https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=1000&auto=format&fit=crop" 
                  alt="App Interface" 
                  className="w-full h-full object-cover opacity-80"
                />
                
                {/* Overlay Elements imitating the app UI in the screenshot */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80">
                  <div className="absolute bottom-8 left-6 right-6">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl mb-4">
                      <div className="h-2 w-24 bg-white/50 rounded-full mb-2"></div>
                      <div className="h-2 w-16 bg-white/30 rounded-full"></div>
                    </div>
                    <div className="flex gap-3">
                       <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/50">
                          <div className="h-4 w-4 bg-white rounded-sm"></div>
                       </div>
                       <div className="flex-1 h-10 bg-white/10 backdrop-blur-md rounded-full border border-white/20"></div>
                    </div>
                  </div>
                </div>
             </div>
             
             {/* Floating Cards Behind (Decorative) */}
             <div className="absolute top-10 -left-12 md:-left-20 w-40 h-48 bg-gray-800 rounded-xl rotate-[-12deg] -z-10 opacity-60 border border-gray-700 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=400" className="w-full h-full object-cover opacity-50" />
             </div>
             <div className="absolute bottom-20 -right-12 md:-right-20 w-40 h-48 bg-gray-800 rounded-xl rotate-[12deg] -z-10 opacity-60 border border-gray-700 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400" className="w-full h-full object-cover opacity-50" />
             </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-32 mb-24 w-full max-w-4xl border-t border-gray-800 pt-12">
          <div className="flex flex-col items-center group">
            <span className="text-4xl font-extrabold text-white mb-2 group-hover:text-blue-500 transition-colors">+55</span>
            <span className="text-gray-500 text-sm font-bold uppercase tracking-widest">Covered countries</span>
          </div>
          <div className="flex flex-col items-center group">
            <span className="text-4xl font-extrabold text-white mb-2 group-hover:text-green-500 transition-colors">100%</span>
            <span className="text-gray-500 text-sm font-bold uppercase tracking-widest">Free to use</span>
          </div>
          <div className="flex flex-col items-center group">
            <span className="text-4xl font-extrabold text-white mb-2 group-hover:text-purple-500 transition-colors">Global</span>
            <span className="text-gray-500 text-sm font-bold uppercase tracking-widest">Presence</span>
          </div>
        </div>

      </div>
    </div>
  );
}
