import { AuthenticationError, NotFoundError } from '../../../utils/errors.js';

/**
 * Use Case para renovar access token usando refresh token
 * Segue o Single Responsibility Principle
 */
export class RefreshTokenUseCase {
  constructor(studentRepository, teacherRepository, authService) {
    this.studentRepository = studentRepository;
    this.teacherRepository = teacherRepository;
    this.authService = authService;
  }

  async execute(refreshToken) {
    // Verificar refresh token
    let decoded;
    try {
      decoded = this.authService.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new AuthenticationError(error.message);
    }

    // Buscar usuário em ambas as tabelas
    let user = await this.studentRepository.findById(decoded.id);

    if (!user) {
      user = await this.teacherRepository.findById(decoded.id);
    }

    if (!user) {
      throw new NotFoundError('Usuário');
    }

    // Gerar novo access token
    const accessToken = this.authService.generateAccessToken(user);

    return {
      accessToken,
      user: user.toPublicData(),
    };
  }
}
