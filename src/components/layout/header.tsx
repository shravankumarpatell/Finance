import { Wallet, Download, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { generateYearlyPDF } from '@/lib/pdf-generator';
import CustomReportDialog from '@/components/CustomReportDialog';
import { useWorkplaces } from '@/hooks/use-workplaces';
import AddWorkplaceDialog from '@/components/AddWorkplaceDialog';

interface HeaderProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export default function Header({ selectedYear, onYearChange }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { workplaces, currentWorkplace, switchWorkplace } = useWorkplaces();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCustomReport, setShowCustomReport] = useState(false);
  const [showAddWorkplace, setShowAddWorkplace] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear];

  const handleYearlyDownload = async () => {
    if (!user || !currentWorkplace) return;
    
    setIsDownloading(true);
    try {
      await generateYearlyPDF(user.uid, selectedYear, user.email || 'user', currentWorkplace.id);
    } catch (error) {
      console.error('Error generating yearly PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <div className="flex items-center gap-2 text-lg font-semibold md:text-base">
            <Wallet className="h-6 w-6" />
            <span className="sr-only">FinTrack</span>
          </div>
          
          {/* Workplace Selector */}
          {currentWorkplace && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-foreground hover:text-foreground">
                  {currentWorkplace.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                  Your Workplaces
                </div>
                <DropdownMenuSeparator />
                {workplaces.map((workplace) => (
                  <DropdownMenuItem
                    key={workplace.id}
                    onClick={() => {
                      if (workplace.id !== currentWorkplace.id) {
                        console.log('Header: Switching to', workplace.name);
                        switchWorkplace(workplace);
                        // Force page reload after short delay
                        setTimeout(() => {
                          console.log('Forcing page reload...');
                          window.location.reload();
                        }, 200);
                      }
                    }}
                    className={currentWorkplace.id === workplace.id ? 'bg-accent' : ''}
                  >
                    {workplace.name}
                    {currentWorkplace.id === workplace.id && (
                      <span className="ml-auto text-xs">Current</span>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowAddWorkplace(true)}
                  className="text-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Workplace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
        
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          {/* Manual Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('Manual refresh triggered');
              window.location.reload();
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

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

          {/* Download Options - Only show if workplace is selected */}
          {currentWorkplace && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDownloading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleYearlyDownload}>
                  Annual Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCustomReport(true)}>
                  Custom Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="ml-auto flex-1 sm:flex-initial">
            {user && (
              <p className="text-sm text-muted-foreground">
                Welcome, {user.displayName || user.email || 'User'}
              </p>
            )}
          </div>
          <ThemeToggle />
          <Button onClick={signOut}>Logout</Button>
        </div>
      </header>

      {/* Custom Report Dialog */}
      {currentWorkplace && (
        <CustomReportDialog 
          open={showCustomReport}
          onOpenChange={setShowCustomReport}
          workplaceId={currentWorkplace.id}
          selectedYear={selectedYear}
        />
      )}

      {/* Add Workplace Dialog */}
      <AddWorkplaceDialog 
        open={showAddWorkplace}
        onOpenChange={setShowAddWorkplace}
      />
    </>
  );
}