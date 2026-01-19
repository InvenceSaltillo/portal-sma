import express from 'express';
import {
  getAllSpecies,
  getSpeciesById
} from '../controllers/species.controller.js';

const router = express.Router();

router.get('/', getAllSpecies);
router.get('/:id', getSpeciesById);

export default router;
