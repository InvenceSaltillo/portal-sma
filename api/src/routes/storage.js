import express from 'express';
import { uploadFile } from '../controllers/storage.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas de storage requieren autenticación
router.use(authenticate);

router.post('/upload', uploadFile);

export default router;
