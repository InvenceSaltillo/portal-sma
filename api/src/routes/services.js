import express from 'express';
import {
  getAllServices,
  getServiceById,
  getServicesByType,
  getFormFieldsByService,
  getServiceRequirements,
} from '../controllers/services.controller.js';

const router = express.Router();

router.get('/', getAllServices);
router.get('/by-type/:typeId', getServicesByType);
router.get('/:id/requirements', getServiceRequirements);
router.get('/:id/form-fields', getFormFieldsByService);
router.get('/:id', getServiceById);

export default router;
