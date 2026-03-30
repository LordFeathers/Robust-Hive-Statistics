const MC_COLORS: Record<string, string> = {
  "0": "#000000", "1": "#0000AA", "2": "#00AA00", "3": "#00AAAA",
  "4": "#AA0000", "5": "#AA00AA", "6": "#FFAA00", "7": "#AAAAAA",
  "8": "#555555", "9": "#5555FF", "a": "#55FF55", "b": "#55FFFF",
  "c": "#FF5555", "d": "#FF55FF", "e": "#FFFF55", "f": "#FFFFFF",
};

interface TextSegment { text: string; color?: string }

export function parseMinecraftText(raw: string): TextSegment[] {
  const cleaned = raw
    .replace(/\([\ue000-\uf8ff]+\)/g, "")
    .replace(/^\s+/, "");

  const segments: TextSegment[] = [];
  let color: string | undefined;
  let i = 0;

  while (i < cleaned.length) {
    const ch = cleaned[i];

    if ((ch === "&" || ch === "§") && i + 1 < raw.length) {
      const code = raw[i + 1].toLowerCase();

      // Hex color: &x followed by six (&<hex-digit>) pairs = 14 chars total
      if (code === "x" && i + 13 < cleaned.length) {
        const hexSeq = cleaned.slice(i + 2, i + 14);
        if (/^(?:[&§][0-9a-fA-F]){6}$/.test(hexSeq)) {
          color = "#" + hexSeq.replace(/[&§]/g, "");
          i += 14;
          continue;
        }
      }

      if (MC_COLORS[code]) {
        color = MC_COLORS[code];
      } else if (code === "r") {
        color = undefined;
      }
      i += 2;
    } else {
      const start = i;
      while (i < cleaned.length && cleaned[i] !== "&" && cleaned[i] !== "§") i++;
      const chunk = cleaned.slice(start, i).replace(/[\ue000-\uf8ff]/g, "");
      if (chunk) segments.push({ text: chunk, color });
    }
  }

  return segments;
}

export function MinecraftText({ text }: { text: string }) {
  const segments = parseMinecraftText(String(text));
  return (
    <>
      {segments.map((seg, i) => (
        <span key={i} style={seg.color ? { color: seg.color } : undefined}>
          {seg.text}
        </span>
      ))}
    </>
  );
}

export function stripMinecraftColors(text: string): string {
  return text
    .replace(/[&§]x(?:[&§][0-9a-fA-F]){6}/gi, "")
    .replace(/[&§][0-9a-zA-Z]/g, "")
    .replace(/[\ue000-\uf8ff]/g, "")
    .replace(/\\\//g, "/")
    .trim();
}

export function firstMCColor(text: string): string | undefined {
  const match = text.match(/[&§]([0-9a-f])/i);
  return match ? MC_COLORS[match[1].toLowerCase()] : undefined;
}
