import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../../services/auth';
import { FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';

export default function ReportIssue() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('Harassment');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async () => {
    setError('');
    setSuccess('');
    if (!description) {
      setError('Please add description');
      return;
    }
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({ subject, description })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.message || `Failed (${res.status})`);
        return;
      }
      setSuccess('Report submitted successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (e) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 text-blue-400 hover:text-blue-300 transition-all duration-300 hover:scale-105 font-semibold"
        >
          <FaArrowLeft /> Back
        </button>

        <h1 className="text-4xl font-extrabold mb-8 flex items-center gap-3">
          <FaExclamationTriangle className="text-red-500" />
          <span>
            <span className="text-blue-500">Report an </span>
            <span className="text-red-500">Issue</span>
          </span>
        </h1>

        <div className="bg-gray-950 p-8 rounded-2xl shadow-2xl border border-gray-800">
          <div className="space-y-6">
            {/* Subject Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <FaExclamationTriangle className="text-yellow-400" />
                Report Subject
              </label>
              <select 
                value={subject} 
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 block p-3.5 placeholder-gray-500 transition-all duration-300 hover:border-gray-600"
              >
                <option value="Harassment">Harassment</option>
                <option value="Fake Profile">Fake Profile</option>
                <option value="Scam/Spam">Scam/Spam</option>
                <option value="Inappropriate Content">Inappropriate Content</option>
                <option value="Technical Issue">Technical Issue</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <FaExclamationTriangle className="text-orange-400" />
                Description
              </label>
              <textarea 
                placeholder="Please describe the issue in detail. Include any relevant information or evidence..."
                value={description} 
                onChange={e => setDescription(e.target.value)}
                rows="6"
                className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 block p-3.5 placeholder-gray-500 transition-all duration-300 hover:border-gray-600 resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mt-6 rounded-lg bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-3 text-sm font-medium animate-pulse">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button 
              onClick={submit}
              disabled={loading}
              className="w-full text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-800 font-bold rounded-xl text-sm px-5 py-3.5 text-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-red-500/50 transform hover:scale-105 mt-8"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gray-950 p-6 rounded-xl border border-yellow-500/30 text-yellow-200 text-sm">
          <p className="font-semibold mb-2">📋 Note:</p>
          <p>Our moderation team will review your report within 24-48 hours. Please provide as much detail as possible to help us investigate faster.</p>
        </div>
      </div>
    </div>
  );
}
