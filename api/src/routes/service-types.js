import express from 'express';
import {
  getAllServiceTypes,
  getServiceTypeById
} from '../controllers/service-types.controller.js';

const router = express.Router();

router.get('/', getAllServiceTypes);
router.get('/:id', getServiceTypeById);

export default router;
