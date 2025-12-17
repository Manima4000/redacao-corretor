import { useNavigate } from 'react-router-dom';
import { Card } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';

/**
 * Componente para exibir um aluno na lista
 * Segue SRP - apenas exibe dados de um aluno
 */
export const StudentListItem = ({ student }) => {
  const navigate = useNavigate();
  const getStatusBadge = () => {
    if (!student.hasSubmitted) {
      return (
        <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200">
          <i className="bi bi-hourglass-split"></i> Pendente
        </span>
      );
    }

    const statusMap = {
      pending: {
        label: <><i className="bi bi-file-earmark-text-fill"></i> Enviado</>,
        className: 'bg-blue-100 text-blue-700 border-blue-200',
      },
      correcting: {
        label: <><i className="bi bi-pencil-fill"></i> Corrigindo</>,
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      },
      corrected: {
        label: <><i className="bi bi-check-circle-fill"></i> Corrigido</>,
        className: 'bg-green-100 text-green-700 border-green-200',
      },
    };

    const status = statusMap[student.essay?.status] || statusMap.pending;

    return (
      <span className={`px-3 py-1.5 text-xs font-medium rounded-full border ${status.className}`}>
        {status.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);

    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      console.error('Data inválida:', dateString);
      return 'Data inválida';
    }

    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-lg font-semibold text-blue-600">
                {student.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{student.fullName}</h4>
              <p className="text-sm text-gray-500">{student.email}</p>
              {student.enrollmentNumber && (
                <p className="text-xs text-gray-400">Matrícula: {student.enrollmentNumber}</p>
              )}
            </div>
          </div>

          {student.hasSubmitted && student.essay?.submittedAt && (
            <div className="mt-3 text-xs text-gray-600 flex items-center gap-2">
              <span><i className="bi bi-calendar-event"></i></span>
              <span>Enviado em: {formatDate(student.essay.submittedAt)}</span>
            </div>
          )}

          {student.essay?.correctedAt && (
            <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
              <span><i className="bi bi-check-circle-fill"></i></span>
              <span>Corrigido em: {formatDate(student.essay.correctedAt)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge()}

          {/* Botão Corrigir - apenas se o aluno enviou a redação */}
          {student.hasSubmitted && student.essay?.id && (
            <Button
              onClick={() => navigate(`/essays/${student.essay.id}/correct`)}
              variant={student.essay.status === 'corrected' ? 'secondary' : 'primary'}
              size="sm"
            >
              {student.essay.status === 'corrected' ? (
                <>
                  <i className="bi bi-eye-fill"></i> Ver Correção
                </>
              ) : (
                <>
                  <i className="bi bi-pencil-fill"></i> Corrigir
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
