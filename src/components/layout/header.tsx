import { Link, useLocation } from 'react-router-dom';
import { Wallet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { generateYearlyPDF } from '@/lib/pdf-generator';

interface HeaderProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  pageType: 'home' | 'clinic'; // Add pageType prop
}

export default function Header({ selectedYear, onYearChange, pageType }: HeaderProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isDownloading, setIsDownloading] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear];

  const handleYearlyDownload = async () => {
    if (!user) return;
    
    setIsDownloading(true);
    try {
      await generateYearlyPDF(user.uid, selectedYear, user.email || 'user', pageType);
    } catch (error) {
      console.error('Error generating yearly PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          to="/home"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Wallet className="h-6 w-6" />
          <span className="sr-only">FinTrack</span>
        </Link>
        <Link
          to="/home"
          className={`transition-colors hover:text-foreground ${
            location.pathname === '/home' ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          Home
        </Link>
        <Link
          to="/clinic"
          className={`transition-colors hover:text-foreground ${
            location.pathname === '/clinic' ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          Clinic
        </Link>
      </nav>
      
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        {/* Year Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {selectedYear}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {years.map((year) => (
              <DropdownMenuItem
                key={year}
                onClick={() => onYearChange(year)}
                className={selectedYear === year ? 'bg-accent' : ''}
              >
                {year} {year === currentYear ? '(Current)' : '(Previous)'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Yearly Download */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleYearlyDownload}
          disabled={isDownloading}
        >
          <Download className="h-4 w-4 mr-2" />
          {isDownloading ? 'Downloading...' : `Download ${selectedYear}`}
        </Button>

        <div className="ml-auto flex-1 sm:flex-initial">
          {user && <p className="text-sm text-muted-foreground">Welcome, {user.email}</p>}
        </div>
        <ThemeToggle />
        <Button onClick={signOut}>Logout</Button>
      </div>
    </header>
  );
}