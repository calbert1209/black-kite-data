import axios from "axios";

const STATION_PAGE_URL =
  "https://www.data.jma.go.jp/kaiyou/db/tide/suisan/station2025.php";

/**
 * Fetches tide station list from the JMA website.
 * @returns {Promise<string>} The HTML data of the tide station page.
 */
export async function fetchTideStationData() {
  const response = await axios.get(STATION_PAGE_URL);
  return response.data;
}

/**
 *
 * @param {string} stationCode
 * @param {number | string} year
 * @returns {Promise<string>} The JMA tide table data for the specified station and year.
 */
export async function fetchTideTableData(stationCode, year) {
  const url = `https://www.data.jma.go.jp/kaiyou/data/db/tide/suisan/txt/${year}/${stationCode}.txt`;
  const response = await axios.get(url);
  return response.data;
}
