import { IStudentRepository } from '../../../domain/repositories/IStudentRepository.js';
import { Student } from '../../../domain/entities/Student.js';
import { query } from '../config/database.js';
import { NotFoundError, DatabaseError } from '../../../utils/errors.js';

export class StudentRepository extends IStudentRepository {
  /**
   * Cria um novo aluno
   * @param {Object} studentData - Dados do aluno
   * @returns {Promise<Student>} Aluno criado
   */
  async create(studentData) {
    try {
      const sql = `
        INSERT INTO students (email, password_hash, full_name, enrollment_number, class_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, password_hash, full_name, enrollment_number, class_id, created_at, updated_at
      `;

      const values = [
        studentData.email,
        studentData.passwordHash,
        studentData.fullName,
        studentData.enrollmentNumber || null,
        studentData.classId || null,
      ];

      const result = await query(sql, values);

      if (result.rows.length === 0) {
        throw new DatabaseError('Falha ao criar aluno');
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
   * Busca aluno por ID
   * @param {string} id - ID do aluno
   * @returns {Promise<Student|null>} Aluno encontrado ou null
   */
  async findById(id) {
    const sql = `
      SELECT id, email, password_hash, full_name, enrollment_number, class_id, created_at, updated_at
      FROM students
      WHERE id = $1
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._mapToEntity(result.rows[0]);
  }

  /**
   * Busca aluno por email
   * @param {string} email - Email do aluno
   * @returns {Promise<Student|null>} Aluno encontrado ou null
   */
  async findByEmail(email) {
    const sql = `
      SELECT id, email, password_hash, full_name, enrollment_number, class_id, created_at, updated_at
      FROM students
      WHERE email = $1
    `;

    const result = await query(sql, [email]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._mapToEntity(result.rows[0]);
  }

  /**
   * Busca aluno por número de matrícula
   * @param {string} enrollmentNumber - Número de matrícula
   * @returns {Promise<Student|null>} Aluno encontrado ou null
   */
  async findByEnrollmentNumber(enrollmentNumber) {
    const sql = `
      SELECT id, email, password_hash, full_name, enrollment_number, class_id, created_at, updated_at
      FROM students
      WHERE enrollment_number = $1
    `;

    const result = await query(sql, [enrollmentNumber]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._mapToEntity(result.rows[0]);
  }

  /**
   * Busca todos os alunos
   * @returns {Promise<Student[]>} Lista de alunos
   */
  async findAll() {
    const sql = `
      SELECT id, email, password_hash, full_name, enrollment_number, class_id, created_at, updated_at
      FROM students
      ORDER BY full_name ASC
    `;

    const result = await query(sql);
    return result.rows.map(row => this._mapToEntity(row));
  }

  /**
   * Busca alunos por nome (parcial)
   * @param {string} name - Nome ou parte do nome
   * @returns {Promise<Student[]>} Lista de alunos encontrados
   */
  async findByName(name) {
    const sql = `
      SELECT id, email, password_hash, full_name, enrollment_number, class_id, created_at, updated_at
      FROM students
      WHERE full_name ILIKE $1
      ORDER BY full_name ASC
      LIMIT 10
    `;

    const result = await query(sql, [`%${name}%`]);
    return result.rows.map(row => this._mapToEntity(row));
  }

  /**
   * Atualiza aluno
   * @param {string} id - ID do aluno
   * @param {Object} studentData - Dados para atualizar
   * @returns {Promise<Student>} Aluno atualizado
   */
  async update(id, studentData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (studentData.email) {
      fields.push(`email = $${paramCount++}`);
      values.push(studentData.email);
    }

    if (studentData.fullName) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(studentData.fullName);
    }

    if (studentData.passwordHash) {
      fields.push(`password_hash = $${paramCount++}`);
      values.push(studentData.passwordHash);
    }

    if (studentData.enrollmentNumber !== undefined) {
      fields.push(`enrollment_number = $${paramCount++}`);
      values.push(studentData.enrollmentNumber);
    }

    if (studentData.classId !== undefined) {
      fields.push(`class_id = $${paramCount++}`);
      values.push(studentData.classId);
    }

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `
      UPDATE students
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, password_hash, full_name, enrollment_number, class_id, created_at, updated_at
    `;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      throw new NotFoundError('Aluno');
    }

    return this._mapToEntity(result.rows[0]);
  }

  /**
   * Deleta aluno
   * @param {string} id - ID do aluno
   * @returns {Promise<boolean>} True se deletado com sucesso
   */
  async delete(id) {
    const sql = 'DELETE FROM students WHERE id = $1';
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Aluno');
    }

    return true;
  }

  /**
   * Mapeia row do banco para entidade Student
   * @private
   */
  _mapToEntity(row) {
    return new Student({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      enrollmentNumber: row.enrollment_number,
      classId: row.class_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
