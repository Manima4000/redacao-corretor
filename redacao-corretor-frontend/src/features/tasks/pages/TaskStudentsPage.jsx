import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskStudents } from '../hooks/useTaskStudents';
import { StudentListItem } from '../components/StudentListItem';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Button } from '@/shared/components/ui/Button';

/**
 * Página que exibe alunos de uma tarefa com status de entrega
 * Segue SRP - apenas exibe lista de alunos
 */
export const TaskStudentsPage = () => {
  const { classId, taskId } = useParams();
  const navigate = useNavigate();

  const { task, students, stats, pagination, page, setPage, isLoading, error } = useTaskStudents(taskId);

  // Scroll para o topo quando mudar de página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 mt-8">
        <p>{error}</p>
        <Button
          onClick={() => navigate(`/classes/${classId}`)}
          variant="outline"
          className="mt-4"
        >
          Voltar
        </Button>
      </div>
    );
  }

  // Separar alunos
  const submitted = students.filter((s) => s.hasSubmitted);
  const notSubmitted = students.filter((s) => !s.hasSubmitted);

  return (
    <div className="space-y-6 pb-12">
      {/* Navegação */}
      <div>
        <Button
          variant="outline"
          onClick={() => navigate(`/classes/${classId}`)}
          className="flex items-center gap-2 text-gray-600"
        >
          <span><i className="bi bi-arrow-left"></i></span> Voltar para Tarefas
        </Button>
      </div>

      {/* Header da Tarefa */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
        <p className="text-gray-600 mt-2 leading-relaxed">{task.description}</p>

        {task.deadline && (
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
            <span><i className="bi bi-calendar-event"></i></span>
            <span>
              Prazo: {new Date(task.deadline).toLocaleDateString('pt-BR')} às{' '}
              {new Date(task.deadline).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total de Alunos</div>
          </div>

          <div className="bg-green-50 p-5 rounded-lg shadow-sm border border-green-100">
            <div className="text-2xl font-bold text-green-700">{stats.submitted}</div>
            <div className="text-sm text-green-600 mt-1">Entregas Realizadas</div>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-gray-700">{stats.notSubmitted}</div>
            <div className="text-sm text-gray-600 mt-1">Pendentes</div>
          </div>

          <div className="bg-blue-50 p-5 rounded-lg shadow-sm border border-blue-100">
            <div className="text-2xl font-bold text-blue-700">{stats.submissionRate}%</div>
            <div className="text-sm text-blue-600 mt-1">Taxa de Entrega</div>
          </div>
        </div>
      )}

      {/* Lista de Alunos que Entregaram */}
      {submitted.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-gray-800">
            <i className="bi bi-check-circle-fill"></i> Entregas Realizadas ({submitted.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {submitted.map((student) => (
              <StudentListItem key={student.id} student={student} />
            ))}
          </div>
        </div>
      )}

      {/* Lista de Alunos Pendentes */}
      {notSubmitted.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-gray-800">
            <i className="bi bi-hourglass-split"></i> Pendentes ({notSubmitted.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {notSubmitted.map((student) => (
              <StudentListItem key={student.id} student={student} />
            ))}
          </div>
        </div>
      )}

      {/* Mensagem se não houver alunos */}
      {students.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            Nenhum aluno matriculado nesta turma.
          </p>
        </div>
      )}

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pb-8 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2"
          >
            <i className="bi bi-chevron-left"></i> Anterior
          </Button>
          <span className="text-gray-600 font-medium">
            Página {page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="flex items-center gap-2"
          >
            Próxima <i className="bi bi-chevron-right"></i>
          </Button>
        </div>
      )}
    </div>
  );
};
