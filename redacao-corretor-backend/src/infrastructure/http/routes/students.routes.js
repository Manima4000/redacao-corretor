import { Router } from 'express';
import { StudentController } from '../controllers/StudentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireTeacher } from '../middleware/roleMiddleware.js';

const router = Router();
const studentController = new StudentController();

// Apenas professores podem buscar alunos
router.get('/search', authMiddleware, requireTeacher, studentController.search);

export default router;
