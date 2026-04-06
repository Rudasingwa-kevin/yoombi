import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

/**
 * POST /api/notifications/device-token
 */
router.post('/device-token', async (req: any, res: Response) => {
  try {
    const { deviceToken } = req.body;
    if (!deviceToken) return res.status(400).json({ success: false, message: 'Token is required' });

    await prisma.user.update({
      where: { id: String(req.user.id) },
      data: { expoPushToken: String(deviceToken) }
    });

    res.json({ success: true, message: 'Device token registered successfully' });
  } catch (error) {
    console.error('[NOTIF] Register token error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/notifications
 */
router.get('/', async (req: any, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: String(req.user.id) },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('[NOTIF] Fetch error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', async (req: any, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.notification.update({
      where: { id, userId: String(req.user.id) },
      data: { read: true }
    });
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    console.error('[NOTIF] Update read error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * PATCH /api/notifications/read-all
 */
router.patch('/read-all', async (req: any, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: String(req.user.id), read: false },
      data: { read: true }
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('[NOTIF] Update read-all error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
