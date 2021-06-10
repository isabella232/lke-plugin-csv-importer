import {Request, Response} from 'express';

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

export enum RowErrorKey {
  TOO_MANY_VALUES = 'Got more values than headers',
  SOURCE_TARGET_NOT_FOUND = 'Source or target node not found'
}

export class GroupedErrors extends Map<string, number[]> {
  public total = 0;
  public add(error: string, row: number) {
    // TODO simplify error message
    const entry = this.get(error);
    if (entry === undefined) {
      this.set(error, [row]);
    } else {
      entry.push(row);
    }
    this.total++;
  }
  public toString() {
    let text = '';
    for (const [a, b] of this) {
      text += `${a}: ${b.join(', ')}\n`;
    }
    return text;
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
      if (e instanceof InvalidParameter) {
        res.status(400);
      } else {
        res.status(500);
      }
      res.json(e);
    }
  };
}

export class InvalidParameter {
  constructor(readonly message: string) {}
}
