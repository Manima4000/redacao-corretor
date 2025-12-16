/**
 * Interface para serviços de armazenamento de arquivos
 *
 * Define o contrato que todas as implementações de storage devem seguir.
 * Permite trocar implementações (Local, S3, Google Drive) sem alterar código.
 *
 * Segue:
 * - OCP (Open/Closed): Aberto para extensão, fechado para modificação
 * - LSP (Liskov Substitution): Qualquer implementação pode substituir outra
 * - ISP (Interface Segregation): Interface focada apenas em storage
 * - DIP (Dependency Inversion): Use Cases dependem da abstração, não da implementação
 */
export class IFileStorageService {
  /**
   * Faz upload de um arquivo
   *
   * @async
   * @param {Buffer} buffer - Buffer do arquivo
   * @param {Object} metadata - Metadados do arquivo
   * @param {string} metadata.filename - Nome original do arquivo
   * @param {string} metadata.mimetype - Tipo MIME do arquivo
   * @param {string} metadata.folder - Pasta de destino (opcional)
   * @returns {Promise<string>} URL pública ou ID do arquivo
   * @throws {Error} Se o upload falhar
   */
  async upload(buffer, metadata) {
    throw new Error('Method upload() must be implemented');
  }

  /**
   * Deleta um arquivo
   *
   * @async
   * @param {string} fileIdentifier - URL ou ID do arquivo
   * @returns {Promise<boolean>} True se deletado com sucesso
   * @throws {Error} Se a deleção falhar
   */
  async delete(fileIdentifier) {
    throw new Error('Method delete() must be implemented');
  }

  /**
   * Obtém URL pública de um arquivo
   *
   * @async
   * @param {string} fileIdentifier - URL ou ID do arquivo
   * @returns {Promise<string>} URL pública para acesso
   * @throws {Error} Se não conseguir gerar URL
   */
  async getPublicUrl(fileIdentifier) {
    throw new Error('Method getPublicUrl() must be implemented');
  }

  /**
   * Verifica se um arquivo existe
   *
   * @async
   * @param {string} fileIdentifier - URL ou ID do arquivo
   * @returns {Promise<boolean>} True se o arquivo existe
   */
  async exists(fileIdentifier) {
    throw new Error('Method exists() must be implemented');
  }

  /**
   * Obtém metadados de um arquivo
   *
   * @async
   * @param {string} fileIdentifier - URL ou ID do arquivo
   * @returns {Promise<Object>} Metadados do arquivo
   * @throws {Error} Se não conseguir obter metadados
   */
  async getMetadata(fileIdentifier) {
    throw new Error('Method getMetadata() must be implemented');
  }
}
