import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';

/**
 * Modal para criar nova tarefa
 *
 * Responsabilidades:
 * - Coletar dados da tarefa (título, descrição, prazo)
 * - Validar campos obrigatórios
 * - Chamar callback onCreate com os dados
 *
 * Segue SOLID:
 * - SRP: Apenas UI do formulário de criação
 * - Validação local, lógica de criação delegada ao parent
 */
export const CreateTaskModal = ({ isOpen, onClose, onCreate, isLoading, classId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  /**
   * Handler para submit do formulário
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validar campos obrigatórios
    if (!title.trim()) {
      setError('Título é obrigatório');
      return;
    }

    if (title.trim().length < 3) {
      setError('Título deve ter pelo menos 3 caracteres');
      return;
    }

    if (!description.trim()) {
      setError('Descrição é obrigatória');
      return;
    }

    if (description.trim().length < 10) {
      setError('Descrição deve ter pelo menos 10 caracteres');
      return;
    }

    if (!deadline) {
      setError('Prazo é obrigatório');
      return;
    }

    // Validar que deadline é no futuro
    const deadlineDate = new Date(deadline);
    const now = new Date();

    if (deadlineDate <= now) {
      setError('Prazo deve ser uma data futura');
      return;
    }

    // Chamar callback de criação
    onCreate({
      title: title.trim(),
      description: description.trim(),
      deadline: deadlineDate.toISOString(),
      classIds: [classId], // Array com o ID da turma atual
    });
  };

  /**
   * Handler para fechar modal (reseta campos)
   */
  const handleClose = () => {
    if (!isLoading) {
      setTitle('');
      setDescription('');
      setDeadline('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Nova Tarefa</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo de Título */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Título da Tarefa <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Ex: Redação sobre Aquecimento Global"
              maxLength={255}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Dê um título claro e objetivo para a tarefa
            </p>
          </div>

          {/* Campo de Descrição */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição / Tema <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Descreva o tema da redação, orientações, critérios de avaliação, etc."
            />
            <p className="text-xs text-gray-500 mt-1">
              Forneça instruções claras sobre o que os alunos devem fazer
            </p>
          </div>

          {/* Campo de Prazo */}
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
              Prazo de Entrega <span className="text-red-500">*</span>
            </label>
            <input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Data e hora limite para os alunos enviarem suas redações
            </p>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <i className="bi bi-exclamation-circle"></i>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-plus-circle"></i>
                  <span>Criar Tarefa</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Informação Adicional */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-2 text-sm text-blue-800">
            <i className="bi bi-info-circle shrink-0 mt-0.5"></i>
            <p>
              Ao criar a tarefa, <strong>todos os alunos da turma</strong> receberão automaticamente
              e poderão enviar suas redações até o prazo definido.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
