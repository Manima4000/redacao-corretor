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

    // 2. Criar turmas
    logger.info('🎓 Criando turmas...');

    const classes = [
      {
        name: 'Turma AFA',
        description: 'Turma preparatória para Academia da Força Aérea',
      },
      {
        name: 'Turma EFOMM',
        description: 'Turma preparatória para Escola de Formação de Oficiais da Marinha Mercante',
      },
      {
        name: 'Turma ENEM',
        description: 'Turma preparatória para redação do ENEM',
      },
      {
        name: 'Turma ESA',
        description: 'Turma preparatória para Escola de Sargentos das Armas',
      },
    ];

    const classIds = [];

    for (const classData of classes) {
      const classResult = await query(
        `
        INSERT INTO classes (name, description, teacher_id)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
        RETURNING id, name
        `,
        [classData.name, classData.description, teacherId]
      );

      if (classResult.rows.length > 0) {
        classIds.push({ id: classResult.rows[0].id, name: classResult.rows[0].name });
        logger.info(`✅ Turma criada: ${classResult.rows[0].name}`);
      }
    }

    // 3. Criar alunos de exemplo
    logger.info('👨‍🎓 Criando alunos...');

    const studentPassword = await authService.hashPassword('senha123');

    const students = [
      {
        email: 'joao.silva@exemplo.com',
        fullName: 'João Silva Santos',
        enrollmentNumber: '2024001',
        classIndex: 0, // Turma AFA
      },
      {
        email: 'maria.santos@exemplo.com',
        fullName: 'Maria Santos Oliveira',
        enrollmentNumber: '2024002',
        classIndex: 0, // Turma AFA
      },
      {
        email: 'pedro.oliveira@exemplo.com',
        fullName: 'Pedro Oliveira Costa',
        enrollmentNumber: '2024003',
        classIndex: 1, // Turma EFOMM
      },
      {
        email: 'ana.costa@exemplo.com',
        fullName: 'Ana Costa Lima',
        enrollmentNumber: '2024004',
        classIndex: 1, // Turma EFOMM
      },
      {
        email: 'lucas.lima@exemplo.com',
        fullName: 'Lucas Lima Pereira',
        enrollmentNumber: '2024005',
        classIndex: 2, // Turma ENEM
      },
      {
        email: 'juliana.pereira@exemplo.com',
        fullName: 'Juliana Pereira Souza',
        enrollmentNumber: '2024006',
        classIndex: 3, // Turma ESA
      },
    ];

    for (const studentData of students) {
      const classId = classIds[studentData.classIndex]?.id || null;

      const studentResult = await query(
        `
        INSERT INTO students (email, password_hash, full_name, enrollment_number, class_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING
        RETURNING id, email, full_name
        `,
        [
          studentData.email,
          studentPassword,
          studentData.fullName,
          studentData.enrollmentNumber,
          classId,
        ]
      );

      if (studentResult.rows.length > 0) {
        logger.info(
          `✅ Aluno criado: ${studentResult.rows[0].email} (${classIds[studentData.classIndex]?.name})`
        );
      }
    }

    // 4. Criar tarefas de exemplo
    logger.info('📝 Criando tarefas...');

    const tasks = [
      {
        title: 'Redação sobre Meio Ambiente',
        description:
          'Escreva uma redação dissertativa-argumentativa sobre os impactos da poluição nos oceanos e possíveis soluções.',
        deadline: new Date('2026-01-15T23:59:59.000Z'),
        classIndexes: [0, 1], // Turmas AFA e EFOMM
      },
      {
        title: 'Redação sobre Tecnologia',
        description:
          'Discorra sobre os impactos da inteligência artificial na sociedade moderna, considerando aspectos éticos e sociais.',
        deadline: new Date('2026-01-20T23:59:59.000Z'),
        classIndexes: [2], // Turma ENEM
      },
      {
        title: 'Redação sobre Educação',
        description:
          'Analise os desafios da educação pública no Brasil e proponha medidas para melhorar a qualidade do ensino.',
        deadline: new Date('2026-02-01T23:59:59.000Z'),
        classIndexes: [0, 2, 3], // Turmas AFA, ENEM, ESA
      },
    ];

    for (const taskData of tasks) {
      // Criar a tarefa
      const taskResult = await query(
        `
        INSERT INTO tasks (title, description, teacher_id, deadline)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title
        `,
        [taskData.title, taskData.description, teacherId, taskData.deadline]
      );

      if (taskResult.rows.length > 0) {
        const taskId = taskResult.rows[0].id;

        // Associar turmas à tarefa
        for (const classIndex of taskData.classIndexes) {
          const classId = classIds[classIndex]?.id;
          if (classId) {
            await query(
              `
              INSERT INTO task_classes (task_id, class_id)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING
              `,
              [taskId, classId]
            );
          }
        }

        const classNames = taskData.classIndexes.map((idx) => classIds[idx]?.name).join(', ');
        logger.info(`✅ Tarefa criada: ${taskResult.rows[0].title} (${classNames})`);
      }
    }

    // 5. Resumo
    logger.info('\n📊 Resumo do Seed:');
    logger.info('==============================================');
    logger.info('👩‍🏫 Professora:');
    logger.info('   Email: professora@exemplo.com');
    logger.info('   Senha: senha123');
    logger.info('\n🎓 Turmas criadas:');
    classIds.forEach((c) => logger.info(`   - ${c.name}`));
    logger.info('\n👨‍🎓 Alunos criados (todos com senha: senha123):');
    students.forEach((s) => logger.info(`   - ${s.email} (${classIds[s.classIndex]?.name})`));
    logger.info('\n📝 Tarefas criadas:');
    tasks.forEach((t) => {
      const classNames = t.classIndexes.map((idx) => classIds[idx]?.name).join(', ');
      logger.info(`   - ${t.title} (${classNames})`);
    });
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
