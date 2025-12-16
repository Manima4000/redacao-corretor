// Interface para ClassRepository (Dependency Inversion Principle)
export class IClassRepository {
  async create(classData) {
    throw new Error('Method not implemented');
  }

  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findAll() {
    throw new Error('Method not implemented');
  }

  async findByTeacherId(teacherId) {
    throw new Error('Method not implemented');
  }

  async update(id, classData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }
}
