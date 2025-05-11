export type TideStation = {
  id: string;
  jmaId: string;
  stationCode: string;
  stationName: string;
  latitude: {
    degrees: number;
    minutes: number;
  };
  longitude: {
    degrees: number;
    minutes: number;
  };
};

export type RowDate = {
  year: number;
  /** 1 ~ 12 */
  month: number;
  day: number;
};

export type RowDateTime = RowDate & {
  hour: number;
  minute: number;
};

export type TidalEventType = "high" | "low" | "hourly";

export type TidalEvent = {
  localDateTime: RowDateTime;
  stationCode: string;
  level: number;
  type: TidalEventType;
};
