import { useState } from "react";
import Header from "@/components/layout/header";
import Dashboard from "@/components/dashboard";

export default function HomePage() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header selectedYear={selectedYear} onYearChange={setSelectedYear} pageType="home" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Dashboard 
          selectedYear={selectedYear} 
          pageType="home" 
          selectedDate={selectedDate}
          selectedMonth={selectedMonth}
          onDateChange={setSelectedDate}
        />
      </main>
    </div>
  );
}