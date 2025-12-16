import { ITaskRepository } from '../../../domain/repositories/ITaskRepository.js';
import { Task } from '../../../domain/entities/Task.js';
import { query } from '../config/database.js';
import { NotFoundError, DatabaseError } from '../../../utils/errors.js';

export class TaskRepository extends ITaskRepository {
  /**
   * Cria uma nova tarefa com turmas associadas
   * @param {Object} taskData - Dados da tarefa
   * @returns {Promise<Task>} Tarefa criada
   */
  async create(taskData) {
    const client = await query.connect();

    try {
      await client.query('BEGIN');

      // 1. Criar a tarefa
      const taskSql = `
        INSERT INTO tasks (title, description, teacher_id, deadline)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, description, teacher_id, deadline, created_at, updated_at
      `;

      const taskValues = [
        taskData.title,
        taskData.description,
        taskData.teacherId,
        taskData.deadline || null,
      ];

      const taskResult = await client.query(taskSql, taskValues);

      if (taskResult.rows.length === 0) {
        throw new DatabaseError('Falha ao criar tarefa');
      }

      const task = taskResult.rows[0];

      // 2. Associar turmas à tarefa
      if (taskData.classIds && taskData.classIds.length > 0) {
        const classValues = taskData.classIds
          .map((classId, index) => `($1, $${index + 2})`)
          .join(', ');

        const classSql = `
          INSERT INTO task_classes (task_id, class_id)
          VALUES ${classValues}
        `;

        await client.query(classSql, [task.id, ...taskData.classIds]);
      }

      await client.query('COMMIT');

      return this._mapToEntity({ ...task, classIds: taskData.classIds });
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23503') {
        // Foreign key violation
        throw new DatabaseError('Professor ou turma não encontrados');
      }
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Busca tarefa por ID com turmas associadas
   * @param {string} id - ID da tarefa
   * @returns {Promise<Task|null>} Tarefa encontrada ou null
   */
  async findById(id) {
    const sql = `
      SELECT
        t.id, t.title, t.description, t.teacher_id, t.deadline, t.created_at, t.updated_at,
        COALESCE(
          json_agg(tc.class_id) FILTER (WHERE tc.class_id IS NOT NULL),
          '[]'
        ) as class_ids
      FROM tasks t
      LEFT JOIN task_classes tc ON t.id = tc.task_id
      WHERE t.id = $1
      GROUP BY t.id
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._mapToEntity(result.rows[0]);
  }

  /**
   * Busca todas as tarefas com turmas associadas
   * @returns {Promise<Task[]>} Lista de tarefas
   */
  async findAll() {
    const sql = `
      SELECT
        t.id, t.title, t.description, t.teacher_id, t.deadline, t.created_at, t.updated_at,
        COALESCE(
          json_agg(tc.class_id) FILTER (WHERE tc.class_id IS NOT NULL),
          '[]'
        ) as class_ids
      FROM tasks t
      LEFT JOIN task_classes tc ON t.id = tc.task_id
      GROUP BY t.id
      ORDER BY t.deadline DESC NULLS LAST, t.created_at DESC
    `;

    const result = await query(sql);
    return result.rows.map((row) => this._mapToEntity(row));
  }

  /**
   * Busca tarefas por ID do professor
   * @param {string} teacherId - ID do professor
   * @returns {Promise<Task[]>} Lista de tarefas do professor
   */
  async findByTeacherId(teacherId) {
    const sql = `
      SELECT
        t.id, t.title, t.description, t.teacher_id, t.deadline, t.created_at, t.updated_at,
        COALESCE(
          json_agg(tc.class_id) FILTER (WHERE tc.class_id IS NOT NULL),
          '[]'
        ) as class_ids
      FROM tasks t
      LEFT JOIN task_classes tc ON t.id = tc.task_id
      WHERE t.teacher_id = $1
      GROUP BY t.id
      ORDER BY t.deadline DESC NULLS LAST, t.created_at DESC
    `;

    const result = await query(sql, [teacherId]);
    return result.rows.map((row) => this._mapToEntity(row));
  }

  /**
   * Busca tarefas por ID da turma
   * @param {string} classId - ID da turma
   * @returns {Promise<Task[]>} Lista de tarefas da turma
   */
  async findByClassId(classId) {
    const sql = `
      SELECT
        t.id, t.title, t.description, t.teacher_id, t.deadline, t.created_at, t.updated_at,
        COALESCE(
          json_agg(tc.class_id) FILTER (WHERE tc.class_id IS NOT NULL),
          '[]'
        ) as class_ids
      FROM tasks t
      INNER JOIN task_classes tc ON t.id = tc.task_id
      WHERE tc.class_id = $1
      GROUP BY t.id
      ORDER BY t.deadline DESC NULLS LAST, t.created_at DESC
    `;

    const result = await query(sql, [classId]);
    return result.rows.map((row) => this._mapToEntity(row));
  }

  /**
   * Atualiza tarefa
   * @param {string} id - ID da tarefa
   * @param {Object} taskData - Dados para atualizar
   * @returns {Promise<Task>} Tarefa atualizada
   */
  async update(id, taskData) {
    const client = await query.connect();

    try {
      await client.query('BEGIN');

      // 1. Atualizar dados da tarefa
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (taskData.title !== undefined) {
        fields.push(`title = $${paramCount++}`);
        values.push(taskData.title);
      }

      if (taskData.description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        values.push(taskData.description);
      }

      if (taskData.deadline !== undefined) {
        fields.push(`deadline = $${paramCount++}`);
        values.push(taskData.deadline);
      }

      if (fields.length > 0) {
        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const sql = `
          UPDATE tasks
          SET ${fields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING id, title, description, teacher_id, deadline, created_at, updated_at
        `;

        const result = await client.query(sql, values);

        if (result.rows.length === 0) {
          throw new NotFoundError('Tarefa');
        }
      }

      // 2. Atualizar turmas associadas (se fornecido)
      if (taskData.classIds !== undefined) {
        // Remover todas as associações existentes
        await client.query('DELETE FROM task_classes WHERE task_id = $1', [id]);

        // Adicionar novas associações
        if (taskData.classIds.length > 0) {
          const classValues = taskData.classIds
            .map((classId, index) => `($1, $${index + 2})`)
            .join(', ');

          const classSql = `
            INSERT INTO task_classes (task_id, class_id)
            VALUES ${classValues}
          `;

          await client.query(classSql, [id, ...taskData.classIds]);
        }
      }

      await client.query('COMMIT');

      // Buscar tarefa atualizada com turmas
      return await this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Deleta tarefa
   * @param {string} id - ID da tarefa
   * @returns {Promise<boolean>} True se deletado com sucesso
   */
  async delete(id) {
    const sql = 'DELETE FROM tasks WHERE id = $1';
    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Tarefa');
    }

    return true;
  }

  /**
   * Mapeia row do banco para entidade Task
   * @private
   */
  _mapToEntity(row) {
    return new Task({
      id: row.id,
      title: row.title,
      description: row.description,
      teacherId: row.teacher_id,
      deadline: row.deadline,
      classIds: row.class_ids || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
