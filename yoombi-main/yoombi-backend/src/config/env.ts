/**
 * Yoombi Backend — Environment Configuration
 *
 * This module validates ALL required environment variables at startup.
 * If any are missing, the process exits immediately with a clear error.
 * Never use fallback values for secrets.
 */

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        console.error(
            `\n❌  FATAL: Missing required environment variable: ${name}\n` +
            `   Copy yoombi-backend/.env.example to yoombi-backend/.env and fill in the values.\n`
        );
        process.exit(1);
    }
    return value;
}

function optionalEnv(name: string, fallback: string): string {
    return process.env[name] || fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// Required — the server will NOT start without these
// ─────────────────────────────────────────────────────────────────────────────

export const JWT_SECRET = requireEnv('JWT_SECRET');
export const DATABASE_URL = requireEnv('DATABASE_URL');

// ─────────────────────────────────────────────────────────────────────────────
// Optional — server starts, but features may be degraded without them
// ─────────────────────────────────────────────────────────────────────────────

export const PORT = optionalEnv('PORT', '3000');

export const SENDGRID_API_KEY = optionalEnv('SENDGRID_API_KEY', '');
export const SENDGRID_FROM_EMAIL = optionalEnv('SENDGRID_FROM_EMAIL', 'noreply@yoombi.com');
export const FRONTEND_URL = optionalEnv('FRONTEND_URL', 'http://localhost:19006');

export const CLOUDINARY_CLOUD_NAME = optionalEnv('CLOUDINARY_CLOUD_NAME', '');
export const CLOUDINARY_API_KEY = optionalEnv('CLOUDINARY_API_KEY', '');
export const CLOUDINARY_API_SECRET = optionalEnv('CLOUDINARY_API_SECRET', '');
