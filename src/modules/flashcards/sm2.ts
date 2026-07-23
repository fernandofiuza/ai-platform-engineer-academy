// Repetição espaçada — versão simplificada do algoritmo SM-2 (SuperMemo 2).
// Referência: https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm

export type SM2State = {
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
};

export function computeNextReview(
  quality: number,
  previous: SM2State | null
): { intervalDays: number; easeFactor: number; nextReviewAt: Date } {
  const prevEase = previous?.easeFactor ?? 2.5;
  const prevInterval = previous?.intervalDays ?? 0;
  const reviewCount = (previous?.reviewCount ?? 0) + 1;

  let easeFactor = prevEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(1.3, easeFactor);

  let intervalDays: number;
  if (quality < 3) {
    intervalDays = 1;
  } else if (reviewCount <= 1) {
    intervalDays = 1;
  } else if (reviewCount === 2) {
    intervalDays = 6;
  } else {
    intervalDays = Math.round(prevInterval * easeFactor);
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

  return { intervalDays, easeFactor, nextReviewAt };
}
