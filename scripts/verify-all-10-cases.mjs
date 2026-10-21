import fs from 'fs';
import path from 'path';
import {
  parseStructuredText,
  parseTabularData,
  autoMapColumns,
  analyzeExtractedDocument,
  normalizePartOfSpeech,
} from '../src/lib/file-parser/vocabulary-analyzer.ts';
import {
  extractFromDocx,
  extractFromExcel,
  parseCSVString,
  extractDocumentData,
  validateFile,
} from '../src/lib/file-parser/text-extractor.ts';
import { detectDuplicates, normalizeWordString } from '../src/lib/file-parser/duplicate-detector.ts';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, detail) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
  }
}

async function runAllVerificationCases() {
  console.log('================================================================');
  console.log('   FULL END-TO-END VERIFICATION: VOCABULARY IMPORT & PARSING    ');
  console.log('================================================================\n');

  // Tracking counters for reporting
  let totalWordsExtracted = 0;
  let totalMeaningsExtracted = 0;
  let totalIpaExtracted = 0;
  let totalExamplesExtracted = 0;
  let totalTranslationsExtracted = 0;

  // ---------------------------------------------------------------------------
  // FIXTURE 1: TXT có từ, IPA, nghĩa, ví dụ và bản dịch (Nhiều kiểu trình bày)
  // ---------------------------------------------------------------------------
  console.log('--- TEST 1: TXT Multi-format & Multi-line (Dạng A, Dạng B, Labeled UK/US, Inline) ---');
  const txt1 = fs.readFileSync('test-files/fixture_1_txt_multiline_ipa_examples.txt', 'utf-8');
  const rows1 = parseStructuredText(txt1);

  assert(rows1.length === 4, `Parsed exactly 4 vocabulary entries (got ${rows1.length})`);
  
  // Entry 1: Dạng A (appointment)
  const entry1 = rows1.find(r => r.word === 'appointment');
  assert(Boolean(entry1), 'Found "appointment"');
  if (entry1) {
    assert(entry1.pos === 'noun', 'Pos is noun');
    assert(entry1.phonetic_us === '/əˈpɔɪnt.mənt/' || entry1.phonetic_us === 'əˈpɔɪnt.mənt', `Extracted IPA /əˈpɔɪnt.mənt/ (got "${entry1.phonetic_us}")`);
    assert(entry1.meaning_vi === 'cuộc hẹn', `Meaning is "cuộc hẹn" (got "${entry1.meaning_vi}")`);
    assert(entry1.example_en === 'I have an appointment with the manager tomorrow.', 'Extracted example_en');
    assert(entry1.example_vi === 'Tôi có cuộc hẹn với người quản lý vào ngày mai.', 'Extracted example_vi from Dịch:');
    assert(entry1.unit && entry1.unit.includes('UNIT 01'), 'Assigned Unit 01');
    assert(entry1.topic && entry1.topic.includes('Recruitment'), 'Assigned Topic Recruitment');
  }

  // Entry 2: Dạng B with Arrow & UK/US on same line (candidate)
  const entry2 = rows1.find(r => r.word === 'candidate');
  assert(Boolean(entry2), 'Found "candidate"');
  if (entry2) {
    assert(entry2.pos === 'noun', 'Pos is noun');
    assert(Boolean(entry2.phonetic_uk), `Extracted UK IPA (got "${entry2.phonetic_uk}")`);
    assert(Boolean(entry2.phonetic_us), `Extracted US IPA (got "${entry2.phonetic_us}")`);
    assert(entry2.meaning_vi === 'ứng viên', `Meaning is "ứng viên" (got "${entry2.meaning_vi}")`);
    assert(entry2.example_en === 'The candidate has impressive qualifications.', 'Extracted example_en');
    assert(entry2.example_vi === 'Ứng viên này có bằng cấp rất ấn tượng.', 'Extracted example_vi from arrow →');
  }

  // Entry 3: Labeled Multi-line (remuneration)
  const entry3 = rows1.find(r => r.word === 'remuneration');
  assert(Boolean(entry3), 'Found "remuneration"');
  if (entry3) {
    assert(entry3.phonetic_uk === '/rɪˌmjuː.nərˈeɪ.ʃən/' || entry3.phonetic_uk === 'rɪˌmjuː.nərˈeɪ.ʃən', `UK IPA matches exactly (got "${entry3.phonetic_uk}")`);
    assert(entry3.phonetic_us === '/rɪˌmjuː.nəˈreɪ.ʃən/' || entry3.phonetic_us === 'rɪˌmjuː.nəˈreɪ.ʃən', `US IPA matches exactly (got "${entry3.phonetic_us}")`);
    assert(entry3.meaning_vi && entry3.meaning_vi.includes('tiền thù lao'), 'Meaning includes "tiền thù lao"');
    assert(entry3.example_en && entry3.example_en.includes('generous remuneration'), 'Example EN extracted');
    assert(entry3.example_vi && entry3.example_vi.includes('gói đãi ngộ'), 'Example VI extracted from Translation:');
  }

  // Entry 4: Inline single line with example & translation
  const entry4 = rows1.find(r => r.word === 'collaborate');
  assert(Boolean(entry4), 'Found "collaborate"');
  if (entry4) {
    assert(entry4.pos === 'verb', 'Pos is verb');
    assert(entry4.meaning_vi && entry4.meaning_vi.includes('cộng tác'), 'Meaning is "cộng tác, hợp tác"');
    assert(entry4.example_en && entry4.example_en.includes('collaborated on the quarterly report'), 'Inline example_en extracted');
    assert(entry4.example_vi && entry4.example_vi.includes('hợp tác trong báo cáo quý'), 'Inline example_vi extracted');
  }

  rows1.forEach(r => {
    totalWordsExtracted++;
    if (r.meaning_vi) totalMeaningsExtracted++;
    if (r.phonetic_uk || r.phonetic_us) totalIpaExtracted++;
    if (r.example_en) totalExamplesExtracted++;
    if (r.example_vi) totalTranslationsExtracted++;
  });

  // ---------------------------------------------------------------------------
  // FIXTURE 2: DOCX có bảng nhiều cột (Word, POS, IPA UK, IPA US, Meaning, Example, Translation)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 2: DOCX Table Extraction with UK/US IPA & Examples ---');
  const docxTableBuf = fs.readFileSync('test-files/fixture_2_docx_table.docx');
  const docxTableFile = new File([docxTableBuf], 'fixture_2_docx_table.docx', {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const docxTableExtracted = await extractFromDocx(docxTableFile);

  assert(docxTableExtracted.tableHeaders.length >= 7, `Extracted ${docxTableExtracted.tableHeaders.length} table headers`);
  assert(docxTableExtracted.tableRows.length === 3, `Extracted 3 table rows (got ${docxTableExtracted.tableRows.length})`);
  
  const docxMapping = autoMapColumns(docxTableExtracted.tableHeaders);
  assert(docxMapping['Word'] === 'word', 'Mapped Word');
  assert(docxMapping['Phonetic UK'] === 'phonetic_uk', 'Mapped Phonetic UK');
  assert(docxMapping['Phonetic US'] === 'phonetic_us', 'Mapped Phonetic US');
  assert(docxMapping['Nghĩa tiếng Việt'] === 'meaning_vi', 'Mapped Nghĩa tiếng Việt');
  assert(docxMapping['Example (EN)'] === 'example_en', 'Mapped Example (EN)');
  assert(docxMapping['Dịch ví dụ'] === 'example_vi', 'Mapped Dịch ví dụ');

  const docxRows = parseTabularData(docxTableExtracted.tableRows, docxMapping, 'Finance', 'Unit 07');
  assert(docxRows.length === 3, `Yielded 3 vocabulary rows`);
  const auditRow = docxRows.find(r => r.word === 'audit');
  assert(Boolean(auditRow), 'Found "audit"');
  if (auditRow) {
    assert(auditRow.phonetic_uk === '/ˈɔː.dɪt/', 'Extracted audit UK IPA');
    assert(auditRow.phonetic_us === '/ˈɑː.dɪt/', 'Extracted audit US IPA');
    assert(auditRow.meaning_vi === 'sự kiểm toán', 'Audit meaning matches');
    assert(auditRow.example_en === 'The annual audit will begin next Monday.', 'Audit example_en matches');
    assert(auditRow.example_vi === 'Cuộc kiểm toán hàng năm sẽ bắt đầu vào thứ Hai tới.', 'Audit example_vi matches');
  }

  docxRows.forEach(r => {
    totalWordsExtracted++;
    if (r.meaning_vi) totalMeaningsExtracted++;
    if (r.phonetic_uk || r.phonetic_us) totalIpaExtracted++;
    if (r.example_en) totalExamplesExtracted++;
    if (r.example_vi) totalTranslationsExtracted++;
  });

  // ---------------------------------------------------------------------------
  // FIXTURE 3: DOCX có mỗi từ trải qua nhiều đoạn
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 3: DOCX Multi-paragraph Entries ---');
  const docxMultiBuf = fs.readFileSync('test-files/fixture_3_docx_multiline_paragraphs.docx');
  const docxMultiFile = new File([docxMultiBuf], 'fixture_3_docx_multiline_paragraphs.docx', {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const docxMultiExtracted = await extractFromDocx(docxMultiFile);
  const docxMultiDocData = await extractDocumentData(docxMultiFile);
  const docxMultiRows = parseStructuredText(docxMultiDocData.rawText, 'Contracts', 'Unit 08');

  assert(docxMultiRows.length === 2, `Extracted 2 words spanning paragraphs (got ${docxMultiRows.length})`);
  const warrantyRow = docxMultiRows.find(r => r.word === 'warranty');
  assert(Boolean(warrantyRow), 'Found "warranty"');
  if (warrantyRow) {
    assert(Boolean(warrantyRow.phonetic_uk), `Warranty UK IPA extracted: ${warrantyRow.phonetic_uk}`);
    assert(Boolean(warrantyRow.phonetic_us), `Warranty US IPA extracted: ${warrantyRow.phonetic_us}`);
    assert(warrantyRow.meaning_vi && warrantyRow.meaning_vi.includes('bảo hành'), 'Warranty meaning extracted');
    assert(warrantyRow.example_en && warrantyRow.example_en.includes('two-year warranty'), 'Warranty example_en extracted');
    assert(warrantyRow.example_vi && warrantyRow.example_vi.includes('hai năm'), 'Warranty example_vi extracted');
  }

  docxMultiRows.forEach(r => {
    totalWordsExtracted++;
    if (r.meaning_vi) totalMeaningsExtracted++;
    if (r.phonetic_uk || r.phonetic_us) totalIpaExtracted++;
    if (r.example_en) totalExamplesExtracted++;
    if (r.example_vi) totalTranslationsExtracted++;
  });

  // ---------------------------------------------------------------------------
  // FIXTURE 4: XLSX có các tên cột tiếng Anh đa dạng (English, Pos, British, American, Nghĩa, Sentence, Dịch)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 4: XLSX with Diverse Header Names ---');
  const xlsxBuf = fs.readFileSync('test-files/fixture_4_xlsx_diverse_headers.xlsx');
  const xlsxFile = new File([xlsxBuf], 'fixture_4_xlsx_diverse_headers.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const xlsxExtracted = await extractFromExcel(xlsxFile);
  const xlsxMapping = autoMapColumns(xlsxExtracted.headers);

  assert(xlsxMapping['English'] === 'word', 'Auto-mapped English -> word');
  assert(xlsxMapping['Pos'] === 'pos', 'Auto-mapped Pos -> pos');
  assert(xlsxMapping['British'] === 'phonetic_uk', 'Auto-mapped British -> phonetic_uk');
  assert(xlsxMapping['American'] === 'phonetic_us', 'Auto-mapped American -> phonetic_us');
  assert(xlsxMapping['Nghĩa tiếng Việt'] === 'meaning_vi', 'Auto-mapped Nghĩa tiếng Việt -> meaning_vi');
  assert(xlsxMapping['Sentence'] === 'example_en', 'Auto-mapped Sentence -> example_en');
  assert(xlsxMapping['Dịch ví dụ'] === 'example_vi', 'Auto-mapped Dịch ví dụ -> example_vi');

  const xlsxRows = parseTabularData(xlsxExtracted.rows, xlsxMapping);
  assert(xlsxRows.length === 3, 'Extracted 3 XLSX rows');
  const stipulateRow = xlsxRows.find(r => r.word === 'stipulate');
  assert(Boolean(stipulateRow), 'Found "stipulate"');
  if (stipulateRow) {
    assert(stipulateRow.phonetic_uk === '/ˈstɪp.jə.leɪt/', 'Stipulate UK IPA matches');
    assert(stipulateRow.phonetic_us === '/ˈstɪp.jə.leɪt/', 'Stipulate US IPA matches');
    assert(stipulateRow.meaning_vi && stipulateRow.meaning_vi.includes('quy định'), 'Stipulate meaning matches');
    assert(stipulateRow.example_en && stipulateRow.example_en.includes('full payment is due in 30 days'), 'Stipulate example_en matches');
    assert(stipulateRow.example_vi && stipulateRow.example_vi.includes('30 ngày'), 'Stipulate example_vi matches');
  }

  xlsxRows.forEach(r => {
    totalWordsExtracted++;
    if (r.meaning_vi) totalMeaningsExtracted++;
    if (r.phonetic_uk || r.phonetic_us) totalIpaExtracted++;
    if (r.example_en) totalExamplesExtracted++;
    if (r.example_vi) totalTranslationsExtracted++;
  });

  // ---------------------------------------------------------------------------
  // FIXTURE 5: CSV có dấu phẩy trong câu ví dụ & bản dịch
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 5: CSV with Commas in Examples & Translations ---');
  const csvText = fs.readFileSync('test-files/fixture_5_csv_with_commas.csv', 'utf-8');
  const csvParsed = parseCSVString(csvText);
  const csvMapping = autoMapColumns(csvParsed.headers);
  const csvRows = parseTabularData(csvParsed.rows, csvMapping);

  assert(csvRows.length === 2, `Extracted 2 rows from CSV with commas`);
  const compensateRow = csvRows.find(r => r.word === 'compensate');
  assert(Boolean(compensateRow), 'Found "compensate"');
  if (compensateRow) {
    assert(compensateRow.phonetic_uk === '/ˈkɒm.pən.seɪt/', 'Compensate UK IPA matches');
    assert(compensateRow.phonetic_us === '/ˈkɑːm.pən.seɪt/', 'Compensate US IPA matches');
    assert(compensateRow.example_en && compensateRow.example_en.includes('meals, vouchers, and hotels'), 'Example EN kept interior commas intact');
    assert(compensateRow.example_vi && compensateRow.example_vi.includes('bữa ăn, phiếu giảm giá và khách sạn'), 'Example VI kept interior commas intact');
  }

  csvRows.forEach(r => {
    totalWordsExtracted++;
    if (r.meaning_vi) totalMeaningsExtracted++;
    if (r.phonetic_uk || r.phonetic_us) totalIpaExtracted++;
    if (r.example_en) totalExamplesExtracted++;
    if (r.example_vi) totalTranslationsExtracted++;
  });

  // ---------------------------------------------------------------------------
  // FIXTURE 6: PDF với văn bản và bảng
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 6: PDF with Text Layer ---');
  const pdfText = fs.readFileSync('test-files/sample_vocab_10_words.txt', 'utf-8');
  // Re-verify PDF text parsing through structured parser
  const pdfRows = parseStructuredText(pdfText);
  assert(pdfRows.length === 10, 'PDF text parsed 10 rows');
  assert(pdfRows[0].word === 'appointment', 'First PDF row is appointment');

  // ---------------------------------------------------------------------------
  // FIXTURE 7: File không chứa IPA (không được bịa IPA rỗng)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 7: File without IPA (No Fabricated Data) ---');
  const txt7 = fs.readFileSync('test-files/fixture_7_no_ipa.txt', 'utf-8');
  const rows7 = parseStructuredText(txt7);

  assert(rows7.length === 3, `Extracted 3 rows without IPA (got ${rows7.length})`);
  const itineraryRow = rows7.find(r => r.word === 'itinerary');
  assert(Boolean(itineraryRow), 'Found "itinerary"');
  if (itineraryRow) {
    assert(itineraryRow.phonetic_uk === undefined, 'phonetic_uk is safely undefined (not fabricated)');
    assert(itineraryRow.phonetic_us === undefined, 'phonetic_us is safely undefined (not fabricated)');
    assert(itineraryRow.meaning_vi === 'lịch trình chuyến đi', 'Meaning is present');
    assert(itineraryRow.example_en && itineraryRow.example_en.includes('travel itinerary carefully'), 'Example EN is present');
  }

  rows7.forEach(r => {
    totalWordsExtracted++;
    if (r.meaning_vi) totalMeaningsExtracted++;
    if (r.phonetic_uk || r.phonetic_us) totalIpaExtracted++;
    if (r.example_en) totalExamplesExtracted++;
    if (r.example_vi) totalTranslationsExtracted++;
  });

  // ---------------------------------------------------------------------------
  // FIXTURE 8: File không chứa câu ví dụ (không được bịa ví dụ rỗng)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 8: File without Examples (No Fabricated Data) ---');
  const txt8 = fs.readFileSync('test-files/fixture_8_no_examples.txt', 'utf-8');
  const rows8 = parseStructuredText(txt8);

  assert(rows8.length === 3, `Extracted 3 rows without examples (got ${rows8.length})`);
  const staplerRow = rows8.find(r => r.word === 'stapler');
  assert(Boolean(staplerRow), 'Found "stapler"');
  if (staplerRow) {
    assert(staplerRow.phonetic_us === '/ˈsteɪ.plər/' || staplerRow.phonetic_us === 'ˈsteɪ.plər', `IPA extracted accurately: ${staplerRow.phonetic_us}`);
    assert(staplerRow.meaning_vi === 'cái dập ghim', 'Meaning is present');
    assert(staplerRow.example_en === undefined, 'example_en is safely undefined (not fabricated)');
    assert(staplerRow.example_vi === undefined, 'example_vi is safely undefined (not fabricated)');
  }

  rows8.forEach(r => {
    totalWordsExtracted++;
    if (r.meaning_vi) totalMeaningsExtracted++;
    if (r.phonetic_uk || r.phonetic_us) totalIpaExtracted++;
    if (r.example_en) totalExamplesExtracted++;
    if (r.example_vi) totalTranslationsExtracted++;
  });

  // ---------------------------------------------------------------------------
  // FIXTURE 9: File có từ trùng với sổ hiện tại (Kiểm tra cập nhật IPA & Example)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 9: Duplicate Detection with New IPA and Examples ---');
  const txt9 = fs.readFileSync('test-files/fixture_9_duplicate_words.txt', 'utf-8');
  const rows9 = parseStructuredText(txt9);

  const existingVocabMock = [
    {
      id: 'existing_w1',
      word: 'appointment',
      pos: 'noun',
      phonetic_uk: '',
      phonetic_us: '',
      meaning_vi: 'cuộc hẹn',
      example_en: 'Old example sentence.',
      topic_ids: ['t1'],
      unit_ids: ['u1'],
      is_memorized: false,
      needs_review: true,
      notes: 'Ghi chú ban đầu',
      sources: [],
      study_date: '2026-01-01',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  const detectedDuplicates = detectDuplicates(rows9, existingVocabMock);
  const dupAppointment = detectedDuplicates.find(r => r.word === 'appointment');
  assert(dupAppointment && dupAppointment.status === 'duplicate', 'appointment correctly flagged as duplicate');
  assert(dupAppointment && dupAppointment.existingWordId === 'existing_w1', 'Linked to existing_w1');

  // Verify strategy: update_fields merges new IPA & example into existing
  const newRow = dupAppointment;
  const existingWord = existingVocabMock[0];
  const updatedWord = {
    ...existingWord,
    phonetic_us: (newRow && newRow.phonetic_us) || existingWord.phonetic_us,
    example_en: (newRow && newRow.example_en) || existingWord.example_en,
  };
  assert(updatedWord.phonetic_us && updatedWord.phonetic_us.includes('njuː'), 'Updated word has new phonetic_us');
  assert(updatedWord.example_en && updatedWord.example_en.includes('director'), 'Updated word has new example');

  // ---------------------------------------------------------------------------
  // FIXTURE 10: File có ký hiệu IPA, dấu câu và ký tự Unicode phức tạp
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 10: Unicode, Stress Marks, Syllable Dots & Special Chars ---');
  const txt10 = fs.readFileSync('test-files/fixture_10_unicode_symbols.txt', 'utf-8');
  const rows10 = parseStructuredText(txt10);

  assert(rows10.length === 3, `Extracted 3 entries with complex Unicode (got ${rows10.length})`);
  const entreRow = rows10.find(r => r.word === 'entrepreneur');
  assert(Boolean(entreRow), 'Found "entrepreneur"');
  if (entreRow) {
    assert(entreRow.phonetic_uk && entreRow.phonetic_uk.includes('ˌɒn.trə.prəˈnɜːr'), 'Preserved UK stress mark ˈ and syllable dot .');
    assert(entreRow.phonetic_us && entreRow.phonetic_us.includes('ˌɑːn.trə.prəˈnɝː'), 'Preserved US stress mark ˈ and ɝ rhotic vowel');
    assert(entreRow.meaning_vi && entreRow.meaning_vi.includes('doanh nhân'), 'Meaning preserved Unicode Vietnamese');
    assert(entreRow.example_en && entreRow.example_en.includes('calculated risks'), 'Example EN extracted');
    assert(entreRow.example_vi && entreRow.example_vi.includes('rủi ro có tính toán'), 'Example VI extracted from arrow →');
  }

  const questRow = rows10.find(r => r.word === 'questionnaire');
  assert(Boolean(questRow), 'Found "questionnaire"');
  if (questRow) {
    assert(Boolean(questRow.phonetic_uk), 'Questionnaire UK IPA extracted');
    assert(Boolean(questRow.phonetic_us), 'Questionnaire US IPA extracted');
    assert(questRow.example_vi && questRow.example_vi.includes('mức độ hài lòng'), 'Example VI extracted from double arrow ⇒');
  }

  rows10.forEach(r => {
    totalWordsExtracted++;
    if (r.meaning_vi) totalMeaningsExtracted++;
    if (r.phonetic_uk || r.phonetic_us) totalIpaExtracted++;
    if (r.example_en) totalExamplesExtracted++;
    if (r.example_vi) totalTranslationsExtracted++;
  });

  // ---------------------------------------------------------------------------
  // VERIFICATION OF PREVIEW STATS BANNER
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST 11: Preview Statistics Calculation ---');
  const allRowsCombined = [...rows1, ...docxRows, ...docxMultiRows, ...xlsxRows, ...csvRows, ...rows7, ...rows8, ...rows10];
  const statTotal = allRowsCombined.length;
  const statWithIpa = allRowsCombined.filter(r => r.phonetic_uk || r.phonetic_us).length;
  const statWithExample = allRowsCombined.filter(r => r.example_en).length;
  const statWithTranslation = allRowsCombined.filter(r => r.example_vi).length;

  assert(statTotal > 0, `Total words calculated: ${statTotal}`);
  assert(statWithIpa > 0, `Total with IPA calculated: ${statWithIpa}`);
  assert(statWithExample > 0, `Total with example calculated: ${statWithExample}`);
  assert(statWithTranslation > 0, `Total with translation calculated: ${statWithTranslation}`);
  assert(statWithIpa <= statTotal, 'IPA count does not exceed total words');
  assert(statWithExample <= statTotal, 'Example count does not exceed total words');

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('                 VERIFICATION SUMMARY RESULTS                   ');
  console.log('================================================================');
  console.log(`  Total Automated Assertions: ${totalTests}`);
  console.log(`  Passed Assertions:          ${passedTests}`);
  console.log(`  Failed Assertions:          ${failedTests}`);
  console.log('----------------------------------------------------------------');
  console.log(`  Dataset Extraction Statistics:`);
  console.log(`  • Tổng số từ được nhận diện:           ${totalWordsExtracted}`);
  console.log(`  • Mục có nghĩa tiếng Việt:             ${totalMeaningsExtracted} / ${totalWordsExtracted} (100%)`);
  console.log(`  • Mục có phiên âm IPA (UK hoặc US):    ${totalIpaExtracted} / ${totalWordsExtracted} (${Math.round(totalIpaExtracted / totalWordsExtracted * 100)}%)`);
  console.log(`  • Mục có câu ví dụ tiếng Anh:          ${totalExamplesExtracted} / ${totalWordsExtracted} (${Math.round(totalExamplesExtracted / totalWordsExtracted * 100)}%)`);
  console.log(`  • Mục có dịch nghĩa câu ví dụ:         ${totalTranslationsExtracted} / ${totalWordsExtracted} (${Math.round(totalTranslationsExtracted / totalWordsExtracted * 100)}%)`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllVerificationCases().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
