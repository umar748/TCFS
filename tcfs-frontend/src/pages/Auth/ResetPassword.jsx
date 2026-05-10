import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [token, setToken] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [searchParams]);

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
    setPasswordError("");
    setConfirmPasswordError("");
    setError("");

    if (!password) {
      setPasswordError("Password is required.");
      return false;
    }
    const strongPwd = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()[\]{}.,:;<>\-_=+~`|\\/]).{8,}$/;
    if (!strongPwd.test(password)) {
      setPasswordError("Password must be 8+ chars with letter, number, and special character.");
      return false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password.");
      return false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Password reset successfully! You can now log in with your new password.");
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || "Failed to reset password. Please try again.");
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
            Enter your new password below.
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
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full rounded-lg border px-4 py-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 ${passwordError ? 'border-red-300' : 'border-neutral-300'}`}
                />
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

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full rounded-lg border px-4 py-3 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 ${confirmPasswordError ? 'border-red-300' : 'border-neutral-300'}`}
              />
              {confirmPasswordError && <p className="mt-1 text-sm text-red-600">{confirmPasswordError}</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-black text-white font-medium py-3 hover:bg-neutral-800 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              disabled={loading || !token}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}