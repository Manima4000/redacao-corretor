/**
 * ProfileInfoCard
 * Responsabilidade: Exibir informações pessoais do usuário
 */
export const ProfileInfoCard = ({ user, isTeacher, onEdit }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          <i className="bi bi-person-circle mr-2"></i>
          Informações Pessoais
        </h2>
        <button
          onClick={onEdit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <i className="bi bi-pencil-square mr-2"></i>
          Editar Perfil
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome Completo */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Nome Completo
          </label>
          <p className="text-lg text-gray-900">{user.fullName}</p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Email
          </label>
          <p className="text-lg text-gray-900">{user.email}</p>
        </div>

        {/* Matrícula (Aluno) ou Especialização (Professor) */}
        {isTeacher ? (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Especialização
            </label>
            <p className="text-lg text-gray-900">
              {user.specialization || 'Não informada'}
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Matrícula
            </label>
            <p className="text-lg text-gray-900">
              {user.enrollmentNumber || 'Não informada'}
            </p>
          </div>
        )}

        {/* Tipo de Usuário */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Tipo de Conta
          </label>
          <p className="text-lg text-gray-900">
            {isTeacher ? (
              <span className="inline-flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                <i className="bi bi-mortarboard-fill mr-2"></i>
                Professor
              </span>
            ) : (
              <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                <i className="bi bi-person-fill mr-2"></i>
                Aluno
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
