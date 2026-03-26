const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(verifyToken);

// GET /api/favorites
router.get('/', async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        event: {
          include: {
            city: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = favorites.map((fav) => ({
      id: fav.id,
      eventId: fav.eventId,
      createdAt: fav.createdAt,
      event: {
        ...fav.event,
        gallery: JSON.parse(fav.event.gallery),
      },
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch favorites' });
  }
});

// POST /api/favorites
router.post('/', async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'eventId is required' });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_eventId: {
          userId: req.user.id,
          eventId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Event already in favorites' });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: req.user.id,
        eventId,
      },
    });

    res.status(201).json({
      success: true,
      data: favorite,
      message: 'Added to favorites',
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ success: false, message: 'Failed to add favorite' });
  }
});

// DELETE /api/favorites/:eventId
router.delete('/:eventId', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    if (isNaN(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_eventId: {
          userId: req.user.id,
          eventId,
        },
      },
    });

    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }

    await prisma.favorite.delete({
      where: { id: favorite.id },
    });

    res.json({
      success: true,
      message: 'Removed from favorites',
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove favorite' });
  }
});

module.exports = router;
