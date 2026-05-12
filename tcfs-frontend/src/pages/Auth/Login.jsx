import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as apiLogin, storeToken, setUser } from "../../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const getPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[!@#$%^&*()[\]{}.,:;<>\-_=+~`|\\/]/.test(pwd)) strength++;
    return strength;
  };

  const getStrengthLabel = (strength) => {
    if (strength <= 2) return { label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { label: 'Medium', color: 'bg-yellow-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  const validate = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setError("");

    if (!email) {
      setEmailError("Email is required.");
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError("Please enter a valid email address.");
        isValid = false;
      }
    }

    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else {
      const strongPwd = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()[\]{}.,:;<>\-_=+~`|\\/]).{8,}$/;
      if (!strongPwd.test(password)) {
        setPasswordError("Password must be 8+ chars with letter, number, and special character.");
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await apiLogin({ email, password });
      storeToken(data?.token);
      
      // Store user info and redirect based on role
      if (data?.user) {
        setUser(data.user);
        if (data.user.role === 'admin') {
          navigate("/dashboard/admin");
        } else {
          navigate("/dashboard/user");
        }
      } else {
        navigate("/dashboard/user");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a4d5c] via-[#1a7a8a] to-[#2da5bb] px-6 py-8">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Info Panel */}
        <div className="relative bg-gradient-to-br from-[#0a4d5c] via-[#1a7a8a] to-[#2da5bb] text-white p-10 lg:p-12">
          {/* Decorative bubbles */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-pulse" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl animate-bounce" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-48 w-48 rounded-full bg-indigo-400/15 blur-2xl animate-ping" />

          <div className="relative max-w-md">
            <div className="mb-8 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <span className="text-4xl">✈️</span>
              </div>
            </div>

            <h1 className="text-4xl font-black tracking-tight leading-tight mb-6">
              Travel Companion<br />
              <span className="gradient-text">& Finder System</span>
            </h1>

            <p className="text-lg text-white/85 mb-10">Find your perfect travel companion and explore life together.</p>

            <ul className="space-y-6 mb-10">
              <li className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xl">
                  ✓
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Verified Travelers</h3>
                  <p className="text-sm text-white/80">Connect with verified travelers safely and build trust before your journey.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xl">
                  💬
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Real-Time Planning</h3>
                  <p className="text-sm text-white/80">Chat in real-time to plan every detail of your adventure together.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xl">
                  🗺️
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Curated Experiences</h3>
                  <p className="text-sm text-white/80">Discover verified trip plans and authentic experiences from fellow travelers.</p>
                </div>
              </li>
            </ul>

            <p className="text-base text-white/70 border-t border-white/15 pt-6">
              Join <strong className="text-orange-300">10,000+ travelers</strong> who've found their perfect adventure partner.
            </p>
          </div>
        </div>

        {/* Right Login Form */}
        <div className="relative bg-white p-10 lg:p-12">
          <div className="max-w-md mx-auto">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
              <p className="text-sm text-slate-600">Enter your credentials to access your account</p>
            </div>

            {error && !emailError && !passwordError && (
              <div className="w-full mb-6 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full rounded-xl border border-slate-200 px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] transition ${emailError ? 'border-red-300' : 'border-slate-200'}`}
                />
                {emailError && <p className="mt-2 text-sm text-red-600">{emailError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`w-full rounded-xl border border-slate-200 px-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] transition ${passwordError ? 'border-red-300' : 'border-slate-200'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      )}
                    </svg>
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getStrengthLabel(getPasswordStrength(password)).color}`}
                          style={{ width: `${(getPasswordStrength(password) / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-500">{getStrengthLabel(getPasswordStrength(password)).label}</span>
                    </div>
                  </div>
                )}
                {passwordError && <p className="mt-2 text-sm text-red-600">{passwordError}</p>}
                <div className="text-right mt-2">
                  <Link to="/forgot-password" className="text-sm text-[#1a7a8a] hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 focus:ring-[#1a7a8a]"
                />
                <label htmlFor="rememberMe" className="text-sm text-slate-600">
                  Remember me
                </label>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 focus:ring-[#1a7a8a] mt-0.5"
                />
                <label htmlFor="terms" className="text-sm text-slate-600">
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#1a7a8a] hover:underline">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-[#1a7a8a] hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-[#1a7a8a] to-[#2da5bb] text-white font-semibold py-3 hover:shadow-lg transition"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign in to your account'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-[#1a7a8a] hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
