import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import Dashboard from "@/components/dashboard";
import { useWorkplaces } from "@/hooks/use-workplaces";

export default function MainDashboardPage() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const { currentWorkplace, refreshTrigger } = useWorkplaces();

  // Reset date and month selections when workplace changes
  useEffect(() => {
    console.log('Workplace changed, resetting selections'); // Debug log
    setSelectedDate(null);
    setSelectedMonth(null);
  }, [currentWorkplace?.id, refreshTrigger]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header selectedYear={selectedYear} onYearChange={setSelectedYear} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {currentWorkplace ? (
          <Dashboard 
            key={`${currentWorkplace.id}-${refreshTrigger}`} // Include refresh trigger in key
            selectedYear={selectedYear} 
            workplaceId={currentWorkplace.id}
            workplaceName={currentWorkplace.name}
            selectedDate={selectedDate}
            selectedMonth={selectedMonth}
            onDateChange={setSelectedDate}
          />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h3 className="text-lg font-medium">Loading...</h3>
              <p className="text-muted-foreground">Setting up your workspace...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}