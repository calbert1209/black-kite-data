import axios from "axios";
import * as cheerio from "cheerio";

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

(async () => {
  try {
    const url =
      "https://www.data.jma.go.jp/kaiyou/db/tide/suisan/station2025.php";
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const getTextFromCell = (cell) => $(cell).text().trim();
    const data = [];

    // Assuming the table rows are within a specific table
    $("table tr").each((index, element) => {
      if (index === 0) return; // Skip the header row

      const cells = $(element).find("td");
      if (cells.length > 0) {
        const jmaId = $(cells[0]).text().trim();
        const stationCode = getTextFromCell(cells[1]);
        const stationName = getTextFromCell(cells[2]);
        const latitudeText = getTextFromCell(cells[3]);
        const longitudeText = getTextFromCell(cells[4]);

        const latitude = parseDegreesMinutes(latitudeText);
        const longitude = parseDegreesMinutes(longitudeText);

        data.push({
          jmaId,
          stationCode,
          stationName,
          latitude,
          longitude,
        });
      }
    });

    console.log(data);
  } catch (error) {
    console.error("Error fetching or parsing the page:", error);
  }
})();
