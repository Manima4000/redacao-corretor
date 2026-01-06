#!/usr/bin/env node

/**
 * Script de Limpeza de Turmas e Alunos
 *
 * Remove turmas e alunos que NÃO pertencem aos produtos permitidos.
 *
 * 🎯 PRODUTOS PERMITIDOS:
 * - a0431fc2-73a6-4db9-aec6-c921c689ce84
 * - 9e37bc97-087b-4127-968a-6f71eb2eaccc
 * - 9ded9d0b-2281-46e0-924f-67647a82b6d2
 *
 * O QUE FAZ:
 * 1. Busca os nomes dos 3 produtos permitidos na API Guru (endpoint direto)
 * 2. Identifica turmas no banco que NÃO correspondem a esses produtos
 * 3. Identifica alunos sem turma OU em turmas inválidas
 * 4. Deleta alunos primeiro (foreign key)
 * 5. Deleta turmas inválidas
 *
 * Uso:
 *   node src/scripts/cleanupStudents.js
 *   npm run cleanup:students
 *
 * ⚠️ ATENÇÃO:
 * - Este script DELETA permanentemente turmas e alunos do banco de dados
 * - Aguarda 5 segundos antes de deletar (pressione Ctrl+C para cancelar)
 * - Use com cuidado em produção
 * - Sempre faça backup antes de executar
 */

import axios from 'axios';
import logger from '../utils/logger.js';
import { StudentRepository } from '../infrastructure/database/repositories/StudentRepository.js';
import { ClassRepository } from '../infrastructure/database/repositories/ClassRepository.js';

// IDs dos produtos permitidos
const ALLOWED_PRODUCT_IDS = [
  'a0431fc2-73a6-4db9-aec6-c921c689ce84',
  '9e37bc97-087b-4127-968a-6f71eb2eaccc',
  '9ded9d0b-2281-46e0-924f-67647a82b6d2',
];

/**
 * Busca os nomes dos produtos permitidos na API Guru
 * Usa endpoint direto de produto (mais rápido e eficiente)
 */
async function fetchAllowedProductNames() {
  const GURU_API_BASE_URL = 'https://digitalmanager.guru/api/v2';
  const GURU_API_TOKEN = process.env.GURU_API_TOKEN;

  if (!GURU_API_TOKEN) {
    throw new Error('GURU_API_TOKEN não configurado no .env');
  }

  logger.info('📡 Buscando nomes dos 3 produtos permitidos da API Guru...');

  try {
    const productNames = [];

    // Buscar cada produto diretamente por ID
    for (const productId of ALLOWED_PRODUCT_IDS) {
      try {
        const url = `${GURU_API_BASE_URL}/products/${productId}`;

        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${GURU_API_TOKEN}`,
            'Accept': 'application/json',
          },
          timeout: 30000,
        });

        const product = response.data;

        if (product && product.name) {
          productNames.push(product.name);
          logger.debug(`✓ Produto encontrado: ${product.name}`);
        } else {
          logger.warn(`⚠️  Produto ${productId} sem nome`);
        }
      } catch (error) {
        logger.error(`❌ Erro ao buscar produto ${productId}`, {
          message: error.message,
        });
      }

      // Pequeno delay entre requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.info(`✅ Produtos encontrados: ${productNames.length}/${ALLOWED_PRODUCT_IDS.length}`);
    productNames.forEach((name) => logger.info(`   - ${name}`));

    if (productNames.length < ALLOWED_PRODUCT_IDS.length) {
      logger.warn(`⚠️  Encontrados apenas ${productNames.length} de ${ALLOWED_PRODUCT_IDS.length} produtos esperados`);
    }

    return productNames;
  } catch (error) {
    logger.error('❌ Erro ao buscar produtos da API', { message: error.message });
    throw error;
  }
}

/**
 * Remove turmas e alunos que não pertencem aos produtos permitidos
 */
async function cleanupInvalidData() {
  const startTime = Date.now();

  logger.info('🧹 Iniciando limpeza de turmas e alunos inválidos');

  const stats = {
    totalClassesInDB: 0,
    totalStudentsInDB: 0,
    allowedProductNames: 0,
    classesDeleted: 0,
    studentsDeleted: 0,
    errors: 0,
  };

  try {
    // 1. Buscar nomes dos produtos permitidos da API
    const allowedProductNames = await fetchAllowedProductNames();
    stats.allowedProductNames = allowedProductNames.length;

    // Criar Set para busca O(1) (case-insensitive)
    const allowedNamesSet = new Set(
      allowedProductNames.map((name) => name.toLowerCase().trim())
    );

    // 2. Buscar todas as turmas do banco
    const classRepository = new ClassRepository();
    const allClasses = await classRepository.findAll();
    stats.totalClassesInDB = allClasses.length;

    logger.info(`📚 Total de turmas no banco: ${allClasses.length}`);

    // 3. Identificar turmas inválidas (não correspondem aos produtos permitidos)
    const classesToDelete = allClasses.filter((classItem) => {
      const className = classItem.name.toLowerCase().trim();
      return !allowedNamesSet.has(className);
    });

    logger.info(`🗑️  Turmas a deletar: ${classesToDelete.length}`);

    // 4. Buscar todos os alunos do banco
    const studentRepository = new StudentRepository();
    const allStudents = await studentRepository.findAll();
    stats.totalStudentsInDB = allStudents.length;

    logger.info(`👥 Total de alunos no banco: ${allStudents.length}`);

    // 5. Identificar alunos em turmas inválidas
    const invalidClassIds = new Set(classesToDelete.map((c) => c.id));

    const studentsToDelete = allStudents.filter((student) => {
      // Deletar se:
      // - Aluno não tem turma (classId === null)
      // - Aluno está em turma inválida
      return !student.classId || invalidClassIds.has(student.classId);
    });

    logger.info(`👤 Alunos a deletar: ${studentsToDelete.length}`);

    if (classesToDelete.length === 0 && studentsToDelete.length === 0) {
      logger.info('✅ Nenhuma turma ou aluno para deletar. Banco está sincronizado!');
      return { success: true, stats, duration: ((Date.now() - startTime) / 1000).toFixed(2) };
    }

    // 6. Confirmar antes de deletar (apenas em modo interativo)
    if (process.stdout.isTTY) {
      console.log('\n⚠️  ATENÇÃO: Os seguintes dados serão DELETADOS:');

      if (classesToDelete.length > 0) {
        console.log('\n📚 TURMAS:');
        classesToDelete.slice(0, 10).forEach((classItem) => {
          console.log(`   - ${classItem.name} (${classItem.id})`);
        });
        if (classesToDelete.length > 10) {
          console.log(`   ... e mais ${classesToDelete.length - 10} turmas`);
        }
      }

      if (studentsToDelete.length > 0) {
        console.log('\n👤 ALUNOS:');
        studentsToDelete.slice(0, 10).forEach((student) => {
          console.log(`   - ${student.fullName} (${student.email})`);
        });
        if (studentsToDelete.length > 10) {
          console.log(`   ... e mais ${studentsToDelete.length - 10} alunos`);
        }
      }

      // Aguardar 5 segundos para cancelar
      console.log('\n🕐 Aguardando 5 segundos. Pressione Ctrl+C para cancelar...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // 7. Deletar alunos primeiro (foreign key)
    logger.info('🗑️  Iniciando deleção de alunos...');

    for (const student of studentsToDelete) {
      try {
        await studentRepository.delete(student.id);
        stats.studentsDeleted++;

        logger.debug(`✓ Aluno deletado: ${student.email}`);
      } catch (error) {
        stats.errors++;
        logger.error(`❌ Erro ao deletar aluno ${student.email}`, {
          message: error.message,
        });
      }
    }

    // 8. Deletar turmas
    logger.info('🗑️  Iniciando deleção de turmas...');

    for (const classItem of classesToDelete) {
      try {
        await classRepository.delete(classItem.id);
        stats.classesDeleted++;

        logger.debug(`✓ Turma deletada: ${classItem.name}`);
      } catch (error) {
        stats.errors++;
        logger.error(`❌ Erro ao deletar turma ${classItem.name}`, {
          message: error.message,
        });
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logger.info('✅ Limpeza concluída!', {
      duration: `${duration}s`,
      ...stats,
    });

    // Exibir resumo
    console.log('\n' + '='.repeat(60));
    console.log('🧹 RESUMO DA LIMPEZA');
    console.log('='.repeat(60));
    console.log(`⏱️  Duração: ${duration}s`);
    console.log(`🎯 Produtos permitidos: ${stats.allowedProductNames}`);
    console.log(`📚 Turmas no banco (antes): ${stats.totalClassesInDB}`);
    console.log(`👥 Alunos no banco (antes): ${stats.totalStudentsInDB}`);
    console.log(`🗑️  Turmas deletadas: ${stats.classesDeleted}`);
    console.log(`🗑️  Alunos deletados: ${stats.studentsDeleted}`);
    console.log(`❌ Erros: ${stats.errors}`);
    console.log(`📚 Turmas no banco (depois): ${stats.totalClassesInDB - stats.classesDeleted}`);
    console.log(`👥 Alunos no banco (depois): ${stats.totalStudentsInDB - stats.studentsDeleted}`);
    console.log('='.repeat(60) + '\n');

    return { success: true, stats, duration };
  } catch (error) {
    logger.error('❌ Erro fatal na limpeza', {
      message: error.message,
      stack: error.stack,
    });

    console.error('\n❌ ERRO FATAL:');
    console.error(error.message);

    return { success: false, stats, error: error.message };
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    const result = await cleanupInvalidData();

    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    logger.error('❌ Erro no script', { message: error.message });
    console.error(error);
    process.exit(1);
  }
}

// Executar script
main();
