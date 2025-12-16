import { IClassRepository } from '../../../domain/repositories/IClassRepository.js';
import { Class } from '../../../domain/entities/Class.js';
import { query } from '../config/database.js';
import { NotFoundError, DatabaseError } from '../../../utils/errors.js';

export class ClassRepository extends IClassRepository {
  /**
   * Cria uma nova turma
   * @param {Object} classData - Dados da turma
   * @returns {Promise<Class>} Turma criada
   */
  async create(classData) {
    try {
      const sql = `
        INSERT INTO classes (name, description, teacher_id)
        VALUES ($1, $2, $3)
        RETURNING id, name, description, teacher_id, created_at, updated_at
      `;

      const values = [
        classData.name,
        classData.description || null,
        classData.teacherId,
      ];

      const result = await query(sql, values);

      if (result.rows.length === 0) {
        throw new DatabaseError('Falha ao criar turma');
      }

      return this._mapToEntity(result.rows[0]);
    } catch (error) {
      if (error.code === '23503') { // Foreign key violation
        throw new DatabaseError('Professor não encontrado');
      }
      throw error;
    }
  }

  /**
   * Busca turma por ID
   * @param {string} id - ID da turma
   * @returns {Promise<Class|null>} Turma encontrada ou null
   */
  async findById(id) {
    const sql = `
      SELECT c.id, c.name, c.description, c.teacher_id, c.created_at, c.updated_at,
             (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS student_count,
             (SELECT COUNT(*) FROM task_classes tc WHERE tc.class_id = c.id) AS task_count
      FROM classes c
      WHERE c.id = $1
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._mapToEntity(result.rows[0]);
  }

  /**
   * Busca todas as turmas
   * @returns {Promise<Class[]>} Lista de turmas
   */
  async findAll() {
    const sql = `
      SELECT c.id, c.name, c.description, c.teacher_id, c.created_at, c.updated_at,
             (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS student_count,
             (SELECT COUNT(*) FROM task_classes tc WHERE tc.class_id = c.id) AS task_count
      FROM classes c
      ORDER BY c.name ASC
    `;

    const result = await query(sql);
    return result.rows.map(row => this._mapToEntity(row));
  }

  /**
   * Busca turmas por ID do professor
   * @param {string} teacherId - ID do professor
   * @returns {Promise<Class[]>} Lista de turmas do professor
   */
  async findByTeacherId(teacherId) {
    const sql = `
      SELECT c.id, c.name, c.description, c.teacher_id, c.created_at, c.updated_at,
             (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS student_count,
             (SELECT COUNT(*) FROM task_classes tc WHERE tc.class_id = c.id) AS task_count
      FROM classes c
      WHERE c.teacher_id = $1
      ORDER BY c.name ASC
    `;

    const result = await query(sql, [teacherId]);
    return result.rows.map(row => this._mapToEntity(row));
  }

  /**
   * Atualiza turma
   * @param {string} id - ID da turma
   * @param {Object} classData - Dados para atualizar
   * @returns {Promise<Class>} Turma atualizada
   */
  async update(id, classData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (classData.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(classData.name);
    }

    if (classData.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(classData.description);
    }

    if (classData.teacherId !== undefined) {
      fields.push(`teacher_id = $${paramCount++}`);
      values.push(classData.teacherId);
    }

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `
      UPDATE classes
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, description, teacher_id, created_at, updated_at
    `;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      throw new NotFoundError('Turma');
    }

    return this._mapToEntity(result.rows[0]);
  }

  /**
   * Deleta turma
   * @param {string} id - ID da turma
   * @returns {Promise<boolean>} True se deletado com sucesso
   */
  async delete(id) {
    const sql = 'DELETE FROM classes WHERE id = $1';
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Turma');
    }

    return true;
  }

  /**
   * Mapeia row do banco para entidade Class
   * @private
   */
  _mapToEntity(row) {
    return new Class({
      id: row.id,
      name: row.name,
      description: row.description,
      teacherId: row.teacher_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      studentCount: row.student_count,
      taskCount: row.task_count,
    });
  }
}
