import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const generateThreatReport = async (elementId = 'exportable-dashboard') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return false;
  }

  try {
    // Temporarily adjust styles for better PDF rendering
    const originalHeight = element.style.height;
    const originalOverflow = element.style.overflow;
    element.style.height = 'max-content';
    element.style.overflow = 'visible';

    const canvas = await html2canvas(element, {
      scale: 1.5, // Good balance of quality and size
      useCORS: true,
      backgroundColor: '#0a0a0b', // GANBIDS background color
      logging: false,
      ignoreElements: (el) => el.classList.contains('sidebar') || el.classList.contains('topbar')
    });

    // Restore styles
    element.style.height = originalHeight;
    element.style.overflow = originalOverflow;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Export to A4 Landscape
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate aspect ratio to fit image inside PDF cleanly without stretching
    const canvasRatio = canvas.width / canvas.height;
    
    let finalWidth = pdfWidth;
    let finalHeight = pdfWidth / canvasRatio;
    
    if (finalHeight > pdfHeight) {
      finalHeight = pdfHeight;
      finalWidth = pdfHeight * canvasRatio;
    }

    // Center image on the page
    const x = (pdfWidth - finalWidth) / 2;
    const y = (pdfHeight - finalHeight) / 2;

    pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
    pdf.save(`GANBIDS_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    return true;
  } catch (err) {
    console.error("PDF Generation Failed: ", err);
    return false;
  }
};
