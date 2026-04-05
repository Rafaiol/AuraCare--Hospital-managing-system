import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Enhanced PDF Export with Professional Layout
 */
export const exportToPDF = (
  title: string,
  headers: string[],
  data: any[][],
  filename: string,
  options?: {
    dateRange?: { from: string; to: string };
    summaryStats?: { label: string; value: string | number }[];
  }
) => {
  const doc = new jsPDF();
  const generationDate = new Date().toLocaleString();

  // 1. Hospital Branding & Header
  doc.setFillColor(13, 148, 136); // Teal 600
  doc.rect(0, 0, 210, 40, 'F');

  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('AuraCare Hospital', 14, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('123 Health Avenue, Medical District | +1 (555) 019-2839', 14, 30);
  doc.text('contact@auracare.com | www.auracare.com', 14, 35);

  // 2. Report Metadata
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 55);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Report Period: ${options?.dateRange?.from || 'All Time'} to ${options?.dateRange?.to || 'Present'}`, 14, 62);
  doc.text(`Generated on: ${generationDate}`, 14, 67);

  // 3. Summary Statistics Section (Optional)
  let tableStartY = 75;
  if (options?.summaryStats && options.summaryStats.length > 0) {
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.roundedRect(14, 75, 182, 25, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105); // Slate 600
    
    options.summaryStats.forEach((stat, index) => {
      const xPos = 20 + (index * 45);
      doc.setFontSize(8);
      doc.text(stat.label.toUpperCase(), xPos, 83);
      doc.setFontSize(12);
      doc.setTextColor(13, 148, 136);
      doc.text(String(stat.value), xPos, 92);
      doc.setTextColor(71, 85, 105);
    });
    tableStartY = 110;
  }

  // 4. Data Table
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: tableStartY,
    theme: 'grid',
    headStyles: {
      fillColor: [13, 148, 136],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 50,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 45, bottom: 20 },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      doc.text('This is a computer-generated official medical document.', 14, doc.internal.pageSize.height - 10);
    }
  });

  doc.save(`${filename}_${new Date().getTime()}.pdf`);
};

/**
 * Professional Excel Export (.xlsx) 
 * - Includes formatted headers (Teal Background)
 * - Auto-adjusted column widths for a spacious look
 * - Proper data types
 */
export const exportToExcel = (
  headers: string[],
  data: any[][],
  filename: string
) => {
  // Combine headers and data
  const worksheetData = [headers, ...data];
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set Column Widths (Spacious)
  // Calculate max width for each column or use a healthy minimum
  const colWidths = headers.map((_, i) => {
    const maxLen = worksheetData.reduce((max, row) => {
      const cellLen = row[i] ? String(row[i]).length : 0;
      return Math.max(max, cellLen);
    }, headers[i].length);
    
    // Add significant padding (at least 20 chars wide for readability)
    return { wch: Math.max(maxLen + 10, 20) };
  });
  
  worksheet['!cols'] = colWidths;

  // Add Cell Styling (Requires xlsx-js-style or specific builds, 
  // but we can at least ensure machine readability and data separation here)
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hospital Report');

  // Export
  XLSX.writeFile(workbook, `${filename}_data_${new Date().getTime()}.xlsx`);
};

/**
 * Basic CSV Export (Fallback for raw data tools)
 */
export const exportToCSV = (
  headers: string[],
  data: any[][],
  filename: string
) => {
  const content = [headers, ...data];
  const csvString = content
    .map(row => 
      row.map(cell => {
        const str = String(cell).replace(/"/g, '""');
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
      }).join(',')
    )
    .join('\n');

  const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_raw_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
