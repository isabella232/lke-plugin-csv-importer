// TODO move shared files to a lib folder with its own package.json
//  it is currently duplicated in src/backend/shared.ts and src/public/shared.ts
import {parse} from 'papaparse';

export type CSVRecord = (string | number | boolean | null)[];
export type ParsedCSV = {
  headers: string[];
  records: CSVRecord[];
};

export class CSVUtils {
  /**
   * Returns the parsed CSV or a global error if any.
   * A global error can be:
   *   "No headers provided"
   *   "Header value is empty"
   *   "Missing values in records: 1, 5, 20"
   *   "Too many values in records: 1, 5, 20"
   */
  public static parseCSV(csvContent: string): ParsedCSV | {error: string} {
    const parseResult = parse<(string | number | boolean | null)[]>(csvContent, {
      delimiter: ',',
      escapeChar: '"',
      skipEmptyLines: false,
      dynamicTyping: true,
      header: false
    });

    // We make sure the headers are strings
    const headers = parseResult.data[0].map((h) => h + '');

    // Empty line is parsed as ['null']
    if (headers.length === 1 && headers[0] === 'null') {
      return {error: 'No headers provided'};
    }

    // Ex: name,,surname
    if (headers.some((h) => h.length === 0)) {
      return {error: 'Header value is empty'};
    }

    // Remove the headers
    parseResult.data.shift();

    // We remove any trailing empty line if any
    const lastRecord = parseResult.data[parseResult.data.length - 1];
    if (lastRecord.length === 1 && lastRecord[0] === null) {
      parseResult.data.pop();
    }

    const missingValues: number[] = [];
    const tooManyValues: number[] = [];
    const expectedNumberOfValues = headers.length;
    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      if (row.length < expectedNumberOfValues) {
        missingValues.push(i);
        continue;
      }
      if (row.length > expectedNumberOfValues) {
        tooManyValues.push(i);
      }
      // Cast "123,345" to 123.345
      parseResult.data[i] = row.map((value) => {
        if (typeof value === 'string' && /^\d+([.,]\d+)?$/.test(value)) {
          return Number.parseFloat(value);
        }
        return value;
      });
    }
    let error = '';
    if (missingValues.length > 0) {
      error = `Missing values in records: ${missingValues.join(', ')}`;
    }
    if (tooManyValues.length > 0) {
      if (error.length >= 0) {
        error += '<br>';
      }
      error += `Too many values in records: ${tooManyValues.join(', ')}`;
    }
    if (error.length > 0) {
      return {error: error};
    }

    return {
      headers: headers,
      records: parseResult.data
    };
  }
}
