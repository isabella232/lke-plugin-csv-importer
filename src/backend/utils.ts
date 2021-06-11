import {Request, Response} from 'express';
import {LkError, LkErrorKey, Response as LkResponse} from '@linkurious/rest-client';

/**
 * Same as input.split(/\r?\n/).map(row => row.split(',') but lazy
 * It does not take care of escaping commas, line-breaks, etc...
 */
export function* parseCSV(input: string): Generator<string[]> {
  let value = '';
  let lineValues = [];
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '\r' && input[i + 1] === '\n') {
      lineValues.push(value);
      value = '';
      yield lineValues;
      lineValues = [];
      i++;
      continue;
    }
    if (char === '\n') {
      lineValues.push(value);
      value = '';
      yield lineValues;
      lineValues = [];
      continue;
    }
    if (char === ',') {
      lineValues.push(value);
      value = '';
      continue;
    }
    value += char;
  }
  lineValues.push(value);
  yield lineValues;
}

export enum RowErrorMessage {
  TOO_MANY_VALUES = 'Got more values than headers',
  SOURCE_TARGET_NOT_FOUND = 'Source or target node not found',
  SCHEMA_NON_COMPLAINT = 'Values types are not complaint with the schema',
  MISSING_REQUIRED_PROPERTIES = 'Missing properties required by the schema',
  UNEXPECTED_SCHEMA_PROPERTIES = 'Got properties not expected by the schema',
  DATA_SOURCE_UNAVAILABLE = 'Data-source is not available',
  UNAUTHORIZED = 'You are not logged in',
  UNEXPECTED = 'Unexpected error, check the logs'
}

export class GroupedErrors extends Map<string, number[]> {
  public static validKeys = new Set(Object.values(RowErrorMessage));
  public total = 0;
  public add(error: string | LkResponse<LkError>, row: number) {
    const errorKey = GroupedErrors.simplifyErrorMessage(error);
    const entry = this.get(errorKey);
    if (entry === undefined) {
      this.set(errorKey, [row]);
    } else {
      entry.push(row);
    }
    this.total++;
  }
  public toObject() {
    const obj: Record<string, number[]> = {};
    for (const [a, b] of this) {
      obj[a] = b;
    }
    return obj;
  }

  private static simplifyErrorMessage(error: string | LkResponse<LkError>): RowErrorMessage {
    if (!(error instanceof LkResponse) && GroupedErrors.validKeys.has(error as RowErrorMessage)) {
      return error as RowErrorMessage;
    }

    const message = error instanceof LkResponse ? error.body.message : error;
    if (message.includes('source') && message.includes('target')) {
      return RowErrorMessage.SOURCE_TARGET_NOT_FOUND;
    }
    if (message.includes('" must be')) {
      return RowErrorMessage.SCHEMA_NON_COMPLAINT;
    }
    if (message.includes('" must not be undefined')) {
      return RowErrorMessage.MISSING_REQUIRED_PROPERTIES;
    }
    if (message.includes('" has unexpected properties')) {
      return RowErrorMessage.UNEXPECTED_SCHEMA_PROPERTIES;
    }

    const key = error instanceof LkResponse ? error.body.key : undefined;
    if (key === LkErrorKey.DATA_SOURCE_UNAVAILABLE) {
      return RowErrorMessage.DATA_SOURCE_UNAVAILABLE;
    }
    if (key === LkErrorKey.UNAUTHORIZED) {
      return RowErrorMessage.UNAUTHORIZED
    }

    return RowErrorMessage.UNEXPECTED;
  }
}

export function respond(
  asyncHandler: (req: Request) => Promise<{[k: string]: unknown}>
) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const body = await asyncHandler(req);
      res.status(200);
      res.json(body);
    } catch (e) {
      console.log(e);
      // We don't really care about the status code
      res.status(400);
      res.json({
        success: 0
      });
    }
  };
}
