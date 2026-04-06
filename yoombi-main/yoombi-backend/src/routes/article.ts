import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET all published articles
router.get('/', async (req, res) => {
    try {
        const articles = await prisma.article.findMany({
            where: { status: 'Published' },
            orderBy: { createdAt: 'desc' },
            include: {
                restaurant: {
                    select: {
                        name: true,
                    }
                }
            }
        });

        // Format to match frontend expectations
        const formattedArticles = articles.map(article => ({
            id: article.id,
            title: article.title,
            content: article.content,
            category: article.category,
            imageUrl: article.imageUrl,
            date: article.createdAt.toISOString(),
            status: article.status,
            restaurantName: article.restaurant.name,
            restaurantId: article.restaurantId
        }));

        res.json({ success: true, data: formattedArticles });
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ success: false, message: 'Server error fetching articles' });
    }
});

// GET specific article by ID
router.get('/:id', async (req, res) => {
    try {
        const article = await prisma.article.findUnique({
            where: { id: req.params.id as string },
            include: {
                restaurant: {
                    select: {
                        name: true,
                    }
                }
            }
        });

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        const formattedArticle = {
            id: article.id,
            title: article.title,
            content: article.content,
            category: article.category,
            imageUrl: article.imageUrl,
            date: article.createdAt.toISOString(),
            status: article.status,
            restaurantName: article.restaurant.name,
            restaurantId: article.restaurantId
        };

        res.json({ success: true, data: formattedArticle });
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).json({ success: false, message: 'Server error fetching article' });
    }
});

// POST new article (Owner/Admin only)
router.post('/', authenticateToken, authorizeRole(['OWNER', 'ADMIN']), async (req: AuthRequest, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { title, content, category, imageUrl, status, restaurantId } = req.body;

        if (!title || !content || !category) {
            return res.status(400).json({ success: false, message: 'Title, content and category are required' });
        }

        let targetRestaurantId = restaurantId;

        // If it's an owner, find their restaurant. If Admin and targetRestaurantId wasn't provided, 
        // they must provide it.
        if (user.role === 'OWNER') {
            const restaurant = await prisma.restaurant.findFirst({
                where: { ownerId: user.id }
            });
            if (!restaurant) {
                return res.status(400).json({ success: false, message: 'You do not have a restaurant to post an article for.' });
            }
            targetRestaurantId = restaurant.id;
        } else if (user.role === 'ADMIN' && !targetRestaurantId) {
            return res.status(400).json({ success: false, message: 'Admins must provide a restaurantId.' });
        }

        const article = await prisma.article.create({
            data: {
                title,
                content,
                category,
                imageUrl: imageUrl || null,
                status: status || 'Published',
                restaurantId: targetRestaurantId
            }
        });

        res.status(201).json({ success: true, data: article });
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ success: false, message: 'Server error creating article' });
    }
});

/**
 * PATCH /api/articles/:id
 * Only Owner of the restaurant or ADMIN can update.
 */
router.patch('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, imageUrl, status } = req.body;
    const user = req.user;

    const article = await prisma.article.findUnique({
      where: { id: id as string },
      include: { restaurant: true }
    }) as any;

    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });

    // Auth check: Admin or the Owner of the restaurant
    if (user?.role !== 'ADMIN' && article.restaurant.ownerId !== user?.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updated = await prisma.article.update({
      where: { id: id as string },
      data: {
        title: title ?? article.title,
        content: content ?? article.content,
        category: category ?? article.category,
        imageUrl: imageUrl ?? article.imageUrl,
        status: status ?? article.status
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ success: false, message: 'Server error updating article' });
  }
});

/**
 * DELETE /api/articles/:id
 */
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const article = await prisma.article.findUnique({
      where: { id: id as string },
      include: { restaurant: true }
    }) as any;

    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });

    if (user?.role !== 'ADMIN' && article.restaurant.ownerId !== user?.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.article.delete({ where: { id: id as string } });
    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ success: false, message: 'Server error deleting article' });
  }
});

export default router;
