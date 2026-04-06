import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, authorizeRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/stories
 * Returns all active stories from all restaurants
 */
router.get('/', async (req, res) => {
    try {
        const stories = await prisma.story.findMany({
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        images: true, // using first image as avatar placeholder if needed
                    }
                },
                items: {
                    orderBy: { createdAt: 'desc' },
                    take: 10 // only recent items
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Format to match frontend DTO
        const formatted = stories.map((s: any) => ({
            restaurantId: s.restaurantId,
            restaurantName: s.restaurant.name,
            avatar: s.restaurant.images[0] || '', // Fallback to first restaurant image
            stories: s.items.map((item: any) => ({
                id: item.id,
                imageUrl: item.url || '',
                text: item.text || '',
                type: item.type.toLowerCase(), // image, video, text
                createdAt: item.createdAt.toISOString()
            }))
        })).filter((s: any) => s.stories.length > 0);

        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('[STORY] Fetch all error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * POST /api/stories/:restaurantId
 * Add a story item to a restaurant. (OWNER/ADMIN only)
 */
router.post('/:restaurantId', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const { restaurantId } = req.params as { restaurantId: string };
        const { type, url, text, duration } = req.body;
        const userId = req.user?.id;

        // Verify ownership if not ADMIN
        if (req.user?.role === 'OWNER') {
             const restaurant = await prisma.restaurant.findUnique({
                 where: { id: restaurantId },
                 select: { ownerId: true }
             });
             if (!restaurant || restaurant.ownerId !== userId) {
                 return res.status(403).json({ success: false, message: 'Unauthorized: You do not own this restaurant' });
             }
        }

        // Find or create Story for this restaurant
        let story = await prisma.story.findFirst({
            where: { restaurantId }
        });

        if (!story) {
            story = await prisma.story.create({
                data: { restaurantId }
            });
        }

        // Create StoryItem
        const item = await prisma.storyItem.create({
            data: {
                storyId: story.id,
                type: type || 'IMAGE', // IMAGE, VIDEO, TEXT
                url,
                text,
                duration: duration || 5
            }
        });

        // Update story timestamp
        await prisma.story.update({
            where: { id: story.id },
            data: { updatedAt: new Date() }
        });

        res.json({ success: true, data: item });
    } catch (error) {
        console.error('[STORY] Add item error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/stories/:restaurantId/items/:itemId
router.delete('/:restaurantId/items/:itemId', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { restaurantId, itemId } = req.params as { restaurantId: string, itemId: string };
        const userId = req.user?.id;

        if (req.user?.role !== 'ADMIN') {
            const restaurant = await prisma.restaurant.findUnique({
                where: { id: restaurantId }
            });

            if (!restaurant || restaurant.ownerId !== userId) {
                return res.status(403).json({ success: false, message: 'Unauthorized' });
            }
        }

        await (prisma as any).storyItem.delete({
            where: { id: itemId }
        });

        res.json({ success: true, message: 'Item deleted' });
    } catch (error) {
        console.error('[STORY] Delete item error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router;
