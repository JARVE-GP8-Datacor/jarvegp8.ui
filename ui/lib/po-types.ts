export type PoStageState = "done" | "current" | "upcoming";

export interface PoStage {
  key: string;
  label: string;
  sublabel?: string;
  sub: string;
  state: PoStageState;
}

export interface PoSummary {
  id: string;
  vendor: string;
  amount: string;
  createdBy: string;
  createdOn: string;
  requiredBy: string;
  statusLabel: string;
  stages: PoStage[];
  eta: {
    message: string;
    highlight: string;
    progress: string;
    progressLabel: string;
  };
  callout: {
    kicker: string;
    message: string;
    detail: string;
  };
}
