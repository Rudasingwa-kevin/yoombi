import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/analytics/me
 * Returns analytics for the current restaurant owner
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        // 1. Find the restaurant belonging to this owner
        const restaurant = await prisma.restaurant.findFirst({
            where: { ownerId: userId },
            include: {
                _count: {
                    select: { followers: true, reviews: true }
                }
            }
        });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        // 2. Fetch Aggregated Metrics
        // Average Rating
        const reviewStats = await prisma.review.aggregate({
            where: { restaurantId: restaurant.id },
            _avg: { rating: true }
        });

        // Profile Views (using Visit count)
        const totalViews = await prisma.visit.count({
            where: { restaurantId: restaurant.id }
        });

        // 3. Generate Performance Chart Data (Last 7 Days)
        const last7Days: any[] = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Count visits for this specific day
            const dayStart = new Date(date);
            dayStart.setHours(0,0,0,0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23,59,59,999);

            const dayViews = await prisma.visit.count({
                where: {
                    restaurantId: restaurant.id,
                    createdAt: { gte: dayStart, lte: dayEnd }
                }
            });

            last7Days.push({
                label: `D${7 - i}`,
                value: dayViews || Math.floor(Math.random() * 20) // Random fallback for dev visual
            });
        }

        res.json({
            success: true,
            data: {
                restaurantId: restaurant.id,
                totalFollowers: restaurant._count.followers,
                totalReviews: restaurant._count.reviews,
                averageRating: reviewStats._avg.rating || 0,
                profileViews: totalViews || 0,
                viewsOverTime: last7Days,
                reviewsOverTime: [] // Not used by current dashboard but in DTO
            }
        });

    } catch (error) {
        console.error('[ANALYTICS] Me Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router;
