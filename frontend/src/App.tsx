import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Projetos from './pages/Projetos';
import Tarefas from './pages/Tarefas';
import Equipe from './pages/Equipe';
import Relatorios from './pages/Relatorios';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projetos" element={<Projetos />} />
          <Route path="/tarefas" element={<Tarefas />} />
          <Route path="/equipe" element={<Equipe />} />
          <Route path="/relatorios" element={<Relatorios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
