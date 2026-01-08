import { query } from '../config/database.js';
import { AuthService } from '../../services/AuthService.js';
import logger from '../../../utils/logger.js';

const authService = new AuthService();

/**
 * Script para popular o banco de dados com dados de exemplo
 * Execute com: npm run seed
 */
async function seedDatabase() {
  try {
    logger.info('🌱 Iniciando seed do banco de dados...');

    // 1. Criar professora de exemplo
    logger.info('👩‍🏫 Criando professora...');
    const teacherPassword = await authService.hashPassword('senha123');

    const teacherResult = await query(
      `
      INSERT INTO teachers (email, password_hash, full_name, specialization)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, full_name
      `,
      ['professora@exemplo.com', teacherPassword, 'Maria Silva Oliveira', 'Redação ENEM e Concursos']
    );

    let teacherId;
    if (teacherResult.rows.length > 0) {
      teacherId = teacherResult.rows[0].id;
      logger.info(`✅ Professora criada: ${teacherResult.rows[0].email}`);
    } else {
      // Se já existe, buscar o ID
      const existing = await query('SELECT id FROM teachers WHERE email = $1', [
        'professora@exemplo.com',
      ]);
      teacherId = existing.rows[0].id;
      logger.info('⚠️  Professora já existe, usando ID existente');
    }

    // 2. Buscar primeira turma existente no banco de dados
    logger.info('🔍 Buscando primeira turma existente...');

    const firstClassResult = await query(
      `
      SELECT id, name
      FROM classes
      ORDER BY created_at ASC
      LIMIT 1
      `
    );

    if (firstClassResult.rows.length === 0) {
      logger.error('❌ Nenhuma turma encontrada no banco de dados!');
      logger.info('💡 Crie uma turma primeiro antes de executar o seed.');
      process.exit(1);
    }

    const firstClass = {
      id: firstClassResult.rows[0].id,
      name: firstClassResult.rows[0].name,
    };

    logger.info(`✅ Turma encontrada: ${firstClass.name} (ID: ${firstClass.id})`);

    // 3. Criar aluno de exemplo
    logger.info('👨‍🎓 Criando aluno...');

    const studentPassword = await authService.hashPassword('senha123');

    const studentData = {
      email: 'matandradefe@gmail.com',
      fullName: 'Matheus Andrade Pinto Ferreira',
      enrollmentNumber: '2024001',
    };

    const studentResult = await query(
      `
      INSERT INTO students (email, password_hash, full_name, enrollment_number, class_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE
      SET class_id = $5, enrollment_number = $4, full_name = $3
      RETURNING id, email, full_name
      `,
      [
        studentData.email,
        studentPassword,
        studentData.fullName,
        studentData.enrollmentNumber,
        firstClass.id,
      ]
    );

    if (studentResult.rows.length > 0) {
      logger.info(
        `✅ Aluno criado/atualizado: ${studentResult.rows[0].email} → ${firstClass.name}`
      );
    }

    // 4. Resumo
    logger.info('\n📊 Resumo do Seed:');
    logger.info('==============================================');
    logger.info('👩‍🏫 Professora:');
    logger.info('   Email: professora@exemplo.com');
    logger.info('   Senha: senha123');
    logger.info('\n🎓 Turma encontrada:');
    logger.info(`   - ${firstClass.name} (ID: ${firstClass.id})`);
    logger.info('\n👨‍🎓 Aluno criado (senha: senha123):');
    logger.info(`   - ${studentData.email} → ${firstClass.name}`);
    logger.info('==============================================');
    logger.info('\n✅ Seed concluído com sucesso!');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Erro ao popular banco de dados:', error);
    process.exit(1);
  }
}

// Executar seed
seedDatabase();
