import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Transaction } from '@/components/dashboard';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Get transactions for a specific month and year
const getMonthTransactions = async (
  userId: string,
  year: number,
  month: number,
  pageType: 'home' | 'clinic'
): Promise<Transaction[]> => {
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    where('pageType', '==', pageType),
    where('year', '==', year),
    where('month', '==', month),
    orderBy('date', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Transaction)
  );
};

export const generateMonthlyPDF = async (
  transactions: Transaction[],
  month: number,
  year: number,
  username: string,
  pageType: 'home' | 'clinic'
) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  const pageTitle = pageType === 'home' ? 'Home' : 'Clinic';
  doc.text(`${pageTitle} - ${monthNames[month - 1]} ${year} Transaction Report`, 20, 20);
  
  // User info
  doc.setFontSize(12);
  doc.text(`User: ${username}`, 20, 35);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 42);
  
  // Summary calculations
  const incomeCash = transactions.filter(t => t.type === 'income' && t.category === 'Cash').reduce((sum, t) => sum + t.amount, 0);
  const incomeOnline = transactions.filter(t => t.type === 'income' && t.category === 'Online').reduce((sum, t) => sum + t.amount, 0);
  const expenseCash = transactions.filter(t => t.type === 'expense' && t.category === 'Cash').reduce((sum, t) => sum + t.amount, 0);
  const expenseOnline = transactions.filter(t => t.type === 'expense' && t.category === 'Online').reduce((sum, t) => sum + t.amount, 0);
  
  const totalIncome = incomeCash + incomeOnline;
  const totalExpense = expenseCash + expenseOnline;
  const netAmount = totalIncome - totalExpense;
  
  // Summary table
  autoTable(doc, {
    startY: 55,
    head: [['Category', 'Cash', 'Online', 'Total']],
    body: [
      ['Income', incomeCash.toFixed(2), incomeOnline.toFixed(2), totalIncome.toFixed(2)],
      ['Expense', expenseCash.toFixed(2), expenseOnline.toFixed(2), totalExpense.toFixed(2)],
      ['Net Amount', '', '', netAmount.toFixed(2)]
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
  });
  
  // Transaction details
  if (transactions.length > 0) {
    const tableData = transactions.map(tx => [
      tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
      tx.category,
      tx.detail || '-',
      tx.amount.toFixed(2),
      tx.date.toDate().toLocaleDateString(),
    ]);
    
    // @ts-ignore
    const lastTableY = (doc as any).lastAutoTable?.finalY || 120;
    
    autoTable(doc, {
      startY: lastTableY + 20,
      head: [['Type', 'Method', 'Detail', 'Amount', 'Date']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
    });
  }
  
  // Save the PDF
  const filename = `${pageTitle}_${username.split('@')[0]}_${month.toString().padStart(2, '0')}_${year}.pdf`;
  doc.save(filename);
};

export const generateYearlyPDF = async (
  userId: string,
  year: number,
  username: string,
  pageType: 'home' | 'clinic'
) => {
  try {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    const pageTitle = pageType === 'home' ? 'Home' : 'Clinic';
    doc.text(`${pageTitle} - ${year} Annual Transaction Report`, 20, 20);
    
    // User info
    doc.setFontSize(12);
    doc.text(`User: ${username}`, 20, 35);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 42);
    
    // Process each month
    const monthlySummary = [];
    let allYearTransactions: Transaction[] = [];
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const maxMonth = year === currentYear ? currentMonth : 12;
    
    for (let month = 1; month <= maxMonth; month++) {
      const monthTransactions = await getMonthTransactions(userId, year, month, pageType);
      
      if (monthTransactions.length > 0) {
        // Calculate using the same method as monthly PDF
        const monthIncomeCash = monthTransactions.filter(t => t.type === 'income' && t.category === 'Cash').reduce((sum, t) => sum + t.amount, 0);
        const monthIncomeOnline = monthTransactions.filter(t => t.type === 'income' && t.category === 'Online').reduce((sum, t) => sum + t.amount, 0);
        const monthExpenseCash = monthTransactions.filter(t => t.type === 'expense' && t.category === 'Cash').reduce((sum, t) => sum + t.amount, 0);
        const monthExpenseOnline = monthTransactions.filter(t => t.type === 'expense' && t.category === 'Online').reduce((sum, t) => sum + t.amount, 0);
        
        const monthIncome = monthIncomeCash + monthIncomeOnline;
        const monthExpense = monthExpenseCash + monthExpenseOnline;
        const monthNet = monthIncome - monthExpense;
        
        allYearTransactions = [...allYearTransactions, ...monthTransactions];
        
        monthlySummary.push([
          monthNames[month - 1],
          monthIncome.toFixed(2),
          monthExpense.toFixed(2),
          monthNet.toFixed(2)
        ]);
      }
    }
    
    // Calculate yearly totals using the same method as monthly PDF
    const yearlyIncomeCash = allYearTransactions.filter(t => t.type === 'income' && t.category === 'Cash').reduce((sum, t) => sum + t.amount, 0);
    const yearlyIncomeOnline = allYearTransactions.filter(t => t.type === 'income' && t.category === 'Online').reduce((sum, t) => sum + t.amount, 0);
    const yearlyExpenseCash = allYearTransactions.filter(t => t.type === 'expense' && t.category === 'Cash').reduce((sum, t) => sum + t.amount, 0);
    const yearlyExpenseOnline = allYearTransactions.filter(t => t.type === 'expense' && t.category === 'Online').reduce((sum, t) => sum + t.amount, 0);
    
    const yearlyIncome = yearlyIncomeCash + yearlyIncomeOnline;
    const yearlyExpense = yearlyExpenseCash + yearlyExpenseOnline;
    
    // Annual summary table
    autoTable(doc, {
      startY: 55,
      head: [['Month', 'Income', 'Expense', 'Net']],
      body: monthlySummary,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
    });
    
    // Annual totals
    const totalNet = yearlyIncome - yearlyExpense;
    
    // @ts-ignore
    const lastTableY = (doc as any).lastAutoTable?.finalY || 150;
    
    autoTable(doc, {
      startY: lastTableY + 10,
      head: [['Total Annual Summary', 'Amount']],
      body: [
        ['Total Income', yearlyIncome.toFixed(2)],
        ['Total Expense', yearlyExpense.toFixed(2)],
        ['Net Amount', totalNet.toFixed(2)]
      ],
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
    });
    
    // Detailed transactions by month
    if (allYearTransactions.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Detailed Monthly Transactions', 20, 20);
      
      let currentY = 35;
      
      for (let month = 1; month <= maxMonth; month++) {
        const monthTransactions = allYearTransactions.filter(t => t.month === month);
        
        if (monthTransactions.length > 0) {
          // Check if we need a new page
          if (currentY > 270) {
            doc.addPage();
            currentY = 20;
          }
          
          // Month header
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(`${monthNames[month - 1]} ${year}`, 20, currentY);
          doc.setFont('helvetica', 'normal');
          currentY += 5;
          
          // Calculate month totals using the same corrected method
          const monthIncomeCash = monthTransactions.filter(t => t.type === 'income' && t.category === 'Cash').reduce((sum, t) => sum + t.amount, 0);
          const monthIncomeOnline = monthTransactions.filter(t => t.type === 'income' && t.category === 'Online').reduce((sum, t) => sum + t.amount, 0);
          const monthExpenseCash = monthTransactions.filter(t => t.type === 'expense' && t.category === 'Cash').reduce((sum, t) => sum + t.amount, 0);
          const monthExpenseOnline = monthTransactions.filter(t => t.type === 'expense' && t.category === 'Online').reduce((sum, t) => sum + t.amount, 0);
          
          const monthIncome = monthIncomeCash + monthIncomeOnline;
          const monthExpense = monthExpenseCash + monthExpenseOnline;
          const monthNet = monthIncome - monthExpense;
          
          doc.setFontSize(10);
          doc.text(`Month Total - Income: ${monthIncome.toFixed(2)}, Expense: ${monthExpense.toFixed(2)}, Net: ${monthNet.toFixed(2)}`, 20, currentY);
          currentY += 10;
          
          // Month transactions table
          const monthTableData = monthTransactions.map(tx => [
            tx.date.toDate().toLocaleDateString(),
            tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
            tx.category,
            (tx.detail || '-').substring(0, 20),
            tx.amount.toFixed(2)
          ]);
          
          autoTable(doc, {
            startY: currentY,
            head: [['Date', 'Type', 'Method', 'Detail', 'Amount']],
            body: monthTableData,
            theme: 'striped',
            headStyles: { fillColor: [66, 139, 202] },
            styles: { fontSize: 8 },
            margin: { left: 20, right: 20 },
          });
          
          // @ts-ignore
          currentY = (doc as any).lastAutoTable?.finalY + 15 || currentY + (monthTableData.length * 6) + 30;
        }
      }
    }
    
    // Save the PDF
    const filename = `${pageTitle}_${username.split('@')[0]}_Annual_${year}.pdf`;
    doc.save(filename);
    
  } catch (error) {
    console.error('Error generating yearly PDF:', error);
    throw error;
  }
};

export const generateCustomRangePDF = async (
  userId: string,
  fromDate: Date,
  toDate: Date,
  username: string,
  pageType: 'home' | 'clinic'
) => {
  try {
    // Get all transactions within the date range
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      where('pageType', '==', pageType),
      where('date', '>=', Timestamp.fromDate(fromDate)),
      where('date', '<=', Timestamp.fromDate(new Date(toDate.getTime() + 24 * 60 * 60 * 1000))), // Include end date
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const transactions = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Transaction)
    );

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    const pageTitle = pageType === 'home' ? 'Home' : 'Clinic';
    doc.text(`${pageTitle} - Custom Report`, 20, 20);
    
    // User info and date range
    doc.setFontSize(12);
    doc.text(`User: ${username}`, 20, 35);
    doc.text(`Date Range: ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`, 20, 42);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 49);
    
    // Summary calculations
    const incomeCash = transactions.filter(t => t.type === 'income' && t.category === 'Cash').reduce((sum, t) => sum + t.amount, 0);
    const incomeOnline = transactions.filter(t => t.type === 'income' && t.category === 'Online').reduce((sum, t) => sum + t.amount, 0);
    const expenseCash = transactions.filter(t => t.type === 'expense' && t.category === 'Cash').reduce((sum, t) => sum + t.amount, 0);
    const expenseOnline = transactions.filter(t => t.type === 'expense' && t.category === 'Online').reduce((sum, t) => sum + t.amount, 0);
    
    const totalIncome = incomeCash + incomeOnline;
    const totalExpense = expenseCash + expenseOnline;
    const netAmount = totalIncome - totalExpense;
    
    // Summary table
    autoTable(doc, {
      startY: 62,
      head: [['Category', 'Cash', 'Online', 'Total']],
      body: [
        ['Income', incomeCash.toFixed(2), incomeOnline.toFixed(2), totalIncome.toFixed(2)],
        ['Expense', expenseCash.toFixed(2), expenseOnline.toFixed(2), totalExpense.toFixed(2)],
        ['Net Amount', '', '', netAmount.toFixed(2)]
      ],
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
    });
    
    // Transaction details
    if (transactions.length > 0) {
      const tableData = transactions.map(tx => [
        tx.date.toDate().toLocaleDateString(),
        tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
        tx.category,
        (tx.detail || '-').substring(0, 20),
        tx.amount.toFixed(2)
      ]);
      
      // @ts-ignore
      const lastTableY = (doc as any).lastAutoTable?.finalY || 130;
      
      autoTable(doc, {
        startY: lastTableY + 20,
        head: [['Date', 'Type', 'Method', 'Detail', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 9 },
      });
    }
    
    // Save the PDF
    const fromDateStr = fromDate.toLocaleDateString().replace(/\//g, '-');
    const toDateStr = toDate.toLocaleDateString().replace(/\//g, '-');
    const filename = `${pageTitle}_${username.split('@')[0]}_Custom_${fromDateStr}_to_${toDateStr}.pdf`;
    doc.save(filename);
    
  } catch (error) {
    console.error('Error generating custom range PDF:', error);
    throw error;
  }
};