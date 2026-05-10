import express from 'express';
import { sendVerificationEmail, verifyEmailCode, resendVerificationCode } from '../controllers/emailController.js';

const router = express.Router();

router.post('/send-verification-email', sendVerificationEmail);
router.post('/verify-email', verifyEmailCode);
router.post('/resend-verification-code', resendVerificationCode);

export default router;
