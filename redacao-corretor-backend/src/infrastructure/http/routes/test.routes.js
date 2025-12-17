import { Router } from 'express';
import { GoogleDriveStorageService } from '../../services/GoogleDriveStorageService.js';
import { googleDriveConfig } from '../../config/googleDrive.js';

const router = Router();

/**
 * Endpoint de teste para listar arquivos do Google Drive
 * GET /api/test/drive/list
 */
router.get('/drive/list', async (req, res, next) => {
  try {
    const driveService = new GoogleDriveStorageService();
    await driveService.initialize();

    const folderId = googleDriveConfig.getFolderId();

    // Listar arquivos na pasta
    const response = await driveService.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, createdTime)',
      pageSize: 20,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = response.data.files || [];

    res.status(200).json({
      success: true,
      data: {
        folderId,
        totalFiles: files.length,
        files: files.map((file) => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
          createdTime: file.createdTime,
        })),
      },
    });
  } catch (error) {
    console.error('[TEST] Erro ao listar arquivos:', error);
    next(error);
  }
});

/**
 * Endpoint de teste para verificar se arquivo existe
 * GET /api/test/drive/exists/:fileId
 */
router.get('/drive/exists/:fileId', async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const driveService = new GoogleDriveStorageService();
    await driveService.initialize();

    const exists = await driveService.exists(fileId);

    if (exists) {
      const metadata = await driveService.getMetadata(fileId);

      res.status(200).json({
        success: true,
        data: {
          fileId,
          exists: true,
          metadata,
        },
      });
    } else {
      res.status(200).json({
        success: true,
        data: {
          fileId,
          exists: false,
          message: 'Arquivo não encontrado',
        },
      });
    }
  } catch (error) {
    console.error('[TEST] Erro ao verificar arquivo:', error);
    res.status(200).json({
      success: false,
      data: {
        fileId: req.params.fileId,
        exists: false,
        error: error.message,
      },
    });
  }
});

/**
 * Endpoint de teste para deletar arquivo específico
 * DELETE /api/test/drive/delete/:fileId
 */
router.delete('/drive/delete/:fileId', async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const driveService = new GoogleDriveStorageService();
    await driveService.initialize();

    // PRIMEIRO: Verificar se o arquivo existe
    console.log(`[TEST DELETE] Verificando se arquivo existe: ${fileId}`);

    let existsBefore = false;
    let metadataBefore = null;

    try {
      const metadata = await driveService.drive.files.get({
        fileId: fileId,
        fields: 'id, name, parents, trashed, capabilities',
        supportsAllDrives: true,
      });

      existsBefore = true;
      metadataBefore = metadata.data;
      console.log('[TEST DELETE] Arquivo encontrado:', metadataBefore);
    } catch (err) {
      console.log('[TEST DELETE] Arquivo NÃO encontrado antes de deletar:', err.message);
    }

    // SEGUNDO: Tentar deletar com diferentes configurações
    const deleteResults = [];

    // Tentativa 1: Mover para lixeira (RECOMENDADO para Shared Drives)
    try {
      console.log('[TEST DELETE] Tentativa 1: Mover para lixeira (trash: true)');
      await driveService.drive.files.update({
        fileId: fileId,
        requestBody: {
          trashed: true,
        },
        supportsAllDrives: true,
        supportsTeamDrives: true,
      });
      deleteResults.push({ attempt: 1, success: true, method: 'trash' });
      console.log('[TEST DELETE] Tentativa 1: SUCESSO - Arquivo movido para lixeira');
    } catch (err) {
      deleteResults.push({
        attempt: 1,
        success: false,
        method: 'trash',
        error: err.message,
        code: err.code
      });
      console.log('[TEST DELETE] Tentativa 1: FALHOU -', err.message);
    }

    // Verificar se ainda existe após tentativa de delete
    let existsAfter = false;
    let isTrashed = false;
    let metadataAfter = null;

    try {
      const metadata = await driveService.drive.files.get({
        fileId: fileId,
        fields: 'id, name, trashed',
        supportsAllDrives: true,
      });
      existsAfter = true;
      isTrashed = metadata.data.trashed;
      metadataAfter = metadata.data;
      console.log('[TEST DELETE] Estado após delete:', {
        exists: true,
        trashed: isTrashed
      });
    } catch (err) {
      console.log('[TEST DELETE] Arquivo não existe mais após delete');
    }

    res.status(200).json({
      success: true,
      data: {
        fileId,
        existsBefore,
        metadataBefore,
        deleteResults,
        existsAfter,
        isTrashed,
        metadataAfter,
        conclusion: existsBefore && isTrashed ? 'Movido para lixeira com sucesso' :
                    existsBefore && !existsAfter ? 'Deletado permanentemente' :
                    !existsBefore ? 'Arquivo não existia' :
                    'Falha ao deletar',
      },
    });
  } catch (error) {
    console.error('[TEST] Erro geral ao deletar arquivo:', error);
    res.status(200).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

export default router;
