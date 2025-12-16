import multer from 'multer';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { ValidationError } from '../../../utils/errors.js';

/**
 * Configuração de armazenamento temporário em memória
 * Arquivos serão validados antes de serem enviados ao Google Drive
 */
const storage = multer.memoryStorage();

/**
 * Tipos MIME permitidos para upload
 * @constant {Object}
 */
const ALLOWED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
};

/**
 * Tamanho máximo do arquivo: 10MB
 * @constant {number}
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Dimensões mínimas para imagens (previne imagens muito pequenas/inválidas)
 * @constant {Object}
 */
const MIN_IMAGE_DIMENSIONS = {
  width: 100,
  height: 100,
};

/**
 * Dimensões máximas para imagens (previne imagens excessivamente grandes)
 * @constant {Object}
 */
const MAX_IMAGE_DIMENSIONS = {
  width: 10000,
  height: 10000,
};

/**
 * Filtra arquivos baseado no tipo MIME
 * SRP: Apenas verifica extensão e tipo MIME
 */
const fileFilter = (req, file, cb) => {
  const mimeType = file.mimetype;

  if (!ALLOWED_MIME_TYPES[mimeType]) {
    return cb(
      new ValidationError(
        `Tipo de arquivo não permitido: ${mimeType}. Apenas JPEG, PNG e PDF são aceitos.`
      ),
      false
    );
  }

  cb(null, true);
};

/**
 * Configuração do multer
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Apenas 1 arquivo por vez
  },
});

/**
 * Middleware para validação avançada de arquivos
 * Verifica metadados e valida a integridade do arquivo
 *
 * IMPORTANTE: Use DEPOIS do multer.single()
 * @async
 * @throws {ValidationError} Se o arquivo for inválido
 */
export const validateFileMetadata = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('Nenhum arquivo foi enviado');
    }

    const { buffer, mimetype, originalname, size } = req.file;

    // 1. Validar tipo real do arquivo (não apenas extensão)
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType) {
      throw new ValidationError(
        'Não foi possível determinar o tipo do arquivo. O arquivo pode estar corrompido.'
      );
    }

    // 2. Verificar se o tipo real corresponde ao tipo MIME declarado
    if (fileType.mime !== mimetype) {
      throw new ValidationError(
        `O tipo real do arquivo (${fileType.mime}) não corresponde ao tipo declarado (${mimetype}). Possível tentativa de spoofing.`
      );
    }

    // 3. Validar que o tipo detectado está na lista permitida
    if (!ALLOWED_MIME_TYPES[fileType.mime]) {
      throw new ValidationError(
        `Tipo de arquivo não permitido: ${fileType.mime}`
      );
    }

    // 4. Validações específicas para imagens
    if (mimetype.startsWith('image/')) {
      await validateImageMetadata(buffer, originalname);
    }

    // 5. Validações específicas para PDF
    if (mimetype === 'application/pdf') {
      await validatePdfMetadata(buffer, originalname);
    }

    // 6. Adicionar informações validadas ao request
    req.validatedFile = {
      buffer,
      mimetype: fileType.mime,
      extension: fileType.ext,
      originalname,
      size,
      isImage: mimetype.startsWith('image/'),
      isPdf: mimetype === 'application/pdf',
    };

    next();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Erro inesperado
    console.error('Erro na validação de arquivo:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao validar arquivo',
    });
  }
};

/**
 * Valida metadados de imagem usando Sharp
 * SRP: Apenas valida imagens
 *
 * @async
 * @param {Buffer} buffer - Buffer do arquivo
 * @param {string} filename - Nome original do arquivo
 * @throws {ValidationError} Se a imagem for inválida
 */
async function validateImageMetadata(buffer, filename) {
  try {
    const metadata = await sharp(buffer).metadata();

    // 1. Verificar se conseguiu extrair metadados
    if (!metadata.width || !metadata.height) {
      throw new ValidationError(
        'Não foi possível extrair metadados da imagem. O arquivo pode estar corrompido.'
      );
    }

    // 2. Validar dimensões mínimas
    if (
      metadata.width < MIN_IMAGE_DIMENSIONS.width ||
      metadata.height < MIN_IMAGE_DIMENSIONS.height
    ) {
      throw new ValidationError(
        `Imagem muito pequena. Dimensões mínimas: ${MIN_IMAGE_DIMENSIONS.width}x${MIN_IMAGE_DIMENSIONS.height}px`
      );
    }

    // 3. Validar dimensões máximas
    if (
      metadata.width > MAX_IMAGE_DIMENSIONS.width ||
      metadata.height > MAX_IMAGE_DIMENSIONS.height
    ) {
      throw new ValidationError(
        `Imagem muito grande. Dimensões máximas: ${MAX_IMAGE_DIMENSIONS.width}x${MAX_IMAGE_DIMENSIONS.height}px`
      );
    }

    // 4. Validar formato de imagem
    const allowedFormats = ['jpeg', 'png'];
    if (!allowedFormats.includes(metadata.format)) {
      throw new ValidationError(
        `Formato de imagem não permitido: ${metadata.format}`
      );
    }

    // 5. Verificar se a imagem tem densidade excessiva (possível bomb)
    const pixelCount = metadata.width * metadata.height;
    const MAX_PIXELS = 100_000_000; // 100 megapixels

    if (pixelCount > MAX_PIXELS) {
      throw new ValidationError(
        'Imagem com densidade de pixels excessiva. Isso pode ser uma tentativa de ataque.'
      );
    }

    console.log(`[UPLOAD] Imagem validada: ${filename}`, {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      size: Math.round(buffer.length / 1024) + 'KB',
    });
  } catch (error) {
    // Sharp pode lançar erro se a imagem estiver corrompida
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new ValidationError(
      `Erro ao processar imagem: ${error.message}. O arquivo pode estar corrompido.`
    );
  }
}

/**
 * Valida metadados de PDF
 * SRP: Apenas valida PDFs
 *
 * @async
 * @param {Buffer} buffer - Buffer do arquivo
 * @param {string} filename - Nome original do arquivo
 * @throws {ValidationError} Se o PDF for inválido
 */
async function validatePdfMetadata(buffer, filename) {
  // 1. Verificar se começa com assinatura PDF
  const pdfSignature = buffer.slice(0, 5).toString();

  if (!pdfSignature.startsWith('%PDF-')) {
    throw new ValidationError(
      'Arquivo PDF inválido. Assinatura do arquivo não corresponde a um PDF.'
    );
  }

  // 2. Verificar se termina com EOF
  const pdfEnd = buffer.slice(-6).toString();

  if (!pdfEnd.includes('%%EOF')) {
    throw new ValidationError(
      'Arquivo PDF possivelmente corrompido. Não possui marcador de fim de arquivo.'
    );
  }

  // 3. Validar que o PDF não contém JavaScript (prevenção de PDFs maliciosos)
  const pdfContent = buffer.toString();

  if (pdfContent.includes('/JavaScript') || pdfContent.includes('/JS')) {
    throw new ValidationError(
      'PDF contém JavaScript. Por segurança, PDFs com scripts não são permitidos.'
    );
  }

  console.log(`[UPLOAD] PDF validado: ${filename}`, {
    size: Math.round(buffer.length / 1024) + 'KB',
  });
}

/**
 * Middleware de tratamento de erros do Multer
 * Converte erros do Multer em respostas JSON amigáveis
 */
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Apenas um arquivo pode ser enviado por vez',
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Campo de arquivo inesperado',
      });
    }

    return res.status(400).json({
      success: false,
      error: `Erro no upload: ${err.message}`,
    });
  }

  next(err);
};
