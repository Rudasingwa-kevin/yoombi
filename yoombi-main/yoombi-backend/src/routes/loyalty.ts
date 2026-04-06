import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/loyalty/check-in
// Award points for visiting a restaurant
router.post('/check-in', authenticateToken, async (req: any, res: Response) => {
    const { restaurantId } = req.body;
    const userId = req.user.id;

    if (!restaurantId) {
        return res.status(400).json({ error: 'restaurantId is required' });
    }

    try {
        // In a real app, we'd verify the user is actually at the restaurant (e.g., GPS or QR code)
        // For now, we'll just increment points.
        
        // Create a visit record AND increment points in a transaction
        const [visit, updatedUser] = await prisma.$transaction([
            prisma.visit.create({
                data: {
                    userId,
                    restaurantId,
                    pointsEarned: 50
                }
            }),
            prisma.user.update({
                where: { id: userId },
                data: {
                    loyaltyPoints: {
                        increment: 50
                    }
                }
            })
        ]);

        res.json({
            success: true,
            message: 'Check-in successful! Experience recorded.',
            pointsEarned: 50,
            totalPoints: updatedUser.loyaltyPoints,
            visitId: visit.id
        });
    } catch (error) {
        console.error('[Loyalty] Check-in error:', error);
        res.status(500).json({ error: 'Failed to process check-in' });
    }
});

// GET /api/loyalty/visits
// Retrieve all experiences for the current user
router.get('/visits', authenticateToken, async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const visits = await prisma.visit.findMany({
            where: { userId },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        area: true,
                        cuisine: true,
                        images: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: visits });
    } catch (error) {
        console.error('[Loyalty] Fetch visits error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch experiences' });
    }
});

export default router;
