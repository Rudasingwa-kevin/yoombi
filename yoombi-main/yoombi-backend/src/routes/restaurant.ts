import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/restaurants
 * Returns a list of all restaurants
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { city, cuisine, search, vibe, dressCode, isMichelin, isTrending } = req.query;
        const where: any = { AND: [] };
 
        if (city) where.AND.push({ city: city as string });
        if (cuisine) where.AND.push({ cuisine: { contains: cuisine as string, mode: 'insensitive' } });
        
        if (vibe) where.AND.push({ vibe: vibe as string });
        if (dressCode) where.AND.push({ dressCode: dressCode as string });
        if (isMichelin === 'true') where.AND.push({ isMichelin: true });
        if (isTrending === 'true') where.AND.push({ isTrending: true });

        if (search) {
            const searchTerm = search as string;
            where.AND.push({
                OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { description: { contains: searchTerm, mode: 'insensitive' } },
                    { cuisine: { contains: searchTerm, mode: 'insensitive' } },
                    { vibe: { contains: searchTerm, mode: 'insensitive' } },
                    { menuItems: { some: { 
                        OR: [
                            { name: { contains: searchTerm, mode: 'insensitive' } },
                            { description: { contains: searchTerm, mode: 'insensitive' } }
                        ]
                    }}}
                ]
            });
        }

        const restaurants = await prisma.restaurant.findMany({
            where: where.AND.length > 0 ? where : {},
            include: {
                _count: {
                    select: { followers: true, reviews: true, likes: true }
                }
            },
            orderBy: { rating: 'desc' }
        });

        // Map to include totalReviews/followers count from _count
        const formatted = restaurants.map((r: any) => ({
            ...r,
            totalReviews: r._count.reviews,
            followers: r._count.followers,
            likes: r._count.likes
        }));

        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('[RESTAURANT] Fetch all error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/restaurants/mine
 * Returns the restaurant owned by the current user
 */
router.get('/mine', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const restaurant = await prisma.restaurant.findFirst({
            where: { ownerId: userId },
            include: {
                _count: {
                    select: { followers: true, reviews: true, likes: true }
                }
            }
        });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        res.json({
            success: true,
            data: {
                ...restaurant,
                totalReviews: restaurant._count.reviews,
                followers: restaurant._count.followers,
                likes: restaurant._count.likes
            }
        });
    } catch (error) {
        console.error('[RESTAURANT] Mine fetch error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/restaurants/:id
 * Returns a single restaurant detail
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const restaurant = await prisma.restaurant.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { followers: true, reviews: true, likes: true }
                }
            }
        });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        res.json({
            success: true,
            data: {
                ...restaurant,
                totalReviews: restaurant._count.reviews,
                followers: restaurant._count.followers,
                likes: restaurant._count.likes
            }
        });
    } catch (error) {
        console.error('[RESTAURANT] Fetch single error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/restaurants/:id/menu
 * Returns menu items for a restaurant
 */
router.get('/:id/menu', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const menuItems = await prisma.menuItem.findMany({
            where: { restaurantId: id, available: true },
            orderBy: { category: 'asc' }
        });
        res.json({ success: true, data: menuItems });
    } catch (error) {
        console.error('[RESTAURANT] Fetch menu error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/restaurants/:id/reviews
 * Returns (paginated) reviews for a restaurant
 */
router.get('/:id/reviews', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 5;
        const skip = (page - 1) * limit;

        const [reviews, total] = await prisma.$transaction([
            prisma.review.findMany({
                where: { restaurantId: id },
                include: { user: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.review.count({ where: { restaurantId: id } })
        ]);

        const formatted = reviews.map((r: any) => ({
            id: r.id,
            rating: r.rating,
            comment: r.text,
            userName: r.user.name,
            userAvatar: r.user.avatar,
            createdAt: r.createdAt.toISOString()
        }));

        res.json({
            success: true,
            data: formatted,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('[RESTAURANT] Fetch reviews error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * GET /api/restaurants/:id/followers
 * Returns a list of users who follow this restaurant
 */
router.get('/:id/followers', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const followers = await prisma.follow.findMany({
            where: { restaurantId: id },
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        });

        const formattedFollowers = followers.map((f: any) => ({
            id: f.user.id,
            name: f.user.name,
            avatar: f.user.avatar,
            since: f.createdAt.toISOString()
        }));

        res.json({ success: true, data: formattedFollowers });
    } catch (error) {
        console.error('[RESTAURANT] Fetch followers error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * POST /api/restaurants/:id/follow
 * Current user follows a restaurant. Awards 5 loyalty points.
 */
router.post('/:id/follow', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        // Check if already following
        const existing = await prisma.follow.findUnique({
            where: {
                userId_restaurantId: { userId, restaurantId: id }
            }
        });

        if (existing) {
            return res.status(400).json({ success: false, message: 'Already following' });
        }

        // Create follow and award points in a transaction
        await prisma.$transaction([
            prisma.follow.create({
                data: { userId, restaurantId: id }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { loyaltyPoints: { increment: 5 } }
            })
        ]);

        res.json({ success: true, message: 'Followed successfully' });
    } catch (error) {
        console.error('[RESTAURANT] Follow error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * POST /api/restaurants/:id/like
 * Current user likes a restaurant. Awards 2 loyalty points.
 */
router.post('/:id/like', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        // Check if already liked
        const existing = await prisma.like.findUnique({
            where: {
                userId_restaurantId: { userId, restaurantId: id }
            }
        });

        if (existing) {
            return res.status(400).json({ success: false, message: 'Already liked' });
        }

        // Create like and award points in a transaction
        await prisma.$transaction([
            prisma.like.create({
                data: { userId, restaurantId: id }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { loyaltyPoints: { increment: 2 } }
            })
        ]);

        res.json({ success: true, message: 'Liked successfully' });
    } catch (error) {
        console.error('[RESTAURANT] Like error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * DELETE /api/restaurants/:id/like
 * Current user unlikes a restaurant.
 */
router.delete('/:id/like', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        await prisma.like.delete({
            where: {
                userId_restaurantId: { userId, restaurantId: id }
            }
        });

        res.json({ success: true, message: 'Unliked successfully' });
    } catch (error) {
        // If not found, ignore
        if ((error as any).code === 'P2025') {
            return res.json({ success: true, message: 'Not liked' });
        }
        console.error('[RESTAURANT] Unlike error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * DELETE /api/restaurants/:id/follow
 * Current user unfollows a restaurant.
 */
router.delete('/:id/follow', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        await prisma.follow.delete({
            where: {
                userId_restaurantId: { userId, restaurantId: id }
            }
        });

        res.json({ success: true, message: 'Unfollowed successfully' });
    } catch (error) {
        // If not found, ignore
        if ((error as any).code === 'P2025') {
            return res.json({ success: true, message: 'Not following' });
        }
        console.error('[RESTAURANT] Unfollow error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * DELETE /api/restaurants/:id/images
 * Remove an image from the restaurant gallery.
 */
router.delete('/:id/images', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const imageUrl = req.body.imageUrl as string;
        const userId = req.user?.id;

        const restaurant = await prisma.restaurant.findUnique({
            where: { id },
            select: { ownerId: true, images: true }
        });

        if (!restaurant || restaurant.ownerId !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const newImages = restaurant.images.filter((img: string) => img !== imageUrl);
        await prisma.restaurant.update({
            where: { id },
            data: { images: newImages }
        });

        res.json({ success: true, message: 'Image removed successfully' });
    } catch (error) {
        console.error('[RESTAURANT] Delete image error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

/**
 * PATCH /api/restaurants/:id
 * Updates base restaurant info.
 */
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;
    const data = req.body;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    if (!restaurant || (restaurant.ownerId !== userId && req.user?.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        cuisine: data.cuisine,
        area: data.area,
        city: data.city,
        phone: data.phone,
        email: data.email,
        vibe: data.vibe,
        dressCode: data.dressCode,
        latitude: data.latitude,
        longitude: data.longitude,
        ...(req.user?.role === 'ADMIN' && { isTrending: data.isTrending })
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[RESTAURANT] Update error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/restaurants/:id/images
 * Add an image URL to the gallery.
 */
router.post('/:id/images', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { imageUrl } = req.body;
    const userId = req.user?.id;

    if (!imageUrl) return res.status(400).json({ success: false, message: 'imageUrl is required' });

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: { ownerId: true, images: true }
    });

    if (!restaurant || (restaurant.ownerId !== userId && req.user?.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        images: {
          set: [...restaurant.images, imageUrl]
        }
      }
    });

    res.json({ success: true, data: { imageUrl: imageUrl } });
  } catch (error) {
    console.error('[RESTAURANT] Append image error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/restaurants/:id/menu
 */
router.post('/:id/menu', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.params.id as string;
    const userId = req.user?.id;
    const data = req.body;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { ownerId: true }
    });

    if (!restaurant || (restaurant.ownerId !== userId && req.user?.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const item = await prisma.menuItem.create({
      data: {
        name: data.name,
        description: data.description,
        priceRaw: data.price, // DTO sends it as price
        category: data.category,
        image: data.image,
        available: data.available ?? true,
        restaurantId
      }
    });

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('[RESTAURANT] Create menu item error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * PATCH /api/restaurants/:id/menu/:itemId
 */
router.patch('/:id/menu/:itemId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.params.id as string;
    const itemId = req.params.itemId as string;
    const userId = req.user?.id;
    const data = req.body;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { ownerId: true }
    });

    if (!restaurant || (restaurant.ownerId !== userId && req.user?.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updated = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        name: data.name,
        description: data.description,
        priceRaw: data.price,
        category: data.category,
        image: data.image,
        available: data.available
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[RESTAURANT] Update menu item error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * DELETE /api/restaurants/:id/menu/:itemId
 */
router.delete('/:id/menu/:itemId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const restaurantId = req.params.id as string;
    const itemId = req.params.itemId as string;
    const userId = req.user?.id;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { ownerId: true }
    });

    if (!restaurant || (restaurant.ownerId !== userId && req.user?.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.menuItem.delete({
      where: { id: itemId }
    });

    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    console.error('[RESTAURANT] Delete menu item error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
