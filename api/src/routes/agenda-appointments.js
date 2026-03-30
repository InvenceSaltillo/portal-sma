import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createAgendaAppointment,
  deleteAgendaAppointment,
  listAgendaAppointments,
} from '../controllers/agenda-appointments.controller.js';

const router = express.Router();

router.get('/', authenticate, listAgendaAppointments);
router.post('/', authenticate, createAgendaAppointment);
router.delete('/:id', authenticate, deleteAgendaAppointment);

export default router;
