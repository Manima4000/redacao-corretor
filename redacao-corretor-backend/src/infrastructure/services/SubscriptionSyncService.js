import fs from 'fs';
import axios from 'axios';
import logger from '../../utils/logger.js';
import { StudentRepository } from '../database/repositories/StudentRepository.js';
import { TeacherRepository } from '../database/repositories/TeacherRepository.js';
import { ClassRepository } from '../database/repositories/ClassRepository.js';
import { AuthService } from './AuthService.js';
import { isActiveSubscription, extractStudentData } from '../../types/subscription.types.js';

/**
 * Serviço para sincronizar assinaturas com alunos e turmas
 *
 * Processa arquivo JSON em batches para eficiência de memória.
 * Cria turmas automaticamente baseadas em produtos únicos.
 * Cria/atualiza/deleta alunos baseado no status da assinatura.
 */
export class SubscriptionSyncService {
  constructor() {
    this.studentRepository = new StudentRepository();
    this.teacherRepository = new TeacherRepository();
    this.classRepository = new ClassRepository();
    this.authService = new AuthService();

    // Configurações
    this.BATCH_SIZE = 100; // Processar 100 registros por vez
    this.DEFAULT_TEACHER_EMAIL = process.env.DEFAULT_TEACHER_EMAIL || 'professora@exemplo.com';

    // Configurações da API Guru
    this.GURU_API_URL = 'https://digitalmanager.guru/api/v2/subscriptions';
    this.GURU_API_TOKEN = process.env.GURU_API_TOKEN;

    // IDs dos produtos permitidos (apenas esses produtos criam contas)
    this.ALLOWED_PRODUCT_IDS = [
      'a0431fc2-73a6-4db9-aec6-c921c689ce84',
      '9e37bc97-087b-4127-968a-6f71eb2eaccc',
      '9ded9d0b-2281-46e0-924f-67647a82b6d2',
    ];
  }

  /**
   * Sincroniza todos os alunos do arquivo de assinaturas
   * @param {string} filePath - Caminho do arquivo JSON
   * @returns {Promise<Object>} Estatísticas da sincronização
   */
  async syncFromFile(filePath) {
    const startTime = Date.now();

    logger.info('🔄 Iniciando sincronização de assinaturas', { filePath });

    const stats = {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      inactiveSubscriptions: 0,
      classesCreated: 0,
      studentsCreated: 0,
      studentsUpdated: 0,
      studentsDeleted: 0,
      errors: [],
    };

    try {
      // 1. Ler arquivo e extrair dados
      const allSubscriptions = await this._loadSubscriptions(filePath);

      // 2. Filtrar apenas produtos permitidos
      const subscriptions = this._filterAllowedProducts(allSubscriptions);
      stats.totalSubscriptions = subscriptions.length;

      logger.info(`📊 Total de assinaturas (após filtro): ${subscriptions.length}`);
      logger.info(`🎯 Produtos permitidos: ${this.ALLOWED_PRODUCT_IDS.length}`);

      // 3. Separar assinaturas ativas e inativas
      const { active, inactive } = this._groupByStatus(subscriptions);
      stats.activeSubscriptions = active.length;
      stats.inactiveSubscriptions = inactive.length;

      logger.info(`✅ Assinaturas ativas: ${active.length}`);
      logger.info(`❌ Assinaturas inativas: ${inactive.length}`);

      // 4. Buscar ou criar professor padrão
      const teacher = await this._ensureDefaultTeacher();

      // 5. Extrair produtos únicos e criar turmas
      const classMap = await this._ensureClasses(active, teacher.id);
      stats.classesCreated = classMap.size;

      logger.info(`📚 Turmas criadas/encontradas: ${classMap.size}`);

      // 6. Processar alunos ativos em batches
      const activeStats = await this._processActiveStudents(active, classMap);
      stats.studentsCreated = activeStats.created;
      stats.studentsUpdated = activeStats.updated;

      // 7. Processar alunos inativos (deletar ou desativar)
      const inactiveStats = await this._processInactiveStudents(inactive);
      stats.studentsDeleted = inactiveStats.deleted;

      // 8. Calcular tempo total
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      logger.info('✅ Sincronização concluída com sucesso!', {
        duration: `${duration}s`,
        ...stats,
      });

      return { success: true, stats, duration };
    } catch (error) {
      logger.error('❌ Erro na sincronização', {
        message: error.message,
        stack: error.stack,
      });

      stats.errors.push(error.message);
      return { success: false, stats, error: error.message };
    }
  }

  /**
   * Sincroniza todos os alunos direto da API Guru (RECOMENDADO)
   * @returns {Promise<Object>} Estatísticas da sincronização
   */
  async syncFromAPI() {
    const startTime = Date.now();

    logger.info('🔄 Iniciando sincronização de assinaturas da API Guru');

    const stats = {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      inactiveSubscriptions: 0,
      classesCreated: 0,
      studentsCreated: 0,
      studentsUpdated: 0,
      studentsDeleted: 0,
      errors: [],
    };

    try {
      // ⚠️ SEGURANÇA: Dados são processados diretamente da API (NUNCA salvos em disco)

      // 1. Buscar dados da API com paginação
      const allSubscriptions = await this._fetchAllPagesFromAPI();

      // 2. Filtrar apenas produtos permitidos
      const subscriptions = this._filterAllowedProducts(allSubscriptions);
      stats.totalSubscriptions = subscriptions.length;

      logger.info(`📊 Total de assinaturas (após filtro): ${subscriptions.length}`);
      logger.info(`🎯 Produtos permitidos: ${this.ALLOWED_PRODUCT_IDS.length}`);

      // 3. Separar assinaturas ativas e inativas
      const { active, inactive } = this._groupByStatus(subscriptions);
      stats.activeSubscriptions = active.length;
      stats.inactiveSubscriptions = inactive.length;

      logger.info(`✅ Assinaturas ativas: ${active.length}`);
      logger.info(`❌ Assinaturas inativas: ${inactive.length}`);

      // 4. Buscar ou criar professor padrão
      const teacher = await this._ensureDefaultTeacher();

      // 5. Extrair produtos únicos e criar turmas
      const classMap = await this._ensureClasses(active, teacher.id);
      stats.classesCreated = classMap.size;

      logger.info(`📚 Turmas criadas/encontradas: ${classMap.size}`);

      // 6. Processar alunos ativos em batches
      const activeStats = await this._processActiveStudents(active, classMap);
      stats.studentsCreated = activeStats.created;
      stats.studentsUpdated = activeStats.updated;

      // 7. Processar alunos inativos (deletar ou desativar)
      const inactiveStats = await this._processInactiveStudents(inactive);
      stats.studentsDeleted = inactiveStats.deleted;

      // 8. Calcular tempo total
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      logger.info('✅ Sincronização concluída com sucesso!', {
        duration: `${duration}s`,
        ...stats,
      });

      return { success: true, stats, duration };
    } catch (error) {
      logger.error('❌ Erro na sincronização da API', {
        message: error.message,
        stack: error.stack,
      });

      stats.errors.push(error.message);
      return { success: false, stats, error: error.message };
    }
  }

  /**
   * Busca todas as páginas da API Guru com paginação
   * @private
   * @returns {Promise<Array>} Lista de todas as assinaturas
   */
  async _fetchAllPagesFromAPI() {
    if (!this.GURU_API_TOKEN) {
      throw new Error('GURU_API_TOKEN não configurado no .env');
    }

    logger.info('📡 Buscando dados da API Guru...');

    let allSubscriptions = [];
    let cursor = null;
    let currentPage = 1;
    let totalRows = null;

    try {
      while (true) {
        logger.debug(`📄 Buscando página ${currentPage}...`);

        // Buscar página
        const url = cursor ? `${this.GURU_API_URL}?cursor=${cursor}` : this.GURU_API_URL;

        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${this.GURU_API_TOKEN}`,
            'Accept': 'application/json',
          },
          timeout: 30000, // 30 segundos de timeout
        });

        const pageData = response.data;

        // Primeira página: obter total de registros
        if (totalRows === null) {
          totalRows = pageData.total_rows || 0;
          logger.info(`📊 Total de registros na API: ${totalRows}`);
        }

        // Adicionar dados da página
        const subscriptions = pageData.data || [];
        allSubscriptions = [...allSubscriptions, ...subscriptions];

        logger.debug(`✓ Página ${currentPage} carregada: ${subscriptions.length} registros`);
        logger.info(`📊 Progresso: ${allSubscriptions.length}/${totalRows} assinaturas baixadas`);

        // Verificar se há mais páginas (Guru usa 1 para true)
        if (pageData.has_more_pages !== 1) {
          logger.info('✓ Última página alcançada!');
          break;
        }

        // Próxima página
        cursor = pageData.next_cursor;
        currentPage++;

        // Pequeno delay para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.info(`✅ Total de assinaturas baixadas da API: ${allSubscriptions.length}`);

      return allSubscriptions;
    } catch (error) {
      if (error.response) {
        // Erro da API
        logger.error('❌ Erro na API Guru', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
        throw new Error(`API Guru error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        // Timeout ou sem resposta
        logger.error('❌ Sem resposta da API Guru', {
          message: error.message,
        });
        throw new Error('API Guru não respondeu. Verifique a conexão.');
      } else {
        // Outro erro
        throw error;
      }
    }
  }

  /**
   * Carrega assinaturas do arquivo JSON
   * @private
   * @param {string} filePath
   * @returns {Promise<Array>}
   */
  async _loadSubscriptions(filePath) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Erro ao ler arquivo: ${error.message}`);
    }
  }

  /**
   * Agrupa assinaturas por status (ativas vs inativas)
   * @private
   * @param {Array} subscriptions
   * @returns {Object}
   */
  _groupByStatus(subscriptions) {
    const active = [];
    const inactive = [];

    // Agrupar por email para evitar duplicatas
    const byEmail = new Map();

    for (const subscription of subscriptions) {
      const email = subscription.contact.email.toLowerCase().trim();

      // Se o aluno já existe, manter apenas a assinatura mais recente
      if (!byEmail.has(email) || subscription.updated_at > byEmail.get(email).updated_at) {
        byEmail.set(email, subscription);
      }
    }

    // Separar ativos e inativos
    for (const subscription of byEmail.values()) {
      if (isActiveSubscription(subscription)) {
        active.push(subscription);
      } else {
        inactive.push(subscription);
      }
    }

    return { active, inactive };
  }

  /**
   * Garante que o professor padrão existe
   * @private
   * @returns {Promise<Object>}
   */
  async _ensureDefaultTeacher() {
    try {
      let teacher = await this.teacherRepository.findByEmail(this.DEFAULT_TEACHER_EMAIL);

      if (!teacher) {
        logger.info('👨‍🏫 Criando professor padrão', { email: this.DEFAULT_TEACHER_EMAIL });

        const passwordHash = await this.authService.hashPassword('admin123');

        teacher = await this.teacherRepository.create({
          email: this.DEFAULT_TEACHER_EMAIL,
          passwordHash,
          fullName: 'Administrador do Sistema',
          specialization: 'Administração',
        });

        logger.info('✅ Professor padrão criado', { id: teacher.id });
      }

      return teacher;
    } catch (error) {
      throw new Error(`Erro ao criar professor padrão: ${error.message}`);
    }
  }

  /**
   * Cria ou encontra turmas baseadas nos produtos
   * @private
   * @param {Array} subscriptions - Assinaturas ativas
   * @param {string} teacherId - ID do professor
   * @returns {Promise<Map>} Mapa de nome do produto → ID da turma
   */
  async _ensureClasses(subscriptions, teacherId) {
    const classMap = new Map();

    // Extrair produtos únicos
    const uniqueProducts = new Set();
    for (const subscription of subscriptions) {
      if (subscription.product?.name) {
        uniqueProducts.add(subscription.product.name.trim());
      }
    }

    logger.info(`🎯 Produtos únicos encontrados: ${uniqueProducts.size}`);

    // Criar ou encontrar cada turma
    for (const productName of uniqueProducts) {
      try {
        // Verificar se turma já existe
        const existingClass = await this.classRepository.findByName(productName);

        if (existingClass) {
          classMap.set(productName, existingClass.id);
          logger.debug(`📚 Turma encontrada: ${productName}`, { id: existingClass.id });
        } else {
          // Criar nova turma
          const newClass = await this.classRepository.create({
            name: productName,
            description: `Turma criada automaticamente a partir do produto: ${productName}`,
            teacherId,
          });

          classMap.set(productName, newClass.id);
          logger.info(`✨ Turma criada: ${productName}`, { id: newClass.id });
        }
      } catch (error) {
        logger.error(`❌ Erro ao criar/encontrar turma: ${productName}`, {
          message: error.message,
        });
      }
    }

    return classMap;
  }

  /**
   * Processa alunos com assinaturas ativas (criar/atualizar)
   * @private
   * @param {Array} subscriptions
   * @param {Map} classMap
   * @returns {Promise<Object>}
   */
  async _processActiveStudents(subscriptions, classMap) {
    let created = 0;
    let updated = 0;
    let errors = 0;

    logger.info(`👥 Processando ${subscriptions.length} alunos ativos...`);

    // Processar em batches
    for (let i = 0; i < subscriptions.length; i += this.BATCH_SIZE) {
      const batch = subscriptions.slice(i, i + this.BATCH_SIZE);

      for (const subscription of batch) {
        try {
          const studentData = extractStudentData(subscription);
          const classId = classMap.get(subscription.product.name.trim());

          if (!classId) {
            logger.warn(`⚠️  Turma não encontrada para produto: ${subscription.product.name}`);
            continue;
          }

          // Verificar se aluno já existe
          const existingStudent = await this.studentRepository.findByEmail(studentData.email);

          if (existingStudent) {
            // Atualizar apenas se mudou de turma
            if (existingStudent.classId !== classId) {
              await this.studentRepository.update(existingStudent.id, { classId });
              updated++;
              logger.debug(`🔄 Aluno atualizado: ${studentData.email}`, {
                newClass: subscription.product.name,
              });
            }
          } else {
            // Criar novo aluno
            const passwordHash = await this.authService.hashPassword(studentData.password);

            await this.studentRepository.create({
              email: studentData.email,
              passwordHash,
              fullName: studentData.fullName,
              enrollmentNumber: studentData.enrollmentNumber,
              classId,
            });

            created++;
            logger.debug(`✨ Aluno criado: ${studentData.email}`, {
              class: subscription.product.name,
            });
          }
        } catch (error) {
          errors++;
          logger.error(`❌ Erro ao processar aluno`, {
            email: subscription.contact.email,
            message: error.message,
          });
        }
      }

      // Log de progresso
      const progress = Math.min(i + this.BATCH_SIZE, subscriptions.length);
      logger.info(`📊 Progresso: ${progress}/${subscriptions.length} alunos processados`);
    }

    logger.info(`✅ Alunos ativos processados`, { created, updated, errors });
    return { created, updated, errors };
  }

  /**
   * Processa alunos com assinaturas inativas (deletar)
   * @private
   * @param {Array} subscriptions
   * @returns {Promise<Object>}
   */
  async _processInactiveStudents(subscriptions) {
    let deleted = 0;
    let errors = 0;

    logger.info(`🗑️  Processando ${subscriptions.length} alunos inativos...`);

    for (const subscription of subscriptions) {
      try {
        const email = subscription.contact.email.toLowerCase().trim();

        // Verificar se aluno existe
        const existingStudent = await this.studentRepository.findByEmail(email);

        if (existingStudent) {
          // Deletar aluno
          await this.studentRepository.delete(existingStudent.id);
          deleted++;

          logger.debug(`🗑️  Aluno deletado: ${email}`, {
            reason: `Assinatura inativa (${subscription.last_status})`,
          });
        }
      } catch (error) {
        errors++;
        logger.error(`❌ Erro ao deletar aluno`, {
          email: subscription.contact.email,
          message: error.message,
        });
      }
    }

    logger.info(`✅ Alunos inativos processados`, { deleted, errors });
    return { deleted, errors };
  }

  /**
   * Filtra assinaturas para incluir apenas produtos permitidos
   * @private
   * @param {Array} subscriptions - Todas as assinaturas
   * @returns {Array} Assinaturas filtradas
   */
  _filterAllowedProducts(subscriptions) {
    const filtered = subscriptions.filter((subscription) => {
      // Verificar se o produto existe e tem ID
      if (!subscription.product || !subscription.product.id) {
        return false;
      }

      // Verificar se o ID do produto está na lista permitida
      return this.ALLOWED_PRODUCT_IDS.includes(subscription.product.id);
    });

    logger.info(`🎯 Filtro de produtos aplicado: ${filtered.length}/${subscriptions.length} assinaturas`);

    return filtered;
  }
}
