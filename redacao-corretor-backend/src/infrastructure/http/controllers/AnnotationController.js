/**
 * Controller de anotações
 *
 * Responsabilidades:
 * - Receber requisições HTTP relacionadas a anotações de redações
 * - Validar parâmetros da requisição
 * - Chamar use cases apropriados
 * - Retornar respostas HTTP formatadas
 *
 * Segue SOLID:
 * - SRP: Apenas gerencia HTTP para annotations
 * - DIP: Depende de use cases injetados
 *
 * @class
 */
export class AnnotationController {
  /**
   * @param {SaveAnnotationsUseCase} saveAnnotationsUseCase - Use case de salvar anotações
   * @param {GetAnnotationsUseCase} getAnnotationsUseCase - Use case de buscar anotações
   * @param {UpdateEssayStatusUseCase} updateEssayStatusUseCase - Use case de atualizar status
   */
  constructor(saveAnnotationsUseCase, getAnnotationsUseCase, updateEssayStatusUseCase) {
    this.saveAnnotationsUseCase = saveAnnotationsUseCase;
    this.getAnnotationsUseCase = getAnnotationsUseCase;
    this.updateEssayStatusUseCase = updateEssayStatusUseCase;

    // Bind methods para preservar contexto
    this.save = this.save.bind(this);
    this.get = this.get.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
  }

  /**
   * Salvar/atualizar anotações de redação
   * POST /api/essays/:essayId/annotations
   *
   * Body esperado:
   * {
   *   "annotationData": {
   *     "version": "1.0",
   *     "lines": [
   *       {
   *         "points": [[x, y, pressure], ...],
   *         "color": "#FF0000",
   *         "size": 4
   *       }
   *     ]
   *   },
   *   "pageNumber": 1
   * }
   *
   * @async
   * @param {Request} req - Request do Express
   * @param {Response} res - Response do Express
   * @param {NextFunction} next - Next middleware
   */
  async save(req, res, next) {
    try {
      const { essayId } = req.params;
      const { annotationData, pageNumber = 1 } = req.body;
      const teacherId = req.user.id; // Vem do authMiddleware

      // Validar que é um professor
      if (req.user.userType !== 'teacher') {
        return res.status(403).json({
          success: false,
          error: 'Apenas professores podem fazer anotações',
        });
      }

      // Validar que annotationData foi fornecido
      if (!annotationData) {
        return res.status(400).json({
          success: false,
          error: 'annotationData é obrigatório',
        });
      }

      // Executar use case
      const savedAnnotation = await this.saveAnnotationsUseCase.execute({
        essayId,
        teacherId,
        annotationData,
        pageNumber,
      });

      res.status(200).json({
        success: true,
        message: 'Anotações salvas com sucesso',
        data: savedAnnotation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar anotações de redação
   * GET /api/essays/:essayId/annotations
   * GET /api/essays/:essayId/annotations?page=2
   *
   * @async
   * @param {Request} req - Request do Express
   * @param {Response} res - Response do Express
   * @param {NextFunction} next - Next middleware
   */
  async get(req, res, next) {
    try {
      const { essayId } = req.params;
      const { page } = req.query;
      const userId = req.user.id;
      const userType = req.user.userType;

      // Converter page para número se fornecido
      const pageNumber = page ? parseInt(page, 10) : null;

      // Executar use case
      const annotations = await this.getAnnotationsUseCase.execute({
        essayId,
        userId,
        userType,
        pageNumber,
      });

      res.status(200).json({
        success: true,
        data: annotations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar status de redação
   * PATCH /api/essays/:essayId/status
   *
   * Body esperado:
   * {
   *   "status": "corrected"
   * }
   *
   * Status possíveis: pending, correcting, corrected
   *
   * @async
   * @param {Request} req - Request do Express
   * @param {Response} res - Response do Express
   * @param {NextFunction} next - Next middleware
   */
  async updateStatus(req, res, next) {
    try {
      const { essayId } = req.params;
      const { status } = req.body;
      const teacherId = req.user.id;

      // Validar que é um professor
      if (req.user.userType !== 'teacher') {
        return res.status(403).json({
          success: false,
          error: 'Apenas professores podem atualizar status de redação',
        });
      }

      // Validar que status foi fornecido
      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'status é obrigatório',
        });
      }

      // Executar use case
      const updatedEssay = await this.updateEssayStatusUseCase.execute({
        essayId,
        teacherId,
        status,
      });

      res.status(200).json({
        success: true,
        message: `Status atualizado para: ${status}`,
        data: updatedEssay,
      });
    } catch (error) {
      next(error);
    }
  }
}
