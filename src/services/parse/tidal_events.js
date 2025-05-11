/**
 * @typedef { import('../../types.d.ts').RowDate } RowDate
 *
 * @typedef { import('../../types.d.ts').RowDateTime } RowDateTime
 *
 * @typedef {import('../../types.d.ts').TidalEvent} TidalEvent
 */

/**
 * Parse hourly level measurements from row of table data.
 *
 * @param { string } row line of data from table to parse.
 *
 * @return { number[] } Array of 24 hourly level measurements.
 */
function parseHourlyData(row) {
  const rawData = row.substring(0, 72);
  const output = [];
  for (let i = 0; i < 24; i++) {
    const levelText = rawData.substring(i * 3, i * 3 + 3);
    const level = parseInt(levelText, 10);
    output.push(level);
  }

  return output;
}

/**
 * Parse date from row of table data.
 *
 * @param { string } row line of data from table to parse.
 *
 * @return { RowDate } Object with year, month, and day properties.
 */
function parseDate(row) {
  const rawData = row.substring(72, 78);
  const [year, month, day] = [0, 2, 4].map((cursor) => {
    const digits = rawData.substring(cursor, cursor + 2);
    return parseInt(digits, 10);
  });
  return {
    year,
    month,
    day,
  };
}

/**
 * Parse station code from row of table data.
 *
 * @param { string } row line of data from table to parse.
 *
 * @returns { string } 2 character station code.
 *
 * @see JMA: {@link https://www.data.jma.go.jp/kaiyou/db/tide/suisan/station.php | 潮位表掲載地点一覧表（2025年）}
 */
function parseStationCode(row) {
  return row.substring(78, 80);
}

/**
 * A bare extremum object without any station code or type information.
 * @typedef { Object } BareExtremum
 * @property { number } hour hour measurement
 * @property { number } minute minutes measurement
 * @property { number } level in cm
 */

/**
 * Parse extrema (high- and low-tide events) from row of table data.
 *
 * @param {string} row line of data from table to parse.
 *
 * @param {number} start starting index of extrema data in row.
 *
 * @returns { BareExtremum[] } Array of bare extremum objects.
 */
function parseExtrema(row, start) {
  const rawData = row.substring(start, start + 28);
  return (
    [0, 7, 14, 21]
      .map((c) => {
        const hText = rawData.substring(c, c + 2);
        const mText = rawData.substring(c + 2, c + 4);
        const level = rawData.substring(c + 4, c + 7);
        return {
          hour: parseInt(hText, 10),
          minute: parseInt(mText, 10),
          level: parseInt(level, 10),
        };
      })
      // filter out filler entries with all 9s
      .filter((event) => event.hour !== 99)
  );
}

/**
 * Results of parsing a JMA tide table.
 * @typedef {Object} ParsedTableData
 * @property { TidalEvent[] } hourlyLevels
 * @property { TidalEvent[] } extrema
 */

/**
 * Parse JMA tide table data for a specific station and year.
 * @param {string} table JMA tide table data for a specific station and year.
 * @returns {ParsedTableData} Parsed data containing hourly levels and extrema.
 */
export function parseTidalEvents(table) {
  /** @type {TidalEvent[]} */
  const hourlyLevels = [];
  /** @type {TidalEvent[]} */
  const extrema = [];

  const rows = table.split("\n");
  for (let row of rows) {
    const { year, month, day } = parseDate(row);
    const stationCode = parseStationCode(row);
    const hourlyData = parseHourlyData(row);

    hourlyData.forEach((level, index) => {
      const localDateTime = { year, month, day, hour: index, minute: 0 };
      /** @type {TidalEvent} */
      const levelData = { localDateTime, stationCode, level, type: "hourly" };
      hourlyLevels.push(levelData);
    });

    // Parse high tide events
    parseExtrema(row, 80).forEach(({ hour, minute, level }) => {
      const localDateTime = { year, month, day, hour, minute };
      /** @type {TidalEvent} */
      const extremum = {
        localDateTime,
        stationCode,
        level,
        type: "high",
      };

      extrema.push(extremum);
    });

    // Parse low tide events
    parseExtrema(row, 108).forEach(({ hour, minute, level }) => {
      const localDateTime = { year, month, day, hour, minute };
      /** @type {TidalEvent} */
      const extremum = {
        localDateTime,
        stationCode,
        level,
        type: "low",
      };

      extrema.push(extremum);
    });
  }

  return {
    hourlyLevels,
    extrema,
  };
}
