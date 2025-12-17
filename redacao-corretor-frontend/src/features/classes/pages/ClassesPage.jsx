import { useState } from 'react';
import { useClasses } from '../hooks/useClasses';
import { classService } from '../services/classService';
import { ClassCard } from '../components/ClassCard';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const ClassesPage = () => {
  const { classes, isLoading, error, refetch } = useClasses();
  const { isTeacher } = useAuth();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);

    try {
      await classService.createClass(formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      refetch();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Erro ao criar turma');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Turmas</h1>
          <p className="text-gray-600 mt-1">
            {classes.length} turma{classes.length !== 1 ? 's' : ''} cadastrada{classes.length !== 1 ? 's' : ''}
          </p>
        </div>

        {isTeacher() && (
          <Button onClick={() => setShowCreateModal(true)}>
            + Nova Turma
          </Button>
        )}
      </div>

      {/* Grid */}
      {classes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 text-lg">Nenhuma turma encontrada</p>
          {isTeacher() && (
            <Button onClick={() => setShowCreateModal(true)} className="mt-4">
              Criar Primeira Turma
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <ClassCard key={classItem.id} classData={classItem} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Nova Turma</h2>

            {createError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Turma
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Turma AFA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Descrição da turma"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', description: '' });
                    setCreateError(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" isLoading={isCreating}>
                  Criar Turma
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
