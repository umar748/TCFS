// Email Verification Service
const API_URL = '/api/auth';

export async function sendVerificationEmail(email) {
  try {
    const res = await fetch(`${API_URL}/send-verification-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || 'Failed to send verification email');
    }

    return await res.json();
  } catch (err) {
    throw new Error(err?.message || 'Network error');
  }
}

export async function verifyEmail(email, code) {
  try {
    const res = await fetch(`${API_URL}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, verificationCode: code })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.message || 'Verification failed');
    }

    return await res.json();
  } catch (err) {
    throw new Error(err?.message || 'Network error');
  }
}

export async function resendVerificationCode(email) {
  return sendVerificationEmail(email);
}

export function generateVerificationCodeUI() {
  return {
    length: 6,
    type: 'numeric'
  };
}

// Validation helpers
export function isValidVerificationCode(code) {
  return /^\d{6}$/.test(code);
}

export function formatVerificationCode(code) {
  // Format as: XXX XXX
  const cleaned = code.replace(/\D/g, '').substring(0, 6);
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.substring(0, 3)} ${cleaned.substring(3)}`;
}
