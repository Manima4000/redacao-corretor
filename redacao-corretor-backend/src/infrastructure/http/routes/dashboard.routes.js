import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { DashboardController } from '../controllers/DashboardController.js';
import { GetTeacherDashboardStatsUseCase } from '../../../application/use-cases/dashboard/GetTeacherDashboardStatsUseCase.js';
import { GetStudentDashboardStatsUseCase } from '../../../application/use-cases/dashboard/GetStudentDashboardStatsUseCase.js';
import { ClassRepository } from '../../database/repositories/ClassRepository.js';
import { TaskRepository } from '../../database/repositories/TaskRepository.js';
import { EssayRepository } from '../../database/repositories/EssayRepository.js';
import { StudentRepository } from '../../database/repositories/StudentRepository.js';

const router = Router();

// Depedency Injection
const classRepository = new ClassRepository();
const taskRepository = new TaskRepository();
const essayRepository = new EssayRepository();
const studentRepository = new StudentRepository();

const getTeacherDashboardStatsUseCase = new GetTeacherDashboardStatsUseCase(
  classRepository,
  taskRepository,
  essayRepository
);

const getStudentDashboardStatsUseCase = new GetStudentDashboardStatsUseCase(
  taskRepository,
  essayRepository,
  studentRepository
);

const dashboardController = new DashboardController(
  getTeacherDashboardStatsUseCase,
  getStudentDashboardStatsUseCase
);

// Routes
/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Obter estatísticas do dashboard
 *     description: Retorna estatísticas relevantes para o usuário logado (professor ou aluno)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas recuperadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     classCount:
 *                       type: integer
 *                     taskCount:
 *                       type: integer
 *                     pendingEssaysCount:
 *                       type: integer
 *                     essayCount:
 *                       type: integer
 */
router.get('/stats', authMiddleware, (req, res, next) => dashboardController.getStats(req, res, next));

export { router as dashboardRoutes };
