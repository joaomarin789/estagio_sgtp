import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const margin = collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-w)';

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="main-area" style={{ marginLeft: margin }}>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
