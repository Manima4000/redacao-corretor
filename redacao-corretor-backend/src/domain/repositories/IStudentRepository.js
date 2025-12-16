// Interface para StudentRepository (Dependency Inversion Principle)
export class IStudentRepository {
  async create(studentData) {
    throw new Error('Method not implemented');
  }

  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async update(id, studentData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async findByEnrollmentNumber(enrollmentNumber) {
    throw new Error('Method not implemented');
  }
}
