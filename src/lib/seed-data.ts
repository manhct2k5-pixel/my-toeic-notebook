import { Topic, Unit, VocabularyItem, ListeningLesson, ReadingLesson } from '@/types';

export const SEED_TOPICS: Topic[] = [
  {
    id: 'topic-office',
    name: 'Office & Work',
    description: 'Từ vựng môi trường công sở, họp hành, quản lý công việc và đồng nghiệp',
    color: '#2563eb',
    created_at: '2026-10-15T08:00:00Z',
    updated_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'topic-finance',
    name: 'Finance & Banking',
    description: 'Từ vựng tài chính, thanh toán, ngân sách, hóa đơn và kế toán',
    color: '#059669',
    created_at: '2026-10-15T08:00:00Z',
    updated_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'topic-contracts',
    name: 'Contracts & Agreements',
    description: 'Hợp đồng, điều khoản, cam kết và đàm phán thương mại',
    color: '#7c3aed',
    created_at: '2026-10-15T08:00:00Z',
    updated_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'topic-marketing',
    name: 'Marketing & Sales',
    description: 'Chiến dịch quảng bá, nghiên cứu thị trường và tiếp thị khách hàng',
    color: '#ea580c',
    created_at: '2026-10-15T08:00:00Z',
    updated_at: '2026-10-15T08:00:00Z',
  },
];

export const SEED_UNITS: Unit[] = [
  {
    id: 'unit-01',
    title: 'Lesson 01 – Contracts',
    description: 'Các từ vựng cốt lõi về ký kết hợp đồng, điều khoản và hủy bỏ thỏa thuận',
    category: 'General',
    created_at: '2026-10-15T08:00:00Z',
    updated_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'unit-02',
    title: 'Lesson 02 – Marketing',
    description: 'Từ vựng về thu hút khách hàng, thuyết phục và tung sản phẩm mới',
    category: 'General',
    created_at: '2026-10-15T08:00:00Z',
    updated_at: '2026-10-15T08:00:00Z',
  },
  {
    id: 'unit-listen-01',
    title: 'TOEIC Listening – Part 2 – Unit 01',
    description: 'Hỏi đáp trong công sở: lịch họp, phân công dự án và báo cáo',
    category: 'Listening',
    created_at: '2026-10-16T08:00:00Z',
    updated_at: '2026-10-16T08:00:00Z',
  },
  {
    id: 'unit-read-01',
    title: 'TOEIC Reading – Part 7 – Unit 03',
    description: 'Thư điện tử thông báo lịch bảo trì văn phòng và ngân sách quý',
    category: 'Reading',
    created_at: '2026-10-16T08:00:00Z',
    updated_at: '2026-10-16T08:00:00Z',
  },
];

export const SEED_VOCABULARY: VocabularyItem[] = [
  {
    id: 'vocab-appointment',
    word: 'appointment',
    pos: 'noun',
    phonetic_uk: '/əˈpɔɪnt.mənt/',
    phonetic_us: '/əˈpɔɪnt.mənt/',
    meaning_vi: 'cuộc hẹn, sự bổ nhiệm',
    example_en: 'I would like to make an appointment with the marketing director for next Monday.',
    example_vi: 'Tôi muốn đặt một cuộc hẹn với giám đốc tiếp thị vào thứ Hai tới.',
    collocations: [
      'make an appointment: đặt cuộc hẹn',
      'keep / cancel an appointment: giữ / hủy cuộc hẹn',
      'by appointment only: chỉ nhận khách có hẹn trước',
    ],
    notes: `### Cụm từ TOEIC hay gặp:
* **schedule an appointment**: sắp xếp cuộc hẹn
* **confirm an appointment**: xác nhận lịch hẹn
* **doctor's appointment**: lịch hẹn với bác sĩ

> **Mẹo nhớ:** Đi với giới từ \`with somebody\` (hẹn với ai) và \`for something / some time\` (vào thời gian nào).`,
    study_date: '2026-10-16',
    topic_ids: ['topic-office'],
    unit_ids: ['unit-01'],
    is_memorized: false,
    needs_review: true,
    review_interval_days: 1,
    ease_factor: 2.5,
    repetitions: 0,
    next_review_date: '2026-10-16',
    incorrect_count: 0,
    correct_count: 1,
    sources: [
      {
        type: 'manual',
        lessonTitle: 'Tự thêm vào sổ',
        contextSentence: 'I have an urgent appointment at 2 PM.',
        timestamp: '2026-10-16T09:00:00Z',
      },
    ],
    created_at: '2026-10-16T09:00:00Z',
    updated_at: '2026-10-16T09:00:00Z',
  },
  {
    id: 'vocab-schedule',
    word: 'schedule',
    pos: 'noun',
    phonetic_uk: '/ˈʃedʒ.uːl/',
    phonetic_us: '/ˈskedʒ.uːl/',
    meaning_vi: 'lịch trình, tiến độ; lên lịch',
    example_en: 'The maintenance work was completed two days ahead of schedule.',
    example_vi: 'Công việc bảo trì đã hoàn thành sớm hơn 2 ngày so với kế hoạch.',
    collocations: [
      'ahead of schedule: sớm hơn dự kiến',
      'behind schedule: chậm tiến độ',
      'on schedule: đúng tiến độ',
      'tight schedule: lịch trình dày đặc',
    ],
    notes: `### Ghi chú quan trọng:
* **Phát âm:** Người Anh đọc là \`/ˈʃedʒ.uːl/\` (âm "sh"), người Mỹ đọc là \`/ˈskedʒ.uːl/\` (âm "sk").
* **Động từ:** \`schedule a meeting\` (lên lịch một cuộc họp), \`be scheduled to do sth\` (dự kiến làm gì).

*Ví dụ:* The flight is scheduled to arrive at 4:30 PM.`,
    study_date: '2026-10-16',
    topic_ids: ['topic-office'],
    unit_ids: ['unit-01', 'unit-listen-01'],
    is_memorized: true,
    needs_review: false,
    review_interval_days: 6,
    ease_factor: 2.6,
    repetitions: 2,
    next_review_date: '2026-10-22',
    incorrect_count: 0,
    correct_count: 3,
    sources: [
      {
        type: 'listening',
        lessonTitle: 'TOEIC Listening – Part 2 – Unit 01',
        contextSentence: 'Is the new marketing campaign still on schedule?',
        timestamp: '2026-10-16T10:00:00Z',
      },
    ],
    created_at: '2026-10-16T10:00:00Z',
    updated_at: '2026-10-16T10:00:00Z',
  },
  {
    id: 'vocab-obligate',
    word: 'obligate',
    pos: 'verb',
    phonetic_uk: '/ˈɒb.lɪ.ɡeɪt/',
    phonetic_us: '/ˈɑː.blə.ɡeɪt/',
    meaning_vi: 'bắt buộc, ép buộc về mặt pháp lý hoặc đạo đức',
    example_en: 'The contractor is obligated to finish the construction before December 1st.',
    example_vi: 'Nhà thầu có nghĩa vụ phải hoàn thành công trình trước ngày 1 tháng 12.',
    collocations: [
      'be obligated to do sth: có nghĩa vụ phải làm gì',
      'contractual obligation: nghĩa vụ theo hợp đồng',
    ],
    notes: `### Cấu trúc ngữ pháp TOEIC:
* \`be obligated to + V-infinitive\`: có nghĩa vụ làm gì.
* Từ loại liên quan: **obligation** (noun - nghĩa vụ), **obligatory** (adj - bắt buộc).
* *Bẫy đề thi:* TOEIC thường kiểm tra dạng phân từ bị động \`obligated\`.`,
    study_date: '2026-10-16',
    topic_ids: ['topic-contracts'],
    unit_ids: ['unit-01'],
    is_memorized: false,
    needs_review: true,
    review_interval_days: 1,
    ease_factor: 2.4,
    repetitions: 0,
    next_review_date: '2026-10-16',
    incorrect_count: 1,
    correct_count: 0,
    sources: [
      {
        type: 'manual',
        lessonTitle: 'Lesson 01 – Contracts',
        contextSentence: 'Both parties are obligated to comply with clause 5.',
        timestamp: '2026-10-16T10:30:00Z',
      },
    ],
    created_at: '2026-10-16T10:30:00Z',
    updated_at: '2026-10-16T10:30:00Z',
  },
  {
    id: 'vocab-negotiate',
    word: 'negotiate',
    pos: 'verb',
    phonetic_uk: '/nəˈɡəʊ.ʃi.eɪt/',
    phonetic_us: '/nəˈɡoʊ.ʃi.eɪt/',
    meaning_vi: 'thương lượng, đàm phán',
    example_en: 'The procurement manager successfully negotiated a 15% discount with the supplier.',
    example_vi: 'Trưởng phòng mua sắm đã đàm phán thành công mức giảm giá 15% với nhà cung cấp.',
    collocations: [
      'negotiate a contract: đàm phán hợp đồng',
      'negotiate with somebody: đàm phán với ai',
      'terms of negotiation: điều khoản đàm phán',
    ],
    notes: `* **Danh từ:** \`negotiation\` (cuộc đàm phán)
* **Tính từ:** \`negotiable\` (có thể thương lượng) >< \`non-negotiable\` (không thể thương lượng).
* Mẹo: Trong Part 7, từ đồng nghĩa hay gặp là \`bargain\`, \`discuss terms\`.`,
    study_date: '2026-10-16',
    topic_ids: ['topic-contracts', 'topic-office'],
    unit_ids: ['unit-01'],
    is_memorized: false,
    needs_review: true,
    review_interval_days: 2,
    ease_factor: 2.5,
    repetitions: 1,
    next_review_date: '2026-10-17',
    incorrect_count: 0,
    correct_count: 1,
    sources: [
      {
        type: 'reading',
        lessonTitle: 'TOEIC Reading – Part 7 – Unit 03',
        contextSentence: 'We hope to negotiate the delivery timeframe by tomorrow.',
        timestamp: '2026-10-16T11:00:00Z',
      },
    ],
    created_at: '2026-10-16T11:00:00Z',
    updated_at: '2026-10-16T11:00:00Z',
  },
  {
    id: 'vocab-persuade',
    word: 'persuade',
    pos: 'verb',
    phonetic_uk: '/pəˈsweɪd/',
    phonetic_us: '/pɚˈsweɪd/',
    meaning_vi: 'thuyết phục',
    example_en: 'The sales team worked hard to persuade the client to sign the extended warranty.',
    example_vi: 'Đội ngũ bán hàng đã nỗ lực thuyết phục khách hàng ký gói bảo hành mở rộng.',
    collocations: [
      'persuade somebody to do sth: thuyết phục ai làm gì',
      'persuasive argument: lập luận đầy thuyết phục',
    ],
    notes: `### Cấu trúc cần nhớ:
* \`persuade sb to do sth\` (chủ động)
* \`be persuaded that + mệnh đề\`
* Từ đồng nghĩa: \`convince\` (lưu ý: convince sb of sth / convince sb to do sth).`,
    study_date: '2026-10-15',
    topic_ids: ['topic-marketing'],
    unit_ids: ['unit-02'],
    is_memorized: true,
    needs_review: false,
    review_interval_days: 4,
    ease_factor: 2.5,
    repetitions: 2,
    next_review_date: '2026-10-19',
    incorrect_count: 0,
    correct_count: 2,
    sources: [
      {
        type: 'manual',
        lessonTitle: 'Lesson 02 – Marketing',
        contextSentence: 'She persuaded the board of investors.',
        timestamp: '2026-10-15T14:00:00Z',
      },
    ],
    created_at: '2026-10-15T14:00:00Z',
    updated_at: '2026-10-15T14:00:00Z',
  },
  {
    id: 'vocab-budget',
    word: 'budget',
    pos: 'noun',
    phonetic_uk: '/ˈbʌdʒ.ɪt/',
    phonetic_us: '/ˈbʌdʒ.ɪt/',
    meaning_vi: 'ngân sách; dự trù kinh phí',
    example_en: 'The advertising department has exceeded its allocated budget for this quarter.',
    example_vi: 'Phòng quảng cáo đã vượt quá ngân sách được phân bổ cho quý này.',
    collocations: [
      'within budget: trong phạm vi ngân sách',
      'over budget: vượt quá ngân sách',
      'annual budget: ngân sách hàng năm',
      'budget deficit: thâm hụt ngân sách',
    ],
    notes: `* Động từ: \`budget for sth\` (lên ngân sách cho cái gì).
* Tính từ: \`budget hotel / budget airline\` (khách sạn/hãng hàng không giá rẻ, bình dân).`,
    study_date: '2026-10-15',
    topic_ids: ['topic-finance'],
    unit_ids: ['unit-read-01'],
    is_memorized: true,
    needs_review: false,
    review_interval_days: 6,
    ease_factor: 2.5,
    repetitions: 3,
    next_review_date: '2026-10-21',
    incorrect_count: 0,
    correct_count: 3,
    sources: [
      {
        type: 'reading',
        lessonTitle: 'TOEIC Reading – Part 7 – Unit 03',
        contextSentence: 'The board approved the annual operating budget.',
        timestamp: '2026-10-15T15:00:00Z',
      },
    ],
    created_at: '2026-10-15T15:00:00Z',
    updated_at: '2026-10-15T15:00:00Z',
  },
  {
    id: 'vocab-reimburse',
    word: 'reimburse',
    pos: 'verb',
    phonetic_uk: '/ˌriː.ɪmˈbɜːs/',
    phonetic_us: '/ˌriː.ɪmˈbɝːs/',
    meaning_vi: 'hoàn trả, thanh toán lại (tiền đã tự chi trước)',
    example_en: 'The company will reimburse travel expenses if you submit original receipts within 7 days.',
    example_vi: 'Công ty sẽ hoàn lại chi phí công tác nếu bạn nộp hóa đơn gốc trong vòng 7 ngày.',
    collocations: [
      'reimburse expenses: hoàn trả chi phí',
      'reimbursement claim: đơn yêu cầu hoàn tiền',
    ],
    notes: `### Cực kỳ phổ biến trong TOEIC Part 7:
Xuất hiện trong các email công tác hoặc chính sách tài chính của công ty.
* \`reimburse somebody for something\`: hoàn tiền cho ai về khoản gì.
* Từ đồng nghĩa: \`refund\`, \`compensate\`.`,
    study_date: '2026-10-15',
    topic_ids: ['topic-finance', 'topic-office'],
    unit_ids: ['unit-read-01'],
    is_memorized: false,
    needs_review: true,
    review_interval_days: 1,
    ease_factor: 2.3,
    repetitions: 0,
    next_review_date: '2026-10-16',
    incorrect_count: 2,
    correct_count: 1,
    sources: [
      {
        type: 'reading',
        lessonTitle: 'TOEIC Reading – Part 7 – Unit 03',
        contextSentence: 'Employees will be reimbursed for taxi fares.',
        timestamp: '2026-10-15T16:00:00Z',
      },
    ],
    created_at: '2026-10-15T16:00:00Z',
    updated_at: '2026-10-15T16:00:00Z',
  },
  {
    id: 'vocab-complimentary',
    word: 'complimentary',
    pos: 'adjective',
    phonetic_uk: '/ˌkɒm.plɪˈmen.tər.i/',
    phonetic_us: '/ˌkɑːm.pləˈmen.t̬ɚ.i/',
    meaning_vi: 'miễn phí; ca ngợi',
    example_en: 'All hotel guests receive a complimentary breakfast buffet each morning.',
    example_vi: 'Tất cả khách lưu trú tại khách sạn đều được phục vụ bữa sáng buffet miễn phí mỗi sáng.',
    collocations: [
      'complimentary shuttle service: xe đưa đón miễn phí',
      'complimentary refreshments: đồ uống nhẹ miễn phí',
      'complimentary remarks: những lời khen ngợi',
    ],
    notes: `### Bẫy chính tả & nghĩa trong TOEIC:
* \`complimentary\` (có chữ "i"): miễn phí (= free) HOẶC khen ngợi.
* \`complementary\` (có chữ "e"): mang tính bổ sung, tương hỗ (= mutually reinforcing).`,
    study_date: '2026-10-15',
    topic_ids: ['topic-marketing'],
    unit_ids: ['unit-02'],
    is_memorized: true,
    needs_review: false,
    review_interval_days: 5,
    ease_factor: 2.6,
    repetitions: 2,
    next_review_date: '2026-10-20',
    incorrect_count: 0,
    correct_count: 2,
    sources: [
      {
        type: 'manual',
        lessonTitle: 'Lesson 02 – Marketing',
        contextSentence: 'We offer complimentary samples to visitors.',
        timestamp: '2026-10-15T17:00:00Z',
      },
    ],
    created_at: '2026-10-15T17:00:00Z',
    updated_at: '2026-10-15T17:00:00Z',
  },
  {
    id: 'vocab-specification',
    word: 'specification',
    pos: 'noun',
    phonetic_uk: '/ˌspes.ɪ.fɪˈkeɪ.ʃən/',
    phonetic_us: '/ˌspes.ə.fəˈkeɪ.ʃən/',
    meaning_vi: 'thông số kỹ thuật, bản đặc tả chi tiết',
    example_en: 'The device was manufactured according to the client’s strict specifications.',
    example_vi: 'Thiết bị được chế tạo theo các thông số kỹ thuật nghiêm ngặt của khách hàng.',
    collocations: [
      'meet specifications: đáp ứng thông số kỹ thuật',
      'technical specifications (specs): thông số kỹ thuật',
      'detailed specification: bản mô tả chi tiết',
    ],
    notes: `* Thường gặp dạng viết tắt là \`specs\`.
* Động từ: \`specify\` (nêu rõ, chỉ định cụ thể).
* Tính từ: \`specific\` (cụ thể, riêng biệt).`,
    study_date: '2026-10-14',
    topic_ids: ['topic-office'],
    unit_ids: ['unit-01'],
    is_memorized: false,
    needs_review: true,
    review_interval_days: 1,
    ease_factor: 2.5,
    repetitions: 0,
    next_review_date: '2026-10-16',
    incorrect_count: 1,
    correct_count: 0,
    sources: [
      {
        type: 'manual',
        lessonTitle: 'Lesson 01 – Contracts',
        contextSentence: 'Please review the product specifications.',
        timestamp: '2026-10-14T09:00:00Z',
      },
    ],
    created_at: '2026-10-14T09:00:00Z',
    updated_at: '2026-10-14T09:00:00Z',
  },
  {
    id: 'vocab-eligible',
    word: 'eligible',
    pos: 'adjective',
    phonetic_uk: '/ˈel.ɪ.dʒə.bəl/',
    phonetic_us: '/ˈel.ə.dʒə.bəl/',
    meaning_vi: 'đủ tư cách, đủ điều kiện',
    example_en: 'Full-time employees are eligible for paid sick leave after three months of service.',
    example_vi: 'Nhân viên toàn thời gian đủ điều kiện hưởng chế độ nghỉ ốm có lương sau 3 tháng làm việc.',
    collocations: [
      'eligible for sth: đủ điều kiện nhận cái gì',
      'eligible to do sth: đủ điều kiện làm cái gì',
      'eligible candidate: ứng viên đủ điều kiện',
    ],
    notes: `### Cấu trúc bắt buộc học thuộc:
* \`be eligible for + Noun\` (ví dụ: promotion, bonus, discount)
* \`be eligible to + Verb\` (ví dụ: participate, vote, apply)
* Trái nghĩa: \`ineligible\` (không đủ điều kiện).`,
    study_date: '2026-10-14',
    topic_ids: ['topic-office'],
    unit_ids: ['unit-read-01'],
    is_memorized: true,
    needs_review: false,
    review_interval_days: 7,
    ease_factor: 2.6,
    repetitions: 3,
    next_review_date: '2026-10-21',
    incorrect_count: 0,
    correct_count: 3,
    sources: [
      {
        type: 'reading',
        lessonTitle: 'TOEIC Reading – Part 7 – Unit 03',
        contextSentence: 'Only registered members are eligible to participate.',
        timestamp: '2026-10-14T11:00:00Z',
      },
    ],
    created_at: '2026-10-14T11:00:00Z',
    updated_at: '2026-10-14T11:00:00Z',
  },
  {
    id: 'vocab-launch',
    word: 'launch',
    pos: 'verb',
    phonetic_uk: '/lɔːntʃ/',
    phonetic_us: '/lɑːntʃ/',
    meaning_vi: 'tung ra, ra mắt (sản phẩm, chiến dịch); sự kiện ra mắt',
    example_en: 'The tech company plans to launch its new flagship smartphone next month.',
    example_vi: 'Công ty công nghệ dự kiến sẽ ra mắt mẫu điện thoại thông minh cao cấp mới vào tháng tới.',
    collocations: [
      'product launch: buổi ra mắt sản phẩm',
      'launch a marketing campaign: khởi động chiến dịch tiếp thị',
      'launch event: sự kiện ra mắt',
    ],
    notes: `* Có thể vừa là động từ, vừa là danh từ.
* Từ đồng nghĩa: \`introduce\`, \`roll out\`, \`release\`.`,
    study_date: '2026-10-14',
    topic_ids: ['topic-marketing'],
    unit_ids: ['unit-02'],
    is_memorized: true,
    needs_review: false,
    review_interval_days: 5,
    ease_factor: 2.5,
    repetitions: 2,
    next_review_date: '2026-10-19',
    incorrect_count: 0,
    correct_count: 2,
    sources: [
      {
        type: 'manual',
        lessonTitle: 'Lesson 02 – Marketing',
        contextSentence: 'The product launch is set for November.',
        timestamp: '2026-10-14T14:00:00Z',
      },
    ],
    created_at: '2026-10-14T14:00:00Z',
    updated_at: '2026-10-14T14:00:00Z',
  },
  {
    id: 'vocab-colleague',
    word: 'colleague',
    pos: 'noun',
    phonetic_uk: '/ˈkɒl.iːɡ/',
    phonetic_us: '/ˈkɑː.liːɡ/',
    meaning_vi: 'đồng nghiệp',
    example_en: 'He consulted with several senior colleagues before making the final decision.',
    example_vi: 'Anh ấy đã tham khảo ý kiến của một số đồng nghiệp kỳ cựu trước khi đưa ra quyết định cuối cùng.',
    collocations: [
      'respected colleague: đồng nghiệp đáng kính',
      'former colleague: đồng nghiệp cũ',
      'work colleague: bạn đồng nghiệp',
    ],
    notes: `* Từ đồng nghĩa trong môi trường làm việc: \`coworker\`, \`associate\`.
* Thường xuất hiện trong Part 3 (hội thoại văn phòng) và Part 4 (giới thiệu nhân viên).`,
    study_date: '2026-10-14',
    topic_ids: ['topic-office'],
    unit_ids: ['unit-listen-01'],
    is_memorized: true,
    needs_review: false,
    review_interval_days: 6,
    ease_factor: 2.5,
    repetitions: 3,
    next_review_date: '2026-10-20',
    incorrect_count: 0,
    correct_count: 3,
    sources: [
      {
        type: 'listening',
        lessonTitle: 'TOEIC Listening – Part 2 – Unit 01',
        contextSentence: 'Did your colleagues approve the draft proposal?',
        timestamp: '2026-10-14T16:00:00Z',
      },
    ],
    created_at: '2026-10-14T16:00:00Z',
    updated_at: '2026-10-14T16:00:00Z',
  },
];

export const SEED_LISTENING_LESSONS: ListeningLesson[] = [
  {
    id: 'listen-part-1-01',
    part: 1,
    title: 'Part 1: Photographs – Office Setting',
    description: 'Miêu tả hành động của người và vị trí đồ vật trong phòng làm việc văn phòng.',
    difficulty: 'Beginner',
    audio_url: '',
    image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    transcript: `(A) A woman is typing on a computer keyboard.
(B) Some people are gathered around a conference table.
(C) They are hanging pictures on the wall.
(D) The office chairs are being stacked in the corner.`,
    questions: [
      {
        id: 'q-lp1-1',
        prompt: 'Look at the image and choose the statement that best describes what you see:',
        options: [
          { key: 'A', text: 'A woman is typing on a computer keyboard.' },
          { key: 'B', text: 'Some people are gathered around a conference table.' },
          { key: 'C', text: 'They are hanging pictures on the wall.' },
          { key: 'D', text: 'The office chairs are being stacked in the corner.' },
        ],
        correct_answer: 'B',
        explanation_vi: 'Bức ảnh hiển thị một nhóm người đang cùng ngồi họp quanh bàn làm việc/bàn hội nghị. Phương án (B) "Some people are gathered around a conference table" miêu tả chính xác nhất.',
      },
    ],
  },
  {
    id: 'listen-part-2-01',
    part: 2,
    title: 'Part 2: Question – Response – Scheduling',
    description: 'Nghe câu hỏi về lịch họp và chọn phản hồi tự nhiên, chuẩn xác trong ngữ cảnh công sở.',
    difficulty: 'Beginner',
    audio_url: '',
    transcript: `Question: Where is the annual financial summary being held this year?
(A) In the main auditorium on the second floor.
(B) Yes, I received the report this morning.
(C) At half past three in the afternoon.`,
    questions: [
      {
        id: 'q-lp2-1',
        prompt: 'Question: Where is the annual financial summary being held this year?',
        options: [
          { key: 'A', text: '(A) In the main auditorium on the second floor.' },
          { key: 'B', text: '(B) Yes, I received the report this morning.' },
          { key: 'C', text: '(C) At half past three in the afternoon.' },
        ],
        correct_answer: 'A',
        explanation_vi: 'Câu hỏi bắt đầu bằng "Where" (ở đâu), cần trả lời bằng một địa điểm cụ thể. (A) "In the main auditorium on the second floor" là địa điểm (hội trường chính tầng 2). (B) trả lời Yes/No cho câu hỏi Wh- là sai; (C) trả lời về thời gian (When).',
      },
      {
        id: 'q-lp2-2',
        prompt: 'Question: Has Mr. Henderson signed the revised supply contract yet?',
        options: [
          { key: 'A', text: '(A) Yes, he sent it over before lunch.' },
          { key: 'B', text: '(B) Turn right at the next intersection.' },
          { key: 'C', text: '(C) Forty-five dollars per box.' },
        ],
        correct_answer: 'A',
        explanation_vi: 'Câu hỏi dạng "Has Mr. Henderson signed...?": Ông Henderson đã ký hợp đồng sửa đổi chưa? (A) "Yes, he sent it over before lunch" xác nhận hành động đã hoàn tất.',
      },
    ],
  },
  {
    id: 'listen-part-3-01',
    part: 3,
    title: 'Part 3: Conversation – Budget & Software Approval',
    description: 'Cuộc trao đổi giữa hai đồng nghiệp về việc phê duyệt ngân sách mua phần mềm đồ họa mới.',
    difficulty: 'Intermediate',
    audio_url: '',
    transcript: `Man: Hi Sarah, have you had a chance to speak with the accounting department about our software upgrade?
Woman: Yes, I spoke with David this morning. He mentioned that our quarterly budget is already quite tight, but if we can negotiate a team license discount with the vendor, the director might approve it.
Man: That sounds promising. I will contact the sales representative right away and ask if they offer a discount for educational or corporate teams.
Woman: Good idea. Make sure to get the quotation in writing so we can submit it with the formal purchase requisition.`,
    questions: [
      {
        id: 'q-lp3-1',
        prompt: 'What are the speakers mainly discussing?',
        options: [
          { key: 'A', text: 'Hiring a new graphic designer' },
          { key: 'B', text: 'Purchasing a software license' },
          { key: 'C', text: 'Relocating to another office building' },
          { key: 'D', text: 'Organizing an annual company retreat' },
        ],
        correct_answer: 'B',
        explanation_vi: 'Đoạn đầu người nam hỏi về "software upgrade", người nữ đề cập đến "quarterly budget" và "negotiate a team license discount". Do đó chủ đề chính là mua bản quyền phần mềm (Purchasing a software license).',
      },
      {
        id: 'q-lp3-2',
        prompt: 'What will the man do next?',
        options: [
          { key: 'A', text: 'Contact a sales representative' },
          { key: 'B', text: 'Meet with the finance director' },
          { key: 'C', text: 'Cancel the existing subscription' },
          { key: 'D', text: 'Submit a resignation letter' },
        ],
        correct_answer: 'A',
        explanation_vi: 'Người nam nói: "I will contact the sales representative right away and ask if they offer a discount..." -> Hành động tiếp theo là liên hệ đại diện bán hàng.',
      },
    ],
  },
  {
    id: 'listen-part-4-01',
    part: 4,
    title: 'Part 4: Short Talk – Office Policy Announcement',
    description: 'Thông báo nội bộ của phòng Hành chính Nhân sự về chính sách hoàn tiền công tác phí.',
    difficulty: 'Intermediate',
    audio_url: '',
    transcript: `Attention all marketing and sales personnel. This is an important reminder regarding travel expense claims. Beginning next Monday, all employees seeking reimbursement must submit their original receipts through the new online employee portal within five business days of returning from a business trip. Late submissions will require written authorization from department vice presidents. Please contact the payroll desk on extension 402 if you encounter any difficulties logging into the portal. Thank you for your cooperation.`,
    questions: [
      {
        id: 'q-lp4-1',
        prompt: 'What is the announcement mainly about?',
        options: [
          { key: 'A', text: 'Upcoming holiday schedules' },
          { key: 'B', text: 'Procedures for expense reimbursement' },
          { key: 'C', text: 'The installation of new office furniture' },
          { key: 'D', text: 'Sales quotas for the next quarter' },
        ],
        correct_answer: 'B',
        explanation_vi: 'Bài nói thông báo "regarding travel expense claims... all employees seeking reimbursement must submit their original receipts through the new online employee portal" -> Thủ tục hoàn trả chi phí (Procedures for expense reimbursement).',
      },
      {
        id: 'q-lp4-2',
        prompt: 'What must employees do within five business days?',
        options: [
          { key: 'A', text: 'Call extension 402' },
          { key: 'B', text: 'Book travel tickets' },
          { key: 'C', text: 'Submit original receipts online' },
          { key: 'D', text: 'Meet with their department manager' },
        ],
        correct_answer: 'C',
        explanation_vi: 'Người nói nêu rõ: "...submit their original receipts through the new online employee portal within five business days..." -> Đáp án C.',
      },
    ],
  },
];

export const SEED_READING_LESSONS: ReadingLesson[] = [
  {
    id: 'read-part-5-01',
    part: 5,
    title: 'Part 5: Incomplete Sentences – Contracts & Office',
    description: 'Kiểm tra ngữ pháp và từ vựng thông dụng trong hợp đồng và công việc văn phòng.',
    difficulty: 'Beginner',
    questions: [
      {
        id: 'q-rp5-1',
        prompt: 'Both parties are legally _______ to fulfill the terms stipulated in the signed service agreement.',
        options: [
          { key: 'A', text: 'obligate' },
          { key: 'B', text: 'obligated' },
          { key: 'C', text: 'obligation' },
          { key: 'D', text: 'obligatory' },
        ],
        correct_answer: 'B',
        explanation_vi: 'Cấu trúc bị động: "be + V3/ed + to V". Sau "are legally" cần phân từ hai "obligated" để tạo thành cụm "be obligated to do sth" (có nghĩa vụ pháp lý phải làm gì). (C) là danh từ, (D) là tính từ mang nghĩa bắt buộc đối với vật.',
      },
      {
        id: 'q-rp5-2',
        prompt: 'Ms. Tanaka rescheduled her client appointment _______ an unforeseen scheduling conflict occurred.',
        options: [
          { key: 'A', text: 'because' },
          { key: 'B', text: 'despite' },
          { key: 'C', text: 'although' },
          { key: 'D', text: 'in order to' },
        ],
        correct_answer: 'A',
        explanation_vi: 'Phía sau là một mệnh đề hoàn chỉnh (S: an unforeseen scheduling conflict, V: occurred). Cần liên từ chỉ nguyên nhân "because" (bởi vì xung đột lịch trình ngoài dự kiến xảy ra). "despite" đi với danh từ, "although" chỉ nhượng bộ, "in order to" đi với động từ nguyên mẫu.',
      },
      {
        id: 'q-rp5-3',
        prompt: 'The management team will _______ discuss the annual operating budget during tomorrow’s board meeting.',
        options: [
          { key: 'A', text: 'thorough' },
          { key: 'B', text: 'thoroughly' },
          { key: 'C', text: 'thoroughness' },
          { key: 'D', text: 'more thorough' },
        ],
        correct_answer: 'B',
        explanation_vi: 'Vị trí đứng giữa trợ động từ "will" và động từ chính "discuss" cần một trạng từ (Adverb) bổ nghĩa cho động từ: "thoroughly" (một cách thấu đáo, kỹ lưỡng).',
      },
    ],
  },
  {
    id: 'read-part-6-01',
    part: 6,
    title: 'Part 6: Text Completion – Company Notice',
    description: 'Điền từ và câu vào chỗ trống trong bản thông báo nâng cấp hạ tầng mạng văn phòng.',
    difficulty: 'Intermediate',
    passage: `MEMORANDUM

To: All Staff Members
From: IT Support Division
Date: October 16, 2026
Subject: Planned Server Maintenance and System Upgrade

Please be advised that the company’s internal network servers will undergo essential maintenance this coming Saturday from 8:00 AM to 4:00 PM. During this timeframe, access to the central file directory and email system will be temporarily [1] _______.

The upgrade is designed to improve cybersecurity measures and significantly increase data retrieval speeds across all branch offices. [2] _______.

We kindly request all department heads to ensure their team members save all current work files before Friday afternoon. If you have any urgent assignments requiring database access over the weekend, please notify your supervisor so that [3] _______ arrangements can be organized in advance.

Thank you for your patience and understanding as we work to improve our digital infrastructure.`,
    questions: [
      {
        id: 'q-rp6-1',
        prompt: 'Choose the best option for blank [1]:',
        options: [
          { key: 'A', text: 'unavailable' },
          { key: 'B', text: 'unavailability' },
          { key: 'C', text: 'unavailably' },
          { key: 'D', text: 'unavail' },
        ],
        correct_answer: 'A',
        explanation_vi: 'Sau liên động từ "will be" và trạng từ "temporarily", ta cần một tính từ (Adjective) để mô tả trạng thái của hệ thống: "unavailable" (tạm thời không khả dụng/bị gián đoạn).',
      },
      {
        id: 'q-rp6-2',
        prompt: 'Choose the sentence that best fits blank [2]:',
        options: [
          { key: 'A', text: 'Furthermore, several outdated workstations will be replaced with new laptops next month.' },
          { key: 'B', text: 'Employees who arrive late will receive a formal penalty.' },
          { key: 'C', text: 'This will ensure smoother day-to-day operations for all employees.' },
          { key: 'D', text: 'The annual picnic has been postponed until further notice.' },
        ],
        correct_answer: 'C',
        explanation_vi: 'Câu trước nêu mục tiêu nâng cấp ("to improve cybersecurity and increase speeds..."). Câu logic tiếp theo nối vào là "This will ensure smoother day-to-day operations for all employees" (Điều này sẽ đảm bảo hoạt động hàng ngày trơn tru hơn cho mọi nhân viên).',
      },
      {
        id: 'q-rp6-3',
        prompt: 'Choose the best option for blank [3]:',
        options: [
          { key: 'A', text: 'alternate' },
          { key: 'B', text: 'alternative' },
          { key: 'C', text: 'alternatively' },
          { key: 'D', text: 'alternation' },
        ],
        correct_answer: 'B',
        explanation_vi: 'Trước danh từ "arrangements" cần một tính từ "alternative" (mang tính thay thế/dự phòng). Cụm từ "alternative arrangements": các phương án sắp xếp thay thế.',
      },
    ],
  },
  {
    id: 'read-part-7-01',
    part: 7,
    title: 'Part 7: Reading Comprehension – Business Email & Inquiry',
    description: 'Đọc bức thư điện tử trao đổi giữa khách hàng và bộ phận bán hàng về chiết khấu đơn hàng văn phòng phẩm.',
    difficulty: 'Intermediate',
    passage: `From: Eleanor Vance <e.vance@apexlogistics.com>
To: Martin Cole <m.cole@superioroffice.com>
Date: October 14, 2026
Subject: Bulk Stationery Order Inquiry – Order #SP-8820

Dear Mr. Cole,

I am writing on behalf of Apex Logistics to inquire about the terms for our upcoming corporate stationery order. Our company is currently expanding two new regional offices in Da Nang and Hai Phong, which means our demand for standard office supplies has increased substantially.

According to your wholesale catalog, orders exceeding $2,000 are eligible for a 10% volume discount, along with complimentary expedited delivery. Our estimated order total comes out to approximately $3,450. 

Could you please confirm whether you can honor this discount and deliver the items by October 25th? Furthermore, we would appreciate it if you could split the shipment into two separate consignments directed to our two respective branch addresses.

If the terms are acceptable, please forward the formal sales invoice and contractual agreement so that our accounting team can process the advance payment.

Sincerely,
Eleanor Vance
Procurement Specialist
Apex Logistics`,
    questions: [
      {
        id: 'q-rp7-1',
        prompt: 'Why did Ms. Vance write the email to Mr. Cole?',
        options: [
          { key: 'A', text: 'To cancel an existing delivery' },
          { key: 'B', text: 'To ask about pricing discounts and delivery terms for a bulk order' },
          { key: 'C', text: 'To complain about defective office supplies' },
          { key: 'D', text: 'To apply for an open job vacancy at Superior Office' },
        ],
        correct_answer: 'B',
        explanation_vi: 'Ngay đoạn mở đầu Ms. Vance viết: "I am writing... to inquire about the terms for our upcoming corporate stationery order... confirm whether you can honor this discount and deliver the items..." -> Hỏi về chiết khấu và điều kiện giao hàng cho đơn hàng lớn (bulk order).',
      },
      {
        id: 'q-rp7-2',
        prompt: 'What special service is offered for orders over $2,000?',
        options: [
          { key: 'A', text: 'A 20% cashback coupon' },
          { key: 'B', text: 'Free expedited delivery and a 10% discount' },
          { key: 'C', text: 'Complimentary office furniture assembly' },
          { key: 'D', text: 'A voucher for a local restaurant' },
        ],
        correct_answer: 'B',
        explanation_vi: 'Đoạn 2 nêu rõ: "orders exceeding $2,000 are eligible for a 10% volume discount, along with complimentary expedited delivery" -> Miễn phí giao hàng hỏa tốc và giảm giá 10%.',
      },
      {
        id: 'q-rp7-3',
        prompt: 'In the email, the word "complimentary" in paragraph 2 is closest in meaning to:',
        options: [
          { key: 'A', text: 'expensive' },
          { key: 'B', text: 'free of charge' },
          { key: 'C', text: 'helpful' },
          { key: 'D', text: 'flattering' },
        ],
        correct_answer: 'B',
        explanation_vi: 'Trong ngữ cảnh "complimentary expedited delivery", từ "complimentary" đồng nghĩa với "free of charge" (miễn phí).',
      },
    ],
  },
];
