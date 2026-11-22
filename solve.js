// Faster drop-in for make.fun's csv-reader 1.0.0 (see
// ../csv-reader-speed-01-run-20261121-kit/baselines/csv-reader/vendor/csv-reader/index.js for the reference
// semantics this must match exactly). Same answer, less work per character: unquoted runs and quoted runs that
// contain no CR are read with indexOf/slice instead of one character at a time, and only the rare runs that
// actually contain a stray CR, an escaped quote or trailing junk fall back to a char-by-char path.

const COMMA = 0;
const LINE_BREAK = 1;
const END = 2;

export function run(input) {
  return readCsv(input);
}

function readCsv(input) {
  const text = String(input.text);
  const header = input.header === true;
  const len = text.length;
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;

  let pos = len > 0 && text.charCodeAt(0) === 0xfeff ? 1 : 0;
  let line = 1;

  // The record being read: the line it starts on and the index in rows it takes (null: the header).
  let recordLine = 1;
  let recordRow = null;
  // How the field just read ended (set by readUnquoted/readQuoted as a side effect).
  let endKind = END;

  function error(code, extraKey, extraValue) {
    const e = { code, line: recordLine, row: recordRow };
    if (extraKey !== undefined) e[extraKey] = extraValue;
    errors.push(e);
  }

  // Reads an unquoted field, `initial` already read onto it (used for quote_junk/unterminated_quote resumes).
  // Sets pos, line and endKind; a CR not followed by LF is dropped (stray_cr).
  function readUnquoted(initial) {
    let value = initial;
    let start = pos;
    while (true) {
      let i = start;
      while (i < len) {
        const c = text.charCodeAt(i);
        if (c === 44 || c === 10 || c === 13) break;
        i++;
      }
      if (i > start) value += text.slice(start, i);
      if (i >= len) {
        pos = i;
        endKind = END;
        return value;
      }
      const c = text.charCodeAt(i);
      if (c === 44) {
        pos = i + 1;
        endKind = COMMA;
        return value;
      }
      if (c === 10) {
        pos = i + 1;
        line += 1;
        endKind = LINE_BREAK;
        return value;
      }
      // c === 13: CRLF ends the field; a lone CR is dropped (stray_cr) and reading continues.
      if (text.charCodeAt(i + 1) === 10) {
        pos = i + 2;
        line += 1;
        endKind = LINE_BREAK;
        return value;
      }
      pos = i;
      error('stray_cr');
      start = i + 1;
      pos = start;
    }
  }

  // Reads a quoted field whose opening quote is at pos.
  function readQuoted() {
    const open = pos;
    const openLine = line;
    pos += 1;
    let value = '';
    while (true) {
      const qi = text.indexOf('"', pos);
      if (qi === -1) {
        // The quote never closes: a literal character, and the text after it is read again as unquoted.
        pos = open + 1;
        line = openLine;
        error('unterminated_quote');
        return readUnquoted('"');
      }
      const segStart = pos;
      if (text.indexOf('\r', segStart) === -1 || text.indexOf('\r', segStart) >= qi) {
        // No CR in this span: a plain slice, only '\n' (already correct) may need counting.
        value += text.slice(segStart, qi);
        let idx = segStart;
        while (true) {
          const ni = text.indexOf('\n', idx);
          if (ni === -1 || ni >= qi) break;
          line += 1;
          idx = ni + 1;
        }
      } else {
        // A CR is present: CRLF and a lone CR each read as one LF, one character at a time.
        let seg = '';
        let i = segStart;
        while (i < qi) {
          const c = text.charCodeAt(i);
          if (c === 13) {
            seg += '\n';
            line += 1;
            i += text.charCodeAt(i + 1) === 10 ? 2 : 1;
          } else if (c === 10) {
            seg += '\n';
            line += 1;
            i += 1;
          } else {
            const next = text.indexOf('\r', i);
            const nextNl = text.indexOf('\n', i);
            let stop = qi;
            if (next !== -1 && next < stop) stop = next;
            if (nextNl !== -1 && nextNl < stop) stop = nextNl;
            seg += text.slice(i, stop);
            i = stop;
          }
        }
        value += seg;
      }
      pos = qi;
      if (text.charCodeAt(qi + 1) === 34) {
        // "" inside a quoted field is one literal quote.
        value += '"';
        pos = qi + 2;
        continue;
      }
      pos = qi + 1;
      break;
    }
    if (pos >= len) {
      endKind = END;
      return value;
    }
    const c = text.charCodeAt(pos);
    if (c === 44) {
      pos += 1;
      endKind = COMMA;
      return value;
    }
    if (c === 10) {
      pos += 1;
      line += 1;
      endKind = LINE_BREAK;
      return value;
    }
    if (c === 13 && text.charCodeAt(pos + 1) === 10) {
      pos += 2;
      line += 1;
      endKind = LINE_BREAK;
      return value;
    }
    // What follows the closing quote, up to the next comma or line break, is appended as it stands.
    const before = value.length;
    const junk = readUnquoted(value);
    if (junk.length > before) error('quote_junk');
    return junk;
  }

  while (pos < len) {
    // Lines with no characters (pure LF or CRLF runs) are no records.
    while (pos < len) {
      const c = text.charCodeAt(pos);
      if (c === 10) {
        pos += 1;
        line += 1;
      } else if (c === 13 && text.charCodeAt(pos + 1) === 10) {
        pos += 2;
        line += 1;
      } else {
        break;
      }
    }
    if (pos >= len) break;

    recordLine = line;
    recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let quoted = false;
    let ended;
    do {
      quoted = text.charCodeAt(pos) === 34;
      const value = quoted ? readQuoted() : readUnquoted('');
      ended = endKind;
      fields.push(value);
    } while (ended === COMMA);

    // A line that held only stray CRs is left with no characters: no record (its stray_cr errors stay).
    if (fields.length === 1 && fields[0] === '' && !quoted) continue;

    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fields.length < width) {
      error('short_row', 'fields', fields.length);
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      error('long_row', 'extra', fields.splice(width));
    }
    rows.push(fields);
  }

  return { columns: header ? columns ?? [] : null, rows, errors };
}
