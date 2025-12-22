import { Card } from '@/shared/components/ui/Card';

/**
 * Card de estatísticas para o Dashboard
 *
 * @param {string} icon - Classe do ícone (ex: 'bi bi-people-fill')
 * @param {string} title - Título do card
 * @param {string|number} value - Valor principal
 * @param {string} label - Texto descritivo abaixo do valor
 * @param {string} color - Cor do ícone e valor (ex: 'text-blue-600')
 * @param {boolean} loading - Se true, mostra '...' no lugar do valor
 */
export const DashboardStatsCard = ({
  icon,
  title,
  value,
  label,
  color = 'text-gray-900',
  loading = false,
}) => {
  return (
    <Card className="p-6">
      <div className={`text-4xl mb-3 ${color}`}>
        <i className={icon}></i>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${color}`}>
        {loading ? '...' : value}
      </p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </Card>
  );
};
