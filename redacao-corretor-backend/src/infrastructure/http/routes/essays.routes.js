import { Router } from 'express';
import { EssayController } from '../controllers/EssayController.js';
import { UploadEssayUseCase } from '../../../application/use-cases/essays/UploadEssayUseCase.js';
import { GetStudentEssayByTaskUseCase } from '../../../application/use-cases/essays/GetStudentEssayByTaskUseCase.js';
import { GetEssayByIdUseCase } from '../../../application/use-cases/essays/GetEssayByIdUseCase.js';
import { GetEssayImageUseCase } from '../../../application/use-cases/essays/GetEssayImageUseCase.js';
import { DeleteEssayUseCase } from '../../../application/use-cases/essays/DeleteEssayUseCase.js';
import { FinalizeEssayCorrectionUseCase } from '../../../application/use-cases/essays/FinalizeEssayCorrectionUseCase.js';
import { SendCorrectionCompletedUseCase } from '../../../application/use-cases/emails/SendCorrectionCompletedUseCase.js';
import { EssayRepository } from '../../database/repositories/EssayRepository.js';
import { TaskRepository } from '../../database/repositories/TaskRepository.js';
import { StudentRepository } from '../../database/repositories/StudentRepository.js';
import { GoogleDriveStorageService } from '../../services/GoogleDriveStorageService.js';
import { EmailService } from '../../services/EmailService.js';
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
const emailService = new EmailService();

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

const getEssayByIdUseCase = new GetEssayByIdUseCase(
  essayRepository,
  taskRepository,
  studentRepository,
  fileStorageService
);

const getEssayImageUseCase = new GetEssayImageUseCase(
  essayRepository,
  taskRepository,
  studentRepository,
  fileStorageService
);

const deleteEssayUseCase = new DeleteEssayUseCase(
  essayRepository,
  taskRepository,
  fileStorageService
);

// Email Use Case
const sendCorrectionCompletedUseCase = new SendCorrectionCompletedUseCase(
  essayRepository,
  studentRepository,
  taskRepository,
  emailService
);

// Finalize Correction Use Case com email
const finalizeEssayCorrectionUseCase = new FinalizeEssayCorrectionUseCase(
  essayRepository,
  taskRepository,
  sendCorrectionCompletedUseCase
);

// Controller
const essayController = new EssayController(
  uploadEssayUseCase,
  getStudentEssayByTaskUseCase,
  getEssayByIdUseCase,
  getEssayImageUseCase,
  deleteEssayUseCase,
  finalizeEssayCorrectionUseCase
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
 * /api/essays/{essayId}/image:
 *   get:
 *     summary: Obter imagem da redação (proxy)
 *     description: Retorna a imagem da redação diretamente (proxy do Google Drive)
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
 *         description: Imagem retornada com sucesso
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Sem permissão para acessar esta redação
 *       404:
 *         description: Redação não encontrada
 */
router.get(
  '/:essayId/image',
  authMiddleware,
  (req, res, next) => essayController.getEssayImage(req, res, next)
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

/**
 * @swagger
 * /api/essays/{essayId}/finalize:
 *   put:
 *     summary: Finalizar correção de redação
 *     description: Permite que professores finalizem a correção de uma redação, atribuindo nota e comentários escritos
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grade
 *             properties:
 *               grade:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 10
 *                 description: Nota da redação (0 a 10)
 *                 example: 8.5
 *               writtenFeedback:
 *                 type: string
 *                 description: Comentários escritos da professora (opcional)
 *                 example: Ótimo desenvolvimento da argumentação, mas atenção à pontuação.
 *     responses:
 *       200:
 *         description: Correção finalizada com sucesso
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
 *                   example: Correção finalizada com sucesso
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
 *                     fileType:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [corrected]
 *                       example: corrected
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *                     correctedAt:
 *                       type: string
 *                       format: date-time
 *                     grade:
 *                       type: number
 *                       format: float
 *                       example: 8.5
 *                     writtenFeedback:
 *                       type: string
 *                       example: Ótimo desenvolvimento da argumentação, mas atenção à pontuação.
 *       400:
 *         description: Nota não fornecida ou inválida
 *       403:
 *         description: Apenas professores podem finalizar correções
 *       404:
 *         description: Redação não encontrada
 */
router.put(
  '/:essayId/finalize',
  authMiddleware,
  requireTeacher,
  (req, res, next) => essayController.finalize(req, res, next)
);

export default router;
