import { IoFlash } from 'react-icons/io5';
import { ThemeToggle } from '../theme-toggle';

interface HeaderProps {
  children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <IoFlash className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">FuseLink</h1>
        </div>
        <div className="flex items-center gap-3">
          {children}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
