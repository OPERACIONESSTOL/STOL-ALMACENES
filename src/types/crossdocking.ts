export interface CrossdockingSummary {
  volRegular: number; // 225,335.42
  volExtraordinario: number; // 19,905.16
  volDomFer: number; // 4,172.16
  reprocesos: number; // 0.00
}

export interface CrossdockingDailyRecord {
  id: string;
  fecha: string;
  m3Prog: number;
  m3RecbPtio: number;
  m3RecbNve: number;
  lpnProgPtio: number;
  lpnProgNave: number;
  lpnPtio: number;
  lpnNve: number;
  provProg: number;
  provTardanza: number;
  volRegular: number;
  volExtraordinario: number;
  volDomFerNoct: number;
  m3PorAtencExt: number;
  observaciones: string;
}
