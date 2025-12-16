import { NotFoundError, ValidationError, ConflictError } from '../../../utils/errors.js';

/**
 * Use Case: Upload de redação
 *
 * Responsabilidades:
 * 1. Validar que a tarefa existe
 * 2. Validar que o aluno está matriculado na turma da tarefa
 * 3. Verificar se o aluno já enviou redação para esta tarefa
 * 4. Fazer upload do arquivo para o storage (Google Drive)
 * 5. Salvar registro da redação no banco de dados
 *
 * Segue SOLID:
 * - SRP: Apenas orquestra upload de redação
 * - DIP: Depende de abstrações (repositories, services)
 */
export class UploadEssayUseCase {
  /**
   * @param {IEssayRepository} essayRepository - Repositório de redações
   * @param {ITaskRepository} taskRepository - Repositório de tarefas
   * @param {IStudentRepository} studentRepository - Repositório de alunos
   * @param {IFileStorageService} fileStorageService - Serviço de storage
   */
  constructor(essayRepository, taskRepository, studentRepository, fileStorageService) {
    this.essayRepository = essayRepository;
    this.taskRepository = taskRepository;
    this.studentRepository = studentRepository;
    this.fileStorageService = fileStorageService;
  }

  /**
   * Executa o upload da redação
   *
   * @async
   * @param {Object} params - Parâmetros
   * @param {string} params.taskId - ID da tarefa
   * @param {string} params.studentId - ID do aluno
   * @param {Buffer} params.fileBuffer - Buffer do arquivo
   * @param {Object} params.fileMetadata - Metadados do arquivo validado
   * @returns {Promise<Object>} Redação criada
   * @throws {NotFoundError} Se tarefa ou aluno não existir
   * @throws {ValidationError} Se aluno não pertencer à turma
   * @throws {ConflictError} Se aluno já enviou redação
   */
  async execute({ taskId, studentId, fileBuffer, fileMetadata }) {
    // 1. Validar que a tarefa existe
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new NotFoundError('Tarefa');
    }

    // 2. Validar que o aluno existe
    const student = await this.studentRepository.findById(studentId);

    if (!student) {
      throw new NotFoundError('Aluno');
    }

    // 3. Validar que o aluno pertence a uma das turmas da tarefa
    const isStudentInTaskClass = task.classIds && task.classIds.includes(student.classId);

    if (!isStudentInTaskClass) {
      throw new ValidationError(
        'Você não está matriculado em nenhuma turma desta tarefa'
      );
    }

    // 4. Verificar se o aluno já enviou redação para esta tarefa
    const existingEssay = await this.essayRepository.findByTaskAndStudent(
      taskId,
      studentId
    );

    if (existingEssay) {
      throw new ConflictError(
        'Você já enviou uma redação para esta tarefa. Para reenviar, delete a redação anterior.'
      );
    }

    // 5. Gerar nome único para o arquivo
    const timestamp = Date.now();
    const filename = `${student.id}_${task.id}_${timestamp}_${fileMetadata.originalname}`;

    // 6. Fazer upload para o storage (Google Drive)
    console.log(`[UPLOAD ESSAY] Iniciando upload para Google Drive: ${filename}`);

    const fileId = await this.fileStorageService.upload(fileBuffer, {
      filename,
      mimetype: fileMetadata.mimetype,
      // folder: student.classId, // TODO: Criar pasta automaticamente
    });

    console.log(`[UPLOAD ESSAY] Upload concluído. File ID: ${fileId}`);

    // 7. Salvar registro no banco de dados
    const essay = await this.essayRepository.create({
      taskId,
      studentId,
      fileUrl: fileId, // Armazenar ID do Google Drive
      fileType: fileMetadata.mimetype, // Tipo MIME do arquivo
    });

    console.log(`[UPLOAD ESSAY] Redação criada com sucesso:`, {
      essayId: essay.id,
      taskId,
      studentId,
      fileId,
    });

    // 8. Retornar redação com URL pública
    const publicUrl = await this.fileStorageService.getPublicUrl(fileId);

    return {
      ...essay,
      publicUrl,
    };
  }
}
