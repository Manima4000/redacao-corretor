#!/usr/bin/env node

/**
 * Script de Sincronização de Alunos
 *
 * Sincroniza alunos e turmas direto da API Guru ou arquivo JSON.
 *
 * 🎯 PRODUTOS PERMITIDOS:
 * Apenas alunos com assinaturas ATIVAS destes produtos são sincronizados:
 * - a0431fc2-73a6-4db9-aec6-c921c689ce84
 * - 9e37bc97-087b-4127-968a-6f71eb2eaccc
 * - 9ded9d0b-2281-46e0-924f-67647a82b6d2
 *
 * Uso:
 *   # Buscar da API
 *   node src/scripts/syncStudents.js
 *   npm run sync:students
 *
 *   # Usar arquivo JSON (fallback)
 *   node src/scripts/syncStudents.js --file ./dados/assinaturas.json
 *
 * ⚠️ SEGURANÇA:
 * - API: Dados são processados diretamente da API (NUNCA salvos em disco)
 * - Arquivo: Use apenas para testes ou emergências
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { SubscriptionSyncService } from '../infrastructure/services/SubscriptionSyncService.js';
import logger from '../utils/logger.js';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Função principal
 */
async function main() {
  try {
    // Verificar argumentos
    const args = process.argv.slice(2);
    const useFile = args.includes('--file');
    const filePath = useFile ? args[args.indexOf('--file') + 1] : null;

    logger.info('🚀 Iniciando script de sincronização de alunos');

    // Criar service
    const syncService = new SubscriptionSyncService();
    let result;

    if (useFile && filePath) {
      // Modo arquivo (fallback)
      logger.warn('⚠️  ATENÇÃO: Usando arquivo JSON. Prefira usar API (sem --file)');
      logger.info(`📂 Arquivo: ${filePath}`);
      result = await syncService.syncFromFile(filePath);
    } else {
      // Modo API (padrão - RECOMENDADO)
      logger.info('📡 Fonte: API Guru (dados NUNCA salvos em disco)');
      result = await syncService.syncFromAPI();
    }

    // Exibir resultado
    if (result.success) {
      logger.info('✅ Sincronização concluída com sucesso!');
      logger.info('📊 Estatísticas:', result.stats);

      // Exibir resumo formatado
      console.log('\n' + '='.repeat(60));
      console.log('📊 RESUMO DA SINCRONIZAÇÃO');
      console.log('='.repeat(60));
      console.log(`⏱️  Duração: ${result.duration}s`);
      console.log(`📝 Total de assinaturas: ${result.stats.totalSubscriptions}`);
      console.log(`✅ Assinaturas ativas: ${result.stats.activeSubscriptions}`);
      console.log(`❌ Assinaturas inativas: ${result.stats.inactiveSubscriptions}`);
      console.log(`📚 Turmas criadas/encontradas: ${result.stats.classesCreated}`);
      console.log(`👤 Alunos criados: ${result.stats.studentsCreated}`);
      console.log(`🔄 Alunos atualizados: ${result.stats.studentsUpdated}`);
      console.log(`🗑️  Alunos deletados: ${result.stats.studentsDeleted}`);
      console.log('='.repeat(60) + '\n');

      process.exit(0);
    } else {
      logger.error('❌ Sincronização falhou');
      logger.error('Erro:', result.error);
      logger.error('Estatísticas parciais:', result.stats);

      process.exit(1);
    }
  } catch (error) {
    logger.error('❌ Erro fatal no script', {
      message: error.message,
      stack: error.stack,
    });

    console.error('\n❌ ERRO FATAL:');
    console.error(error.message);

    process.exit(1);
  }
}

// Executar script
main();
