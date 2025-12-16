import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { User } from '../../../domain/entities/User.js';
import { query } from '../config/database.js';
import { NotFoundError, DatabaseError } from '../../../utils/errors.js';

export class UserRepository extends IUserRepository {
  /**
   * Cria um novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<User>} Usuário criado
   */
  async create(userData) {
    try {
      const sql = `
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, password_hash, full_name, role, created_at, updated_at
      `;

      const values = [
        userData.email,
        userData.passwordHash,
        userData.fullName,
        userData.role,
      ];

      const result = await query(sql, values);

      if (result.rows.length === 0) {
        throw new DatabaseError('Falha ao criar usuário');
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
   * Busca usuário por ID
   * @param {string} id - ID do usuário
   * @returns {Promise<User|null>} Usuário encontrado ou null
   */
  async findById(id) {
    const sql = `
      SELECT id, email, password_hash, full_name, role, created_at, updated_at
      FROM users
      WHERE id = $1
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._mapToEntity(result.rows[0]);
  }

  /**
   * Busca usuário por email
   * @param {string} email - Email do usuário
   * @returns {Promise<User|null>} Usuário encontrado ou null
   */
  async findByEmail(email) {
    const sql = `
      SELECT id, email, password_hash, full_name, role, created_at, updated_at
      FROM users
      WHERE email = $1
    `;

    const result = await query(sql, [email]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._mapToEntity(result.rows[0]);
  }

  /**
   * Busca todos os usuários
   * @returns {Promise<User[]>} Lista de usuários
   */
  async findAll() {
    const sql = `
      SELECT id, email, password_hash, full_name, role, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;

    const result = await query(sql);
    return result.rows.map(row => this._mapToEntity(row));
  }

  /**
   * Busca usuários por role
   * @param {string} role - Role do usuário (student ou teacher)
   * @returns {Promise<User[]>} Lista de usuários
   */
  async findByRole(role) {
    const sql = `
      SELECT id, email, password_hash, full_name, role, created_at, updated_at
      FROM users
      WHERE role = $1
      ORDER BY full_name ASC
    `;

    const result = await query(sql, [role]);
    return result.rows.map(row => this._mapToEntity(row));
  }

  /**
   * Atualiza usuário
   * @param {string} id - ID do usuário
   * @param {Object} userData - Dados para atualizar
   * @returns {Promise<User>} Usuário atualizado
   */
  async update(id, userData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (userData.email) {
      fields.push(`email = $${paramCount++}`);
      values.push(userData.email);
    }

    if (userData.fullName) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(userData.fullName);
    }

    if (userData.passwordHash) {
      fields.push(`password_hash = $${paramCount++}`);
      values.push(userData.passwordHash);
    }

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, password_hash, full_name, role, created_at, updated_at
    `;

    const result = await query(sql, values);

    if (result.rows.length === 0) {
      throw new NotFoundError('Usuário');
    }

    return this._mapToEntity(result.rows[0]);
  }

  /**
   * Deleta usuário
   * @param {string} id - ID do usuário
   * @returns {Promise<boolean>} True se deletado com sucesso
   */
  async delete(id) {
    const sql = 'DELETE FROM users WHERE id = $1';
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Usuário');
    }

    return true;
  }

  /**
   * Mapeia row do banco para entidade User
   * @private
   */
  _mapToEntity(row) {
    return new User({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
