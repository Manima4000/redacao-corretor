/**
 * Controller de redações (essays)
 *
 * Responsabilidades:
 * - Receber requisições HTTP relacionadas a redações
 * - Validar parâmetros da requisição
 * - Chamar use cases apropriados
 * - Retornar respostas HTTP formatadas
 *
 * Segue SOLID:
 * - SRP: Apenas gerencia HTTP para essays
 * - DIP: Depende de use cases injetados
 */
export class EssayController {
  /**
   * @param {UploadEssayUseCase} uploadEssayUseCase - Use case de upload
   * @param {GetStudentEssayByTaskUseCase} getStudentEssayByTaskUseCase - Use case busca redação
   * @param {GetEssayByIdUseCase} getEssayByIdUseCase - Use case busca redação por ID
   * @param {GetEssayImageUseCase} getEssayImageUseCase - Use case busca imagem da redação
   * @param {DeleteEssayUseCase} deleteEssayUseCase - Use case de delete
   */
  constructor(uploadEssayUseCase, getStudentEssayByTaskUseCase, getEssayByIdUseCase, getEssayImageUseCase, deleteEssayUseCase) {
    this.uploadEssayUseCase = uploadEssayUseCase;
    this.getStudentEssayByTaskUseCase = getStudentEssayByTaskUseCase;
    this.getEssayByIdUseCase = getEssayByIdUseCase;
    this.getEssayImageUseCase = getEssayImageUseCase;
    this.deleteEssayUseCase = deleteEssayUseCase;

    // Bind methods
    this.upload = this.upload.bind(this);
    this.getStudentEssayByTask = this.getStudentEssayByTask.bind(this);
    this.getById = this.getById.bind(this);
    this.getEssayImage = this.getEssayImage.bind(this);
    this.delete = this.delete.bind(this);
  }

  /**
   * Upload de redação
   * POST /api/essays/upload
   *
   * @async
   * @param {Request} req - Request do Express
   * @param {Response} res - Response do Express
   * @param {NextFunction} next - Next middleware
   */
  async upload(req, res, next) {
    try {
      const { taskId } = req.body;
      const studentId = req.user.id; // Vem do authMiddleware

      // Validar que taskId foi fornecido
      if (!taskId) {
        return res.status(400).json({
          success: false,
          error: 'taskId é obrigatório',
        });
      }

      // Validar que é um estudante
      if (req.user.userType !== 'student') {
        return res.status(403).json({
          success: false,
          error: 'Apenas alunos podem enviar redações',
        });
      }

      // req.validatedFile vem do middleware validateFileMetadata
      if (!req.validatedFile) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum arquivo válido foi enviado',
        });
      }

      // Executar use case
      const essay = await this.uploadEssayUseCase.execute({
        taskId,
        studentId,
        fileBuffer: req.validatedFile.buffer,
        fileMetadata: req.validatedFile,
      });

      res.status(201).json({
        success: true,
        message: 'Redação enviada com sucesso',
        data: {
          essay,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar redação do aluno autenticado para uma tarefa
   * GET /api/essays/task/:taskId/student
   *
   * @async
   * @param {Request} req - Request do Express
   * @param {Response} res - Response do Express
   * @param {NextFunction} next - Next middleware
   */
  async getStudentEssayByTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const studentId = req.user.id;

      // Validar que é um estudante
      if (req.user.userType !== 'student') {
        return res.status(403).json({
          success: false,
          error: 'Apenas alunos podem acessar este recurso',
        });
      }

      const essay = await this.getStudentEssayByTaskUseCase.execute({
        taskId,
        studentId,
      });

      // Se não encontrou redação, retorna 404
      if (!essay) {
        return res.status(404).json({
          success: false,
          error: 'Você ainda não enviou redação para esta tarefa',
        });
      }

      res.status(200).json({
        success: true,
        data: essay,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar redações de uma tarefa (apenas professores)
   * GET /api/essays/task/:taskId
   *
   * @async
   * @param {Request} req - Request do Express
   * @param {Response} res - Response do Express
   * @param {NextFunction} next - Next middleware
   */
  async listByTask(req, res, next) {
    try {
      const { taskId } = req.params;

      // TODO: Implementar use case GetEssaysByTaskUseCase

      res.status(200).json({
        success: true,
        data: {
          essays: [],
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar redações do aluno logado
   * GET /api/essays/my-essays
   *
   * @async
   * @param {Request} req - Request do Express
   * @param {Response} res - Response do Express
   * @param {NextFunction} next - Next middleware
   */
  async listMyEssays(req, res, next) {
    try {
      const studentId = req.user.id;

      // TODO: Implementar use case GetMyEssaysUseCase

      res.status(200).json({
        success: true,
        data: {
          essays: [],
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter detalhes de uma redação
   * GET /api/essays/:essayId
   *
   * @async
   * @param {Request} req - Request do Express
   * @param {Response} res - Response do Express
   * @param {NextFunction} next - Next middleware
   */
  async getById(req, res, next) {
    try {
      const { essayId } = req.params;
      const userId = req.user.id;
      const userType = req.user.userType;

      const essay = await this.getEssayByIdUseCase.execute({
        essayId,
        userId,
        userType,
      });

      res.status(200).json({
        success: true,
        data: essay,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter imagem da redação (proxy)
   * GET /api/essays/:essayId/image
   *
   * @async
   * @param {Request} req - Request do Express
   * @param {Response} res - Response do Express
   * @param {NextFunction} next - Next middleware
   */
  async getEssayImage(req, res, next) {
    try {
      const { essayId } = req.params;
      const userId = req.user.id;
      const userType = req.user.userType;

      const { buffer, mimetype } = await this.getEssayImageUseCase.execute({
        essayId,
        userId,
        userType,
      });

      // Define headers para cache e tipo de conteúdo
      res.setHeader('Content-Type', mimetype);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache de 1 hora
      res.setHeader('Content-Length', buffer.length);

      // Envia o buffer diretamente
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletar redação (apenas dono ou professor)
   * DELETE /api/essays/:essayId
   *
   * @async
   * @param {Request} req - Request do Express
   * @param {Response} res - Response do Express
   * @param {NextFunction} next - Next middleware
   */
  async delete(req, res, next) {
    try {
      const { essayId } = req.params;
      const userId = req.user.id;
      const userType = req.user.userType;

      await this.deleteEssayUseCase.execute({
        essayId,
        userId,
        userType,
      });

      res.status(200).json({
        success: true,
        message: 'Redação deletada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}
