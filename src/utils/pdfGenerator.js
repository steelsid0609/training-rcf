import { jsPDF } from "jspdf";

// Helper to format dates
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
};

export const generateApprovalLetterPDF = (student, approvalDetails) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // --- HEADER ---
  doc.setFontSize(20);
  doc.setTextColor(0, 100, 0); // RCF Green
  doc.setFont("helvetica", "bold");
  doc.text("RASHTRIYA CHEMICALS AND FERTILIZERS LTD.", pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text("Human Resource Development Department | Training Center", pageWidth / 2, 28, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(15, 32, pageWidth - 15, 32);

  // --- META ---
  let currentY = 45;
  doc.setFontSize(11);
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - 20, currentY, { align: "right" });
  doc.text(`Ref: APP/${new Date().getFullYear()}/${student.id.substring(0,6).toUpperCase()}`, 20, currentY);

  // --- RECIPIENT ---
  currentY += 15;
  doc.setFont("helvetica", "bold");
  doc.text(`To,`, 20, currentY);
  currentY += 6;
  doc.text(`${student.studentName}`, 20, currentY);
  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.text(`${student.collegeName}`, 20, currentY);

  // --- SUBJECT ---
  currentY += 15;
  doc.setFont("helvetica", "bold");
  doc.text(`Sub: Approval for ${student.internshipType}`, 20, currentY);
  doc.line(20, currentY + 2, 100, currentY + 2); // Underline subject

  // --- BODY ---
  currentY += 15;
  doc.setFont("helvetica", "normal");
  const bodyText = `Dear Student,

We are pleased to inform you that your application for the ${student.internshipType} program at Rashtriya Chemicals and Fertilizers Ltd. has been approved.

Based on your application and slot availability, your training has been scheduled as follows:`;
  
  const splitBody = doc.splitTextToSize(bodyText, pageWidth - 40);
  doc.text(splitBody, 20, currentY);
  currentY += (splitBody.length * 6) + 5;

  // --- DETAILS BOX ---
  doc.setDrawColor(0);
  doc.setFillColor(245, 245, 245);
  doc.rect(20, currentY, pageWidth - 40, 35, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.text(`Approved Duration:`, 25, currentY + 10);
  doc.setFont("helvetica", "normal");
  doc.text(`${approvalDetails.actualStartDate}  TO  ${approvalDetails.actualEndDate}`, 80, currentY + 10);

  doc.setFont("helvetica", "bold");
  doc.text(`Duration Type:`, 25, currentY + 20);
  doc.setFont("helvetica", "normal");
  doc.text(`${student.durationDetails?.value || "-"} ${student.durationDetails?.type || "-"}`, 80, currentY + 20);

  currentY += 45;

  // --- INSTRUCTIONS ---
  const instructions = [
    "Next Steps:",
    "1. Please login to the student portal and complete the payment process.",
    "2. Upload the payment receipt for verification.",
    "3. Once payment is verified, your final Posting Letter will be issued.",
    "4. Please carry a copy of this letter and your college ID card on the first day."
  ];

  instructions.forEach((line, i) => {
    if (i === 0) {
      doc.setFont("helvetica", "bold");
      currentY += 4;
    } else {
      doc.setFont("helvetica", "normal");
    }
    doc.text(line, 20, currentY);
    currentY += 7;
  });

  // --- SIGNATURE ---
  currentY += 20;
  doc.text("Authorized Signatory", pageWidth - 20, currentY, { align: "right" });
  currentY += 5;
  doc.setFontSize(10);
  doc.text("(RCF Training Center)", pageWidth - 20, currentY, { align: "right" });

  return doc.output("blob");
};

export const generatePostingLetterPDF = (student, details) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // --- HEADER ---
  doc.setFontSize(22);
  doc.setTextColor(0, 100, 0); 
  doc.setFont("helvetica", "bold");
  doc.text("RASHTRIYA CHEMICALS AND FERTILIZERS LTD.", pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); 
  doc.setFont("helvetica", "normal");
  doc.text("Human Resource Development Department", pageWidth / 2, 30, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(15, 35, pageWidth - 15, 35);

  // --- META DATA ---
  doc.setFontSize(11);
  const dateStr = new Date().toLocaleDateString('en-GB');
  doc.text(`Date: ${dateStr}`, pageWidth - 20, 45, { align: "right" });
  doc.text(`Ref: RCF/TRG/${new Date().getFullYear()}/${student.id.substring(0,6)}`, 20, 45);

  // --- SUBJECT ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SUBJECT: PRACTICAL TRAINING / INTERNSHIP POSTING", pageWidth / 2, 60, { align: "center" });
  doc.setLineWidth(0.2);
  doc.line(60, 62, pageWidth - 60, 62); 

  // --- BODY CONTENT ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  
  let startY = 80;
  const lineHeight = 7;

  const content = [
    `To,`,
    `The Shift In-charge / HOD,`,
    `${details.plant} Department`,
    ``,
    `Dear Sir/Madam,`,
    ``,
    `This is to inform you that Mr./Ms. ${student.studentName.toUpperCase()}, a student of ${student.collegeName}, has been accepted for the ${student.internshipType} program at our organization.`,
    ``,
    `Please allow the trainee to undergo practical training in your department as per the details below:`,
  ];

  content.forEach(line => {
    doc.text(line, 20, startY);
    startY += lineHeight;
  });

  // --- TABLE FOR DETAILS ---
  startY += 5;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, startY, pageWidth - 40, 30, 'F'); 
  doc.setFont("helvetica", "bold");
  
  doc.text(`Duration Period :  ${details.period}`, 25, startY + 10);
  doc.text(`Allocated Plant :  ${details.plant}`, 25, startY + 20);
  
  startY += 40;

  // --- INSTRUCTIONS ---
  doc.setFont("helvetica", "normal");
  const instructions = [
    "Instructions for Trainee:",
    "1. Safety shoes and helmet are mandatory within the plant premises.",
    "2. Strict adherence to safety protocols is required at all times.",
    "3. Mobile phones are not allowed inside the plant area.",
    "4. This letter must be produced whenever demanded by security personnel."
  ];

  instructions.forEach((line, i) => {
    if(i===0) doc.setFont("helvetica", "bold");
    else doc.setFont("helvetica", "normal");
    doc.text(line, 20, startY);
    startY += lineHeight;
  });

  // --- SIGNATURE ---
  startY += 30;
  doc.text("Authorized Signatory", pageWidth - 20, startY, { align: "right" });
  doc.setFontSize(10);
  doc.text("(RCF Training Center)", pageWidth - 20, startY + 5, { align: "right" });

  return doc.output("blob");
};