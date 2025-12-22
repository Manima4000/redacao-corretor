import { EssayCorrectionSummary } from './EssayCorrectionSummary';

/**
 * Painel flutuante de correção (SOLID - SRP)
 *
 * Responsabilidade Única:
 * - Gerenciar posicionamento flutuante do painel de correção
 * - Controlar animação de entrada
 * - Renderizar EssayCorrectionSummary no local correto
 *
 * Princípios aplicados:
 * - SRP: Apenas responsável pelo painel flutuante, não pela correção em si
 * - OCP: Pode ser estendido (diferentes posições) sem modificação
 * - DIP: Depende de EssayCorrectionSummary (abstração)
 *
 * @param {Object} props
 * @param {number} props.grade - Nota da redação (0-10)
 * @param {string} props.writtenFeedback - Comentários escritos
 * @param {string} [props.position='left'] - Posição do painel ('left' ou 'right')
 */
export const FloatingCorrectionPanel = ({ grade, writtenFeedback, position = 'left' }) => {
  // Se não há dados, não renderiza
  const hasContent = (grade !== null && grade !== undefined) || (writtenFeedback && writtenFeedback.trim());
  if (!hasContent) return null;

  // Classes de posicionamento e animação
  const positionClasses = position === 'right' ? 'right-4' : 'left-4';
  const animationClasses = position === 'right'
    ? 'animate-slide-in-right'
    : 'animate-slide-in-left';

  return (
    <div className={`absolute top-4 ${positionClasses} z-20 max-w-sm ${animationClasses}`}>
      <EssayCorrectionSummary grade={grade} writtenFeedback={writtenFeedback} />
    </div>
  );
};
