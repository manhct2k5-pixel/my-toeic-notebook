import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const testDir = path.resolve('test-files');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// 1. TXT: 10 TOEIC words with Unit and Topic headers
const txtContent = `UNIT 01: OFFICE PROCEDURES
TOPIC: Business Operations

1. appointment (n) - cuộc hẹn - Please schedule an appointment with Dr. Smith.
2. collaborate (v) - cộng tác, hợp tác - Our team collaborated on the quarterly report.
3. negotiate (v) - đàm phán, thương lượng - They negotiated a favorable contract.
4. agenda (n) - chương trình nghị sự - The meeting agenda will be distributed tomorrow.
5. mandatory (adj) - bắt buộc - Attendance at the safety seminar is mandatory.
6. distribute (v) - phân phát, phân phối - Please distribute the handouts to all attendees.
7. implement (v) - thi hành, triển khai - The company implemented a new remote work policy.
8. productivity (n) - năng suất - Flexible hours have increased employee productivity.
9. designate (v) - chỉ định, bổ nhiệm - He was designated as the project leader.
10. deadline (n) - hạn chót - We must submit the proposal before the Friday deadline.
`;
fs.writeFileSync(path.join(testDir, 'sample_vocab_10_words.txt'), txtContent, 'utf-8');

// 2. CSV: with English, POS, Meaning, Example, Notes, Topic, Unit
const csvContent = `English,Part of Speech,Meaning,Example,Notes,Topic,Unit
revenue,noun,doanh thu,The company reported a 15% increase in annual revenue.,Xuất hiện nhiều ở Part 7,Finance & Budget,Lesson 03 - Financial Reports
lucrative,adjective,sinh lợi có lời,They secured a lucrative contract with a multinational firm.,Cụm lucrative contract/deal,Finance & Budget,Lesson 03 - Financial Reports
audit,noun,sự kiểm toán,The annual audit is scheduled for next Monday.,annual audit,Finance & Budget,Lesson 03 - Financial Reports
deficit,noun,sự thâm hụt,The budget deficit reached a record high this quarter.,budget deficit,Finance & Budget,Lesson 03 - Financial Reports
reimburse,verb,hoàn lại bồi hoàn,The company will reimburse travel expenses.,reimburse sb for sth,Office Expenses,Lesson 03 - Financial Reports
`;
fs.writeFileSync(path.join(testDir, 'sample_vocab.csv'), csvContent, 'utf-8');

// 3. XLSX: Multi-row spreadsheet
const xlsxData = [
  ['Word', 'Part of Speech', 'Meaning (VI)', 'Example (EN)', 'Notes', 'Topic', 'Unit'],
  ['inventory', 'noun', 'hàng tồn kho', 'The warehouse manager conducts inventory checks weekly.', 'take inventory', 'Logistics', 'Unit 04 - Supply Chain'],
  ['procurement', 'noun', 'sự thu mua, mua sắm', 'The procurement department handles supplier negotiations.', 'procurement officer', 'Logistics', 'Unit 04 - Supply Chain'],
  ['distributor', 'noun', 'nhà phân phối', 'We signed an agreement with an authorized distributor.', 'authorized distributor', 'Logistics', 'Unit 04 - Supply Chain'],
  ['expedite', 'verb', 'xúc tiến, đẩy nhanh', 'Please expedite the shipping process to meet the delivery deadline.', 'expedite the order', 'Logistics', 'Unit 04 - Supply Chain'],
  ['consignment', 'noun', 'lô hàng gửi bán', 'The consignment of electronic parts arrived on Tuesday.', 'goods on consignment', 'Logistics', 'Unit 04 - Supply Chain'],
  ['invoice', 'noun', 'hóa đơn bán hàng', 'Please send the invoice to our accounting department.', 'tax invoice', 'Finance', 'Unit 04 - Supply Chain'],
];
const ws = XLSX.utils.aoa_to_sheet(xlsxData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'TOEIC Vocabulary');
XLSX.writeFile(wb, path.join(testDir, 'sample_vocab.xlsx'));

// 4. DOCX file: Create a valid ZIP-based .docx with document.xml
// A minimal docx is a zip file with [Content_Types].xml, _rels/.rels, and word/document.xml
import zlib from 'zlib';

async function createDocx() {
  const zip = new (await import('jszip')).default();
  
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Unit 05 - Marketing Strategies</w:t></w:r></w:p>
    <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Topic: Advertising &amp; Promotion</w:t></w:r></w:p>
    <w:p><w:r><w:t>campaign (n) - chiến dịch quảng bá - The marketing campaign generated high sales.</w:t></w:r></w:p>
    <w:p><w:r><w:t>demographic (n) - nhóm nhân khẩu học - The product appeals to a younger demographic.</w:t></w:r></w:p>
    <w:p><w:r><w:t>endorse (v) - chứng thực, quảng cáo - A famous athlete endorsed our new sneakers.</w:t></w:r></w:p>
    <w:p><w:r><w:t>market share (n) - thị phần - Our company gained 5% market share this year.</w:t></w:r></w:p>
    <w:p><w:r><w:t>billboard (n) - biển quảng cáo ngoài trời - They placed billboards along major highways.</w:t></w:r></w:p>
  </w:body>
</w:document>`;
  zip.file('word/document.xml', docXml);

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(path.join(testDir, 'sample_vocab.docx'), buffer);
}

// 5. Minimal Valid PDF with text layer
function createSimplePdf() {
  const content = `BT
/F1 12 Tf
72 712 Td
(LESSON 06 - CONTRACTS AND AGREEMENTS) Tj
0 -20 Td
(Topic: Legal Documents) Tj
0 -20 Td
(clause (n) - dieu khoan hop dong - The contract contains a non-compete clause.) Tj
0 -20 Td
(stipulate (v) - quy dinh - The agreement stipulates that payment must be made in 30 days.) Tj
0 -20 Td
(obligate (v) - bat buoc - Both parties are obligated to comply with the terms.) Tj
0 -20 Td
(expire (v) - het han - The maintenance warranty will expire next month.) Tj
0 -20 Td
(binding (adj) - co tinh rang buoc - A signed contract is legally binding.) Tj
ET`;

  const streamLength = Buffer.byteLength(content);

  const pdfData = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${content}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000000293 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
368
%%EOF`;

  fs.writeFileSync(path.join(testDir, 'sample_vocab.pdf'), pdfData, 'binary');
}

// 6. Test file with duplicates and issues
const duplicateAndIssues = `
UNIT 01: OFFICE PROCEDURES
TOPIC: Office Operations

appointment (n) - cuộc hẹn lại
agenda (n) - lịch trình họp
missingmeaning (v) -
- đây là nghĩa nhưng thiếu từ
validword (adj) - hợp lệ và đầy đủ nghĩa
`;
fs.writeFileSync(path.join(testDir, 'sample_duplicates_and_issues.txt'), duplicateAndIssues, 'utf-8');

createDocx().then(() => {
  createSimplePdf();
  console.log('Successfully generated all sample test files in test-files/');
}).catch(console.error);
