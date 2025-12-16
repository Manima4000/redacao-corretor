import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IAuthService } from '../../domain/services/IAuthService.js';

export class AuthService extends IAuthService {
  constructor() {
    super();
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error('JWT secrets não configurados. Verifique as variáveis de ambiente.');
    }
  }

  /**
   * Gera hash de senha usando bcrypt
   * @param {string} password - Senha em texto plano
   * @returns {Promise<string>} Hash da senha
   */
  async hashPassword(password) {
    if (!password || password.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compara senha em texto plano com hash
   * @param {string} password - Senha em texto plano
   * @param {string} hash - Hash armazenado
   * @returns {Promise<boolean>} True se a senha corresponde ao hash
   */
  async comparePasswords(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Gera access token JWT (curta duração)
   * @param {Object} user - Objeto do usuário (Student ou Teacher)
   * @returns {string} JWT token
   */
  generateAccessToken(user) {
    const publicData = user.toPublicData();

    const payload = {
      id: publicData.id,
      email: publicData.email,
      userType: publicData.type, // 'student' ou 'teacher'
      tokenType: 'access',
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'redacao-corretor-api',
      audience: 'redacao-corretor-frontend',
    });
  }

  /**
   * Gera refresh token JWT (longa duração)
   * @param {Object} user - Objeto do usuário (Student ou Teacher)
   * @returns {string} JWT refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      tokenType: 'refresh',
    };

    return jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.jwtRefreshExpiresIn,
      issuer: 'redacao-corretor-api',
      audience: 'redacao-corretor-frontend',
    });
  }

  /**
   * Verifica e decodifica access token
   * @param {string} token - JWT access token
   * @returns {Object} Payload decodificado
   * @throws {Error} Se token for inválido
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'redacao-corretor-api',
        audience: 'redacao-corretor-frontend',
      });

      if (decoded.tokenType !== 'access') {
        throw new Error('Token type inválido');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expirado');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Token inválido');
      }
      throw error;
    }
  }

  /**
   * Verifica e decodifica refresh token
   * @param {string} token - JWT refresh token
   * @returns {Object} Payload decodificado
   * @throws {Error} Se token for inválido
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtRefreshSecret, {
        issuer: 'redacao-corretor-api',
        audience: 'redacao-corretor-frontend',
      });

      if (decoded.tokenType !== 'refresh') {
        throw new Error('Token type inválido');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expirado');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Refresh token inválido');
      }
      throw error;
    }
  }

  /**
   * Extrai token do header Authorization
   * @param {string} authHeader - Header Authorization (Bearer <token>)
   * @returns {string|null} Token ou null
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7); // Remove 'Bearer '
  }
}
