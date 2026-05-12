import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as apiRegister, storeToken, setUser } from "../../services/auth";

const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState("");

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
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setTermsError("");
    setError("");

    if (!fullName.trim()) {
      setNameError("Full name is required.");
      isValid = false;
    } else if (!nameRegex.test(fullName.trim())) {
      setNameError("Name must contain alphabets only.");
      isValid = false;
    }

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

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password.");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      isValid = false;
    }

    if (!termsAccepted) {
      setTermsError("You must accept the Terms and Conditions to continue.");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await apiRegister({ name: fullName, email, password, role });
      storeToken(data?.token);
      if (data?.user) {
        // save user info locally
        setUser(data.user);
      }
      navigate("/dashboard");
    } catch (err) {
      const msg = err?.message || "Registration failed. Try again.";
      if (/name must contain alphabets only/i.test(msg)) {
        setNameError("Name must contain alphabets only.");
      } else if (/password must/i.test(msg)) {
        setPasswordError(msg);
      } else if (/email/i.test(msg) && /exist|already|taken/i.test(msg)) {
        setEmailError("Email already exists.");
      } else if (/user already exists/i.test(msg)) {
        setEmailError("Email already exists.");
      } else {
        setError(msg);
      }
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
              Start Your<br />
              <span className="gradient-text">Adventure Today</span>
            </h1>

            <p className="text-lg text-white/85 mb-10">
              Join thousands of travelers finding their perfect companions for unforgettable journeys.
            </p>

            <ul className="space-y-6 mb-10">
              <li className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xl">
                  🌍
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Global Community</h3>
                  <p className="text-sm text-white/80">Connect with travelers from 150+ countries worldwide.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-xl">
                  🔒
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Safe & Verified</h3>
                  <p className="text-sm text-white/80">Every user is verified for your safety and peace of mind.</p>
                </div>
              </li>
            </ul>

            <p className="text-base text-white/70 border-t border-white/15 pt-6">
              Join <strong className="text-orange-300">10,000+ travelers</strong> on their next journey.
            </p>
          </div>
        </div>

        {/* Right Register Form */}
        <div className="relative flex items-center justify-center p-8">
          <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl border border-white/20">
            {error && !nameError && !emailError && !passwordError && !confirmPasswordError && (
              <div className="w-full mb-6 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
              <p className="text-sm text-slate-600 mt-2">Get started with your free account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                const nextValue = e.target.value.replace(/[^A-Za-z ]/g, "");
                setFullName(nextValue);
                if (nameError) setNameError("");
              }}
              placeholder="John Doe"
              className={`w-full rounded-lg border px-4 py-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 ${nameError ? 'border-red-300' : 'border-neutral-300'}`}
            />
            {nameError && <p className="mt-1 text-sm text-red-600">{nameError}</p>}
          </div>

          {/* Email */}
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

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full rounded-lg border px-4 py-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 ${passwordError ? 'border-red-300' : 'border-neutral-300'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
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
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getStrengthLabel(getPasswordStrength(password)).color}`}
                      style={{ width: `${(getPasswordStrength(password) / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">{getStrengthLabel(getPasswordStrength(password)).label}</span>
                </div>
              </div>
            )}
            {passwordError && <p className="mt-1 text-sm text-red-600">{passwordError}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className={`w-full rounded-lg border px-4 py-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 ${confirmPasswordError ? 'border-red-300' : 'border-neutral-300'}`}
            />
            {confirmPasswordError && <p className="mt-1 text-sm text-red-600">{confirmPasswordError}</p>}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Terms and Conditions */}
          <div>
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 focus:ring-teal-400 mt-0.5"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-neutral-600">
                I agree to the{" "}
                <Link to="/terms" className="text-teal-600 hover:text-teal-800 hover:underline">
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-teal-600 hover:text-teal-800 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {termsError && <p className="mt-1 text-sm text-red-600">{termsError}</p>}
          </div>

          {/* Submit Button */}
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
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
          </button>
        </form>

        {/* Sign In Link */}
        <p className="text-center text-sm text-neutral-600 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-neutral-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  </div>
</div>
  );
}
