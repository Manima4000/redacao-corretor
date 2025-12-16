import { AuthorizationError } from '../../../utils/errors.js';

/**
 * Middleware para verificar tipo de usuário (student/teacher)
 * Deve ser usado após authMiddleware
 * @param {string[]} allowedTypes - Array de tipos permitidos ('student', 'teacher')
 * @returns {Function} Middleware
 */
export const roleMiddleware = (allowedTypes) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Usuário não autenticado');
      }

      if (!allowedTypes.includes(req.user.userType)) {
        throw new AuthorizationError(
          `Acesso negado. Apenas ${allowedTypes.join(' ou ')} podem acessar este recurso.`
        );
      }

      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }
  };
};

// Atalhos convenientes
export const requireTeacher = roleMiddleware(['teacher']);
export const requireStudent = roleMiddleware(['student']);
export const requireAny = roleMiddleware(['student', 'teacher']);
