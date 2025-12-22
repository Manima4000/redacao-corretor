/**
 * ClassesListCard
 * Responsabilidade: Exibir lista de turmas do usuário
 */
export const ClassesListCard = ({ classes, isTeacher }) => {
  if (!classes || classes.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        <i className="bi bi-people-fill mr-2"></i>
        {isTeacher ? 'Minhas Turmas' : 'Minha Turma'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((classItem) => (
          <div
            key={classItem.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {classItem.name}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {classItem.description || 'Sem descrição'}
            </p>
            <p className="text-xs text-gray-500">
              <i className="bi bi-calendar3 mr-1"></i>
              Criada em {new Date(classItem.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
