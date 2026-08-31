/**
 * Fail-closed, no-network XML tree builder for untrusted CII input.
 * Rejects DTD/DOCTYPE/ENTITY expansion and non-predefined entity references.
 */

export type SecureXmlNode = {
  name: string;
  localName: string;
  attrs: Record<string, string>;
  children: SecureXmlNode[];
  text: string;
};

export type SecureXmlParseFailure = {
  ok: false;
  reason: "EMPTY" | "TOO_LARGE" | "UNSAFE_XML" | "MALFORMED";
  detail: string;
};

export type SecureXmlParseSuccess = {
  ok: true;
  root: SecureXmlNode;
};

export type SecureXmlParseResult = SecureXmlParseSuccess | SecureXmlParseFailure;

const MAX_BYTES = 2_000_000;
const MAX_DEPTH = 64;
const MAX_NODES = 50_000;

const PREDEFINED_ENTITIES: Record<string, string> = {
  lt: "<",
  gt: ">",
  amp: "&",
  apos: "'",
  quot: '"',
};

function localNameOf(full: string): string {
  const i = full.indexOf(":");
  return i >= 0 ? full.slice(i + 1) : full;
}

function decodeSafeEntities(raw: string): string | null {
  let out = "";
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (ch !== "&") {
      out += ch;
      i += 1;
      continue;
    }
    const end = raw.indexOf(";", i + 1);
    if (end < 0 || end - i > 32) {
      return null;
    }
    const body = raw.slice(i + 1, end);
    if (body.startsWith("#x") || body.startsWith("#X")) {
      const hex = body.slice(2);
      if (!/^[0-9a-fA-F]+$/.test(hex)) return null;
      const code = Number.parseInt(hex, 16);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return null;
      out += String.fromCodePoint(code);
    } else if (body.startsWith("#")) {
      const dec = body.slice(1);
      if (!/^[0-9]+$/.test(dec)) return null;
      const code = Number.parseInt(dec, 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return null;
      out += String.fromCodePoint(code);
    } else {
      const mapped = PREDEFINED_ENTITIES[body];
      if (!mapped) return null;
      out += mapped;
    }
    i = end + 1;
  }
  return out;
}

function rejectUnsafeProlog(xml: string): string | null {
  if (/<!DOCTYPE/i.test(xml)) return "DOCTYPE rejected";
  if (/<!ENTITY/i.test(xml)) return "ENTITY rejected";
  if (/<!\[CDATA\[/i.test(xml) && /\]\]>/.test(xml) === false) return "Unclosed CDATA";
  // External entity / SYSTEM hints outside element content
  if (/SYSTEM\s+["']/i.test(xml) && /<!DOCTYPE/i.test(xml)) return "SYSTEM entity rejected";
  return null;
}

function parseAttributes(raw: string): Record<string, string> | null {
  const attrs: Record<string, string> = {};
  const re = /([A-Za-z_:][\w:.-]*)\s*=\s*(["'])([\s\S]*?)\2/g;
  let m: RegExpExecArray | null;
  let consumed = 0;
  const trimmed = raw.trim();
  if (!trimmed) return attrs;
  while ((m = re.exec(trimmed)) !== null) {
    const decoded = decodeSafeEntities(m[3] ?? "");
    if (decoded === null) return null;
    attrs[m[1] ?? ""] = decoded;
    consumed = re.lastIndex;
  }
  if (trimmed.slice(consumed).trim().length > 0) return null;
  return attrs;
}

/**
 * Build an element tree from XML text. No entity expansion beyond XML predefined.
 */
export function parseSecureXml(xmlInput: string, maxBytes = MAX_BYTES): SecureXmlParseResult {
  if (!xmlInput || !xmlInput.trim()) {
    return { ok: false, reason: "EMPTY", detail: "Empty input" };
  }
  const byteLength = Buffer.byteLength(xmlInput, "utf8");
  if (byteLength > maxBytes) {
    return { ok: false, reason: "TOO_LARGE", detail: "XML exceeds size limit" };
  }

  const unsafe = rejectUnsafeProlog(xmlInput);
  if (unsafe) {
    return { ok: false, reason: "UNSAFE_XML", detail: unsafe };
  }

  // Strip XML declaration and comments; reject processing instructions that are not xml.
  let xml = xmlInput.replace(/^\uFEFF/, "");
  xml = xml.replace(/<\?xml[\s\S]*?\?>/i, "");
  if (/<\?/.test(xml)) {
    return { ok: false, reason: "UNSAFE_XML", detail: "Processing instruction rejected" };
  }
  xml = xml.replace(/<!--[\s\S]*?-->/g, "");

  // Expand CDATA as text (no markup interpretation)
  xml = xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_all, inner: string) => {
    return inner.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  });

  const rootChildren: SecureXmlNode[] = [];
  const stack: SecureXmlNode[] = [];
  let i = 0;
  let nodeCount = 0;
  let textBuf = "";

  const flushText = () => {
    if (!textBuf) return;
    const decoded = decodeSafeEntities(textBuf);
    if (decoded === null) {
      throw new Error("UNSAFE_ENTITY");
    }
    const trimmedMeaningful = decoded.replace(/[ \t\r\n]+/g, " ");
    if (trimmedMeaningful.trim().length === 0) {
      textBuf = "";
      return;
    }
    const top = stack[stack.length - 1];
    if (top) {
      top.text += (top.text ? " " : "") + trimmedMeaningful.trim();
    }
    textBuf = "";
  };

  try {
    while (i < xml.length) {
      const lt = xml.indexOf("<", i);
      if (lt < 0) {
        textBuf += xml.slice(i);
        flushText();
        break;
      }
      if (lt > i) {
        textBuf += xml.slice(i, lt);
        flushText();
      }
      if (xml.startsWith("</", lt)) {
        const gt = xml.indexOf(">", lt);
        if (gt < 0) return { ok: false, reason: "MALFORMED", detail: "Unclosed end tag" };
        const name = xml.slice(lt + 2, gt).trim();
        if (!name || stack.length === 0) {
          return { ok: false, reason: "MALFORMED", detail: "Unexpected end tag" };
        }
        const top = stack.pop()!;
        if (top.name !== name) {
          return { ok: false, reason: "MALFORMED", detail: "Mismatched end tag" };
        }
        i = gt + 1;
        continue;
      }
      if (xml.startsWith("<", lt)) {
        const gt = xml.indexOf(">", lt);
        if (gt < 0) return { ok: false, reason: "MALFORMED", detail: "Unclosed start tag" };
        let body = xml.slice(lt + 1, gt);
        let selfClosing = false;
        if (body.endsWith("/")) {
          selfClosing = true;
          body = body.slice(0, -1).trimEnd();
        }
        const sp = body.search(/\s/);
        const name = (sp < 0 ? body : body.slice(0, sp)).trim();
        if (!name || !/^[A-Za-z_][\w:.-]*$/.test(name)) {
          return { ok: false, reason: "MALFORMED", detail: "Invalid element name" };
        }
        const attrRaw = sp < 0 ? "" : body.slice(sp);
        const attrs = parseAttributes(attrRaw);
        if (attrs === null) {
          return { ok: false, reason: "UNSAFE_XML", detail: "Unsafe or invalid attributes" };
        }
        nodeCount += 1;
        if (nodeCount > MAX_NODES) {
          return { ok: false, reason: "TOO_LARGE", detail: "Too many nodes" };
        }
        if (stack.length >= MAX_DEPTH) {
          return { ok: false, reason: "TOO_LARGE", detail: "XML depth exceeded" };
        }
        const node: SecureXmlNode = {
          name,
          localName: localNameOf(name),
          attrs,
          children: [],
          text: "",
        };
        const parent = stack[stack.length - 1];
        if (parent) parent.children.push(node);
        else rootChildren.push(node);
        if (!selfClosing) stack.push(node);
        i = gt + 1;
        continue;
      }
      return { ok: false, reason: "MALFORMED", detail: "Unexpected markup" };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "parse error";
    if (msg === "UNSAFE_ENTITY") {
      return { ok: false, reason: "UNSAFE_XML", detail: "Non-predefined entity rejected" };
    }
    return { ok: false, reason: "MALFORMED", detail: "Parse failed" };
  }

  if (stack.length > 0) {
    return { ok: false, reason: "MALFORMED", detail: "Unclosed elements" };
  }
  if (rootChildren.length !== 1) {
    return { ok: false, reason: "MALFORMED", detail: "Expected single root element" };
  }
  return { ok: true, root: rootChildren[0]! };
}

export function findChildren(node: SecureXmlNode | null | undefined, localName: string): SecureXmlNode[] {
  if (!node) return [];
  return node.children.filter((c) => c.localName === localName);
}

export function findChild(node: SecureXmlNode | null | undefined, localName: string): SecureXmlNode | null {
  return findChildren(node, localName)[0] ?? null;
}

export function findDescendant(node: SecureXmlNode, localName: string): SecureXmlNode | null {
  if (node.localName === localName) return node;
  for (const child of node.children) {
    const hit = findDescendant(child, localName);
    if (hit) return hit;
  }
  return null;
}

export function textOf(node: SecureXmlNode | null | undefined): string | null {
  if (!node) return null;
  const t = node.text.trim();
  return t.length > 0 ? t : null;
}

export function firstText(node: SecureXmlNode | null, ...path: string[]): string | null {
  let cur: SecureXmlNode | null = node;
  for (const part of path) {
    if (!cur) return null;
    cur = findChild(cur, part);
  }
  return textOf(cur);
}
