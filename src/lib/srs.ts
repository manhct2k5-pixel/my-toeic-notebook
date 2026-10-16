import { VocabularyItem } from '@/types';

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

/**
 * SM-2 based Spaced Repetition calculation
 * Grade:
 * 'again' (0-1): completely forgot, reset interval to 1 day
 * 'hard' (2): remembered with difficulty, small interval growth
 * 'good' (3-4): remembered correctly, normal interval growth
 * 'easy' (5): perfectly remembered, faster interval growth
 */
export function calculateNextReview(
  item: VocabularyItem,
  grade: ReviewGrade
): {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: string;
  isMemorized: boolean;
  needsReview: boolean;
} {
  const { ease_factor } = item;
  let { repetitions, review_interval_days } = item;
  let easeFactor = ease_factor;
  
  if (!easeFactor || easeFactor < 1.3) easeFactor = 2.5;
  if (!repetitions) repetitions = 0;
  if (!review_interval_days) review_interval_days = 1;

  let nextInterval = 1;
  let nextRepetitions = repetitions;
  let nextEase = easeFactor;
  let isMemorized = item.is_memorized;
  let needsReview = false;

  if (grade === 'again') {
    // Reset streak
    nextRepetitions = 0;
    nextInterval = 1;
    nextEase = Math.max(1.3, easeFactor - 0.2);
    isMemorized = false;
    needsReview = true;
  } else if (grade === 'hard') {
    nextRepetitions += 1;
    nextInterval = Math.max(1, Math.round(review_interval_days * 1.2));
    nextEase = Math.max(1.3, easeFactor - 0.15);
    needsReview = false;
    isMemorized = nextRepetitions >= 2;
  } else if (grade === 'good') {
    if (repetitions === 0) {
      nextInterval = 1;
    } else if (repetitions === 1) {
      nextInterval = 3;
    } else {
      nextInterval = Math.round(review_interval_days * easeFactor);
    }
    nextRepetitions += 1;
    needsReview = false;
    isMemorized = nextRepetitions >= 2;
  } else if (grade === 'easy') {
    if (repetitions === 0) {
      nextInterval = 3;
    } else if (repetitions === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(review_interval_days * easeFactor * 1.3);
    }
    nextRepetitions += 1;
    nextEase = Math.min(3.0, easeFactor + 0.15);
    needsReview = false;
    isMemorized = true;
  }

  // Calculate next date (today + nextInterval)
  const now = new Date();
  now.setDate(now.getDate() + nextInterval);
  const nextReviewDate = formatDateToISO(now);

  return {
    intervalDays: nextInterval,
    easeFactor: Number(nextEase.toFixed(2)),
    repetitions: nextRepetitions,
    nextReviewDate,
    isMemorized,
    needsReview,
  };
}

export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayISO(): string {
  return formatDateToISO(new Date());
}

export function isDueForReview(item: VocabularyItem, targetDateISO?: string): boolean {
  if (item.needs_review) return true;
  if (!item.next_review_date) return true;
  const compareDate = targetDateISO || '2099-12-31';
  return item.next_review_date <= compareDate;
}
