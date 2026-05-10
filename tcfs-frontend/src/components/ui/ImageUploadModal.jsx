import { useState } from 'react';
import { FaCloudUploadAlt, FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { validateImageFile, fileToBase64, compressImage } from '../utils/imageUpload';

export default function ImageUploadModal({ isOpen, onClose, onUpload, title = 'Upload Image' }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError('');
    setSuccess(false);

    // Validate file
    const validation = validateImageFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setFile(selectedFile);

    // Generate preview
    try {
      const base64 = await fileToBase64(selectedFile);
      setPreview(base64);
    } catch (err) {
      setError('Failed to load image preview');
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const input = document.createElement('input');
      input.type = 'file';
      Object.defineProperty(input, 'files', {
        value: e.dataTransfer.files
      });
      const event = { target: input };
      handleFileSelect(event);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Compress and convert to base64
      const compressedBlob = await compressImage(file);
      const base64 = await fileToBase64(compressedBlob);

      // Call parent's onUpload function
      await onUpload(base64, file.name);
      setSuccess(true);

      // Clear after success
      setTimeout(() => {
        setFile(null);
        setPreview(null);
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <FaCheckCircle className="text-green-500 mx-auto mb-4" size={48} />
            <p className="text-green-400 font-semibold">Image uploaded successfully!</p>
          </div>
        ) : (
          <>
            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center mb-6 hover:border-blue-500 transition cursor-pointer"
            >
              {preview ? (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <label className="inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="text-blue-400 hover:text-blue-300 text-sm font-semibold cursor-pointer">
                      Change image
                    </span>
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="space-y-3">
                    <FaCloudUploadAlt className="mx-auto text-blue-400" size={32} />
                    <div>
                      <p className="text-white font-semibold">
                        Drag and drop your image
                      </p>
                      <p className="text-gray-400 text-sm">
                        or click to select
                      </p>
                    </div>
                    <p className="text-gray-500 text-xs">
                      JPG, PNG, WebP, GIF up to 5MB
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* File Info */}
            {file && (
              <div className="bg-gray-700 rounded-lg p-3 mb-6 text-sm">
                <p className="text-gray-300">
                  <span className="font-semibold">File:</span> {file.name}
                </p>
                <p className="text-gray-400">
                  <span className="font-semibold">Size:</span> {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6 flex gap-3">
                <FaExclamationCircle className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition"
              >
                {loading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
