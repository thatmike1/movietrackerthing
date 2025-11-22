'use client';

import { useAppStore, UserMode } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { User, Users, Heart } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ModeToggle() {
  const { mode, setMode } = useAppStore();

  const modes: { value: UserMode; label: string; icon: any }[] = [
    { value: 'ME', label: 'Just Me', icon: User },
    { value: 'GIRLFRIEND', label: 'Girlfriend', icon: Heart },
    { value: 'TOGETHER', label: 'Together', icon: Users },
  ];

  const currentMode = modes.find((m) => m.value === mode) || modes[0];
  const Icon = currentMode.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {currentMode.label}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {modes.map((m) => (
          <DropdownMenuItem key={m.value} onClick={() => setMode(m.value)}>
            <m.icon className="mr-2 h-4 w-4" />
            <span>{m.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
