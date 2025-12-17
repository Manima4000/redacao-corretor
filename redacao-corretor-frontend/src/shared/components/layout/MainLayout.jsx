import { Sidebar } from './Sidebar';

/**
 * MainLayout - Layout principal com Sidebar
 * Usado em todas as páginas privadas
 */
export const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
};
