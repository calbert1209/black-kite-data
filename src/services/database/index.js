import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

/**
 * @typedef {import('../../types.d.ts').RowDateTime} RowDateTime
 * @typedef {import('../../types.d.ts').TidalEvent} TidalEvent
 */

/**
 * Database class for managing SQLite database operations.
 */
export class Database {
  /**
   * @type {import('sqlite').Database}
   */
  #db;

  /**
   * Constructs a Database instance.
   * @param {import('sqlite').Database} db - The SQLite database instance.
   */
  constructor(db) {
    this.#db = db;
  }

  /**
   * Initializes the database by creating or opening the specified database file.
   * Ensures the database directory exists.
   * @param {string} dbFileName - The name of the database file.
   * @returns {Promise<Database>} A promise that resolves to a Database instance.
   */
  static async init(dbFileName) {
    const dbDir = path.resolve("./db");
    const dbPath = path.join(dbDir, dbFileName);

    // Ensure the db directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir);
    }

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    return new Database(db);
  }

  /**
   * Closes the database connection.
   * @returns {Promise<void>} A promise that resolves when the database is closed.
   */
  async close() {
    await this.#db.close();
  }

  /**
   * Creates the tide_station table if it does not already exist.
   * @returns {Promise<void>} A promise that resolves when the table is created.
   */
  async createTideStationTable() {
    return this.#db.exec(`
      CREATE TABLE IF NOT EXISTS tide_station (
        id TEXT PRIMARY KEY,
        jma_id TEXT,
        station_code TEXT,
        station_name TEXT,
        latitude_degrees INTEGER,
        latitude_minutes REAL,
        longitude_degrees INTEGER,
        longitude_minutes REAL
      );
    `);
  }

  /**
   * Creates the tidal_event table if it does not already exist.
   * @returns {Promise<void>} A promise that resolves when the table is created.
   */
  async createTidalEventTable() {
    return this.#db.exec(`
        CREATE TABLE IF NOT EXISTS tidal_event (
          id TEXT PRIMARY KEY,
          local_date_time TEXT,
          utc_date_time TEXT,
          level INTEGER,
          type TEXT,
          station_id TEXT,
          FOREIGN KEY (station_id) REFERENCES tide_station (id)
        );
      `);
  }

  /**
   * Inserts tidal event data into the tidal_event table.
   * @param {TidalEvent[]} eventData
   *
   * @param {string} stationId - The tide station's DB ID.
   */
  async insertTidalEventData(eventData, stationId) {
    let currentDateTime = null;
    for (const { localDateTime, level, type } of eventData) {
      currentDateTime = localDateTime;
      try {
        const utcDateTime = new Date(
          localDateTime.year,
          localDateTime.month - 1,
          localDateTime.day,
          localDateTime.hour,
          localDateTime.minute
        ).toISOString();
        const localDateTimeString = createLocalDateTimeString(
          localDateTime,
          JST_OFFSET
        );
        await this.#db.run(
          `INSERT INTO tidal_event (id, local_date_time, utc_date_time, level, type, station_id)
           VALUES (?, ?, ?, ?, ?, ?);`,
          uuid(),
          localDateTimeString,
          utcDateTime,
          level,
          type,
          stationId
        );
      } catch (error) {
        console.error(error, "for date:", JSON.stringify(currentDateTime));
        continue; // Skip this entry and continue with the next one
      }
    }
  }

  /** @typedef {import('../../types.d.ts').TideStation} TideStation */
  /**
   * Inserts tide station data into the tide_station table.
   * @param {TideStation[]} data - An array of tide station data objects.
   * @returns {Promise<void>} A promise that resolves when the data is inserted.
   */
  async insertTideStationData(data) {
    for (const station of data) {
      await this.#db.run(
        `INSERT INTO tide_station (id, jma_id, station_code, station_name, latitude_degrees, latitude_minutes, longitude_degrees, longitude_minutes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        station.id,
        station.jmaId,
        station.stationCode,
        station.stationName,
        station.latitude.degrees,
        station.latitude.minutes,
        station.longitude.degrees,
        station.longitude.minutes
      );
    }
  }

  /**
   * Retrieves all tide station data from the tide_station table.
   * @returns {Promise<Array<TideStation>>} A promise that resolves to an array of tide station data objects.
   */
  async getTideStationData() {
    const rows = await this.#db.all("SELECT * FROM tide_station");
    return rows.map((row) => ({
      id: row.id,
      jmaId: row.jma_id,
      stationCode: row.station_code,
      stationName: row.station_name,
      latitude: {
        degrees: row.latitude_degrees,
        minutes: row.latitude_minutes,
      },
      longitude: {
        degrees: row.longitude_degrees,
        minutes: row.longitude_minutes,
      },
    }));
  }
}

/**
 * Creates a local date-time string in the format "YYYY-MM-DDTHH:MM:SS±HH:MM", per ISO 8601.
 *
 * @param {RowDateTime} dateTime - The date and time components.
 *
 * @param {number} offsetHours - The time zone offset in hours.
 *
 * @returns {string} The formatted local date-time string.
 */
function createLocalDateTimeString(
  { year, month, day, hour, minute },
  offsetHours
) {
  const valence = offsetHours > 0 ? "+" : "-";
  const offsetMinutes = (offsetHours * 60) % 60;
  const offset = `${offsetHours}:${offsetMinutes.toString().padStart(2, "0")}`;
  return `${year}-${month}-${day}T${hour}:${minute}:00${valence}${offset}`;
}

const JST_OFFSET = 9; // Japan Standard Time (UTC+9)
