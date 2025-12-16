import { AuthenticationError } from '../../../utils/errors.js';

/**
 * Use Case para login de usuário (Student ou Teacher)
 * Segue o Single Responsibility Principle - só faz login
 */
export class LoginUseCase {
  constructor(studentRepository, teacherRepository, authService) {
    this.studentRepository = studentRepository;
    this.teacherRepository = teacherRepository;
    this.authService = authService;
  }

  async execute(loginDTO) {
    // Buscar em ambas as tabelas (student e teacher)
    let user = await this.studentRepository.findByEmail(loginDTO.email);

    if (!user) {
      user = await this.teacherRepository.findByEmail(loginDTO.email);
    }

    if (!user) {
      throw new AuthenticationError('Email ou senha incorretos');
    }

    // Verificar senha
    const isPasswordValid = await this.authService.comparePasswords(
      loginDTO.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new AuthenticationError('Email ou senha incorretos');
    }

    // Gerar tokens
    const accessToken = this.authService.generateAccessToken(user);
    const refreshToken = this.authService.generateRefreshToken(user);

    return {
      user: user.toPublicData(),
      accessToken,
      refreshToken,
    };
  }
}
