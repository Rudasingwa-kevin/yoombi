import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest, authorizeRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/cms
 * Public endpoint to fetch active homepage sections with resolved restaurant data
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const sections = await prisma.homepageSection.findMany({
            where: { active: true },
            orderBy: { order: 'asc' }
        });

        const resolvedSections = await Promise.all(sections.map(async (section: any) => {
            let restaurants: any[] = [];

            if (section.type === 'DYNAMIC') {
                if (section.criteria === 'TOP_RATED') {
                    restaurants = await prisma.restaurant.findMany({
                        where: { isApproved: true },
                        orderBy: { rating: 'desc' },
                        take: 6
                    });
                } else if (section.criteria === 'NEW_COMERS') {
                    restaurants = await prisma.restaurant.findMany({
                        where: { isApproved: true },
                        orderBy: { createdAt: 'desc' },
                        take: 6
                    });
                } else if (section.criteria === 'EXCLUSIVE') {
                    restaurants = await prisma.restaurant.findMany({
                        where: { isApproved: true, isMichelin: true },
                        orderBy: { rating: 'desc' },
                        take: 6
                    });
                }
            } else {
                // MANUAL type
                restaurants = await prisma.restaurant.findMany({
                    where: { 
                        id: { in: section.restaurantIds },
                        isApproved: true
                    }
                });
                // Sort manual restaurants to match the order in restaurantIds array if possible
                const restaurantMap = new Map(restaurants.map(r => [r.id, r]));
                restaurants = section.restaurantIds
                    .map((id: string) => restaurantMap.get(id))
                    .filter(Boolean);
            }

            return {
                ...section,
                restaurants: restaurants.map(r => ({
                    ...r,
                    totalReviews: 0, // Simplified for homepage list
                    followers: 0
                }))
            };
        }));

        res.json({ success: true, data: resolvedSections });
    } catch (error) {
        console.error('[CMS] Fetch sections error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/cms/admin
 * Admin endpoint to fetch all sections (including inactive ones)
 */
router.get('/admin', authenticateToken, authorizeRole(['ADMIN']), async (req: Request, res: Response) => {
    try {
        const sections = await prisma.homepageSection.findMany({
            orderBy: { order: 'asc' }
        });
        res.json({ success: true, data: sections });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * POST /api/cms
 * Create a new homepage section
 */
router.post('/', authenticateToken, authorizeRole(['ADMIN']), async (req: Request, res: Response) => {
    try {
        const { title, subtitle, type, criteria, restaurantIds, order, active } = req.body;
        
        const section = await prisma.homepageSection.create({
            data: {
                title,
                subtitle,
                type: type || 'DYNAMIC',
                criteria,
                restaurantIds: restaurantIds || [],
                order: order || 0,
                active: active !== undefined ? active : true
            }
        });

        res.json({ success: true, data: section });
    } catch (error) {
        console.error('[CMS] Create section error:', error);
        res.status(500).json({ success: false, message: 'Failed to create section' });
    }
});

/**
 * PATCH /api/cms/:id
 * Update a homepage section
 */
router.patch('/:id', authenticateToken, authorizeRole(['ADMIN']), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const section = await prisma.homepageSection.update({
            where: { id },
            data
        });

        res.json({ success: true, data: section });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update section' });
    }
});

/**
 * DELETE /api/cms/:id
 * Delete a homepage section
 */
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.homepageSection.delete({ where: { id } });
        res.json({ success: true, message: 'Section deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete section' });
    }
});

export default router;
