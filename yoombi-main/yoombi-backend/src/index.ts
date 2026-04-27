import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import restaurantRoutes from './routes/restaurant';
import loyaltyRoutes from './routes/loyalty';
import storyRoutes from './routes/story';
import reviewRoutes from './routes/review';
import articleRoutes from './routes/article';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notification';
import analyticsRoutes from './routes/analytics';
import cmsRoutes from './routes/cms';
import { authenticateToken, authorizeRole } from './middleware/auth';
import { sanitizeInput } from './middleware/sanitize';
import { PORT } from './config/env';

const app = express();
const prisma = new PrismaClient();


// 1. Logger FIRST (to see EVERYTHING)
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 2. CORS and JSON
app.use(cors());
app.use(express.json());

// 3. Security Middleware (Sanitize JSON body, query, and params)
app.use(sanitizeInput);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cms', cmsRoutes);

// Basic health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        const uptime = process.uptime();
        res.json({ 
            status: 'UP', 
            database: 'CONNECTED',
            uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        res.status(500).json({ status: 'DOWN', database: 'DISCONNECTED', error: (e as any).message });
    }
});

// Admin System Health Endpoint (Mock actual hardware stats for now)
app.get('/api/admin/system/health', authenticateToken, authorizeRole(['ADMIN']), (req: Request, res: Response) => {
    res.json({
        apiLatency: '45ms',
        errorRate: '0.12%',
        serverStatus: 'Online',
        memoryUsage: '42%',
        appVersions: [
            { version: 'v1.4.2', count: '65%' },
            { version: 'v1.4.1', count: '25%' },
            { version: 'v1.3.x', count: '10%' }
        ]
    });
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
