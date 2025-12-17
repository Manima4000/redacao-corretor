import { Router } from 'express';
import { AnnotationController } from '../controllers/AnnotationController.js';
import { SaveAnnotationsUseCase } from '../../../application/use-cases/annotations/SaveAnnotationsUseCase.js';
import { GetAnnotationsUseCase } from '../../../application/use-cases/annotations/GetAnnotationsUseCase.js';
import { UpdateEssayStatusUseCase } from '../../../application/use-cases/annotations/UpdateEssayStatusUseCase.js';
import { AnnotationRepository } from '../../database/repositories/AnnotationRepository.js';
import { EssayRepository } from '../../database/repositories/EssayRepository.js';
import { TaskRepository } from '../../database/repositories/TaskRepository.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import {
  saveAnnotationSchema,
  updateStatusSchema,
  getAnnotationQuerySchema,
} from '../validators/annotationValidators.js';

const router = Router();

// Inicializar dependências (Dependency Injection)
const annotationRepository = new AnnotationRepository();
const essayRepository = new EssayRepository();
const taskRepository = new TaskRepository();

// Use Cases
const saveAnnotationsUseCase = new SaveAnnotationsUseCase(
  annotationRepository,
  essayRepository,
  taskRepository
);

const getAnnotationsUseCase = new GetAnnotationsUseCase(
  annotationRepository,
  essayRepository,
  taskRepository
);

const updateEssayStatusUseCase = new UpdateEssayStatusUseCase(
  essayRepository,
  taskRepository
);

// Controller
const annotationController = new AnnotationController(
  saveAnnotationsUseCase,
  getAnnotationsUseCase,
  updateEssayStatusUseCase
);

/**
 * @swagger
 * tags:
 *   name: Annotations
 *   description: Gerenciamento de anotações em redações
 */

/**
 * @swagger
 * /api/essays/{essayId}/annotations:
 *   post:
 *     summary: Salvar anotações em redação
 *     description: Permite que professores salvem ou atualizem anotações em uma redação (auto-save)
 *     tags: [Annotations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: essayId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da redação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - annotationData
 *             properties:
 *               annotationData:
 *                 type: object
 *                 description: Dados das anotações (formato react-konva + perfect-freehand)
 *                 properties:
 *                   version:
 *                     type: string
 *                     example: "1.0"
 *                   lines:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         points:
 *                           type: array
 *                           description: Array de pontos [x, y, pressure]
 *                           items:
 *                             type: array
 *                             items:
 *                               type: number
 *                           example: [[100, 150, 0.5], [200, 250, 0.7]]
 *                         color:
 *                           type: string
 *                           example: "#FF0000"
 *                         size:
 *                           type: number
 *                           example: 4
 *               pageNumber:
 *                 type: number
 *                 description: Número da página (para PDFs multi-página)
 *                 default: 1
 *                 example: 1
 *     responses:
 *       200:
 *         description: Anotações salvas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Anotações salvas com sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     essayId:
 *                       type: string
 *                       format: uuid
 *                     annotationData:
 *                       type: object
 *                     pageNumber:
 *                       type: number
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Apenas professores podem fazer anotações
 *       404:
 *         description: Redação não encontrada
 */
router.post(
  '/:essayId/annotations',
  authMiddleware,
  validate(saveAnnotationSchema),
  (req, res, next) => annotationController.save(req, res, next)
);

/**
 * @swagger
 * /api/essays/{essayId}/annotations:
 *   get:
 *     summary: Buscar anotações de redação
 *     description: Retorna todas as anotações de uma redação (professor ou aluno dono)
 *     tags: [Annotations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: essayId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da redação
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: number
 *         description: Número da página específica (opcional, para PDFs multi-página)
 *     responses:
 *       200:
 *         description: Anotações retornadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       essayId:
 *                         type: string
 *                         format: uuid
 *                       annotationData:
 *                         type: object
 *                       pageNumber:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       403:
 *         description: Sem permissão para acessar estas anotações
 *       404:
 *         description: Redação não encontrada
 */
router.get(
  '/:essayId/annotations',
  authMiddleware,
  validate(getAnnotationQuerySchema, 'query'),
  (req, res, next) => annotationController.get(req, res, next)
);

/**
 * @swagger
 * /api/essays/{essayId}/status:
 *   patch:
 *     summary: Atualizar status de redação
 *     description: Atualiza o status da redação (pending → correcting → corrected)
 *     tags: [Annotations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: essayId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da redação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, correcting, corrected]
 *                 description: Novo status da redação
 *                 example: corrected
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Status atualizado para: corrected"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       example: corrected
 *                     correctedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Status inválido ou transição inválida
 *       403:
 *         description: Apenas professores podem atualizar status
 *       404:
 *         description: Redação não encontrada
 */
router.patch(
  '/:essayId/status',
  authMiddleware,
  validate(updateStatusSchema),
  (req, res, next) => annotationController.updateStatus(req, res, next)
);

export default router;
