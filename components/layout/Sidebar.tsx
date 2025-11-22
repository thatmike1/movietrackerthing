'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Tv, Settings, Heart, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ModeToggle';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/add', label: 'Add Content', icon: Plus },
  { href: '/movies', label: 'Movies', icon: Film },
  { href: '/series', label: 'Series', icon: Tv },
  { href: '/recommendations', label: 'For You', icon: Heart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card text-card-foreground">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight text-primary">MovieTracker</h1>
      </div>
      
      <div className="px-4 pb-4">
        <ModeToggle />
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start gap-3', isActive && 'bg-secondary')}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
