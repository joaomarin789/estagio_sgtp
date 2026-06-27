import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Waves,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Painel' },
  { to: '/projetos', icon: FolderKanban, label: 'Projetos' },
  { to: '/tarefas', icon: ClipboardList, label: 'Tarefas' },
  { to: '/equipe', icon: Users, label: 'Equipe' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
];

const team = ['AC', 'CM', 'MS', 'RA', 'FL'];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon"><Waves size={18} /></div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <h2>SGTP</h2>
            <span>Gestão Operacional</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {!collapsed && <div className="sidebar-section">Módulos</div>}
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon size={17} />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar-online">
          <label>Online agora</label>
          <div className="online-avatars">
            {team.map((t) => (
              <div key={t} className="online-avatar">{t}</div>
            ))}
          </div>
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">JP</div>
            <div className="sidebar-user-info">
              <strong>João Pedro</strong>
              <span>Coordenador</span>
            </div>
          </div>
        </div>
      )}

      <div className="sidebar-footer">
        <button type="button" className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>
    </aside>
  );
}
