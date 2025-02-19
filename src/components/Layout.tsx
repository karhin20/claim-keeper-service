import { ReactNode } from 'react';
import { UserMenu } from "./UserMenu";
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/dashboard" className="font-bold text-xl text-primary">
            ClaimsGH
          </Link>
          <UserMenu />
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
} 