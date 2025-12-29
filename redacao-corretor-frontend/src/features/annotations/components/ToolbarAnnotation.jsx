import { Button } from '@/shared/components/ui/Button';
import { useAnnotationContext } from './AnnotationProvider';

/**
 * Toolbar para anotações de redação (REFATORADO)
 *
 * Responsabilidades:
 * - Exibir ferramentas de desenho (caneta, marca-texto, marcador)
 * - Exibir seletor de cor e tamanho
 * - Botões de ação (desfazer, limpar, salvar, finalizar)
 * - Indicadores de status (salvando, última salvamento)
 *
 * Segue SOLID:
 * - SRP: Apenas UI da toolbar (estado vem do Context)
 * - Sem prop drilling (usa useAnnotationContext)
 *
 * ANTES: Recebia 17 props
 * DEPOIS: Recebe apenas 2 callbacks (onClear, onFinish)
 *
 * @param {Object} props
 * @param {Function} props.onClear - Callback ao limpar (gerenciado pelo pai - modal)
 * @param {Function} props.onFinish - Callback ao finalizar (gerenciado pelo pai - modal)
 */
export const ToolbarAnnotation = ({ onClear, onFinish }) => {
  // Context de anotações (substitui todas as props!)
  const {
    currentTool,
    setCurrentTool,
    color,
    setColor,
    size,
    setSize,
    isEraser,
    toggleEraser,
    undo,
    saveAnnotations,
    isSaving,
    hasUnsavedChanges,
    lastSaved,
    lines,
  } = useAnnotationContext();
  const tools = [
    { value: 'pen', label: 'Caneta', icon: 'bi-pen-fill' },
    { value: 'highlighter', label: 'Marca-texto', icon: 'bi-highlighter' },
    { value: 'marker', label: 'Marcador', icon: 'bi-brush-fill' },
  ];

  const colors = [
    { value: '#EF4444', label: 'Vermelho', bg: 'bg-red-500' },
    { value: '#3B82F6', label: 'Azul', bg: 'bg-blue-500' },
    { value: '#10B981', label: 'Verde', bg: 'bg-green-500' },
    { value: '#000000', label: 'Preto', bg: 'bg-black' },
  ];

  const sizes = [
    { value: 2, label: 'Fino', size: 'w-2 h-2' },
    { value: 4, label: 'Médio', size: 'w-4 h-4' },
    { value: 6, label: 'Grosso', size: 'w-6 h-6' },
  ];

  const formatLastSaved = () => {
    if (!lastSaved) return 'Nunca salvo';
    const now = new Date();
    const diff = Math.floor((now - lastSaved) / 1000);

    if (diff < 60) return `${diff}s atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    return lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const canUndo = lines.length > 0;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-end text-sm">
        {/* Save Status */}
        <div className="flex items-center gap-2">
          {isSaving && (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
              <span className="text-blue-600 font-medium">Salvando...</span>
            </>
          )}

          {!isSaving && hasUnsavedChanges && (
            <>
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-orange-600 font-medium">Mudanças não salvas</span>
            </>
          )}

          {!isSaving && !hasUnsavedChanges && lastSaved && (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-600 font-medium">Salvo {formatLastSaved()}</span>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-3 flex items-center gap-4 flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            {tools.map((tool) => (
              <button
                key={tool.value}
                onClick={() => setCurrentTool(tool.value)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                  currentTool === tool.value && !isEraser
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-sm'
                }`}
                title={tool.label}
              >
                <i className={`bi ${tool.icon}`}></i>
              </button>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-gray-300" />

        {/* Colors */}
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`w-9 h-9 rounded-full border-2 transition-all ${c.bg} ${
                  color === c.value && !isEraser
                    ? 'border-gray-900 ring-2 ring-gray-300 shadow-md'
                    : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                }`}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-gray-300" />

        {/* Sizes */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            {sizes.map((s) => (
              <button
                key={s.value}
                onClick={() => setSize(s.value)}
                className={`flex items-center justify-center transition-all ${
                  size === s.value && !isEraser
                    ? 'ring-2 ring-blue-600 ring-offset-2'
                    : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-2'
                }`}
                title={s.label}
                style={{ width: '36px', height: '36px' }}
              >
                <div
                  className={`rounded-full bg-gray-700 transition-all ${
                    size === s.value && !isEraser ? 'bg-blue-600' : ''
                  } ${s.size}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-gray-300" />

        {/* Eraser */}
        <Button
          onClick={toggleEraser}
          variant={isEraser ? 'primary' : 'secondary'}
          size="sm"
          title="Borracha (ou use o botão da caneta)"
        >
          <i className="bi bi-eraser-fill me-2"></i>
          Borracha
        </Button>

        {/* Undo */}
        <Button onClick={undo} variant="secondary" size="sm" disabled={!canUndo} title="Desfazer (Ctrl+Z)">
          <i className="bi bi-arrow-counterclockwise me-2"></i>
          Desfazer
        </Button>

        {/* Clear */}
        <Button
          onClick={onClear}
          variant="secondary"
          size="sm"
          disabled={lines.length === 0}
          title="Limpar todas as anotações"
        >
          <i className="bi bi-trash-fill me-2"></i>
          Limpar Tudo
        </Button>

        {/* Separator */}
        <div className="w-px h-8 bg-gray-300" />

        {/* Save */}
        <Button
          onClick={saveAnnotations}
          variant="secondary"
          size="sm"
          disabled={isSaving || !hasUnsavedChanges}
          title="Salvar manualmente (auto-save a cada 5s)"
        >
          <i className="bi bi-floppy-fill me-2"></i>
          Salvar
        </Button>

        {/* Finish */}
        <Button onClick={onFinish} variant="success" size="sm" disabled={isSaving} title="Finalizar e marcar como corrigido">
          <i className="bi bi-check-circle-fill me-2"></i>
          Finalizar Correção
        </Button>
      </div>
    </div>
  );
};
