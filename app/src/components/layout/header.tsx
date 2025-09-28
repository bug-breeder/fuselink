import { Zap } from 'lucide-react';
import { ThemeToggle } from '../theme-toggle';

export function Header() {
  return (
    <header className="bg-transparent">
      <div className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">FuseLink</h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
