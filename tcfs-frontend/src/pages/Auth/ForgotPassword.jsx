import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  const validate = () => {
    setEmailError("");
    setError("");

    if (!email) {
      setEmailError("Email is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("If an account with that email exists, we've sent you a password reset link.");
        if (data.previewUrl) {
          setPreviewUrl(data.previewUrl);
        }
      } else {
        setError(data.message || "Failed to send reset email. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex bg-white">
      <div className="w-full lg:w-1/2 bg-slate-900 text-white flex items-center justify-center p-8">
        <div className="max-w-md">
          <div className="mb-6">
            <img src="/logo.jpeg" alt="TCFS" className="h-48 lg:h-56 object-contain mx-auto" />
          </div>
          <h1 className="text-3xl font-bold gradient-text animate-slide-up">
            Reset Your Password
          </h1>
          <p className="mt-4 text-lg text-white animate-fade-in delay-100">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 relative flex items-center justify-center">
        <img src="/register-bg.png.PNG" alt="Travel background" className="absolute inset-0 w-full h-full object-cover hidden lg:block" />
        <div className="absolute inset-0 bg-black/30 hidden lg:block"></div>
        <div className="relative z-10 w-full max-w-sm p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 animate-fade-in">
          {error && (
            <div className="w-full mb-6 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="w-full mb-6 rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm">
              {message}
              {previewUrl && (
                <div className="mt-2 text-xs">
                  <a href={previewUrl} target="_blank" rel="noreferrer" className="font-medium text-teal-700 hover:underline">
                    View the reset email (dev only)
                  </a>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eeltrekker@gmail.com"
                autoComplete="email"
                className={`w-full rounded-lg border px-4 py-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 ${emailError ? 'border-red-300' : 'border-neutral-300'}`}
              />
              {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-black text-white font-medium py-3 hover:bg-neutral-800 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              disabled={loading}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
            </button>
          </form>

          <p className="text-center text-sm text-neutral-600 mt-6">
            Remember your password?{" "}
            <Link to="/login" className="font-medium text-neutral-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}