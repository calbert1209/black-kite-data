import { Database } from "./services/database/index.js";
import { fetchTideTableData } from "./services/fetch/index.js";
import { parseTidalEvents } from "./services/parse/tidal_events.js";

(async () => {
  let db;
  try {
    const tidalTableData = await fetchTideTableData("D8", 2025);
    const tidalEvents = parseTidalEvents(tidalTableData);

    // db = await Database.init("tidal_data.db");

    console.log(tidalEvents.hourlyLevels.slice(0, 24));
  } catch (error) {
    console.error("Error fetching or parsing the page:", error);
  } finally {
    // await db?.close();
  }
})();
