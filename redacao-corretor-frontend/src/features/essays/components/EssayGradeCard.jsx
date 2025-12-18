/**
 * Card de exibição de nota da redação
 *
 * Responsabilidade Única (SRP):
 * - Apenas exibe a nota de forma visual
 * - Mostra badge de desempenho baseado na nota
 *
 * @param {Object} props
 * @param {number} props.grade - Nota da redação (0-10)
 */
export const EssayGradeCard = ({ grade }) => {
  if (grade === null || grade === undefined) return null;

  /**
   * Determina badge de desempenho baseado na nota
   */
  const getPerformanceBadge = () => {
    if (grade >= 9) {
      return {
        icon: 'bi-star-fill',
        label: 'Excelente',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
      };
    }
    if (grade >= 7) {
      return {
        icon: 'bi-emoji-smile',
        label: 'Bom',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
      };
    }
    if (grade >= 5) {
      return {
        icon: 'bi-emoji-neutral',
        label: 'Regular',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
      };
    }
    return {
      icon: 'bi-arrow-up-circle',
      label: 'Precisa melhorar',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
    };
  };

  const badge = getPerformanceBadge();
  const formattedGrade = typeof grade === 'number' ? grade.toFixed(1) : grade;

  return (
    <div className="bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 md:w-64 shrink-0">
      <div className="text-center">
        <p className="text-sm font-medium text-blue-700 uppercase tracking-wide mb-2">
          Nota
        </p>
        <div className="flex items-center justify-center gap-1">
          <span className="text-5xl font-bold text-blue-900">
            {formattedGrade}
          </span>
          <span className="text-2xl text-blue-600 mt-2">/10</span>
        </div>
        <div className="mt-3 flex justify-center">
          <span className={`inline-flex items-center gap-1 text-xs ${badge.bgColor} ${badge.textColor} px-2 py-1 rounded-full`}>
            <i className={`bi ${badge.icon}`}></i>
            {badge.label}
          </span>
        </div>
      </div>
    </div>
  );
};
