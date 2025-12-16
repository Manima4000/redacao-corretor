import { Router } from 'express';
import { ClassController } from '../controllers/ClassController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireTeacher } from '../middleware/roleMiddleware.js';
import { createClassSchema, updateClassSchema } from '../validators/classValidators.js';

const router = Router();
const classController = new ClassController();

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Criar nova turma
 *     description: Cria uma nova turma no sistema (apenas professores)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Turma AFA
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Turma preparatória para concurso AFA
 *     responses:
 *       201:
 *         description: Turma criada com sucesso
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
 *                   example: Turma criada com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/Class'
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
 *         description: Apenas professores podem criar turmas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  authMiddleware,
  requireTeacher,
  validate(createClassSchema),
  classController.create
);

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: Listar turmas
 *     description: Lista todas as turmas (professores veem apenas suas turmas, alunos veem todas)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar turmas por ID do professor
 *     responses:
 *       200:
 *         description: Lista de turmas
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
 *                     $ref: '#/components/schemas/Class'
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authMiddleware, classController.getAll);

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Buscar turma por ID
 *     description: Retorna os dados de uma turma específica
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da turma
 *     responses:
 *       200:
 *         description: Turma encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Turma não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authMiddleware, classController.getById);

/**
 * @swagger
 * /api/classes/{id}:
 *   put:
 *     summary: Atualizar turma
 *     description: Atualiza os dados de uma turma (apenas o professor dono da turma)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da turma
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Turma AFA - 2025
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Turma preparatória para concurso AFA - ano 2025
 *     responses:
 *       200:
 *         description: Turma atualizada com sucesso
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
 *                   example: Turma atualizada com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/Class'
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
 *         description: Você não tem permissão para atualizar esta turma
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Turma não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  authMiddleware,
  requireTeacher,
  validate(updateClassSchema),
  classController.update
);

/**
 * @swagger
 * /api/classes/{id}:
 *   delete:
 *     summary: Deletar turma
 *     description: Remove uma turma do sistema (apenas o professor dono da turma)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da turma
 *     responses:
 *       200:
 *         description: Turma deletada com sucesso
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
 *                   example: Turma deletada com sucesso
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Você não tem permissão para deletar esta turma
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Turma não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authMiddleware, requireTeacher, classController.delete);

/**
 * @swagger
 * /api/classes/{id}/students:
 *   post:
 *     summary: Adicionar aluno à turma
 *     description: Vincula um aluno existente a uma turma (apenas o professor dono da turma)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da turma
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do aluno a ser adicionado
 *     responses:
 *       200:
 *         description: Aluno adicionado com sucesso
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
 *                   example: Aluno adicionado à turma com sucesso
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Apenas o professor dono da turma pode adicionar alunos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Turma ou aluno não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:id/students',
  authMiddleware,
  requireTeacher,
  classController.addStudent
);

export default router;
