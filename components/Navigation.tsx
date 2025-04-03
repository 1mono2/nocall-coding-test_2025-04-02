'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeSwitch } from './ThemeSwitch';

const Navigation = () => {
  const pathname = usePathname();

  const navItems = [
    { name: '顧客一覧', href: '/' },
    { name: 'コール一覧', href: '/calls' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-950 border-b p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="font-bold text-xl dark:text-white">AIコール管理システム</div>
        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                'hover:text-blue-700 dark:hover:text-blue-400 transition-colors',
                pathname === item.href 
                  ? 'font-semibold text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300'
              )}
            >
              {item.name}
            </Link>
          ))}
          <ThemeSwitch />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
