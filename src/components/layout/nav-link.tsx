'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export default function NavLink({ href, children, icon: Icon, className }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center transition-colors hover:text-primary',
        isActive ? 'text-primary font-semibold' : 'text-muted-foreground',
        className
      )}
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </Link>
  );
}
