import { useState, useRef, useEffect } from 'react';
import { FaEnvelope, FaCheck, FaExclamationCircle, FaRedo, FaClock } from 'react-icons/fa';
import { verifyEmail, resendVerificationCode, formatVerificationCode } from '../services/emailVerification';

export default function EmailVerificationModal({ email, isOpen, onSuccess, onCancel }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [success, setSuccess] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = code.split('');
    newCode[index] = value;
    setCode(newCode.join(''));

    // Move to next input
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-verify if all digits entered
    if (newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async (verificationCode = code) => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyEmail(email, verificationCode);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess(result);
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      setCode('');
      inputRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');

    try {
      await resendVerificationCode(email);
      setCountdown(60);
      setSuccess(false);
      setCode('');
      inputRefs[0].current?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg max-w-md w-full p-8 border border-gray-700 text-center">
          <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheck className="text-green-400 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
          <p className="text-gray-400">Your email has been successfully verified.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-8 border border-gray-700">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <FaEnvelope className="text-blue-400 text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
          <p className="text-gray-400 text-sm mt-2">
            We've sent a verification code to<br />
            <span className="font-semibold text-gray-300">{email}</span>
          </p>
        </div>

        {/* Code Input */}
        <div className="space-y-4 mb-6">
          <label className="text-sm font-semibold text-gray-200">Enter 6-digit code</label>
          <div className="flex gap-2 justify-center">
            {[0, 1, 2, 3, 4, 5].map(idx => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                maxLength="1"
                value={code[idx] || ''}
                onChange={(e) => handleCodeChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={loading}
                className="w-12 h-12 text-center text-2xl font-bold bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-6 flex gap-3">
            <FaExclamationCircle className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={() => handleVerify()}
          disabled={loading || code.length !== 6}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition mb-4"
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>

        {/* Resend Code */}
        <div className="text-center">
          {countdown > 0 ? (
            <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
              <FaClock size={14} /> Resend code in {countdown}s
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-blue-400 hover:text-blue-300 text-sm font-semibold flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
            >
              <FaRedo size={14} /> Didn't receive code? Resend
            </button>
          )}
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          disabled={loading}
          className="w-full border border-gray-600 text-gray-300 py-2 rounded-lg mt-4 hover:bg-gray-700 transition disabled:opacity-50"
        >
          Cancel
        </button>

        {/* Info Message */}
        <p className="text-gray-500 text-xs text-center mt-4">
          Check your spam folder if you don't see the email
        </p>
      </div>
    </div>
  );
}
