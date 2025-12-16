import { CreateClassUseCase } from '../../../application/use-cases/classes/CreateClassUseCase.js';
import { GetClassesUseCase } from '../../../application/use-cases/classes/GetClassesUseCase.js';
import { GetClassByIdUseCase } from '../../../application/use-cases/classes/GetClassByIdUseCase.js';
import { UpdateClassUseCase } from '../../../application/use-cases/classes/UpdateClassUseCase.js';
import { DeleteClassUseCase } from '../../../application/use-cases/classes/DeleteClassUseCase.js';
import { CreateClassDTO } from '../../../application/dtos/CreateClassDTO.js';
import { UpdateClassDTO } from '../../../application/dtos/UpdateClassDTO.js';
import { ClassRepository } from '../../database/repositories/ClassRepository.js';
import { TeacherRepository } from '../../database/repositories/TeacherRepository.js';

/**
 * Controller para gerenciamento de turmas
 * Segue SRP - apenas lida com requisições HTTP e delega para use cases
 */
export class ClassController {
  constructor() {
    // Dependency Injection
    this.classRepository = new ClassRepository();
    this.teacherRepository = new TeacherRepository();

    this.createClassUseCase = new CreateClassUseCase(
      this.classRepository,
      this.teacherRepository
    );

    this.getClassesUseCase = new GetClassesUseCase(this.classRepository);

    this.getClassByIdUseCase = new GetClassByIdUseCase(this.classRepository);

    this.updateClassUseCase = new UpdateClassUseCase(this.classRepository);

    this.deleteClassUseCase = new DeleteClassUseCase(this.classRepository);

    // Bind dos métodos (para manter contexto quando usado como callback)
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  /**
   * POST /api/classes
   * Cria uma nova turma (apenas professores)
   */
  async create(req, res, next) {
    try {
      // req.user vem do authMiddleware
      // teacherId é o ID do professor autenticado
      const createClassDTO = new CreateClassDTO({
        ...req.body,
        teacherId: req.user.id,
      });

      const result = await this.createClassUseCase.execute(createClassDTO);

      res.status(201).json({
        success: true,
        message: 'Turma criada com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/classes
   * Lista turmas (professores veem suas turmas, pode filtrar por teacherId)
   */
  async getAll(req, res, next) {
    try {
      const { teacherId } = req.query;

      const filters = {};

      // Se o usuário for professor, mostrar apenas suas turmas
      if (req.user.userType === 'teacher') {
        filters.teacherId = teacherId || req.user.id;
      } else if (teacherId) {
        // Se for aluno e passar teacherId, permite buscar
        filters.teacherId = teacherId;
      }

      const result = await this.getClassesUseCase.execute(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/classes/:id
   * Busca uma turma específica por ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const result = await this.getClassByIdUseCase.execute(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/classes/:id
   * Atualiza uma turma (apenas o professor dono da turma)
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateClassDTO = new UpdateClassDTO(req.body);

      const result = await this.updateClassUseCase.execute(
        id,
        updateClassDTO,
        req.user.id // teacherId do professor autenticado
      );

      res.status(200).json({
        success: true,
        message: 'Turma atualizada com sucesso',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/classes/:id
   * Deleta uma turma (apenas o professor dono da turma)
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await this.deleteClassUseCase.execute(
        id,
        req.user.id // teacherId do professor autenticado
      );

      res.status(200).json({
        success: true,
        message: 'Turma deletada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}
