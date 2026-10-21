import {
  parseStructuredText,
  parseTabularData,
  autoMapColumns,
  extractIPAFromText,
  looksLikeIPA,
  formatAsIPA,
  cleanWordField,
  cleanMeaningField,
} from '../src/lib/file-parser/vocabulary-analyzer.ts';

let passed = 0;
let failed = 0;

function assert(condition, name, detail) {
  if (condition) {
    passed++;
    console.log(`✅ [PASS] ${name}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] ${name}${detail ? ` -> ${detail}` : ''}`);
  }
}

console.log('=== TEST SUITE: PHIÊN ÂM (IPA) VÀ NGHĨA IMPROVEMENTS ===\n');

// 1. No delimiter, Vietnamese starting with ASCII consonant (cuộc hẹn)
console.log('--- Case 1: No delimiter, Vietnamese starts with ASCII letter (appointment cuộc hẹn) ---');
const r1 = parseStructuredText('appointment cuộc hẹn');
assert(r1.length === 1, 'Parsed 1 row');
assert(r1[0]?.word === 'appointment', `Word is "appointment" (got "${r1[0]?.word}")`);
assert(r1[0]?.meaning_vi === 'cuộc hẹn', `Meaning is "cuộc hẹn" (got "${r1[0]?.meaning_vi}")`);

// 2. No delimiter, Tone-less Vietnamese words (revenue doanh thu)
console.log('\n--- Case 2: No delimiter, toneless Vietnamese (revenue doanh thu) ---');
const r2 = parseStructuredText('revenue doanh thu');
assert(r2.length === 1, 'Parsed 1 row');
assert(r2[0]?.word === 'revenue', `Word is "revenue" (got "${r2[0]?.word}")`);
assert(r2[0]?.meaning_vi === 'doanh thu', `Meaning is "doanh thu" (got "${r2[0]?.meaning_vi}")`);

// 3. IPA separating word and meaning without delimiter (appointment /əˈpɔɪnt.mənt/ cuộc hẹn)
console.log('\n--- Case 3: IPA as boundary without delimiter ---');
const r3 = parseStructuredText('appointment /əˈpɔɪnt.mənt/ cuộc hẹn');
assert(r3.length === 1, 'Parsed 1 row');
assert(r3[0]?.word === 'appointment', `Word is "appointment" (got "${r3[0]?.word}")`);
assert(r3[0]?.phonetic_us === '/əˈpɔɪnt.mənt/', `IPA is "/əˈpɔɪnt.mənt/" (got "${r3[0]?.phonetic_us}")`);
assert(r3[0]?.meaning_vi === 'cuộc hẹn', `Meaning is "cuộc hẹn" (got "${r3[0]?.meaning_vi}")`);

// 4. POS with dot separating word and meaning (candidate (n.) ứng viên)
console.log('\n--- Case 4: POS with dot (n.) separating word and meaning ---');
const r4 = parseStructuredText('candidate (n.) ứng viên');
assert(r4.length === 1, 'Parsed 1 row');
assert(r4[0]?.word === 'candidate', `Word is "candidate" (got "${r4[0]?.word}")`);
assert(r4[0]?.pos === 'noun', `POS is noun (got "${r4[0]?.pos}")`);
assert(r4[0]?.meaning_vi === 'ứng viên', `Meaning is "ứng viên" (got "${r4[0]?.meaning_vi}")`);

// 5. IPA inside parentheses (appointment (əˈpɔɪnt.mənt) - cuộc hẹn)
console.log('\n--- Case 5: IPA inside parentheses (əˈpɔɪnt.mənt) ---');
const r5 = parseStructuredText('appointment (əˈpɔɪnt.mənt) - cuộc hẹn');
assert(r5.length === 1, 'Parsed 1 row');
assert(r5[0]?.word === 'appointment', `Word is "appointment" (got "${r5[0]?.word}")`);
assert(r5[0]?.phonetic_us === '/əˈpɔɪnt.mənt/', `IPA extracted and wrapped in slashes (got "${r5[0]?.phonetic_us}")`);
assert(r5[0]?.meaning_vi === 'cuộc hẹn', `Meaning is "cuộc hẹn" (got "${r5[0]?.meaning_vi}")`);

// 6. POS prefix inside meaning (appointment - n. cuộc hẹn)
console.log('\n--- Case 6: POS prefix in meaning (appointment - n. cuộc hẹn) ---');
const r6 = parseStructuredText('appointment - n. cuộc hẹn');
assert(r6.length === 1, 'Parsed 1 row');
assert(r6[0]?.word === 'appointment', `Word is "appointment" (got "${r6[0]?.word}")`);
assert(r6[0]?.pos === 'noun', `POS is noun (got "${r6[0]?.pos}")`);
assert(r6[0]?.meaning_vi === 'cuộc hẹn', `Cleaned POS out of meaning (got "${r6[0]?.meaning_vi}")`);

// 7. Tab-separated with IPA in column 2 (appointment \t /əˈpɔɪnt.mənt/ \t cuộc hẹn \t n \t Ex sentence.)
console.log('\n--- Case 7: Tab-separated with IPA in column 2 ---');
const r7 = parseStructuredText('appointment\t/əˈpɔɪnt.mənt/\tcuộc hẹn\tn\tPlease schedule an appointment with Dr. Smith.');
assert(r7.length === 1, 'Parsed 1 row');
assert(r7[0]?.word === 'appointment', `Word is "appointment" (got "${r7[0]?.word}")`);
assert(r7[0]?.phonetic_us === '/əˈpɔɪnt.mənt/', `IPA is "/əˈpɔɪnt.mənt/" (got "${r7[0]?.phonetic_us}")`);
assert(r7[0]?.meaning_vi === 'cuộc hẹn', `Meaning is "cuộc hẹn" (got "${r7[0]?.meaning_vi}")`);
assert(r7[0]?.pos === 'noun', `POS is "noun" (got "${r7[0]?.pos}")`);
assert(r7[0]?.example_en === 'Please schedule an appointment with Dr. Smith.', `Example EN extracted`);

// 8. Straight quotes and colons in IPA (meet /mi:t/ - gặp gỡ, contract /kən'trækt/)
console.log('\n--- Case 8: Straight apostrophes and colons in IPA ---');
assert(looksLikeIPA('mi:t'), 'looksLikeIPA recognizes /mi:t/ with colon length mark');
assert(looksLikeIPA("kən'trækt"), "looksLikeIPA recognizes /kən'trækt/ with straight apostrophe");
const r8 = parseStructuredText('meet /mi:t/ - gặp gỡ');
assert(r8[0]?.phonetic_us === '/mi:t/', `Extracted /mi:t/ (got "${r8[0]?.phonetic_us}")`);

// 9. British optional sound notation in parens /kɑː(r)/
console.log('\n--- Case 9: British optional sound notation /kɑː(r)/ ---');
assert(looksLikeIPA('kɑː(r)'), 'looksLikeIPA recognizes /kɑː(r)/');
const r9 = parseStructuredText('car /kɑː(r)/ - xe hơi, ô tô');
assert(r9[0]?.phonetic_us === '/kɑː(r)/', `Extracted /kɑː(r)/ (got "${r9[0]?.phonetic_us}")`);
assert(r9[0]?.meaning_vi.includes('xe hơi'), 'Meaning is "xe hơi, ô tô"');

// 10. Tabular (CSV/Excel) cell cleaning
console.log('\n--- Case 10: Tabular data cleaning ---');
const rawRows = [
  { 'Từ': 'schedule (v.)', 'Nghĩa': 'v. lên lịch trình; n. thời gian biểu', 'Phát âm': '/ˈskedʒ.uːl/ (US), /ˈʃedʒ.uːl/ (UK)' }
];
const mapping = autoMapColumns(['Từ', 'Nghĩa', 'Phát âm']);
const r10 = parseTabularData(rawRows, mapping);
assert(r10[0]?.word === 'schedule', `Cleaned Word is "schedule" (got "${r10[0]?.word}")`);
assert(r10[0]?.pos === 'verb', `POS detected as verb (got "${r10[0]?.pos}")`);
assert(r10[0]?.phonetic_us === '/ˈskedʒ.uːl/', `Extracted US IPA from tabular cell (got "${r10[0]?.phonetic_us}")`);
assert(r10[0]?.phonetic_uk === '/ˈʃedʒ.uːl/', `Extracted UK IPA from tabular cell (got "${r10[0]?.phonetic_uk}")`);
assert(r10[0]?.meaning_vi.includes('lên lịch trình'), `Meaning is clean (got "${r10[0]?.meaning_vi}")`);

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);
