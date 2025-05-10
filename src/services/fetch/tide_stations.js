import axios from "axios";
import * as cheerio from "cheerio";
import { v4 as uuid } from "uuid";

const STATION_PAGE_URL =
  "https://www.data.jma.go.jp/kaiyou/db/tide/suisan/station2025.php";

/**
 * Parses a string containing degrees and minutes into an object.
 * @param {string} degreesMinutes - The string containing degrees and minutes (e.g., "35゜30'").
 * @returns {{ degrees: number, minutes: number }} An object with degrees and minutes as numbers.
 */
function parseDegreesMinutes(degreesMinutes) {
  const [degrees, minutes] = degreesMinutes
    .replace("'", "")
    .split("゜")
    .map((part) => part.trim());
  return {
    degrees: parseFloat(degrees),
    minutes: parseFloat(minutes),
  };
}

/**
 * Fetches tide station data from the JMA website.
 * @returns {Promise<TideStation[]>} A promise that resolves to an array of tide station data objects.
 */
export async function fetchTideStationData() {
  const response = await axios.get(STATION_PAGE_URL);
  const $ = cheerio.load(response.data);
  const getTextFromCell = (cell) => $(cell).text().trim();
  const data = [];

  // Assuming the table rows are within a specific table
  $("table tr").each((index, element) => {
    if (index === 0) return; // Skip the header row

    const cells = $(element).find("td");
    if (cells.length > 1) {
      const id = uuid();
      const jmaId = $(cells[0]).text().trim();
      const stationCode = getTextFromCell(cells[1]);
      const stationName = getTextFromCell(cells[2]);
      const latitudeText = getTextFromCell(cells[3]);
      const longitudeText = getTextFromCell(cells[4]);

      const latitude = parseDegreesMinutes(latitudeText);
      const longitude = parseDegreesMinutes(longitudeText);

      data.push({
        id,
        jmaId,
        stationCode,
        stationName,
        latitude,
        longitude,
      });
    }
  });

  return data;
}
