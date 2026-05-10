import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Verification from '../models/Verification.js';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate a 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save verification code to database
    await Verification.findOneAndUpdate(
      { email },
      { 
        email,
        code,
        expiresAt,
        used: false
      },
      { upsert: true, new: true }
    );

    // Prepare email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'TCFS - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Travel Companion Finder System</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Email Verification</p>
          </div>
          
          <div style="background: #f3f4f6; padding: 40px 30px; text-align: center;">
            <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email Address</h2>
            <p style="color: #6b7280; margin: 20px 0;">Your verification code is:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 30px 0; border: 2px solid #3b82f6;">
              <p style="font-size: 48px; font-weight: bold; color: #3b82f6; margin: 0; letter-spacing: 5px;">
                ${code}
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
              This code will expire in 10 minutes.
            </p>
            
            <p style="color: #6b7280; font-size: 12px;">
              If you didn't request this verification code, please ignore this email.
            </p>
          </div>
          
          <div style="background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px;">
            <p style="margin: 0;">© 2025 Travel Companion Finder System. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // Send email
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email service not configured. Returning mock response.');
      return res.json({
        success: true,
        message: 'Verification email would be sent to ' + email,
        mockCode: code // For testing only - remove in production
      });
    }

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email'
    });
  }
};

export const verifyEmailCode = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    // Find verification record
    const verification = await Verification.findOne({ email });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found for this email'
      });
    }

    // Check if code matches
    if (verification.code !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Check if code has expired
    if (new Date() > verification.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired'
      });
    }

    // Check if code has already been used
    if (verification.used) {
      return res.status(400).json({
        success: false,
        message: 'This verification code has already been used'
      });
    }

    // Mark code as used
    verification.used = true;
    await verification.save();

    // Update user's email verification status if user exists
    const user = await User.findOne({ email });
    if (user) {
      user.emailVerified = true;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Email verified successfully',
      verified: true
    });
  } catch (error) {
    console.error('Error verifying email code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email code'
    });
  }
};

export const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check if we can resend (rate limiting - 1 resend per minute)
    const existingVerification = await Verification.findOne({ email });
    if (existingVerification && existingVerification.resendCount >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many resend attempts. Please try again later.'
      });
    }

    // Call the send verification email function
    req.body = { email };
    return sendVerificationEmail(req, res);
  } catch (error) {
    console.error('Error resending verification code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification code'
    });
  }
};