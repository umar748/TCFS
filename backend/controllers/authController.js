import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { sendTripMatchNotifications } from '../services/matchingService.js';

const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

export const googleDemo = async (req, res) => {
  try {
    const { name, email, googleId } = req.body || {};
    const safeEmail = email || 'demo.google@tcfs.local';
    let user = await User.findOne({ email: safeEmail });
    if (!user) {
      user = await User.create({
        name: name || 'Google Demo User',
        email: safeEmail,
        googleId: googleId || `google-demo-${Date.now()}`,
        authProvider: 'google',
        role: 'user'
      });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret123', {
      expiresIn: '7d'
    });
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, age, gender, role } = req.body;
    console.log('Register attempt for:', email);

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (!nameRegex.test(String(name).trim())) {
      return res.status(400).json({ success: false, message: 'Name must contain alphabets only' });
    }

    // Password validation: minimum 8 characters and must contain special character
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()[\]{}.,:;<>\-_=+~`|\\/]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters and include a letter, number, and special character (!@#$%^&*...)' 
      });
    }

    let user;
    try {
      user = await User.findOne({ email });
    } catch (dbError) {
      console.error("Database Error in register (findOne):", dbError);
      return res.status(500).json({ success: false, message: 'Database error. Please try again.' });
    }

    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    let salt, hashedPassword;
    try {
      salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    } catch (bcryptError) {
      console.error("Bcrypt Error in register:", bcryptError);
      return res.status(500).json({ success: false, message: 'Password hashing error. Please try again.' });
    }

    try {
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        age,
        gender,
        role: role === 'admin' ? 'admin' : 'user'
      });
    } catch (dbError) {
      console.error("Database Error in register (create):", dbError);
      return res.status(500).json({ success: false, message: 'Failed to create user. Please try again.' });
    }

    let token;
    try {
      token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '7d'
      });
    } catch (jwtError) {
      console.error("JWT Error in register:", jwtError);
      return res.status(500).json({ success: false, message: 'Token generation error. Please try again.' });
    }

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Register Error (Unexpected):", error.message, error.stack);
    res.status(500).json({ success: false, message: 'Server Error. Please try again.' });
  }
};

export const getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    let user;
    try {
      user = await User.findById(req.user.userId).select('-password');
    } catch (dbError) {
      console.error("Database Error in getMe:", dbError);
      return res.status(500).json({ success: false, message: 'Database error. Please try again.' });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    console.error("GetMe Error (Unexpected):", error.message, error.stack);
    res.status(500).json({ success: false, message: 'Server Error. Please try again.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    let user;
    try {
      user = await User.findOne({ email });
    } catch (dbError) {
      console.error("Database Error in login:", dbError);
      return res.status(500).json({ success: false, message: 'Database error. Please try again.' });
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.password) {
      return res.status(400).json({ success: false, message: 'User registered with OAuth. Please use OAuth login.' });
    }

    let isMatch;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error("Bcrypt Error in login:", bcryptError);
      // Treat malformed hashes as invalid credentials to avoid 500
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    let token;
    try {
      token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '7d'
      });
    } catch (jwtError) {
      console.error("JWT Error in login:", jwtError);
      return res.status(500).json({ success: false, message: 'Token generation error. Please try again.' });
    }

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        role: user.role || 'user'
      }
    });

  } catch (error) {
    console.error("Login Error (Unexpected):", error.message, error.stack);
    res.status(500).json({ success: false, message: 'Server Error. Please try again.' });
  }
};

const sendPasswordResetEmail = async (email, resetLink, userName) => {
  let transporter;

  if (process.env.EMAIL_SERVICE === 'ethereal') {
    // Use Ethereal for testing
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Use Gmail or other service
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'TCFS - Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Travel Companion Finder System</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Password Reset</p>
        </div>

        <div style="background: #f3f4f6; padding: 40px 30px; text-align: center;">
          <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
          <p style="color: #6b7280; margin: 20px 0;">Hi ${userName},</p>
          <p style="color: #6b7280; margin: 20px 0;">
            You requested a password reset for your TCFS account. Click the button below to reset your password:
          </p>

          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
            This link will expire in 1 hour for security reasons.
          </p>

          <p style="color: #6b7280; font-size: 12px;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>

        <div style="background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px;">
          <p style="margin: 0;">© 2025 Travel Companion Finder System. All rights reserved.</p>
        </div>
      </div>
    `
  };

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email service not configured. Reset link:', resetLink);
    return;
  }

  const info = await transporter.sendMail(mailOptions);
  return info;
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If an account with that email exists, we have sent a password reset link.' });
    }

    // Generate reset token
    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret123', {
      expiresIn: '1h'
    });

    // Save reset token to user (you might want to add a resetToken field to User model)
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // Try to send the reset email
    try {
      const info = await sendPasswordResetEmail(email, resetLink, user.name);
      console.log(`Password reset email sent to ${email}`);

      // For Ethereal (and other test transports), show the preview URL if available
      let previewUrl;
      try {
        previewUrl = nodemailer.getTestMessageUrl(info);
      } catch (e) {
        // nodemailer can throw if not supported; ignore
      }

      if (previewUrl) {
        console.log(`📧 View email at: ${previewUrl}`);
      }

      return res.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.',
        previewUrl
      });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      // Still return success to not reveal if email exists
    }

    res.json({ success: true, message: 'If an account with that email exists, we have sent a password reset link.' });

  } catch (error) {
    console.error("Forgot Password Error:", error.message);
    res.status(500).json({ success: false, message: 'Server Error. Please try again.' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and password are required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    } catch (jwtError) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if token matches and is not expired
    if (user.resetToken !== token || !user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });

  } catch (error) {
    console.error("Reset Password Error:", error.message);
    res.status(500).json({ success: false, message: 'Server Error. Please try again.' });
  }
};
