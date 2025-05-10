export interface TideStation {
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
}