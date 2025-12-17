import { CreateTaskUseCase } from '../../../application/use-cases/tasks/CreateTaskUseCase.js';
import { GetTasksUseCase } from '../../../application/use-cases/tasks/GetTasksUseCase.js';
import { GetTaskByIdUseCase } from '../../../application/use-cases/tasks/GetTaskByIdUseCase.js';
import { UpdateTaskUseCase } from '../../../application/use-cases/tasks/UpdateTaskUseCase.js';
import { DeleteTaskUseCase } from '../../../application/use-cases/tasks/DeleteTaskUseCase.js';
import { GetTaskStudentsUseCase } from '../../../application/use-cases/tasks/GetTaskStudentsUseCase.js';
import { GetTasksByClassUseCase } from '../../../application/use-cases/tasks/GetTasksByClassUseCase.js';
import { CreateTaskDTO } from '../../../application/dtos/CreateTaskDTO.js';
import { UpdateTaskDTO } from '../../../application/dtos/UpdateTaskDTO.js';
import { TaskRepository } from '../../database/repositories/TaskRepository.js';
import { ClassRepository } from '../../database/repositories/ClassRepository.js';
import { TeacherRepository } from '../../database/repositories/TeacherRepository.js';
import { StudentRepository } from '../../database/repositories/StudentRepository.js';

/**
 * Controller para gerenciamento de tarefas
 * Segue SRP - apenas lida com requisições HTTP e delega para use cases
 */
export class TaskController {
  constructor() {
    // Dependency Injection
    this.taskRepository = new TaskRepository();
    this.classRepository = new ClassRepository();
    this.teacherRepository = new TeacherRepository();
    this.studentRepository = new StudentRepository();

    this.createTaskUseCase = new CreateTaskUseCase(
      this.taskRepository,
      this.classRepository,
      this.teacherRepository
    );

    this.getTasksUseCase = new GetTasksUseCase(
      this.taskRepository,
      this.studentRepository
    );

    this.getTaskByIdUseCase = new GetTaskByIdUseCase(this.taskRepository);

    this.updateTaskUseCase = new UpdateTaskUseCase(this.taskRepository);

    this.deleteTaskUseCase = new DeleteTaskUseCase(this.taskRepository);

    this.getTaskStudentsUseCase = new GetTaskStudentsUseCase(
      this.taskRepository
    );

    this.getTasksByClassUseCase = new GetTasksByClassUseCase(
      this.taskRepository,
      this.classRepository
    );

    // Bind dos métodos (para manter contexto quando usado como callback)
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.getStudents = this.getStudents.bind(this);
    this.getTasksByClass = this.getTasksByClass.bind(this);
  }

  /**
   * POST /api/tasks
   * Cria uma nova tarefa (apenas professores)
   */
  async create(req, res, next) {
    try {
      // req.user vem do authMiddleware
      // teacherId é o ID do professor autenticado
      const createTaskDTO = new CreateTaskDTO({
        ...req.body,
        teacherId: req.user.id,
      });

      const result = await this.createTaskUseCase.execute(createTaskDTO);

      res.status(201).json({
        success: true,
        message: 'Tarefa criada com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks
   * Lista tarefas (professores veem suas tarefas, alunos veem tarefas da sua turma)
   */
  async getAll(req, res, next) {
    try {
      const { teacherId, classId } = req.query;

      const filters = {};

      if (teacherId) {
        filters.teacherId = teacherId;
      }

      if (classId) {
        filters.classId = classId;
      }

      const result = await this.getTasksUseCase.execute(filters, req.user);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks/:id
   * Busca uma tarefa específica por ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const result = await this.getTaskByIdUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/tasks/:id
   * Atualiza uma tarefa (apenas o professor dono da tarefa)
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateTaskDTO = new UpdateTaskDTO(req.body);

      const result = await this.updateTaskUseCase.execute(
        id,
        updateTaskDTO,
        req.user.id // teacherId do professor autenticado
      );

      res.status(200).json({
        success: true,
        message: 'Tarefa atualizada com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/tasks/:id
   * Deleta uma tarefa (apenas o professor dono da tarefa)
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await this.deleteTaskUseCase.execute(
        id,
        req.user.id // teacherId do professor autenticado
      );

      res.status(200).json({
        success: true,
        message: 'Tarefa deletada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks/:id/students
   * Busca alunos de uma tarefa com status de entrega
   */
  async getStudents(req, res, next) {
    try {
      const { id } = req.params;

      const result = await this.getTaskStudentsUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks/class/:classId
   * Busca todas as tarefas de uma turma específica
   */
  async getTasksByClass(req, res, next) {
    try {
      const { classId } = req.params;

      const result = await this.getTasksByClassUseCase.execute(classId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
