import { useState, useEffect } from 'react';
import { Document, pdfjs } from 'react-pdf';
import { useCanvasZoom } from '../hooks/useCanvasZoom';
import { useAnnotationContext } from './AnnotationProvider';
import { Spinner } from '@/shared/components/ui/Spinner';
import { AnnotationPage } from './AnnotationPage';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configuração do Worker via CDN para evitar problemas de MIME type com Vite/ESM
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Canvas de Anotações que gerencia múltiplas páginas e scroll nativo
 */
export const AnnotationCanvas = ({ imageUrl, onZoomChange }) => {
  const { essayId, readOnly } = useAnnotationContext();

  // Estado local
  const [fileType, setFileType] = useState(null); // 'image' | 'pdf'
  const [fileUrl, setFileUrl] = useState(null); // Blob URL
  const [image, setImage] = useState(null); // Objeto Image para Konva
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [numPages, setNumPages] = useState(0);

  // Hook de zoom (sem Pan agora, apenas Scale)
  const {
    scale,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useCanvasZoom({ minZoom: 0.5, maxZoom: 3, zoomStep: 0.2 });

  /**
   * Carrega arquivo (Imagem ou PDF) via fetch
   */
  useEffect(() => {
    if (!imageUrl) return;

    setIsLoaded(false);
    setLoadError(null);
    setFileType(null);
    setImage(null);
    setNumPages(0);

    const loadFile = async () => {
      try {
        const response = await fetch(imageUrl, { credentials: 'include' });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const contentType = response.headers.get('content-type');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setFileUrl(blobUrl);

        if (contentType?.includes('application/pdf')) {
          setFileType('pdf');
          // NumPages será definido no onDocumentLoadSuccess
        } else {
          setFileType('image');
          const img = new window.Image();
          img.onload = () => {
            setImage(img);
            setNumPages(1);
            setIsLoaded(true);
          };
          img.onerror = () => setLoadError('Erro ao processar imagem');
          img.src = blobUrl;
        }
      } catch (error) {
        console.error('Erro ao carregar arquivo:', error);
        setLoadError(`Erro ao carregar arquivo: ${error.message}`);
      }
    };

    loadFile();
    return () => { if (fileUrl) URL.revokeObjectURL(fileUrl); };
  }, [imageUrl]);

  /**
   * Notifica mudanças de zoom
   */
  useEffect(() => {
    if (onZoomChange) {
      onZoomChange({ scale, zoomIn, zoomOut, resetZoom });
    }
  }, [scale, zoomIn, zoomOut, resetZoom, onZoomChange]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    // Limitamos a 3 páginas conforme pedido
    setNumPages(Math.min(numPages, 3));
    setIsLoaded(true);
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center max-w-2xl px-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erro ao Carregar Arquivo</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">Tentar Novamente</button>
        </div>
      </div>
    );
  }

  // Renderiza até 3 páginas
  const pages = [];
  for (let i = 1; i <= numPages; i++) {
    pages.push(
      <AnnotationPage
        key={`${essayId}-page-${i}`}
        essayId={essayId}
        pageNumber={i}
        fileType={fileType}
        fileUrl={fileUrl}
        image={image}
        scale={scale}
        readOnly={readOnly}
      />
    );
  }

  return (
    <div className="w-full h-full bg-gray-300 overflow-y-auto overflow-x-hidden p-12 custom-scrollbar">
      {!isLoaded && (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">Carregando documento...</p>
        </div>
      )}

      {fileType === 'pdf' && fileUrl && (
        <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} loading={null}>
          <div className="flex flex-col items-center">
            {pages}
          </div>
        </Document>
      )}

      {fileType === 'image' && isLoaded && (
        <div className="flex flex-col items-center">
          {pages}
        </div>
      )}
    </div>
  );
};
