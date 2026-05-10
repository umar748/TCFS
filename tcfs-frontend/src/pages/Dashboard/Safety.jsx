import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaShieldAlt, FaIdCard, FaMapPin, FaUsers, FaPhone, FaLock, FaEye } from 'react-icons/fa';

export default function Safety() {
  const navigate = useNavigate();

  const tips = [
    {
      icon: <FaIdCard />,
      title: 'Verified Profiles Only',
      description: 'Only meet with travelers who have verified their identity with a government ID.',
      color: 'blue'
    },
    {
      icon: <FaMapPin />,
      title: 'Meet in Public',
      description: 'Always arrange your first few meetings in busy, public places.',
      color: 'green'
    },
    {
      icon: <FaUsers />,
      title: 'Share Your Itinerary',
      description: 'Let a friend or family member know your travel plans and who you are with.',
      color: 'purple'
    },
    {
      icon: <FaPhone />,
      title: 'Stay Connected',
      description: 'Keep your phone charged and share your location with a trusted friend.',
      color: 'yellow'
    },
    {
      icon: <FaLock />,
      title: 'Protect Your Info',
      description: 'Never share personal financial information or passwords with anyone.',
      color: 'red'
    },
    {
      icon: <FaEye />,
      title: 'Trust Your Instincts',
      description: 'If something feels off, it\'s okay to cancel plans and find someone else.',
      color: 'pink'
    }
  ];

  const colorClasses = {
    blue: 'border-blue-500/30 text-blue-400 hover:shadow-blue-500/20',
    green: 'border-green-500/30 text-green-400 hover:shadow-green-500/20',
    purple: 'border-purple-500/30 text-purple-400 hover:shadow-purple-500/20',
    yellow: 'border-yellow-500/30 text-yellow-400 hover:shadow-yellow-500/20',
    red: 'border-red-500/30 text-red-400 hover:shadow-red-500/20',
    pink: 'border-pink-500/30 text-pink-400 hover:shadow-pink-500/20'
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 text-blue-400 hover:text-blue-300 transition-all duration-300 hover:scale-105 font-semibold"
        >
          <FaArrowLeft /> Back
        </button>

        <h1 className="text-4xl font-extrabold mb-2 flex items-center gap-3">
          <FaShieldAlt className="text-green-500" />
          <span>
            <span className="text-blue-500">Safety </span>
            <span className="text-green-400">Center</span>
          </span>
        </h1>
        <p className="text-gray-400 text-lg mb-12">Your safety is our top priority. Follow these guidelines for a secure travel experience.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {tips.map((tip, index) => (
            <div 
              key={index}
              className={`bg-gray-950 p-6 rounded-xl border ${colorClasses[tip.color]} transition-all duration-300 hover:shadow-lg`}
            >
              <div className="text-3xl mb-4">{tip.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{tip.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{tip.description}</p>
            </div>
          ))}
        </div>

        {/* Important Notice */}
        <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 p-8 rounded-2xl border border-blue-500/30 border-r-green-500/30">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <FaShieldAlt className="text-green-400" />
            Important Safety Guidelines
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h4 className="font-semibold text-blue-400 mb-2">Before Your Trip</h4>
              <ul className="space-y-2 text-sm">
                <li>✓ Check your companion's verified status</li>
                <li>✓ Read their reviews and feedback</li>
                <li>✓ Communicate about plans in advance</li>
                <li>✓ Verify contact information</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-400 mb-2">During Your Trip</h4>
              <ul className="space-y-2 text-sm">
                <li>✓ Stay aware of your surroundings</li>
                <li>✓ Keep valuables secure</li>
                <li>✓ Maintain regular contact with friends/family</li>
                <li>✓ Trust your instincts always</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-8 bg-red-500/10 p-6 rounded-xl border border-red-500/30">
          <h3 className="text-lg font-bold text-red-400 mb-2">🆘 Emergency? Need Help?</h3>
          <p className="text-gray-300 text-sm">If you feel unsafe or experience any issues, contact local authorities immediately. You can also report the user through our platform by going to Dashboard → Report Issue.</p>
        </div>
      </div>
    </div>
  );
}
