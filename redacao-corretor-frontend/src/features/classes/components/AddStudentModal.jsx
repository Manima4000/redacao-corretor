import { useEffect } from 'react';
import { useStudentSearch } from '@/features/students/hooks/useStudentSearch';
import { Button } from '@/shared/components/ui/Button';

export const AddStudentModal = ({ isOpen, onClose, onAddStudent }) => {
  const { 
    query, 
    setQuery, 
    students, 
    isLoading, 
    reset 
  } = useStudentSearch();

  // Reseta a busca quando o modal é fechado
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Adicionar Aluno</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pesquisar Aluno
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite o nome do aluno..."
              autoFocus
            />
            <i className="bi bi-search absolute left-3 top-2.5 text-gray-400"></i>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Digite pelo menos 3 caracteres para pesquisar.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto min-h-50">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : students.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {students.map((student) => (
                <li key={student.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{student.fullName}</p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                    {student.classId && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                        Já possui turma
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={student.classId ? "secondary" : "primary"}
                    disabled={!!student.classId}
                    onClick={() => onAddStudent(student.id)}
                  >
                    {student.classId ? 'Indisponível' : 'Adicionar'}
                  </Button>
                </li>
              ))}
            </ul>
          ) : query.length >= 3 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum aluno encontrado.
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <i className="bi bi-people text-4xl mb-2 block"></i>
              Comece a digitar para encontrar alunos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
