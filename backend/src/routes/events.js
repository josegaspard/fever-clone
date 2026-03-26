const express = require('express');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `event-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

function parseGallery(event) {
  return {
    ...event,
    gallery: typeof event.gallery === 'string' ? JSON.parse(event.gallery) : event.gallery,
  };
}

// GET /api/events - public listing with filters
router.get('/', async (req, res) => {
  try {
    const {
      citySlug,
      categorySlug,
      search,
      featured,
      status,
      sortBy = 'date',
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      status: 'PUBLISHED',
    };

    if (citySlug) {
      where.city = { slug: citySlug };
    }

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (search) {
      where.title = { contains: search };
    }

    if (featured === 'true') {
      where.featured = true;
    }

    let orderBy = {};
    switch (sortBy) {
      case 'price':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'date_desc':
        orderBy = { date: 'desc' };
        break;
      case 'date':
      default:
        orderBy = { date: 'asc' };
        break;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          city: true,
          category: true,
          organizer: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.event.count({ where }),
    ]);

    const data = events.map(parseGallery);

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});

// GET /api/events/admin/all - admin listing (any status)
router.get('/admin/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) {
      where.status = status;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          city: true,
          category: true,
          organizer: {
            select: { id: true, name: true, avatar: true },
          },
          _count: { select: { favorites: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.event.count({ where }),
    ]);

    const data = events.map((event) => ({
      ...parseGallery(event),
      favoriteCount: event._count.favorites,
      _count: undefined,
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Admin get events error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});

// GET /api/events/slug/:slug - single event by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { slug: req.params.slug },
      include: {
        city: true,
        category: true,
        organizer: {
          select: { id: true, name: true, avatar: true },
        },
        _count: { select: { favorites: true } },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const data = {
      ...parseGallery(event),
      favoriteCount: event._count.favorites,
      _count: undefined,
    };

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch event' });
  }
});

// POST /api/events - create event (admin only)
router.post('/', verifyToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const {
      title, slug, description, shortDescription,
      gallery, price, originalPrice, currency,
      date, endDate, time, duration,
      address, lat, lng,
      cityId, categoryId,
      status: eventStatus, featured, capacity,
    } = req.body;

    if (!title || !slug || !description || !price || !date || !cityId || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: title, slug, description, price, date, cityId, categoryId',
      });
    }

    const existingSlug = await prisma.event.findUnique({ where: { slug } });
    if (existingSlug) {
      return res.status(409).json({ success: false, message: 'Event slug already exists' });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image || null;

    const event = await prisma.event.create({
      data: {
        title,
        slug,
        description,
        shortDescription: shortDescription || null,
        image,
        gallery: gallery ? (typeof gallery === 'string' ? gallery : JSON.stringify(gallery)) : '[]',
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        currency: currency || 'EUR',
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        time: time || null,
        duration: duration || null,
        address: address || null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        cityId: parseInt(cityId),
        categoryId: parseInt(categoryId),
        organizerId: req.user.id,
        status: eventStatus || 'DRAFT',
        featured: featured === 'true' || featured === true,
        capacity: capacity ? parseInt(capacity) : null,
      },
      include: {
        city: true,
        category: true,
        organizer: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: parseGallery(event),
      message: 'Event created successfully',
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, message: 'Failed to create event' });
  }
});

// PUT /api/events/:id - update event (admin only)
router.put('/:id', verifyToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);

    if (isNaN(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const updateData = {};
    const fields = [
      'title', 'slug', 'description', 'shortDescription',
      'currency', 'time', 'duration', 'address', 'status',
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (req.body.price !== undefined) updateData.price = parseFloat(req.body.price);
    if (req.body.originalPrice !== undefined) updateData.originalPrice = req.body.originalPrice ? parseFloat(req.body.originalPrice) : null;
    if (req.body.date !== undefined) updateData.date = new Date(req.body.date);
    if (req.body.endDate !== undefined) updateData.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
    if (req.body.lat !== undefined) updateData.lat = req.body.lat ? parseFloat(req.body.lat) : null;
    if (req.body.lng !== undefined) updateData.lng = req.body.lng ? parseFloat(req.body.lng) : null;
    if (req.body.cityId !== undefined) updateData.cityId = parseInt(req.body.cityId);
    if (req.body.categoryId !== undefined) updateData.categoryId = parseInt(req.body.categoryId);
    if (req.body.featured !== undefined) updateData.featured = req.body.featured === 'true' || req.body.featured === true;
    if (req.body.capacity !== undefined) updateData.capacity = req.body.capacity ? parseInt(req.body.capacity) : null;
    if (req.body.soldCount !== undefined) updateData.soldCount = parseInt(req.body.soldCount);
    if (req.body.gallery !== undefined) {
      updateData.gallery = typeof req.body.gallery === 'string' ? req.body.gallery : JSON.stringify(req.body.gallery);
    }

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      updateData.image = req.body.image;
    }

    // Check slug uniqueness if changing
    if (updateData.slug && updateData.slug !== existing.slug) {
      const slugExists = await prisma.event.findUnique({ where: { slug: updateData.slug } });
      if (slugExists) {
        return res.status(409).json({ success: false, message: 'Event slug already exists' });
      }
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        city: true,
        category: true,
        organizer: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    res.json({
      success: true,
      data: parseGallery(event),
      message: 'Event updated successfully',
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
});

// DELETE /api/events/:id - delete event (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);

    if (isNaN(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }

    const existing = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Delete related favorites first
    await prisma.favorite.deleteMany({ where: { eventId } });

    await prisma.event.delete({ where: { id: eventId } });

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
});

module.exports = router;
