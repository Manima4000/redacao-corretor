// Interface para TaskRepository (Dependency Inversion Principle)
export class ITaskRepository {
  async create(taskData) {
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

  async findByClassId(classId) {
    throw new Error('Method not implemented');
  }

  async update(id, taskData) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }

  async addClassesToTask(taskId, classIds) {
    throw new Error('Method not implemented');
  }

  async removeClassesFromTask(taskId, classIds) {
    throw new Error('Method not implemented');
  }
}
