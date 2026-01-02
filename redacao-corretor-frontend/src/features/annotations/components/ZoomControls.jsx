/**
 * Controles de Zoom
 *
 * Responsabilidades:
 * - Exibir botões de zoom (in, out, reset)
 * - Exibir nível de zoom atual
 *
 * Segue SOLID:
 * - SRP: Apenas UI de controles de zoom (não gerencia estado de zoom)
 * - Recebe funções via props (inversão de controle)
 *
 * @param {Object} props
 * @param {Function} props.onZoomIn - Callback ao clicar em zoom in
 * @param {Function} props.onZoomOut - Callback ao clicar em zoom out
 * @param {Function} props.onResetZoom - Callback ao resetar zoom
 * @param {number} props.scale - Nível de zoom atual (ex: 1.0, 1.5, 2.0)
 *
 * @example
 * <ZoomControls
 *   onZoomIn={zoomIn}
 *   onZoomOut={zoomOut}
 *   onResetZoom={resetZoom}
 *   scale={1.5}
 * />
 */
export const ZoomControls = ({ onZoomIn, onZoomOut, onResetZoom, scale }) => {
  // Formata escala para exibição (ex: 1.5 → "150%")
  const formattedScale = `${Math.round(scale * 100)}%`;

  return (
    <div className="flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        title="Zoom In (aumentar)"
        aria-label="Zoom In"
      >
        <span className="text-xl font-bold">+</span>
      </button>

      {/* Indicador de zoom */}
      <div className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-700 rounded text-xs font-medium">
        {formattedScale}
      </div>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        title="Zoom Out (diminuir)"
        aria-label="Zoom Out"
      >
        <span className="text-xl font-bold">−</span>
      </button>

      {/* Reset Zoom */}
      <button
        onClick={onResetZoom}
        className="w-10 h-10 flex items-center justify-center bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
        title="Reset Zoom (100%)"
        aria-label="Reset Zoom"
      >
        1:1
      </button>
    </div>
  );
};
