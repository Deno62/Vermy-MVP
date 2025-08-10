import { Search, Bell, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface VermyTopBarProps {
  currentModule: string;
  onSearch?: (query: string) => void;
}

export default function VermyTopBar({ currentModule, onSearch }: VermyTopBarProps) {
  return (
    <header className="bg-crm-topbar border-b border-border h-16 flex items-center justify-between px-6 shadow-sm">
      {/* Left section - Current module */}
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-foreground">{currentModule}</h2>
      </div>

      {/* Center section - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            className="pl-10 bg-background border-border"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
            3
          </Badge>
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>

        {/* User Profile */}
        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span className="hidden md:inline text-sm">Admin</span>
        </Button>
      </div>
    </header>
  );
}