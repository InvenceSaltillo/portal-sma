import express from 'express';
import { createAdminUser } from '../controllers/admin-users.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/require-admin.js';

const router = express.Router();

router.post('/', authenticate, requireAdmin, createAdminUser);

export default router;
