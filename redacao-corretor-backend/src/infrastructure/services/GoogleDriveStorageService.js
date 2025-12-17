import { Readable } from 'stream';
import { IFileStorageService } from '../../domain/services/IFileStorageService.js';
import { googleDriveConfig } from '../config/googleDrive.js';

/**
 * Implementação do IFileStorageService usando Google Drive
 *
 * Armazena arquivos no Google Drive usando a API oficial.
 *
 * Segue SOLID:
 * - SRP: Apenas gerencia arquivos no Google Drive
 * - OCP: Implementa interface, pode ser substituído
 * - LSP: Substituível por qualquer IFileStorageService
 * - DIP: Depende da abstração IFileStorageService
 *
 * @implements {IFileStorageService}
 */
export class GoogleDriveStorageService extends IFileStorageService {
  constructor() {
    super();
    this.drive = null;
    this.initialized = false;
  }

  /**
   * Inicializa o serviço
   * SRP: Apenas inicializa conexão
   *
   * @async
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    if (!googleDriveConfig.isConfigured()) {
      throw new Error(
        'Google Drive não está configurado. Verifique as variáveis de ambiente.'
      );
    }

    this.drive = await googleDriveConfig.initialize();
    this.initialized = true;
  }

  /**
   * Faz upload de arquivo para o Google Drive
   * SRP: Apenas faz upload
   *
   * @async
   * @param {Buffer} buffer - Buffer do arquivo
   * @param {Object} metadata - Metadados do arquivo
   * @param {string} metadata.filename - Nome do arquivo
   * @param {string} metadata.mimetype - Tipo MIME
   * @param {string} [metadata.folder] - Pasta de destino (opcional)
   * @returns {Promise<string>} ID do arquivo no Google Drive
   */
  async upload(buffer, metadata) {
    await this._ensureInitialized();

    const { filename, mimetype, folder } = metadata;

    try {
      // Converter buffer para stream
      const stream = Readable.from(buffer);

      // Configurar metadados do arquivo
      const parentFolderId = folder || googleDriveConfig.getFolderId();

      const fileMetadata = {
        name: this._sanitizeFilename(filename),
        parents: [parentFolderId],
      };

      // Configurar mídia
      const media = {
        mimeType: mimetype,
        body: stream,
      };

      console.log(`[GOOGLE DRIVE] Iniciando upload: ${filename}`);
      console.log(`[GOOGLE DRIVE] Parent folder ID: ${parentFolderId}`);
      console.log(`[GOOGLE DRIVE] File metadata:`, JSON.stringify(fileMetadata, null, 2));

      // Fazer upload
      // IMPORTANTE: supportsAllDrives e supportsTeamDrives são necessários para Shared Drives
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, mimeType, size, webViewLink, webContentLink',
        supportsAllDrives: true, // Suporta Shared Drives
        supportsTeamDrives: true, // Compatibilidade com nome antigo
      });

      const file = response.data;

      console.log(`[GOOGLE DRIVE] Upload concluído: ${file.name}`, {
        id: file.id,
        size: file.size,
      });

      // Tornar arquivo público (para que alunos possam visualizar)
      await this._makePublic(file.id);

      // Retornar ID do arquivo
      return file.id;
    } catch (error) {
      console.error('[GOOGLE DRIVE] Erro ao fazer upload:', error);
      throw new Error(`Falha ao fazer upload para Google Drive: ${error.message}`);
    }
  }

  /**
   * Deleta arquivo do Google Drive (move para lixeira)
   * SRP: Apenas deleta arquivo
   *
   * IMPORTANTE: Para Shared Drives, usamos "trash" ao invés de "delete" permanente,
   * pois o Service Account geralmente não tem permissão de deletar permanentemente.
   *
   * @async
   * @param {string} fileId - ID do arquivo no Google Drive
   * @returns {Promise<boolean>} True se deletado com sucesso
   */
  async delete(fileId) {
    await this._ensureInitialized();

    try {
      console.log(`[GOOGLE DRIVE] Movendo arquivo para lixeira: ${fileId}`);

      // Mover para lixeira (funciona em Shared Drives)
      await this.drive.files.update({
        fileId: fileId,
        requestBody: {
          trashed: true,
        },
        supportsAllDrives: true, // Suporta Shared Drives
        supportsTeamDrives: true, // Compatibilidade com nome antigo
      });

      console.log(`[GOOGLE DRIVE] Arquivo movido para lixeira com sucesso: ${fileId}`);

      return true;
    } catch (error) {
      // Se o arquivo não existir, não é um erro crítico
      if (error.code === 404) {
        console.warn(`[GOOGLE DRIVE] Arquivo não encontrado: ${fileId}`);
        return false;
      }

      console.error('[GOOGLE DRIVE] Erro ao mover arquivo para lixeira:', error);
      throw new Error(`Falha ao deletar arquivo do Google Drive: ${error.message}`);
    }
  }

  /**
   * Obtém URL pública de um arquivo
   * SRP: Apenas retorna URL
   *
   * @async
   * @param {string} fileId - ID do arquivo
   * @returns {Promise<string>} URL pública
   */
  async getPublicUrl(fileId) {
    await this._ensureInitialized();

    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'webViewLink, webContentLink',
        supportsAllDrives: true,
      });

      // webViewLink: para visualização no navegador
      // webContentLink: para download direto
      return response.data.webViewLink || response.data.webContentLink;
    } catch (error) {
      console.error('[GOOGLE DRIVE] Erro ao obter URL pública:', error);
      throw new Error(`Falha ao obter URL pública: ${error.message}`);
    }
  }

  /**
   * Verifica se arquivo existe
   * SRP: Apenas verifica existência
   *
   * @async
   * @param {string} fileId - ID do arquivo
   * @returns {Promise<boolean>} True se existe
   */
  async exists(fileId) {
    await this._ensureInitialized();

    try {
      await this.drive.files.get({
        fileId: fileId,
        fields: 'id',
        supportsAllDrives: true,
      });

      return true;
    } catch (error) {
      if (error.code === 404) {
        return false;
      }

      throw error;
    }
  }

  /**
   * Obtém metadados de um arquivo
   * SRP: Apenas retorna metadados
   *
   * @async
   * @param {string} fileId - ID do arquivo
   * @returns {Promise<Object>} Metadados do arquivo
   */
  async getMetadata(fileId) {
    await this._ensureInitialized();

    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink',
        supportsAllDrives: true,
      });

      return response.data;
    } catch (error) {
      console.error('[GOOGLE DRIVE] Erro ao obter metadados:', error);
      throw new Error(`Falha ao obter metadados: ${error.message}`);
    }
  }

  /**
   * Torna arquivo público (qualquer pessoa com link pode ver)
   * SRP: Apenas gerencia permissões
   *
   * @private
   * @async
   * @param {string} fileId - ID do arquivo
   */
  async _makePublic(fileId) {
    try {
      await this.drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader', // Apenas leitura
          type: 'anyone', // Qualquer pessoa com o link
        },
        supportsAllDrives: true,
      });

      console.log(`[GOOGLE DRIVE] Arquivo tornado público: ${fileId}`);
    } catch (error) {
      console.error('[GOOGLE DRIVE] Erro ao tornar arquivo público:', error);
      // Não lançar erro, pois o upload foi bem-sucedido
      console.warn('[GOOGLE DRIVE] Arquivo foi enviado, mas não pôde ser tornado público');
    }
  }

  /**
   * Sanitiza nome do arquivo
   * Remove caracteres inválidos e limita tamanho
   *
   * @private
   * @param {string} filename - Nome original
   * @returns {string} Nome sanitizado
   */
  _sanitizeFilename(filename) {
    // Remover caracteres inválidos
    const sanitized = filename
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_');

    // Limitar tamanho (Google Drive permite até 255 caracteres)
    const maxLength = 255;
    if (sanitized.length > maxLength) {
      const extension = sanitized.split('.').pop();
      const nameWithoutExtension = sanitized.slice(0, -(extension.length + 1));
      return `${nameWithoutExtension.slice(0, maxLength - extension.length - 1)}.${extension}`;
    }

    return sanitized;
  }

  /**
   * Garante que o serviço está inicializado
   *
   * @private
   * @async
   */
  async _ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}
