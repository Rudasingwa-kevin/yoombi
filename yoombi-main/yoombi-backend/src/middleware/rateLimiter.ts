import rateLimit from 'express-rate-limit';

// General API rate limiter (e.g. for standard routes)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// Strict limiter for authentication specifically
// Prevents brute-forcing passwords
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register requests per 15 mins
  message: { success: false, message: 'Too many authentication attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for asking verification codes/OTPs
// Prevents spamming emails/SMS
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per hour for sending codes
  message: { success: false, message: 'Too many verification code requests, please wait an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});
