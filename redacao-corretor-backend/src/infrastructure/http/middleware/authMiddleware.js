import { AuthService } from '../../services/AuthService.js';
import { AuthenticationError } from '../../../utils/errors.js';

const authService = new AuthService();

/**
 * Middleware para verificar autenticação JWT
 * Lê o token do cookie httpOnly
 * Adiciona req.user com os dados do usuário autenticado
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Lê accessToken do cookie ao invés do header Authorization
    const token = req.cookies.accessToken;

    if (!token) {
      throw new AuthenticationError('Token não fornecido');
    }

    // Verificar e decodificar token
    const decoded = authService.verifyAccessToken(token);

    // Adicionar dados do usuário na requisição
    req.user = {
      id: decoded.id,
      email: decoded.email,
      userType: decoded.userType, // 'student' ou 'teacher'
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Token inválido ou expirado',
    });
  }
};
