import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

/**
 * Configuração do Google Drive API
 *
 * Este módulo gerencia a autenticação e configuração do Google Drive API.
 * Suporta dois métodos de autenticação:
 * 1. Service Account (recomendado para produção)
 * 2. OAuth2 Client (para desenvolvimento)
 *
 * IMPORTANTE: Para usar Google Drive, você precisa:
 * 1. Criar um projeto no Google Cloud Console
 * 2. Ativar Google Drive API
 * 3. Criar credenciais (Service Account ou OAuth2)
 * 4. Baixar o arquivo de credenciais
 */

/**
 * Tipos de autenticação suportados
 */
const AUTH_TYPES = {
  SERVICE_ACCOUNT: 'service_account',
  OAUTH2: 'oauth2',
};

/**
 * Configuração do Google Drive
 * @class
 */
class GoogleDriveConfig {
  constructor() {
    this.drive = null;
    this.authType = process.env.GOOGLE_DRIVE_AUTH_TYPE || AUTH_TYPES.SERVICE_ACCOUNT;
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  }

  /**
   * Inicializa o cliente do Google Drive
   * SRP: Apenas inicializa a conexão
   *
   * @async
   * @throws {Error} Se as credenciais estiverem faltando ou inválidas
   */
  async initialize() {
    try {
      let auth;

      if (this.authType === AUTH_TYPES.SERVICE_ACCOUNT) {
        auth = await this._createServiceAccountAuth();
      } else {
        auth = await this._createOAuth2Auth();
      }

      this.drive = google.drive({ version: 'v3', auth });

      console.log('[GOOGLE DRIVE] Inicializado com sucesso');
      console.log(`[GOOGLE DRIVE] Tipo de autenticação: ${this.authType}`);
      console.log(`[GOOGLE DRIVE] Pasta raiz: ${this.folderId || 'root'}`);

      // Testar conexão
      await this._testConnection();

      return this.drive;
    } catch (error) {
      console.error('[GOOGLE DRIVE] Erro ao inicializar:', error);
      throw new Error(`Falha ao inicializar Google Drive: ${error.message}`);
    }
  }

  /**
   * Cria autenticação usando Service Account
   * SRP: Apenas cria auth de service account
   *
   * @private
   * @async
   * @returns {JWT} Cliente autenticado
   */
  async _createServiceAccountAuth() {
    const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH;

    if (!credentialsPath) {
      throw new Error(
        'GOOGLE_DRIVE_CREDENTIALS_PATH não definido. Configure o caminho para o arquivo de credenciais.'
      );
    }

    // DEBUG: Verificar caminhos
    console.log('[GOOGLE DRIVE] CWD:', process.cwd());
    console.log('[GOOGLE DRIVE] credentialsPath (env):', credentialsPath);
    const fullPath = path.resolve(credentialsPath);
    console.log('[GOOGLE DRIVE] fullPath resolved:', fullPath);
    console.log('[GOOGLE DRIVE] File exists?', fs.existsSync(fullPath));

    // Verificar se o arquivo existe
    if (!fs.existsSync(fullPath)) {
      throw new Error(
        `Arquivo de credenciais não encontrado: ${fullPath}`
      );
    }

        // Ler credenciais
        const credentials = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    
        console.log('[GOOGLE DRIVE] Credentials loaded. Keys:', Object.keys(credentials));
        
        // DEBUG: Inspect key and email
        console.log('[GOOGLE DRIVE] client_email:', credentials.client_email);
        console.log('[GOOGLE DRIVE] private_key exists?', !!credentials.private_key);
        console.log('[GOOGLE DRIVE] private_key type:', typeof credentials.private_key);
        if (credentials.private_key) {
          console.log('[GOOGLE DRIVE] private_key length:', credentials.private_key.length);
          console.log('[GOOGLE DRIVE] private_key start:', credentials.private_key.substring(0, 20));
        }
    
        if (!credentials.private_key) console.error('[GOOGLE DRIVE] private_key missing in credentials!');
        if (!credentials.client_email) console.error('[GOOGLE DRIVE] client_email missing in credentials!');
    
        // Validar estrutura
    if (credentials.type !== 'service_account') {
      throw new Error(
        'Arquivo de credenciais inválido. Esperado: service_account'
      );
    }

    // Processar a chave privada (garantir que \n seja interpretado como quebra de linha)
    const privateKey = credentials.private_key.replace(/\\n/g, '\n');

    console.log('[GOOGLE DRIVE] private_key após processamento - primeiras 50 chars:', privateKey.substring(0, 50));

    // Criar cliente JWT usando a chave privada diretamente
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    await auth.authorize();

    console.log(`[GOOGLE DRIVE] Service Account autenticado: ${credentials.client_email}`);

    return auth;
  }

  /**
   * Cria autenticação usando OAuth2
   * SRP: Apenas cria auth OAuth2
   *
   * @private
   * @async
   * @returns {OAuth2Client} Cliente autenticado
   */
  async _createOAuth2Auth() {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error(
        'Credenciais OAuth2 incompletas. Configure: GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN'
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost' // Redirect URI (não usado com refresh token)
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    console.log('[GOOGLE DRIVE] OAuth2 configurado');

    return oauth2Client;
  }

  /**
   * Testa conexão com o Google Drive
   * SRP: Apenas testa se a conexão está funcionando
   *
   * @private
   * @async
   */
  async _testConnection() {
    try {
      // Listar arquivos (máximo 1) para testar permissão
      await this.drive.files.list({
        pageSize: 1,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      console.log('[GOOGLE DRIVE] Conexão testada com sucesso');
    } catch (error) {
      console.error('[GOOGLE DRIVE] Erro ao testar conexão:', error);
      throw new Error('Falha no teste de conexão com Google Drive');
    }
  }

  /**
   * Retorna instância do Google Drive
   * @returns {drive_v3.Drive} Instância do Google Drive API
   */
  getDrive() {
    if (!this.drive) {
      throw new Error('Google Drive não inicializado. Chame initialize() primeiro.');
    }

    return this.drive;
  }

  /**
   * Retorna ID da pasta raiz
   * @returns {string} ID da pasta ou 'root'
   */
  getFolderId() {
    return this.folderId || 'root';
  }

  /**
   * Verifica se o Google Drive está configurado
   * @returns {boolean}
   */
  isConfigured() {
    if (this.authType === AUTH_TYPES.SERVICE_ACCOUNT) {
      return !!process.env.GOOGLE_DRIVE_CREDENTIALS_PATH;
    }

    return !!(
      process.env.GOOGLE_DRIVE_CLIENT_ID &&
      process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
      process.env.GOOGLE_DRIVE_REFRESH_TOKEN
    );
  }
}

// Singleton
export const googleDriveConfig = new GoogleDriveConfig();
