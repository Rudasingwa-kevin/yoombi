// Temporary declarations to suppress IDE errors since node_modules is missing on this machine.
// Once Node.js and npm are installed and 'npm install' is run, these can be safely removed.

declare var process: {
    env: Record<string, string | undefined>;
    exit: (code?: number) => never;
    uptime: () => number;
};

declare module 'express' {
    export interface Request {
        body: any;
        query: any;
        params: any;
        headers: any;
        user?: any;
        [key: string]: any;
    }
    export interface Response {
        status: (code: number) => Response;
        json: (data: any) => Response;
        send: (data: any) => Response;
        [key: string]: any;
    }
    export interface NextFunction {
        (err?: any): void;
    }
    export const Router: any;
    const express: any;
    export default express;
}
declare module 'express-rate-limit';
declare module 'cors';
declare module 'multer';
declare module 'cloudinary';
declare module 'multer-storage-cloudinary';
declare module 'jsonwebtoken';
declare module 'bcryptjs';
declare module '@sendgrid/mail';
declare module '@prisma/client';
declare module 'crypto';
