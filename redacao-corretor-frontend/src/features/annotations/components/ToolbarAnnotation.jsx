import { Button } from '@/shared/components/ui/Button';

/**
 * Toolbar para anotações de redação
 *
 * Features:
 * - Seleção de cor (vermelho, azul, verde, preto)
 * - Seleção de tamanho (fino, médio, grosso)
 * - Modo borracha (toggle)
 * - Desfazer última linha
 * - Limpar todas as anotações
 * - Salvar manual
 * - Finalizar correção
 * - Indicadores de status
 *
 * @param {Object} props
 * @param {string} props.color - Cor atual
 * @param {Function} props.onColorChange - Callback ao mudar cor
 * @param {number} props.size - Tamanho atual
 * @param {Function} props.onSizeChange - Callback ao mudar tamanho
 * @param {boolean} props.isEraser - Se está em modo borracha
 * @param {Function} props.onEraserToggle - Toggle modo borracha
 * @param {Function} props.onUndo - Desfazer última linha
 * @param {Function} props.onClear - Limpar tudo
 * @param {Function} props.onSave - Salvar manual
 * @param {Function} props.onFinish - Finalizar correção
 * @param {boolean} props.isSaving - Se está salvando
 * @param {boolean} props.hasUnsavedChanges - Se tem mudanças não salvas
 * @param {Date} props.lastSaved - Última vez que salvou
 * @param {number} props.linesCount - Quantidade de linhas
 * @param {boolean} props.canUndo - Se pode desfazer
 * @param {string} props.pointerType - Tipo de pointer ('pen', 'touch', 'mouse')
 * @param {number} props.scale - Escala de zoom
 */
export const ToolbarAnnotation = ({
  color,
  onColorChange,
  size,
  onSizeChange,
  isEraser,
  onEraserToggle,
  onUndo,
  onClear,
  onSave,
  onFinish,
  isSaving,
  hasUnsavedChanges,
  lastSaved,
  linesCount,
  canUndo,
  pointerType,
  scale,
}) => {
  const colors = [
    { value: '#EF4444', label: 'Vermelho', bg: 'bg-red-500' },
    { value: '#3B82F6', label: 'Azul', bg: 'bg-blue-500' },
    { value: '#10B981', label: 'Verde', bg: 'bg-green-500' },
    { value: '#000000', label: 'Preto', bg: 'bg-black' },
  ];

  const sizes = [
    { value: 2, label: 'Fino' },
    { value: 4, label: 'Médio' },
    { value: 6, label: 'Grosso' },
  ];

  const formatLastSaved = () => {
    if (!lastSaved) return 'Nunca salvo';
    const now = new Date();
    const diff = Math.floor((now - lastSaved) / 1000);

    if (diff < 60) return `${diff}s atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    return lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getPointerIcon = () => {
    switch (pointerType) {
      case 'pen':
        return '✏️';
      case 'touch':
        return '👆';
      case 'mouse':
        return '🖱️';
      default:
        return '?';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {/* Pointer Type */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Input:</span>
            <span className="font-medium">{getPointerIcon()}</span>
            <span className="text-gray-700">
              {pointerType === 'pen' && 'Caneta'}
              {pointerType === 'touch' && 'Dedo'}
              {pointerType === 'mouse' && 'Mouse'}
            </span>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Zoom:</span>
            <span className="font-medium text-gray-700">{Math.round(scale * 100)}%</span>
          </div>

          {/* Lines Count */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Linhas:</span>
            <span className="font-medium text-gray-700">{linesCount}</span>
          </div>
        </div>

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
      <div className="px-4 py-3 flex items-center gap-6 flex-wrap">
        {/* Colors */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Cor:</span>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c.value}
                onClick={() => onColorChange(c.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${c.bg} ${
                  color === c.value && !isEraser
                    ? 'border-gray-900 ring-2 ring-gray-300'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Tamanho:</span>
          <div className="flex gap-2">
            {sizes.map((s) => (
              <button
                key={s.value}
                onClick={() => onSizeChange(s.value)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  size === s.value && !isEraser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="w-px h-8 bg-gray-300" />

        {/* Eraser */}
        <Button
          onClick={onEraserToggle}
          variant={isEraser ? 'primary' : 'secondary'}
          size="sm"
          title="Borracha (ou use o botão da caneta)"
        >
          🧽 Borracha
        </Button>

        {/* Undo */}
        <Button onClick={onUndo} variant="secondary" size="sm" disabled={!canUndo} title="Desfazer (Ctrl+Z)">
          ↩️ Desfazer
        </Button>

        {/* Clear */}
        <Button
          onClick={onClear}
          variant="secondary"
          size="sm"
          disabled={linesCount === 0}
          title="Limpar todas as anotações"
        >
          🗑️ Limpar Tudo
        </Button>

        {/* Separator */}
        <div className="w-px h-8 bg-gray-300" />

        {/* Save */}
        <Button
          onClick={onSave}
          variant="secondary"
          size="sm"
          disabled={isSaving || !hasUnsavedChanges}
          title="Salvar manualmente (auto-save a cada 5s)"
        >
          💾 Salvar
        </Button>

        {/* Finish */}
        <Button onClick={onFinish} variant="success" size="sm" disabled={isSaving} title="Finalizar e marcar como corrigido">
          ✅ Finalizar Correção
        </Button>
      </div>
    </div>
  );
};
