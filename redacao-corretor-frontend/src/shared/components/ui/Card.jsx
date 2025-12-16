/**
 * Componente Card reutilizável
 * Container com sombra e bordas arredondadas
 */
export const Card = ({ children, className = '', onClick }) => {
  const baseStyles = 'bg-white rounded-lg shadow-md transition-shadow';
  const clickableStyles = onClick ? 'cursor-pointer hover:shadow-lg' : '';

  return (
    <div
      className={`${baseStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
