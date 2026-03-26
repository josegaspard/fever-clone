const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/cities
router.get('/', async (req, res) => {
  try {
    const cities = await prisma.city.findMany({
      include: {
        _count: {
          select: {
            events: {
              where: { status: 'PUBLISHED' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const data = cities.map((city) => ({
      ...city,
      eventCount: city._count.events,
      _count: undefined,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cities' });
  }
});

// GET /api/cities/:slug
router.get('/:slug', async (req, res) => {
  try {
    const city = await prisma.city.findUnique({
      where: { slug: req.params.slug },
      include: {
        _count: {
          select: {
            events: {
              where: { status: 'PUBLISHED' },
            },
          },
        },
      },
    });

    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }

    const data = {
      ...city,
      eventCount: city._count.events,
      _count: undefined,
    };

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get city error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch city' });
  }
});

module.exports = router;
