import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

/**
 * Recursively sanitize objects and arrays using xss
 * @param obj - The object, array, or string to sanitize
 * @returns The sanitized version
 */
const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'string') {
        // Strip out dangerous HTML tags and scripts
        return xss(obj.trim());
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
        const sanitizedObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
            // Also sanitize the key, just in case (optional, but safe)
            const safeKey = xss(key);
            sanitizedObj[safeKey] = sanitizeObject(value);
        }
        return sanitizedObj;
    }

    // Return numbers, booleans, etc. as they are
    return obj;
};

/**
 * Express middleware to sanitize incoming request payload (body, query, params)
 * Protects against Cross-Site Scripting (XSS) and object pollution.
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
        for (const key of Object.keys(req.body)) {
            req.body[key] = sanitizeObject(req.body[key]);
        }
    }
    
    if (req.query && typeof req.query === 'object') {
        for (const key of Object.keys(req.query)) {
            req.query[key] = sanitizeObject(req.query[key]) as any;
        }
    }
    
    if (req.params && typeof req.params === 'object') {
        for (const key of Object.keys(req.params)) {
            req.params[key] = sanitizeObject(req.params[key]);
        }
    }

    next();
};
