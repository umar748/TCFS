import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../../services/auth';
import { FaArrowLeft, FaIdCard, FaCloudUploadAlt, FaCheck } from 'react-icons/fa';

export default function Verification() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    setError('');
    setSuccess('');
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('document', file);

      const token = getToken();
      const res = await fetch('/api/users/verify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`
        },
        body: formData
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.message || `Upload failed (${res.status})`);
        return;
      }

      setSuccess('Document uploaded successfully! Your verification is pending.');
      setFile(null);
      setTimeout(() => navigate('/dashboard'), 2000);
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

        <h1 className="text-4xl font-extrabold mb-2 flex items-center gap-3">
          <FaIdCard className="text-blue-500" />
          <span>
            <span className="text-blue-500">Identity </span>
            <span className="text-green-400">Verification</span>
          </span>
        </h1>
        <p className="text-gray-400 text-lg mb-8">Verify your identity to unlock premium features and build trust with other travelers.</p>

        <div className="bg-gray-950 p-8 rounded-2xl shadow-2xl border border-gray-800">
          <div className="space-y-6">
            {/* Document Upload Section */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <FaCloudUploadAlt className="text-blue-400" />
                Upload Document
              </label>
              <p className="text-gray-400 text-sm">Please upload a clear photo of your passport or government ID card.</p>

              <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-blue-500 transition-all duration-300 bg-gray-900/50">
                <input 
                  type="file" 
                  id="document-upload"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <label 
                  htmlFor="document-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <FaCloudUploadAlt className="text-4xl text-blue-400" />
                  <div>
                    <p className="text-gray-200 font-semibold">Click to upload or drag and drop</p>
                    <p className="text-gray-500 text-sm">PNG, JPG or PDF (max 5MB)</p>
                  </div>
                </label>
              </div>

              {file && (
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
                  <FaCheck className="text-green-500 text-xl" />
                  <div>
                    <p className="text-green-400 font-semibold">{file.name}</p>
                    <p className="text-green-300 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-3 text-sm font-medium animate-pulse">
                {success}
              </div>
            )}

            {/* Upload Button */}
            <button 
              onClick={handleUpload}
              disabled={loading || !file}
              className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-800 font-bold rounded-xl text-sm px-5 py-3.5 text-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </div>
              ) : (
                <>
                  <FaCloudUploadAlt />
                  Upload Document
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gray-950 p-6 rounded-xl border border-blue-500/30 text-blue-200 text-sm space-y-2">
          <p className="font-semibold flex items-center gap-2"><FaIdCard /> Verification Requirements:</p>
          <ul className="space-y-1 pl-6 list-disc">
            <li>Document must be clear and legible</li>
            <li>Your full name must be visible</li>
            <li>Document must be valid (not expired)</li>
            <li>Verification typically completes within 24 hours</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
