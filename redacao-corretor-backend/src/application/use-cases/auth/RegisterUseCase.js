import { ConflictError } from '../../../utils/errors.js';

/**
 * Use Case para registro de novo usuário (Student ou Teacher)
 * Segue o Single Responsibility Principle - só faz registro
 */
export class RegisterUseCase {
  constructor(studentRepository, teacherRepository, authService) {
    this.studentRepository = studentRepository;
    this.teacherRepository = teacherRepository;
    this.authService = authService;
  }

  async execute(registerDTO) {
    // Verificar se email já existe em ambas as tabelas
    const existingStudent = await this.studentRepository.findByEmail(registerDTO.email);
    const existingTeacher = await this.teacherRepository.findByEmail(registerDTO.email);

    if (existingStudent || existingTeacher) {
      throw new ConflictError('Email já cadastrado');
    }

    // Hash da senha
    const passwordHash = await this.authService.hashPassword(registerDTO.password);

    let user;

    // Criar Student ou Teacher baseado no type
    if (registerDTO.isStudent()) {
      user = await this.studentRepository.create({
        email: registerDTO.email,
        passwordHash: passwordHash,
        fullName: registerDTO.fullName,
        enrollmentNumber: registerDTO.enrollmentNumber,
      });
    } else if (registerDTO.isTeacher()) {
      user = await this.teacherRepository.create({
        email: registerDTO.email,
        passwordHash: passwordHash,
        fullName: registerDTO.fullName,
        specialization: registerDTO.specialization,
      });
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
