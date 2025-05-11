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
