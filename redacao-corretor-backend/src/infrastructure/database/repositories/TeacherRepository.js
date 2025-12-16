import { ITeacherRepository } from '../../../domain/repositories/ITeacherRepository.js';
import { Teacher } from '../../../domain/entities/Teacher.js';
import { query } from '../config/database.js';
import { NotFoundError, DatabaseError } from '../../../utils/errors.js';

export class TeacherRepository extends ITeacherRepository {
  /**
   * Cria um novo professor
   * @param {Object} teacherData - Dados do professor
   * @returns {Promise<Teacher>} Professor criado
   */
  async create(teacherData) {
    try {
      const sql = `
        INSERT INTO teachers (email, password_hash, full_name, specialization)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, password_hash, full_name, specialization, created_at, updated_at
      `;

      const values = [
        teacherData.email,
        teacherData.passwordHash,
        teacherData.fullName,
        teacherData.specialization || null,
      ];

      const result = await query(sql, values);

      if (result.rows.length === 0) {
        throw new DatabaseError('Falha ao criar professor');
      }

      return this._mapToEntity(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new DatabaseError('Email já cadastrado');
      }
      throw error;
    }
  }

  /**
   * Busca professor por ID
   * @param {string} id - ID do professor
   * @returns {Promise<Teacher|null>} Professor encontrado ou null
   */
  async findById(id) {
    const sql = `
      SELECT id, email, password_hash, full_name, specialization, created_at, updated_at
      FROM teachers
      WHERE id = $1
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._mapToEntity(result.rows[0]);
  }

  /**
   * Busca professor por email
   * @param {string} email - Email do professor
   * @returns {Promise<Teacher|null>} Professor encontrado ou null
   */
  async findByEmail(email) {
    const sql = `
      SELECT id, email, password_hash, full_name, specialization, created_at, updated_at
      FROM teachers
      WHERE email = $1
    `;

    const result = await query(sql, [email]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._mapToEntity(result.rows[0]);
  }

  /**
   * Busca todos os professores
   * @returns {Promise<Teacher[]>} Lista de professores
   */
  async findAll() {
    const sql = `
      SELECT id, email, password_hash, full_name, specialization, created_at, updated_at
      FROM teachers
      ORDER BY full_name ASC
    `;

    const result = await query(sql);
    return result.rows.map(row => this._mapToEntity(row));
  }

  /**
   * Atualiza professor
   * @param {string} id - ID do professor
   * @param {Object} teacherData - Dados para atualizar
   * @returns {Promise<Teacher>} Professor atualizado
   */
  async update(id, teacherData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (teacherData.email) {
      fields.push(`email = $${paramCount++}`);
      values.push(teacherData.email);
    }

    if (teacherData.fullName) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(teacherData.fullName);
    }

    if (teacherData.passwordHash) {
      fields.push(`password_hash = $${paramCount++}`);
      values.push(teacherData.passwordHash);
    }

    if (teacherData.specialization !== undefined) {
      fields.push(`specialization = $${paramCount++}`);
      values.push(teacherData.specialization);
    }

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `
      UPDATE teachers
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, password_hash, full_name, specialization, created_at, updated_at
    `;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      throw new NotFoundError('Professor');
    }

    return this._mapToEntity(result.rows[0]);
  }

  /**
   * Deleta professor
   * @param {string} id - ID do professor
   * @returns {Promise<boolean>} True se deletado com sucesso
   */
  async delete(id) {
    const sql = 'DELETE FROM teachers WHERE id = $1';
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Professor');
    }

    return true;
  }

  /**
   * Mapeia row do banco para entidade Teacher
   * @private
   */
  _mapToEntity(row) {
    return new Teacher({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      specialization: row.specialization,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
