export type PublicItem = {
  id: string;
  displayName: string;
  marketHashName: string;
  category: "case" | "knife" | "glove" | "covert_skin";
  imageUrl: string;
  priceEur: number | null;
};

export type GameStartResponse = {
  sessionId: string;
  mode: "daily" | "classic";
  challengeDate: string | null;
  score: number;
  round: number;
  left: PublicItem;
  right: PublicItem;
};

export type AnswerResponse = {
  correct: boolean;
  expected: "higher" | "lower";
  score: number;
  round: number;
  completed: boolean;
  revealedRight: PublicItem & { priceEur: number };
  nextRound: null | {
    left: PublicItem;
    right: PublicItem;
  };
};

export type LeaderboardRow = {
  nickname: string;
  score: number;
  roundsPlayed: number;
  createdAt: string;
};
