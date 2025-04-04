'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Phone, Menu, X } from 'lucide-react';
import { ThemeSwitch } from './ThemeSwitch';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: '顧客一覧', href: '/', icon: Home },
    { name: 'コール一覧', href: '/calls', icon: Phone },
  ];

  return (
    <Sidebar collapsible="icon" className="min-w-[4rem] transition-all duration-300 ease-in-out">
      <SidebarHeader className="p-6 border-b">
        <div className="flex">
          <SidebarTrigger/>
          <div className="pl-2 font-bold text-xl whitespace-nowrap overflow-hidden transition-all duration-300">nocall.ai</div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.href}
                className="flex items-center justify-start transition-all duration-300 ease-in-out"
              >
                <Link href={item.href}>
                  <item.icon className="h-6 w-6 min-w-[1.5rem] transition-transform duration-300" />
                  <span className="ml-1 whitespace-nowrap transition-opacity duration-300">{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-5 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden transition-all duration-300">© 2025 AI管理</span>
          <div className="flex justify-end items-center transition-all duration-300">
            <ThemeSwitch />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
