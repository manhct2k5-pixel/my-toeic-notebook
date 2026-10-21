import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { ExtractedDocumentData, SupportedFileExtension, ImportMode } from './types';

// Max file size: 25MB
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

export const SUPPORTED_EXTENSIONS: SupportedFileExtension[] = [
  'txt',
  'csv',
  'xlsx',
  'xls',
  'docx',
  'pdf',
  'doc',
];

export interface FileValidationResult {
  valid: boolean;
  extension: SupportedFileExtension | null;
  error?: string;
  isLegacyDoc?: boolean;
}

/**
 * Validate file extension and size before reading
 */
export function validateFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, extension: null, error: 'Chưa chọn file' };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      extension: null,
      error: `Dung lượng file (${sizeInMB} MB) vượt quá giới hạn cho phép (25 MB). Vui lòng chọn file nhỏ hơn.`,
    };
  }

  const name = file.name.toLowerCase();
  const ext = name.split('.').pop() as SupportedFileExtension | undefined;

  if (!ext || !SUPPORTED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      extension: null,
      error: `Định dạng file không được hỗ trợ. Vui lòng tải lên file TXT, CSV, XLSX, XLS, DOCX hoặc PDF.`,
    };
  }

  if (ext === 'doc') {
    return {
      valid: false,
      extension: 'doc',
      isLegacyDoc: true,
      error:
        'Định dạng .doc cũ (Word 97-2003) không thể giải mã văn bản an toàn trên trình duyệt mà không làm mất cấu trúc. Vui lòng mở tài liệu trong Word hoặc Google Docs, chọn "Save As" (Lưu thành) định dạng .docx hoặc .txt rồi tải lại.',
    };
  }

  return { valid: true, extension: ext };
}

/**
 * Robust CSV parser that handles quotes, escaped quotes, newlines inside cells, and variable delimiters (comma, tab, semicolon).
 */
export function parseCSVString(text: string): { headers: string[]; rows: Record<string, string>[] } {
  // Strip BOM if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  // Detect delimiter: inspect first non-empty lines
  const firstLines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 5);
  let delimiter = ',';
  let maxCount = 0;

  for (const candidate of [',', '\t', ';', '|']) {
    const totalCount = firstLines.reduce((acc, line) => {
      // count candidate outside of quotes
      let insideQuote = false;
      let count = 0;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') insideQuote = !insideQuote;
        else if (line[i] === candidate && !insideQuote) count++;
      }
      return acc + count;
    }, 0);

    if (totalCount > maxCount) {
      maxCount = totalCount;
      delimiter = candidate;
    }
  }

  // Parse lines using character-by-character state machine
  const matrix: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentCell += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some((c) => c.length > 0)) {
        matrix.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      matrix.push(currentRow);
    }
  }

  if (matrix.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = matrix[0].map((h, idx) => (h.trim().length > 0 ? h.trim() : `Cột_${idx + 1}`));
  const rows: Record<string, string>[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const rowValues = matrix[r];
    if (rowValues.every((val) => val.trim().length === 0)) continue;

    const rowObj: Record<string, string> = {};
    for (let c = 0; c < rawHeaders.length; c++) {
      rowObj[rawHeaders[c]] = rowValues[c] || '';
    }
    rows.push(rowObj);
  }

  return { headers: rawHeaders, rows };
}

/**
 * Extract data from Excel spreadsheets (XLSX, XLS)
 */
export async function extractFromExcel(file: File): Promise<{ headers: string[]; rows: Record<string, string>[]; rawText: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('File Excel không có sheet dữ liệu nào');
  }

  // Read first active sheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to array of arrays to handle headers accurately
  const sheetData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' });

  if (sheetData.length === 0) {
    return { headers: [], rows: [], rawText: '' };
  }

  // Find the first row with at least 2 non-empty cells as header
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(10, sheetData.length); i++) {
    const row = sheetData[i] as unknown[];
    const nonEmpty = row.filter((cell) => cell !== undefined && String(cell).trim().length > 0);
    if (nonEmpty.length >= 2) {
      headerRowIndex = i;
      break;
    }
  }

  const headerRow = (sheetData[headerRowIndex] as unknown[]).map((cell, idx) => {
    const str = String(cell || '').trim();
    return str.length > 0 ? str : `Cột_${idx + 1}`;
  });

  const rows: Record<string, string>[] = [];
  const textLines: string[] = [];

  for (let i = headerRowIndex + 1; i < sheetData.length; i++) {
    const row = sheetData[i] as unknown[];
    if (!row || row.every((c) => !c || String(c).trim().length === 0)) continue;

    const rowObj: Record<string, string> = {};
    const lineParts: string[] = [];

    for (let colIdx = 0; colIdx < headerRow.length; colIdx++) {
      const colName = headerRow[colIdx];
      const val = row[colIdx] !== undefined ? String(row[colIdx]).trim() : '';
      rowObj[colName] = val;
      if (val) lineParts.push(val);
    }

    rows.push(rowObj);
    if (lineParts.length > 0) {
      textLines.push(lineParts.join(' | '));
    }
  }

  return {
    headers: headerRow,
    rows,
    rawText: textLines.join('\n'),
  };
}

/**
 * Extract data from modern Word document (.docx)
 */
export async function extractFromDocx(file: File): Promise<{ rawText: string; html: string; detectedHeadings: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const input = typeof Buffer !== 'undefined' ? { buffer: Buffer.from(arrayBuffer) } : { arrayBuffer };

  const [rawTextResult, htmlResult] = await Promise.all([
    mammoth.extractRawText(input as any),
    mammoth.convertToHtml(input as any),
  ]);

  const rawText = rawTextResult.value || '';
  const html = htmlResult.value || '';

  // Extract headings from HTML or rawText
  const headings: string[] = [];
  const headingMatches = html.matchAll(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi);
  for (const match of headingMatches) {
    const cleanHeading = match[1].replace(/<[^>]+>/g, '').trim();
    if (cleanHeading.length > 0 && cleanHeading.length < 100) {
      headings.push(cleanHeading);
    }
  }

  return {
    rawText,
    html,
    detectedHeadings: headings,
  };
}

/**
 * Extract data from PDF documents using pdfjs-dist
 */
export async function extractFromPdf(file: File): Promise<{ rawText: string; pageCount: number; isScanned: boolean }> {
  const arrayBuffer = await file.arrayBuffer();

  // Dynamic import of pdfjs-dist to optimize bundle
  const pdfjsLib = await import('pdfjs-dist');

  // Configure worker
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    const isGhPages = window.location.pathname.startsWith('/my-toeic-notebook');
    const prefix = isGhPages ? '/my-toeic-notebook' : '';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${prefix}/pdf.worker.min.mjs`;
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const pageCount = pdfDoc.numPages;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageLines: string[] = [];
    let currentY: number | null = null;
    let currentLine = '';

    for (const item of textContent.items) {
      if ('str' in item) {
        const textItem = item as { str: string; transform: number[] };
        const y = Math.round(textItem.transform[5]);

        if (currentY === null || Math.abs(currentY - y) > 5) {
          if (currentLine.trim()) {
            pageLines.push(currentLine.trim());
          }
          currentLine = textItem.str;
          currentY = y;
        } else {
          currentLine += (currentLine.endsWith(' ') || textItem.str.startsWith(' ') ? '' : ' ') + textItem.str;
        }
      }
    }

    if (currentLine.trim()) {
      pageLines.push(currentLine.trim());
    }

    pageTexts.push(pageLines.join('\n'));
  }

  const fullText = pageTexts.join('\n\n').trim();

  // Check if PDF has no extractable text layer (e.g. pure scanned image)
  const isScanned = fullText.length < 20 || fullText.replace(/\s+/g, '').length < 10;

  return {
    rawText: fullText,
    pageCount,
    isScanned,
  };
}

/**
 * Universal file extractor: processes any supported file and yields structured document data
 */
export async function extractDocumentData(file: File): Promise<ExtractedDocumentData> {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'File không hợp lệ');
  }

  const ext = validation.extension!;
  let rawText = '';
  let rawRows: Record<string, string>[] | undefined = undefined;
  let headers: string[] | undefined = undefined;
  const detectedTopics: string[] = [];
  const detectedUnits: string[] = [];
  let pageCount: number | undefined = undefined;
  const warning: string | undefined = undefined;

  if (ext === 'txt') {
    rawText = await file.text();
  } else if (ext === 'csv') {
    const text = await file.text();
    const parsed = parseCSVString(text);
    headers = parsed.headers;
    rawRows = parsed.rows;
    rawText = parsed.rows.map((r) => Object.values(r).join(' | ')).join('\n');
  } else if (ext === 'xlsx' || ext === 'xls') {
    const parsed = await extractFromExcel(file);
    headers = parsed.headers;
    rawRows = parsed.rows;
    rawText = parsed.rawText;
  } else if (ext === 'docx') {
    const parsed = await extractFromDocx(file);
    rawText = parsed.rawText;
    
    // Check headings for topic/unit hints
    parsed.detectedHeadings.forEach((h) => {
      const lower = h.toLowerCase();
      if (lower.includes('unit') || lower.includes('lesson') || lower.includes('bài')) {
        detectedUnits.push(h);
      } else if (lower.includes('topic') || lower.includes('chủ đề')) {
        detectedTopics.push(h);
      }
    });
  } else if (ext === 'pdf') {
    const parsed = await extractFromPdf(file);
    pageCount = parsed.pageCount;
    if (parsed.isScanned) {
      throw new Error(
        'Tài liệu PDF này được tạo từ ảnh scan và không có lớp văn bản có thể trích xuất. Hệ thống chưa hỗ trợ nhận diện chữ (OCR) trên ảnh scan. Vui lòng chuyển sang file PDF có lớp văn bản, file Word (DOCX) hoặc file Excel/CSV/TXT.'
      );
    }
    rawText = parsed.rawText;
  }

  // Scan rawText for obvious Topic and Unit headers
  const unitRegex = /(?:Unit|Lesson|Bài)\s*\d+[:\s–—-]+[^\n\r]+/gi;
  const topicRegex = /(?:Topic|Chủ đề)[:\s–—-]+[^\n\r]+/gi;

  const unitMatches = rawText.match(unitRegex);
  if (unitMatches) {
    unitMatches.forEach((m) => {
      const clean = m.trim().replace(/^[-*•#\s]+/, '');
      if (!detectedUnits.includes(clean)) detectedUnits.push(clean);
    });
  }

  const topicMatches = rawText.match(topicRegex);
  if (topicMatches) {
    topicMatches.forEach((m) => {
      const clean = m.trim().replace(/^[-*•#\s]+/, '');
      if (!detectedTopics.includes(clean)) detectedTopics.push(clean);
    });
  }

  // Determine suggested mode:
  // Tabular formats (CSV/XLSX with detected headers) are default 'structured'.
  // DOCX/PDF/TXT are 'structured' if high percentage of lines match word-definition patterns, else 'freeform'.
  let suggestedMode: ImportMode = 'freeform';
  if (rawRows && rawRows.length > 0 && headers && headers.length >= 2) {
    suggestedMode = 'structured';
  } else {
    // Check if lines in rawText match structured vocab patterns
    const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    let structuredLinesCount = 0;
    const testLines = lines.slice(0, 30);
    for (const line of testLines) {
      if (
        /^[a-zA-Z\s-]{2,40}\s*(?:\([^)]+\)|\/[^/]+\/)?\s*[-–—:=]\s*.+/i.test(line.trim()) ||
        /^\d+[\.\)]\s*[a-zA-Z\s-]{2,40}/i.test(line.trim())
      ) {
        structuredLinesCount++;
      }
    }
    if (testLines.length > 0 && structuredLinesCount / testLines.length >= 0.4) {
      suggestedMode = 'structured';
    }
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    extension: ext,
    rawText,
    rawRows,
    headers,
    suggestedMode,
    detectedTopics,
    detectedUnits,
    pageCount,
    warning,
  };
}
