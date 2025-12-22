import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { updateProfileSchema, changePasswordSchema } from '../validators/profileValidators.js';

const router = Router();
const profileController = new ProfileController();

// Todas as rotas de perfil requerem autenticação
router.use(authMiddleware);

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Obter perfil completo
 *     description: Retorna perfil do usuário logado incluindo suas turmas
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário
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
 *                     user:
 *                       oneOf:
 *                         - $ref: '#/components/schemas/Student'
 *                         - $ref: '#/components/schemas/Teacher'
 *                     classes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Class'
 *       401:
 *         description: Token não fornecido ou inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', profileController.getMyProfile);

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Atualizar perfil
 *     description: Atualiza informações do perfil (email, nome, matrícula ou especialização)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: novoemail@exemplo.com
 *               fullName:
 *                 type: string
 *                 minLength: 3
 *                 example: João Silva Santos
 *               enrollmentNumber:
 *                 type: string
 *                 description: Matrícula (apenas para alunos)
 *                 example: "2024001"
 *               specialization:
 *                 type: string
 *                 description: Especialização (apenas para professores)
 *                 example: Redação ENEM
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
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
 *                   example: Perfil atualizado com sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       oneOf:
 *                         - $ref: '#/components/schemas/Student'
 *                         - $ref: '#/components/schemas/Teacher'
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
 *       409:
 *         description: Email já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/', validate(updateProfileSchema), profileController.updateProfile);

/**
 * @swagger
 * /api/profile/password:
 *   put:
 *     summary: Alterar senha
 *     description: Altera a senha do usuário (requer senha atual)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: senhaAtual123
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: novaSenha456
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
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
 *                   example: Senha alterada com sucesso
 *       400:
 *         description: Dados inválidos ou nova senha igual à atual
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token inválido ou senha atual incorreta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/password', validate(changePasswordSchema), profileController.changePassword);

export default router;
