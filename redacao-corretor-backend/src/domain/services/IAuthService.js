// Interface para AuthService (seguindo Dependency Inversion Principle)
export class IAuthService {
  async hashPassword(password) {
    throw new Error('Method not implemented');
  }

  async comparePasswords(password, hash) {
    throw new Error('Method not implemented');
  }

  generateAccessToken(user) {
    throw new Error('Method not implemented');
  }

  generateRefreshToken(user) {
    throw new Error('Method not implemented');
  }

  verifyAccessToken(token) {
    throw new Error('Method not implemented');
  }

  verifyRefreshToken(token) {
    throw new Error('Method not implemented');
  }
}
