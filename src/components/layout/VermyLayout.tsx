import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import VermySidebar from './VermySidebar';
import VermyTopBar from './VermyTopBar';

interface VermyLayoutProps {
  currentModule: string;
}

export default function VermyLayout({ currentModule }: VermyLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSearch = (query: string) => {
    // TODO: Implement global search functionality
    console.log('Searching for:', query);
  };

  return (
    <div className="h-screen flex bg-background">
      <VermySidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <VermyTopBar 
          currentModule={currentModule} 
          onSearch={handleSearch}
        />
        
        <main className="flex-1 bg-crm-content overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}