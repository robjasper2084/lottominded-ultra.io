export const LEVEL_COMMERCIALS = [
  {
    id: 'detroit-broadcast-01',
    file: 'assets/video/detroit-commercial-01.mp4',
    poster: 'assets/video/detroit-commercial-01-poster.webp',
    label: 'LottoMind Detroit Broadcast One'
  },
  {
    id: 'detroit-broadcast-02',
    file: 'assets/video/detroit-commercial-02.mp4',
    poster: 'assets/video/detroit-commercial-02-poster.webp',
    label: 'LottoMind Detroit Broadcast Two'
  }
] as const;

export function commercialForCompletedLevel(completedLevelIndex: number) {
  const index = Math.floor(Math.abs(Math.trunc(completedLevelIndex)) / 2) % LEVEL_COMMERCIALS.length;
  return LEVEL_COMMERCIALS[index];
}

export function shouldShowCommercialAfterLevel(completedLevelIndex: number): boolean {
  const completedLevelNumber = Math.trunc(completedLevelIndex) + 1;
  return completedLevelNumber > 0 && completedLevelNumber < 10 && completedLevelNumber % 2 === 0;
}
