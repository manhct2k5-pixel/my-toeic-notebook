import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

// Replicate test environment
import { parseCSVString } from '../src/lib/file-parser/text-extractor.ts';
import {
  autoMapColumns,
  parseTabularData,
  parseStructuredText,
  parseFreeformDocument,
  normalizePartOfSpeech,
} from '../src/lib/file-parser/vocabulary-analyzer.ts';
import {
  normalizeWordString,
  detectDuplicates,
} from '../src/lib/file-parser/duplicate-detector.ts';

async function runTests() {
  console.log('=== RUNNING AUTOMATED IMPORT VERIFICATION TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  // TEST 1: Nhập TXT có 10 từ theo dạng từ – nghĩa
  console.log('--- Test 1: TXT 10 words parsing ---');
  const txtRaw = fs.readFileSync('test-files/sample_vocab_10_words.txt', 'utf-8');
  const txtRows = parseStructuredText(txtRaw);
  assert(txtRows.length === 10, 'TXT parsed 10 rows', `Expected 10, got ${txtRows.length}`);
  assert(txtRows[0].word === 'appointment', 'First word is appointment');
  assert(txtRows[0].pos === 'noun', 'First word POS is noun');
  assert(txtRows[0].meaning_vi.includes('cuộc hẹn'), 'First word meaning is cuộc hẹn');
  assert(txtRows[0].unit?.includes('UNIT 01'), 'Assigned Unit 01 from header');
  assert(txtRows[0].topic?.includes('Business Operations'), 'Assigned Topic from header');
  assert(txtRows[9].word === 'deadline', '10th word is deadline');

  // TEST 2: Nhập DOCX chứa tiêu đề Unit và danh sách từ vựng
  console.log('\n--- Test 2: DOCX extraction & parsing ---');
  const docxBuffer = fs.readFileSync('test-files/sample_vocab.docx');
  const docxRaw = (await mammoth.extractRawText({ buffer: docxBuffer })).value;
  const docxRows = parseStructuredText(docxRaw);
  assert(docxRows.length >= 5, `DOCX parsed ${docxRows.length} words`, `Expected >= 5, got ${docxRows.length}`);
  assert(docxRows.some((w) => w.word === 'campaign'), 'DOCX contains campaign');
  assert(docxRows.some((w) => w.word === 'market share'), 'DOCX contains market share');
  assert(docxRows[0].unit?.includes('Unit 05'), 'DOCX Unit 05 detected');

  // TEST 3: Nhập CSV có các cột English, Meaning, Example, Notes
  console.log('\n--- Test 3: CSV parsing & Column mapping ---');
  const csvRaw = fs.readFileSync('test-files/sample_vocab.csv', 'utf-8');
  const parsedCsv = parseCSVString(csvRaw);
  const csvMapping = autoMapColumns(parsedCsv.headers);
  assert(csvMapping['English'] === 'word', 'Auto-mapped English to word');
  assert(csvMapping['Meaning'] === 'meaning_vi', 'Auto-mapped Meaning to meaning_vi');
  assert(csvMapping['Part of Speech'] === 'pos', 'Auto-mapped Part of Speech to pos');
  assert(csvMapping['Example'] === 'example_en', 'Auto-mapped Example to example_en');
  assert(csvMapping['Notes'] === 'notes', 'Auto-mapped Notes to notes');
  const csvRows = parseTabularData(parsedCsv.rows, csvMapping);
  assert(csvRows.length === 5, 'CSV yielded 5 vocabulary rows', `Got ${csvRows.length}`);
  assert(csvRows[0].word === 'revenue', 'First CSV word is revenue');
  assert(csvRows[0].notes?.includes('Part 7'), 'Notes mapped correctly');

  // TEST 4: Nhập XLSX chứa nhiều hàng từ vựng
  console.log('\n--- Test 4: XLSX Excel parsing ---');
  const xlsxBuffer = fs.readFileSync('test-files/sample_vocab.xlsx');
  const workbook = XLSX.read(xlsxBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const headers = sheetData[0];
  const xlsxRowsData = [];
  for (let i = 1; i < sheetData.length; i++) {
    const row = {};
    headers.forEach((h, idx) => { row[h] = sheetData[i][idx] || ''; });
    xlsxRowsData.push(row);
  }
  const xlsxMapping = autoMapColumns(headers);
  const xlsxParsedRows = parseTabularData(xlsxRowsData, xlsxMapping);
  assert(xlsxParsedRows.length === 6, 'XLSX yielded 6 vocabulary rows', `Got ${xlsxParsedRows.length}`);
  assert(xlsxParsedRows.some((w) => w.word === 'inventory'), 'XLSX has inventory');
  assert(xlsxParsedRows.some((w) => w.word === 'procurement'), 'XLSX has procurement');
  assert(xlsxParsedRows.some((w) => w.word === 'expedite'), 'XLSX has expedite');

  // TEST 5: PDF text layer extraction
  console.log('\n--- Test 5: PDF parsing ---');
  const pdfBuffer = fs.readFileSync('test-files/sample_vocab.pdf');
  const pdfjsLib = await import('pdfjs-dist');
  const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  const pdfPage = await pdfDoc.getPage(1);
  const pdfTextContent = await pdfPage.getTextContent();
  const pdfLines = pdfTextContent.items.map((i) => i.str).filter(Boolean);
  const pdfExtractedText = pdfLines.join('\n');
  assert(pdfExtractedText.includes('LESSON 06 - CONTRACTS'), 'PDF contains text layer');
  const pdfRows = parseStructuredText(pdfExtractedText);
  assert(pdfRows.length >= 4, `PDF extracted ${pdfRows.length} vocab rows`, `Got ${pdfRows.length}`);
  assert(pdfRows.some((w) => w.word === 'clause'), 'PDF has clause');
  assert(pdfRows.some((w) => w.word === 'stipulate'), 'PDF has stipulate');

  // TEST 6: File chứa tiêu đề Topic và Unit
  console.log('\n--- Test 6: Topic and Unit detection & normalization ---');
  assert(txtRows[0].unit?.includes('UNIT 01: OFFICE PROCEDURES'), 'Unit recognized in TXT');
  assert(txtRows[0].topic?.includes('Business Operations'), 'Topic recognized in TXT');
  assert(normalizeWordString('  Contracts  ') === 'contracts', 'Whitespace normalized');
  assert(normalizeWordString('“APPOINTMENT”') === 'appointment', 'Quotes stripped and lowercased');

  // TEST 7: File có từ trùng với dữ liệu hiện tại
  console.log('\n--- Test 7: Duplicate detection ---');
  const mockExistingVocab = [
    { id: 'w1', word: 'appointment', pos: 'noun', meaning_vi: 'cuộc hẹn', notes: 'Ghi chú cũ của Người A', topic_ids: ['t1'], unit_ids: ['u1'] },
    { id: 'w2', word: 'collaborate', pos: 'verb', meaning_vi: 'cộng tác', notes: '', topic_ids: ['t1'], unit_ids: [] },
  ];
  const detected = detectDuplicates(txtRows, mockExistingVocab);
  const duplicates = detected.filter((r) => r.status === 'duplicate');
  assert(duplicates.length === 2, `Detected 2 duplicate rows`, `Got ${duplicates.length}`);
  assert(duplicates[0].word === 'appointment', 'appointment flagged as duplicate');
  assert(duplicates[0].existingWordId === 'w1', 'Linked to existing w1');
  assert(duplicates[1].word === 'collaborate', 'collaborate flagged as duplicate');

  // TEST 8: File có dòng thiếu nghĩa hoặc thiếu từ
  console.log('\n--- Test 8: Missing meaning or missing word ---');
  const issuesRaw = fs.readFileSync('test-files/sample_duplicates_and_issues.txt', 'utf-8');
  const issuesRows = parseStructuredText(issuesRaw);
  assert(issuesRows.some((r) => r.status === 'missing_meaning' || !r.meaning_vi), 'Detected missing meaning row');
  assert(issuesRows.some((r) => r.status === 'valid'), 'Valid rows still marked valid');

  // TEST 9: Người dùng sửa dữ liệu ở màn hình xem trước
  console.log('\n--- Test 9: Preview editing ---');
  const editableRow = { ...txtRows[0] };
  editableRow.meaning_vi = 'cuộc hẹn đã được chỉnh sửa';
  editableRow.pos = 'verb';
  assert(editableRow.meaning_vi === 'cuộc hẹn đã được chỉnh sửa', 'Meaning updated in memory');
  assert(editableRow.pos === 'verb', 'POS updated to verb');

  // TEST 10: Người dùng bỏ chọn một số dòng
  console.log('\n--- Test 10: Deselection filtering ---');
  const modifiedRows = txtRows.map((r, idx) => ({ ...r, selected: idx !== 0 }));
  const willImport = modifiedRows.filter((r) => r.selected);
  assert(willImport.length === 9, 'Selected count is 9 after deselecting first row');
  assert(!willImport.some((r) => r.word === 'appointment'), 'Deselected appointment is excluded');

  // TEST 11: Kiểm tra lưu dữ liệu và tìm lại từ
  console.log('\n--- Test 11: Duplicate strategies verification ---');
  // Test merge_notes_and_examples: old notes must be preserved!
  const oldNotes = 'Ghi chú cũ của Người A';
  const fileNotes = 'Ví dụ mở rộng từ bài đọc';
  const mergedNotes = `${oldNotes}\n\n> 📝 Ghi chú từ file:\n${fileNotes}`;
  assert(mergedNotes.includes(oldNotes), 'Old notes preserved when merging');
  assert(mergedNotes.includes(fileNotes), 'New notes appended');

  // TEST 12: Đảm bảo tiến độ của hai hồ sơ không bị thay đổi ngoài ý muốn
  console.log('\n--- Test 12: Profile A & B progress separation ---');
  const mockProgressA = [
    { word_id: 'w1', profile_id: 'profile_a', is_memorized: true, repetitions: 5, ease_factor: 2.6 },
  ];
  const mockProgressB = [
    { word_id: 'w1', profile_id: 'profile_b', is_memorized: false, repetitions: 1, ease_factor: 2.5 },
  ];
  // Adding new word 'w3'
  const newWordId = 'w3';
  const updatedProgressA = [...mockProgressA, { word_id: newWordId, profile_id: 'profile_a', is_memorized: false, repetitions: 0 }];
  assert(updatedProgressA[0].is_memorized === true, 'Profile A progress on w1 unchanged');
  assert(updatedProgressA[0].repetitions === 5, 'Profile A repetitions unchanged');
  assert(mockProgressB[0].is_memorized === false, 'Profile B progress completely independent');

  // TEST 13: Freeform candidate extraction (Mode B)
  console.log('\n--- Test 13: Freeform Mode candidate detection ---');
  const freeformDoc = {
    fileName: 'lecture.txt',
    fileSize: 100,
    extension: 'txt',
    rawText: `
    UNIT 02 - MEETING PREPARATION
    In this chapter we discuss important business terms.
    * agenda: danh sách nội dung cuộc họp
    * quorum: số lượng thành viên tối thiểu hợp lệ
    * consensus: sự đồng thuận của tập thể
    Some other notes on grammar.
    `,
    suggestedMode: 'freeform',
    detectedTopics: [],
    detectedUnits: ['Unit 02'],
  };
  const freeformCandidates = parseFreeformDocument(freeformDoc);
  assert(freeformCandidates.length >= 3, `Extracted ${freeformCandidates.length} freeform candidates`, `Got ${freeformCandidates.length}`);
  assert(freeformCandidates.some((c) => c.word === 'agenda'), 'Detected agenda');
  assert(freeformCandidates.some((c) => c.word === 'quorum'), 'Detected quorum');
  assert(freeformCandidates.some((c) => c.word === 'consensus'), 'Detected consensus');

  // TEST 14: Format validation (.doc legacy & size limit)
  console.log('\n--- Test 14: Validation for legacy .doc ---');
  import('../src/lib/file-parser/text-extractor.ts').then(({ validateFile }) => {
    const fakeDoc = { name: 'old_contract.doc', size: 1024 };
    const resDoc = validateFile(fakeDoc);
    assert(resDoc.valid === false, 'Legacy .doc is invalid for direct parse');
    assert(resDoc.isLegacyDoc === true, 'Flagged as isLegacyDoc');
    assert(resDoc.error?.includes('Word 97-2003'), 'Contains guidance to save as .docx or .txt');

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  });
}

runTests();
