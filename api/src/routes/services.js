import express from 'express';
import {
  getAllServices,
  getServiceById,
  getServicesByType
} from '../controllers/services.controller.js';

const router = express.Router();

router.get('/', getAllServices);
router.get('/by-type/:typeId', getServicesByType);
router.get('/:id', getServiceById);

export default router;
