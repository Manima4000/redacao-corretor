import { query } from '../config/database.js';
import { IEssayRepository } from '../../../domain/repositories/IEssayRepository.js';

/**
 * Implementação do repositório de redações usando PostgreSQL
 *
 * Segue SOLID:
 * - SRP: Apenas acesso a dados de essays
 * - OCP: Implementa interface, pode ser substituído
 * - LSP: Substituível por qualquer IEssayRepository
 *
 * @implements {IEssayRepository}
 */
export class EssayRepository extends IEssayRepository {
  /**
   * Cria nova redação
   * SRP: Apenas insere no banco
   *
   * @async
   * @param {Object} essayData - Dados da redação
   * @returns {Promise<Object>} Redação criada
   */
  async create(essayData) {
    const { taskId, studentId, fileUrl, fileType = 'application/octet-stream' } = essayData;

    const sql = `
      INSERT INTO essays (task_id, student_id, file_url, file_type, status, submitted_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING
        id,
        task_id as "taskId",
        student_id as "studentId",
        file_url as "fileUrl",
        file_type as "fileType",
        status,
        submitted_at as "submittedAt",
        corrected_at as "correctedAt",
        grade,
        written_feedback as "writtenFeedback"
    `;

    const values = [taskId, studentId, fileUrl, fileType, 'pending'];

    const result = await query(sql, values);

    return result.rows[0];
  }

  /**
   * Busca redação por ID
   *
   * @async
   * @param {string} essayId - ID da redação
   * @returns {Promise<Object|null>} Redação ou null
   */
  async findById(essayId) {
    const sql = `
      SELECT
        e.id,
        e.task_id as "taskId",
        e.student_id as "studentId",
        e.file_url as "fileUrl",
        e.file_type as "fileType",
        e.status,
        e.submitted_at as "submittedAt",
        e.corrected_at as "correctedAt",
        e.grade,
        e.written_feedback as "writtenFeedback",
        s.full_name as "studentName",
        s.email as "studentEmail",
        t.title as "taskTitle"
      FROM essays e
      INNER JOIN students s ON e.student_id = s.id
      INNER JOIN tasks t ON e.task_id = t.id
      WHERE e.id = $1
    `;

    const result = await query(sql, [essayId]);

    return result.rows[0] || null;
  }

  /**
   * Busca redação de um aluno em uma tarefa
   *
   * @async
   * @param {string} taskId - ID da tarefa
   * @param {string} studentId - ID do aluno
   * @returns {Promise<Object|null>} Redação ou null
   */
  async findByTaskAndStudent(taskId, studentId) {
    const sql = `
      SELECT
        e.id,
        e.task_id as "taskId",
        e.student_id as "studentId",
        e.file_url as "fileUrl",
        e.file_type as "fileType",
        e.status,
        e.submitted_at as "submittedAt",
        e.corrected_at as "correctedAt",
        e.grade,
        e.written_feedback as "writtenFeedback"
      FROM essays e
      WHERE e.task_id = $1 AND e.student_id = $2
    `;

    const result = await query(sql, [taskId, studentId]);

    return result.rows[0] || null;
  }

  /**
   * Lista redações de uma tarefa (com dados do aluno)
   *
   * @async
   * @param {string} taskId - ID da tarefa
   * @returns {Promise<Array>} Lista de redações
   */
  async findByTask(taskId) {
    const sql = `
      SELECT
        e.id,
        e.task_id as "taskId",
        e.student_id as "studentId",
        e.file_url as "fileUrl",
        e.file_type as "fileType",
        e.status,
        e.submitted_at as "submittedAt",
        e.corrected_at as "correctedAt",
        e.grade,
        e.written_feedback as "writtenFeedback",
        s.full_name as "studentName",
        s.email as "studentEmail",
        s.enrollment_number as "enrollmentNumber"
      FROM essays e
      INNER JOIN students s ON e.student_id = s.id
      WHERE e.task_id = $1
      ORDER BY e.submitted_at DESC
    `;

    const result = await query(sql, [taskId]);

    return result.rows;
  }

  /**
   * Busca redações de uma tarefa (apenas campos essenciais para exclusão)
   *
   * @async
   * @param {string} taskId - ID da tarefa
   * @returns {Promise<Array>} Lista de redações com id e fileUrl
   */
  async findByTaskId(taskId) {
    const sql = `
      SELECT
        id,
        file_url as "fileUrl"
      FROM essays
      WHERE task_id = $1
    `;

    const result = await query(sql, [taskId]);

    return result.rows;
  }

  /**
   * Lista redações de um aluno
   *
   * @async
   * @param {string} studentId - ID do aluno
   * @returns {Promise<Array>} Lista de redações
   */
  async findByStudent(studentId) {
    const sql = `
      SELECT
        e.id,
        e.task_id as "taskId",
        e.student_id as "studentId",
        e.file_url as "fileUrl",
        e.file_type as "fileType",
        e.status,
        e.submitted_at as "submittedAt",
        e.corrected_at as "correctedAt",
        e.grade,
        e.written_feedback as "writtenFeedback",
        t.title as "taskTitle",
        t.description as "taskDescription",
        t.deadline as "taskDeadline"
      FROM essays e
      INNER JOIN tasks t ON e.task_id = t.id
      WHERE e.student_id = $1
      ORDER BY e.submitted_at DESC
    `;

    const result = await query(sql, [studentId]);

    return result.rows;
  }

  /**
   * Conta redações por status para um professor
   *
   * @async
   * @param {string} teacherId - ID do professor
   * @param {string} status - Status da redação
   * @returns {Promise<number>} Quantidade de redações
   */
  async countByTeacherIdAndStatus(teacherId, status) {
    const sql = `
      SELECT COUNT(e.*)
      FROM essays e
      INNER JOIN tasks t ON e.task_id = t.id
      WHERE t.teacher_id = $1 AND e.status = $2
    `;
    const result = await query(sql, [teacherId, status]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Conta redações de um aluno
   *
   * @async
   * @param {string} studentId - ID do aluno
   * @returns {Promise<number>} Quantidade de redações
   */
  async countByStudentId(studentId) {
    const sql = 'SELECT COUNT(*) FROM essays WHERE student_id = $1';
    const result = await query(sql, [studentId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Atualiza status da redação
   *
   * @async
   * @param {string} essayId - ID da redação
   * @param {string} status - Novo status
   * @returns {Promise<Object>} Redação atualizada
   */
  async updateStatus(essayId, status) {
    const sql = `
      UPDATE essays
      SET
        status = $1::text,
        corrected_at = CASE WHEN $1::text = 'corrected' THEN CURRENT_TIMESTAMP ELSE corrected_at END
      WHERE id = $2
      RETURNING
        id,
        task_id as "taskId",
        student_id as "studentId",
        file_url as "fileUrl",
        file_type as "fileType",
        status,
        submitted_at as "submittedAt",
        corrected_at as "correctedAt",
        grade,
        written_feedback as "writtenFeedback"
    `;

    const result = await query(sql, [status, essayId]);

    return result.rows[0];
  }

  /**
   * Atualiza comentários da redação (rascunho antes de finalizar)
   * SRP: Apenas atualiza comentários, não altera status ou nota
   *
   * @async
   * @param {string} essayId - ID da redação
   * @param {string} writtenFeedback - Comentários escritos
   * @returns {Promise<Object>} Redação atualizada
   */
  async updateComments(essayId, writtenFeedback) {
    const sql = `
      UPDATE essays
      SET written_feedback = $1
      WHERE id = $2
      RETURNING
        id,
        task_id as "taskId",
        student_id as "studentId",
        file_url as "fileUrl",
        file_type as "fileType",
        status,
        submitted_at as "submittedAt",
        corrected_at as "correctedAt",
        grade,
        written_feedback as "writtenFeedback"
    `;

    const result = await query(sql, [writtenFeedback, essayId]);

    return result.rows[0];
  }

  /**
   * Finaliza correção da redação (atualiza nota, feedback e status)
   *
   * @async
   * @param {string} essayId - ID da redação
   * @param {number} grade - Nota (0-10)
   * @param {string} writtenFeedback - Comentários escritos (opcional)
   * @returns {Promise<Object>} Redação atualizada
   */
  async finalize(essayId, grade, writtenFeedback) {
    const sql = `
      UPDATE essays
      SET
        grade = $1,
        written_feedback = $2,
        status = 'corrected',
        corrected_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING
        id,
        task_id as "taskId",
        student_id as "studentId",
        file_url as "fileUrl",
        file_type as "fileType",
        status,
        submitted_at as "submittedAt",
        corrected_at as "correctedAt",
        grade,
        written_feedback as "writtenFeedback"
    `;

    const result = await query(sql, [grade, writtenFeedback, essayId]);

    return result.rows[0];
  }

  /**
   * Deleta redação
   *
   * @async
   * @param {string} essayId - ID da redação
   * @returns {Promise<boolean>} True se deletado
   */
  async delete(essayId) {
    const sql = 'DELETE FROM essays WHERE id = $1 RETURNING id';

    const result = await query(sql, [essayId]);

    return result.rowCount > 0;
  }
}
