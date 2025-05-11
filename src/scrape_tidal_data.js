import { Database } from "./services/database/index.js";
import { fetchTideTableData } from "./services/fetch/index.js";
import { parseTidalEvents } from "./services/parse/tidal_events.js";

(async () => {
  let db;
  try {
    db = await Database.init("tidal_data.db");

    const stations = await db.getTideStationData();
    if (stations[0].stationCode) {
      const tidalTableData = await fetchTideTableData(
        stations[0].stationCode,
        2025
      );
      const tidalEvents = parseTidalEvents(tidalTableData);
      const eventData = [...tidalEvents.hourlyLevels, ...tidalEvents.extrema];
      await db.createTidalEventTable();
      await db.insertTidalEventData(eventData, stations[0].id);
      console.log("Tidal events inserted successfully.");
    }
  } catch (error) {
    console.error("Error fetching or parsing the page:", error);
  } finally {
    await db?.close();
  }
})();
