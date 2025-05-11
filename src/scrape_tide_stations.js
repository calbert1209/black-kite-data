// @ts-check
import { parseTideStationData } from "./services/parse/tide_stations.js";
import { Database } from "./services/database/index.js";
import { fetchTideStationData } from "./services/fetch/index.js";

(async () => {
  let db;
  try {
    const tideStationPageData = await fetchTideStationData();
    const tideStationData = await parseTideStationData(tideStationPageData);

    db = await Database.init("tidal_data.db");
    await db.createTideStationTable();
    await db.insertTideStationData(tideStationData);

    console.log(
      `inserted ${tideStationData.length} records into the database.`
    );
  } catch (error) {
    console.error("Error fetching or parsing the page:", error);
  } finally {
    await db?.close();
  }
})();
