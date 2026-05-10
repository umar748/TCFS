import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../../components/layout/TopNav';
import Sidebar from '../../components/layout/Sidebar';
import { getUser, getToken, setUser } from '../../services/auth';
import { FaUser, FaSave, FaArrowLeft, FaCamera, FaImage, FaTimes } from 'react-icons/fa';
import { compressImage, fileToBase64, validateImageFile } from '../../utils/imageUpload';

export default function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    age: '',
    gender: 'Male',
    interests: '',
    travelStyle: ''
  });

  useEffect(() => {
    const user = getUser();
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        age: user.age || '',
        gender: user.gender || 'Male',
        interests: Array.isArray(user.interests) ? user.interests.join(', ') : (user.interests || ''),
        travelStyle: user.travelStyle || ''
      });
      if (user.profileImage || user.profilePicture) {
        setProfileImagePreview(user.profileImage || user.profilePicture);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (file) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setProfileImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getToken();
      let profilePicture = profileImagePreview || '';

      if (selectedFile) {
        const compressedBlob = await compressImage(selectedFile, 0.72);
        profilePicture = await fileToBase64(compressedBlob);
      }

      const payload = {
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        age: formData.age,
        gender: formData.gender,
        interests: formData.interests.split(',').map(i => i.trim()).filter(i => i),
        travelStyle: formData.travelStyle,
        profilePicture
      };

      const res = await fetch('/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        alert('Profile updated successfully!');
        navigate('/dashboard');
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <TopNav onToggleSidebar={() => setSidebarOpen(s => !s)} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6">
        <Sidebar className={!sidebarOpen ? 'hidden' : ''} />

        <main className="flex-1 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-800 rounded-full transition-all duration-300 hover:scale-110 text-blue-400"
              >
                <FaArrowLeft className="text-xl" />
              </button>
              <h1 className="text-3xl font-bold">
                <span className="text-blue-500">Edit </span>
                <span className="text-green-400">Profile</span>
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-950 p-8 rounded-2xl shadow-2xl border border-gray-800">
                {/* Profile Picture Section */}
                <div className="flex flex-col items-center mb-8">
                  {profileImagePreview && (
                    <div className="relative group mb-4">
                      <img 
                        src={profileImagePreview} 
                        alt="Profile Preview" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 group-hover:border-green-400 transition-all duration-300"
                      />
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                      >
                        <FaCamera className="text-white text-2xl" />
                      </div>
                    </div>
                  )}
                  
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*"
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />

                  {!profileImagePreview && (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`w-full max-w-xs p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
                        dragActive 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'border-gray-700 bg-gray-900 hover:border-blue-400'
                      }`}
                    >
                      <FaImage className="text-4xl text-blue-400" />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-200">Choose an image or drag it here</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  )}

                  {selectedFile && (
                    <p className="mt-3 text-xs text-gray-400">
                      <span className="text-green-400 font-semibold">✓</span> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-200">Full Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3.5 placeholder-gray-500 transition-all duration-300 hover:border-gray-600"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-200">Location</label>
                    <input 
                      type="text" 
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. London, UK"
                      className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 block p-3.5 placeholder-gray-500 transition-all duration-300 hover:border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-200">Age</label>
                    <input 
                      type="number" 
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3.5 placeholder-gray-500 transition-all duration-300 hover:border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-200">Gender</label>
                    <select 
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 block p-3.5 placeholder-gray-500 transition-all duration-300 hover:border-gray-600"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <label className="text-sm font-semibold text-gray-200">Bio</label>
                  <textarea 
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Tell us about yourself..."
                    className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3.5 placeholder-gray-500 transition-all duration-300 hover:border-gray-600 resize-none"
                  />
                </div>

                <div className="mt-6 space-y-2">
                  <label className="text-sm font-semibold text-gray-200">Interests (comma separated)</label>
                  <input 
                    type="text" 
                    name="interests"
                    value={formData.interests}
                    onChange={handleChange}
                    placeholder="Hiking, Photography, Foodie..."
                    className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 block p-3.5 placeholder-gray-500 transition-all duration-300 hover:border-gray-600"
                  />
                </div>

                <div className="mt-6 space-y-2">
                  <label className="text-sm font-semibold text-gray-200">Travel Style</label>
                  <input 
                    type="text" 
                    name="travelStyle"
                    value={formData.travelStyle}
                    onChange={handleChange}
                    placeholder="e.g. Backpacker, Luxury, Solo..."
                    className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-3.5 placeholder-gray-500 transition-all duration-300 hover:border-gray-600"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full mt-8 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 font-bold rounded-xl text-sm px-5 py-3.5 text-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/50 transform hover:scale-105"
                >
                  {loading ? 'Saving...' : (
                    <>
                      <FaSave />
                      Save Profile Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
