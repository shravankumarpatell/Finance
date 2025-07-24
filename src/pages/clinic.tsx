import { useState } from "react";
import Header from "@/components/layout/header";
import Dashboard from "@/components/dashboard";

export default function ClinicPage() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header selectedYear={selectedYear} onYearChange={setSelectedYear} pageType="clinic" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Dashboard selectedYear={selectedYear} pageType="clinic" />
      </main>
    </div>
  );
}