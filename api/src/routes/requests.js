import express from 'express';
import {
  createRequest,
  getRequestById,
  getRequestByFolio,
  getRequestValues,
  saveRequestValues,
  getRequestFiles
} from '../controllers/requests.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas de requests requieren autenticación
router.use(authenticate);

router.post('/', createRequest);
router.get('/by-folio/:folio', getRequestByFolio);
router.get('/:id', getRequestById);
router.get('/:id/values', getRequestValues);
router.post('/:id/values', saveRequestValues);
router.get('/:id/files', getRequestFiles);

export default router;
