import { Router } from 'express';
import { TaskController } from '../controllers/TaskController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireTeacher } from '../middleware/roleMiddleware.js';
import { createTaskSchema, updateTaskSchema } from '../validators/taskValidators.js';

const router = Router();
const taskController = new TaskController();

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Criar nova tarefa
 *     description: Cria uma nova tarefa para uma ou mais turmas (apenas professores)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - classIds
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 example: Redação sobre Meio Ambiente
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 example: Escreva uma redação dissertativa-argumentativa sobre os impactos da poluição nos oceanos.
 *               classIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ['789e0123-e89b-12d3-a456-426614174000', 'abc12345-e89b-12d3-a456-426614174111']
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 example: '2025-12-31T23:59:59.000Z'
 *     responses:
 *       201:
 *         description: Tarefa criada com sucesso
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
 *                   example: Tarefa criada com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Apenas professores podem criar tarefas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  authMiddleware,
  requireTeacher,
  validate(createTaskSchema),
  taskController.create
);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Listar tarefas
 *     description: Lista tarefas (professores veem suas tarefas, alunos veem tarefas da sua turma)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar tarefas por ID do professor
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar tarefas por ID da turma
 *     responses:
 *       200:
 *         description: Lista de tarefas
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
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authMiddleware, taskController.getAll);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Buscar tarefa por ID
 *     description: Retorna os dados de uma tarefa específica
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da tarefa
 *     responses:
 *       200:
 *         description: Tarefa encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Tarefa não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authMiddleware, taskController.getById);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Atualizar tarefa
 *     description: Atualiza os dados de uma tarefa (apenas o professor dono da tarefa)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da tarefa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 example: Redação sobre Tecnologia
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 example: Discorra sobre os impactos da inteligência artificial na sociedade moderna.
 *               classIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ['789e0123-e89b-12d3-a456-426614174000']
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 example: '2026-01-15T23:59:59.000Z'
 *     responses:
 *       200:
 *         description: Tarefa atualizada com sucesso
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
 *                   example: Tarefa atualizada com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Você não tem permissão para atualizar esta tarefa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Tarefa não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  authMiddleware,
  requireTeacher,
  validate(updateTaskSchema),
  taskController.update
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Deletar tarefa
 *     description: Remove uma tarefa do sistema (apenas o professor dono da tarefa)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da tarefa
 *     responses:
 *       200:
 *         description: Tarefa deletada com sucesso
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
 *                   example: Tarefa deletada com sucesso
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Você não tem permissão para deletar esta tarefa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Tarefa não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authMiddleware, requireTeacher, taskController.delete);

export default router;
