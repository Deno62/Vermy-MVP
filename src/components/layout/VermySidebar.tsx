import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Building2,
  Users,
  Euro,
  Receipt,
  Wrench,
  AlertTriangle,
  FileText,
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import logo from '@/assets/vermy-logo.png';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    description: 'Übersicht'
  },
  {
    title: 'Immobilien',
    url: '/immobilien',
    icon: Building2,
    description: 'Objekte verwalten'
  },
  {
    title: 'Mieter',
    url: '/mieter',
    icon: Users,
    description: 'Mieterverwaltung'
  },
  {
    title: 'Finanzen',
    url: '/finanzen',
    icon: Euro,
    description: 'Buchungen & Zahlungen'
  },
  {
    title: 'Nebenkosten',
    url: '/nebenkosten',
    icon: Receipt,
    description: 'Nebenkostenabrechnungen'
  },
  {
    title: 'Wartung',
    url: '/wartung',
    icon: Wrench,
    description: 'Wartung & Mängel'
  },
  {
    title: 'Mahnwesen',
    url: '/mahnwesen',
    icon: AlertTriangle,
    description: 'Mahnungen & Inkasso'
  },
  {
    title: 'Dokumente',
    url: '/dokumente',
    icon: FileText,
    description: 'Dokumentenverwaltung'
  }
];

interface VermySidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function VermySidebar({ collapsed, onToggle }: VermySidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside
      className={cn(
        'bg-crm-sidebar text-crm-sidebar-foreground transition-all duration-300 flex flex-col h-full border-r border-sidebar-border',
        collapsed ? 'w-16' : 'w-72'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <img src={logo} alt="Vermy Logo – Haus Icon" className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold text-crm-sidebar-foreground">Vermy</h1>
              <p className="text-xs text-crm-sidebar-foreground/70">Immobilien CRM</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="text-crm-sidebar-foreground hover:bg-crm-sidebar-accent p-2"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isItemActive = isActive(item.url);
          
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                'flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group',
                isItemActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-crm-sidebar-foreground hover:bg-crm-sidebar-accent hover:text-crm-sidebar-foreground'
              )}
            >
              <item.icon 
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isItemActive ? 'text-primary-foreground' : 'text-crm-sidebar-foreground/80'
                )} 
              />
              
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className={cn(
                    'text-xs mt-0.5',
                    isItemActive 
                      ? 'text-primary-foreground/80' 
                      : 'text-crm-sidebar-foreground/60'
                  )}>
                    {item.description}
                  </div>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="text-xs text-crm-sidebar-foreground/60 text-center">
            Vermy CRM v1.0<br />
            © 2024 Immobilienverwaltung
          </div>
        )}
      </div>
    </aside>
  );
}