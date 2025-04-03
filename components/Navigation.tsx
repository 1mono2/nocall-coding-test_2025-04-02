'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const pathname = usePathname();

  const navItems = [
    { name: '顧客一覧', href: '/' },
    { name: 'コール一覧', href: '/calls' },
  ];

  return (
    <nav className="bg-slate-100 p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="font-bold text-xl">AIコール管理システム</div>
        <div className="flex gap-6">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                'hover:text-blue-700 transition-colors',
                pathname === item.href ? 'font-semibold text-blue-600' : 'text-gray-600'
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
