/**
 * SecurityCard
 * Responsabilidade: Exibir opções de segurança (mudar senha)
 */
export const SecurityCard = ({ onChangePassword }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            <i className="bi bi-shield-lock mr-2"></i>
            Segurança
          </h2>
          <p className="text-gray-600">
            Mantenha sua conta segura alterando sua senha regularmente
          </p>
        </div>
        <button
          onClick={onChangePassword}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
        >
          <i className="bi bi-key-fill mr-2"></i>
          Alterar Senha
        </button>
      </div>
    </div>
  );
};
