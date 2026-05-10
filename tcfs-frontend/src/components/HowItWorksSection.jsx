import React from 'react';
import { FaUserPlus, FaMapMarkedAlt, FaPlaneDeparture, FaRocket } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function HowItWorksSection() {
  const navigate = useNavigate();

  const steps = [
    {
      id: 1,
      title: "Create Your Account",
      description: "Sign up and install mobile application in seconds and join our travel community",
      icon: <FaUserPlus className="text-3xl text-green-500" />,
      number: "1"
    },
    {
      id: 2,
      title: "Discover Destinations",
      description: "Explore trips and connect with travelers",
      icon: <FaMapMarkedAlt className="text-3xl text-blue-500" />,
      number: "2"
    },
    {
      id: 3,
      title: "Start Your Adventure",
      description: "Book your trip and create your first Trip Album",
      icon: <FaPlaneDeparture className="text-3xl text-orange-500" />,
      number: "3"
    }
  ];

  return (
    <div className="w-full py-16 bg-gray-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            How to Get Started
          </h2>
          <p className="text-gray-400 text-lg">
            Start your journey in 3 simple steps
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {steps.map((step) => (
            <div key={step.id} className="relative bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group">
              {/* Number Badge */}
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm">
                {step.number}
              </div>

              <div className="flex flex-col items-center text-center space-y-6">
                {/* Icon Container */}
                <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>

                <h3 className="text-xl font-bold text-gray-900">
                  {step.title}
                </h3>
                
                <p className="text-gray-500 leading-relaxed text-sm">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <button 
            onClick={() => navigate('/register')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all transform hover:scale-105"
          >
            <FaRocket /> Get Started Now
          </button>
        </div>
      </div>
    </div>
  );
}
