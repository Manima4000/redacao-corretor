import { AppRouter } from './app/router/AppRouter';
import { ToastContainer } from '@/shared/components/ui/ToastContainer';
import './App.css';

function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer />
    </>
  );
}

export default App;
