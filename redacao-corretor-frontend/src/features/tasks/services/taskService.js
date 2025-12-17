import api from '@/shared/services/api';

export const taskService = {
  /**
   * Busca lista de tarefas com filtros opcionais
   * @param {Object} filters - Filtros (teacherId, classId)
   */
  async getTasks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.teacherId) params.append('teacherId', filters.teacherId);
    if (filters.classId) params.append('classId', filters.classId);

    const response = await api.get(`/tasks?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Busca tarefa por ID
   * @param {string} id 
   */
  async getTaskById(id) {
    const response = await api.get(`/tasks/${id}`);
    return response.data.data;
  },

  /**
   * Cria nova tarefa
   * @param {Object} taskData 
   */
  async createTask(taskData) {
    const response = await api.post('/tasks', taskData);
    return response.data.data;
  },

  /**
   * Atualiza tarefa existente
   * @param {string} id 
   * @param {Object} taskData 
   */
  async updateTask(id, taskData) {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data.data;
  },

  /**
   * Remove tarefa
   * @param {string} id
   */
  async deleteTask(id) {
    await api.delete(`/tasks/${id}`);
  },

  /**
   * Busca alunos de uma tarefa com status de entrega
   * @param {string} taskId
   */
  async getTaskStudents(taskId) {
    const response = await api.get(`/tasks/${taskId}/students`);
    return response.data.data;
  },

  /**
   * Busca tarefas de uma turma específica
   * @param {string} classId - ID da turma
   * @returns {Promise<Array>} Lista de tarefas da turma
   */
  async getTasksByClass(classId) {
    const response = await api.get(`/tasks/class/${classId}`);
    return response.data.data;
  },
};
