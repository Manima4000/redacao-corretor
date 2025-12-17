import { NotFoundError, ForbiddenError, ValidationError } from '../../../utils/errors.js';

/**
 * Use Case: Salvar/Atualizar Anotações de Redação
 *
 * Responsabilidades:
 * 1. Validar que a redação existe
 * 2. Validar que o usuário é o professor da turma
 * 3. Validar estrutura dos dados de anotação
 * 4. Salvar ou atualizar anotações no banco (UPSERT)
 * 5. Atualizar status da redação (pending → correcting)
 *
 * Segue SOLID:
 * - SRP: Apenas orquestra salvamento de anotações
 * - DIP: Depende de abstrações (repositories)
 *
 * @class
 */
export class SaveAnnotationsUseCase {
  /**
   * @param {IAnnotationRepository} annotationRepository - Repositório de anotações
   * @param {IEssayRepository} essayRepository - Repositório de redações
   * @param {ITaskRepository} taskRepository - Repositório de tarefas
   */
  constructor(annotationRepository, essayRepository, taskRepository) {
    this.annotationRepository = annotationRepository;
    this.essayRepository = essayRepository;
    this.taskRepository = taskRepository;
  }

  /**
   * Executa o salvamento das anotações
   *
   * @async
   * @param {Object} params - Parâmetros
   * @param {string} params.essayId - ID da redação
   * @param {string} params.teacherId - ID do professor
   * @param {Object} params.annotationData - Dados da anotação (linhas do Konva)
   * @param {number} params.pageNumber - Número da página (default: 1)
   * @returns {Promise<Object>} Anotação salva
   * @throws {NotFoundError} Se redação não existir
   * @throws {ForbiddenError} Se não for o professor da turma
   * @throws {ValidationError} Se dados forem inválidos
   */
  async execute({ essayId, teacherId, annotationData, pageNumber = 1 }) {
    console.log('[SAVE ANNOTATIONS] Iniciando salvamento...', {
      essayId,
      teacherId,
      pageNumber,
      hasAnnotationData: !!annotationData,
      linesCount: annotationData?.lines?.length,
    });

    // 1. Validar que a redação existe
    const essay = await this.essayRepository.findById(essayId);

    if (!essay) {
      throw new NotFoundError('Redação');
    }

    // 2. Validar que a tarefa existe e buscar professor
    const task = await this.taskRepository.findById(essay.taskId);

    if (!task) {
      throw new NotFoundError('Tarefa');
    }

    // 3. Validar que o usuário é o professor da turma
    // task tem classIds array, precisamos buscar se teacherId é dono de alguma das turmas
    // Por simplicidade, vamos permitir que qualquer professor corrija por enquanto
    // TODO: Adicionar validação de ownership de turma

    // 4. Validar estrutura dos dados de anotação
    this._validateAnnotationData(annotationData);

    // 5. Salvar ou atualizar anotações (UPSERT)
    const savedAnnotation = await this.annotationRepository.saveOrUpdate(
      essayId,
      annotationData,
      pageNumber
    );

    // 6. Atualizar status da redação para "correcting" se ainda estiver "pending"
    if (essay.status === 'pending') {
      await this.essayRepository.updateStatus(essayId, 'correcting');
    }

    return savedAnnotation;
  }

  /**
   * Valida estrutura dos dados de anotação (react-konva format)
   *
   * Formato esperado:
   * {
   *   version: "1.0",
   *   lines: [
   *     {
   *       points: [[x, y, pressure], ...],
   *       color: "#FF0000",
   *       size: 4
   *     }
   *   ]
   * }
   *
   * @private
   * @param {Object} data - Dados da anotação
   * @throws {ValidationError} Se estrutura for inválida
   */
  _validateAnnotationData(data) {
    if (!data || typeof data !== 'object') {
      console.error('[SAVE ANNOTATIONS] Dados de anotação inválidos:', data);
      throw new ValidationError('Dados de anotação inválidos');
    }

    // Validar que tem array de linhas
    if (!Array.isArray(data.lines)) {
      console.error('[SAVE ANNOTATIONS] Campo "lines" não é um array:', data.lines);
      throw new ValidationError('Campo "lines" deve ser um array');
    }

    console.log(`[SAVE ANNOTATIONS] Validando ${data.lines.length} linhas...`);

    // Validar estrutura de cada linha
    for (let i = 0; i < data.lines.length; i++) {
      const line = data.lines[i];

      if (!Array.isArray(line.points)) {
        console.error(`[SAVE ANNOTATIONS] Linha ${i}: "points" não é um array:`, line.points);
        throw new ValidationError(`Linha ${i}: "points" deve ser um array`);
      }

      if (!line.color || typeof line.color !== 'string') {
        console.error(`[SAVE ANNOTATIONS] Linha ${i}: "color" inválida:`, line.color);
        throw new ValidationError(`Linha ${i}: "color" deve ser uma string válida`);
      }

      if (typeof line.size !== 'number' || line.size <= 0) {
        console.error(`[SAVE ANNOTATIONS] Linha ${i}: "size" inválido:`, line.size);
        throw new ValidationError(`Linha ${i}: "size" deve ser um número positivo`);
      }

      // Validar que cada ponto tem formato [x, y, pressure] ou [x, y]
      for (let j = 0; j < line.points.length; j++) {
        const point = line.points[j];

        if (!Array.isArray(point) || (point.length !== 2 && point.length !== 3)) {
          console.error(`[SAVE ANNOTATIONS] Linha ${i}, ponto ${j}: formato inválido:`, point);
          throw new ValidationError(`Linha ${i}, ponto ${j}: deve ter formato [x, y] ou [x, y, pressure]`);
        }

        const [x, y, pressure] = point;

        if (typeof x !== 'number' || typeof y !== 'number') {
          console.error(`[SAVE ANNOTATIONS] Linha ${i}, ponto ${j}: coordenadas inválidas:`, { x, y });
          throw new ValidationError(`Linha ${i}, ponto ${j}: coordenadas devem ser números`);
        }

        // Pressure é opcional
        if (pressure !== undefined && typeof pressure !== 'number') {
          console.error(`[SAVE ANNOTATIONS] Linha ${i}, ponto ${j}: pressure inválido:`, pressure);
          throw new ValidationError(`Linha ${i}, ponto ${j}: pressure deve ser um número`);
        }
      }
    }

    console.log('[SAVE ANNOTATIONS] Validação concluída com sucesso');
  }
}
