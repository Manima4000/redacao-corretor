import { query } from '../config/database.js';
import { IAnnotationRepository } from '../../../domain/repositories/IAnnotationRepository.js';

/**
 * Implementação do repositório de anotações usando PostgreSQL
 *
 * Segue SOLID:
 * - SRP: Apenas acesso a dados de annotations
 * - OCP: Implementa interface, pode ser substituído
 * - LSP: Substituível por qualquer IAnnotationRepository
 *
 * @implements {IAnnotationRepository}
 */
export class AnnotationRepository extends IAnnotationRepository {
  /**
   * Salva ou atualiza anotações de uma redação
   * Usa UPSERT (ON CONFLICT) para evitar duplicatas
   *
   * @async
   * @param {string} essayId - ID da redação
   * @param {Object} annotationData - Dados da anotação (JSONB)
   * @param {number} pageNumber - Número da página
   * @returns {Promise<Object>} Anotação salva
   */
  async saveOrUpdate(essayId, annotationData, pageNumber = 1) {
    const sql = `
      INSERT INTO annotations (essay_id, annotation_data, page_number, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (essay_id, page_number)
      DO UPDATE SET
        annotation_data = EXCLUDED.annotation_data,
        updated_at = CURRENT_TIMESTAMP
      RETURNING
        id,
        essay_id as "essayId",
        annotation_data as "annotationData",
        page_number as "pageNumber",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const values = [essayId, JSON.stringify(annotationData), pageNumber];

    const result = await query(sql, values);

    return result.rows[0];
  }

  /**
   * Busca anotações de uma redação (todas as páginas)
   *
   * @async
   * @param {string} essayId - ID da redação
   * @returns {Promise<Array>} Lista de anotações ordenadas por página
   */
  async findByEssay(essayId) {
    const sql = `
      SELECT
        id,
        essay_id as "essayId",
        annotation_data as "annotationData",
        page_number as "pageNumber",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM annotations
      WHERE essay_id = $1
      ORDER BY page_number ASC
    `;

    const result = await query(sql, [essayId]);

    return result.rows;
  }

  /**
   * Busca anotação de uma página específica
   *
   * @async
   * @param {string} essayId - ID da redação
   * @param {number} pageNumber - Número da página
   * @returns {Promise<Object|null>} Anotação ou null
   */
  async findByPage(essayId, pageNumber) {
    const sql = `
      SELECT
        id,
        essay_id as "essayId",
        annotation_data as "annotationData",
        page_number as "pageNumber",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM annotations
      WHERE essay_id = $1 AND page_number = $2
    `;

    const result = await query(sql, [essayId, pageNumber]);

    return result.rows[0] || null;
  }

  /**
   * Deleta todas as anotações de uma redação
   *
   * @async
   * @param {string} essayId - ID da redação
   * @returns {Promise<boolean>} True se deletado
   */
  async deleteByEssay(essayId) {
    const sql = 'DELETE FROM annotations WHERE essay_id = $1';

    const result = await query(sql, [essayId]);

    return result.rowCount > 0;
  }

  /**
   * Deleta anotação de uma página específica
   *
   * @async
   * @param {string} essayId - ID da redação
   * @param {number} pageNumber - Número da página
   * @returns {Promise<boolean>} True se deletado
   */
  async deleteByPage(essayId, pageNumber) {
    const sql = 'DELETE FROM annotations WHERE essay_id = $1 AND page_number = $2';

    const result = await query(sql, [essayId, pageNumber]);

    return result.rowCount > 0;
  }
}
