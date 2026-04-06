import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/reviews
 * Creates a new restaurant review
 */
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { restaurantId, rating, comment } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const review = await prisma.review.create({
            data: {
                rating: Number(rating),
                text: comment,
                userId,
                restaurantId
            },
            include: {
                user: {
                    select: { name: true, avatar: true }
                }
            }
        });

        // Update restaurant average rating (optional but recommended)
        const allReviews = await prisma.review.findMany({
            where: { restaurantId },
            select: { rating: true }
        });
        const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        
        await prisma.restaurant.update({
            where: { id: restaurantId },
            data: { 
                rating: averageRating,
                totalReviews: allReviews.length
            }
        });

        res.status(201).json({ 
            success: true, 
            data: {
                id: review.id,
                rating: review.rating,
                comment: review.text,
                userName: review.user.name,
                userAvatar: review.user.avatar,
                createdAt: review.createdAt.toISOString()
            } 
        });
    } catch (error) {
        console.error('[REVIEW] Create error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * PATCH /api/reviews/:id/reply
 * Allows a restaurant owner to reply to a review
 */
router.patch('/:id/reply', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { reply } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        // 1. Find the review and its restaurant to check ownership
        const review = await prisma.review.findUnique({
            where: { id: String(id) },
            include: {
                restaurant: {
                    select: { ownerId: true }
                }
            }
        });

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (review.restaurant.ownerId !== userId) {
            return res.status(403).json({ success: false, message: 'Only the restaurant owner can reply to this review' });
        }

        // 2. Update the review with owner reply
        const updatedReview = await prisma.review.update({
            where: { id: String(id) },
            data: {
                ownerReply: String(reply),
                repliedAt: new Date()
            }
        });

        res.json({ 
            success: true, 
            data: {
                ...updatedReview,
                comment: updatedReview.text // Sync field name if needed
            } 
        });
    } catch (error) {
        console.error('[REVIEW] Reply error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * POST /api/reviews/:id/flag
 * Allows users to report inappropriate reviews
 */
router.post('/:id/flag', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const { reason } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        // In a real app: Create a Flag/Report record in the DB
        console.log(`[REVIEW] Review ${id} flagged by user ${userId} for reason: ${reason}`);

        res.json({ success: true, message: 'Review reported successfully' });
    } catch (error) {
        console.error('[REVIEW] Flag error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router;
