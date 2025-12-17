import { Router } from 'express';
import { EssayController } from '../controllers/EssayController.js';
import { UploadEssayUseCase } from '../../../application/use-cases/essays/UploadEssayUseCase.js';
import { GetStudentEssayByTaskUseCase } from '../../../application/use-cases/essays/GetStudentEssayByTaskUseCase.js';
import { DeleteEssayUseCase } from '../../../application/use-cases/essays/DeleteEssayUseCase.js';
import { EssayRepository } from '../../database/repositories/EssayRepository.js';
import { TaskRepository } from '../../database/repositories/TaskRepository.js';
import { StudentRepository } from '../../database/repositories/StudentRepository.js';
import { GoogleDriveStorageService } from '../../services/GoogleDriveStorageService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireTeacher } from '../middleware/roleMiddleware.js';
import {
  upload,
  validateFileMetadata,
  handleMulterError,
} from '../middleware/uploadValidation.js';

const router = Router();

// Inicializar dependências (Dependency Injection)
const essayRepository = new EssayRepository();
const taskRepository = new TaskRepository();
const studentRepository = new StudentRepository();
const fileStorageService = new GoogleDriveStorageService();

// Use Cases
const uploadEssayUseCase = new UploadEssayUseCase(
  essayRepository,
  taskRepository,
  studentRepository,
  fileStorageService
);

const getStudentEssayByTaskUseCase = new GetStudentEssayByTaskUseCase(
  essayRepository,
  taskRepository,
  fileStorageService
);

const deleteEssayUseCase = new DeleteEssayUseCase(
  essayRepository,
  taskRepository,
  fileStorageService
);

// Controller
const essayController = new EssayController(
  uploadEssayUseCase,
  getStudentEssayByTaskUseCase,
  deleteEssayUseCase
);

/**
 * @swagger
 * tags:
 *   name: Essays
 *   description: Gerenciamento de redações
 */

/**
 * @swagger
 * /api/essays/upload:
 *   post:
 *     summary: Fazer upload de redação
 *     description: Permite que alunos enviem redações para tarefas
 *     tags: [Essays]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *               - file
 *             properties:
 *               taskId:
 *                 type: string
 *                 format: uuid
 *                 description: ID da tarefa
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo da redação (JPEG, PNG ou PDF, máx 10MB)
 *     responses:
 *       201:
 *         description: Redação enviada com sucesso
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
 *                   example: Redação enviada com sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     essay:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         taskId:
 *                           type: string
 *                           format: uuid
 *                         studentId:
 *                           type: string
 *                           format: uuid
 *                         fileUrl:
 *                           type: string
 *                           description: ID do arquivo no Google Drive
 *                         publicUrl:
 *                           type: string
 *                           description: URL pública para visualização
 *                         status:
 *                           type: string
 *                           enum: [pending, correcting, corrected]
 *                           example: pending
 *                         submittedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Arquivo inválido ou dados faltando
 *       403:
 *         description: Apenas alunos podem enviar redações
 *       404:
 *         description: Tarefa não encontrada
 *       409:
 *         description: Aluno já enviou redação para esta tarefa
 */
router.post(
  '/upload',
  authMiddleware,
  upload.single('file'), // Multer middleware
  handleMulterError, // Tratamento de erros do Multer
  validateFileMetadata, // Validação de metadados
  (req, res, next) => essayController.upload(req, res, next)
);

/**
 * @swagger
 * /api/essays/task/{taskId}/student:
 *   get:
 *     summary: Buscar minha redação para uma tarefa
 *     description: Retorna a redação enviada pelo aluno autenticado para uma tarefa específica
 *     tags: [Essays]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da tarefa
 *     responses:
 *       200:
 *         description: Redação encontrada
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     taskId:
 *                       type: string
 *                       format: uuid
 *                     studentId:
 *                       type: string
 *                       format: uuid
 *                     fileUrl:
 *                       type: string
 *                     publicUrl:
 *                       type: string
 *                     fileType:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, correcting, corrected]
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Apenas alunos podem acessar
 *       404:
 *         description: Nenhuma redação encontrada para esta tarefa
 */
router.get(
  '/task/:taskId/student',
  authMiddleware,
  (req, res, next) => essayController.getStudentEssayByTask(req, res, next)
);

/**
 * @swagger
 * /api/essays/task/{taskId}:
 *   get:
 *     summary: Listar redações de uma tarefa
 *     description: Lista todas as redações enviadas para uma tarefa (apenas professores)
 *     tags: [Essays]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da tarefa
 *     responses:
 *       200:
 *         description: Lista de redações retornada com sucesso
 *       403:
 *         description: Apenas professores podem acessar
 *       404:
 *         description: Tarefa não encontrada
 */
router.get(
  '/task/:taskId',
  authMiddleware,
  requireTeacher,
  (req, res, next) => essayController.listByTask(req, res, next)
);

/**
 * @swagger
 * /api/essays/my-essays:
 *   get:
 *     summary: Listar minhas redações
 *     description: Lista todas as redações enviadas pelo aluno logado
 *     tags: [Essays]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de redações retornada com sucesso
 *       403:
 *         description: Apenas alunos podem acessar
 */
router.get(
  '/my-essays',
  authMiddleware,
  (req, res, next) => essayController.listMyEssays(req, res, next)
);

/**
 * @swagger
 * /api/essays/{essayId}:
 *   get:
 *     summary: Obter detalhes de uma redação
 *     description: Retorna detalhes completos de uma redação
 *     tags: [Essays]
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
 *     responses:
 *       200:
 *         description: Detalhes da redação retornados com sucesso
 *       403:
 *         description: Sem permissão para acessar esta redação
 *       404:
 *         description: Redação não encontrada
 */
router.get(
  '/:essayId',
  authMiddleware,
  (req, res, next) => essayController.getById(req, res, next)
);

/**
 * @swagger
 * /api/essays/{essayId}:
 *   delete:
 *     summary: Deletar redação
 *     description: Deleta uma redação (apenas dono ou professor)
 *     tags: [Essays]
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
 *     responses:
 *       200:
 *         description: Redação deletada com sucesso
 *       403:
 *         description: Sem permissão para deletar esta redação
 *       404:
 *         description: Redação não encontrada
 */
router.delete(
  '/:essayId',
  authMiddleware,
  (req, res, next) => essayController.delete(req, res, next)
);

export default router;
