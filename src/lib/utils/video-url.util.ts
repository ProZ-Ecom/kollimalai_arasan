/**
 * Helpers for validating and previewing the video links admins paste into the
 * admin forms (currently the Home Reels banner slot).
 */

export type VideoSourceKind = "youtube" | "vimeo" | "file" | "external";

export interface ParsedVideoUrl {
  kind: VideoSourceKind;
  /** The original, trimmed URL. */
  url: string;
  /** Embeddable iframe URL - only set for youtube / vimeo. */
  embedUrl?: string;
  /** Provider-side video id - only set for youtube / vimeo. */
  id?: string;
}

const VIDEO_FILE_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".ogg",
  ".ogv",
  ".mov",
  ".m4v",
  ".m3u8",
];

/** Hosts we can confidently treat as video links even without an extension. */
const KNOWN_VIDEO_HOSTS = [
  "youtube.com",
  "youtu.be",
  "vimeo.com",
  "player.vimeo.com",
  "instagram.com",
  "facebook.com",
  "fb.watch",
  "dailymotion.com",
  "dai.ly",
  "streamable.com",
  "cloudinary.com",
  "wistia.com",
  "loom.com",
];

function toUrl(raw: string): URL | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

function matchesHost(hostname: string, host: string): boolean {
  const clean = hostname.toLowerCase().replace(/^www\./, "");
  return clean === host || clean.endsWith(`.${host}`);
}

function hasVideoExtension(url: URL): boolean {
  const pathname = url.pathname.toLowerCase();
  return VIDEO_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

function getYouTubeId(url: URL): string | null {
  if (matchesHost(url.hostname, "youtu.be")) {
    return url.pathname.slice(1).split("/")[0] || null;
  }
  if (!matchesHost(url.hostname, "youtube.com")) return null;

  const vParam = url.searchParams.get("v");
  if (vParam) return vParam;

  const segments = url.pathname.split("/").filter(Boolean);
  const keyed = ["embed", "shorts", "live", "v"];
  const index = segments.findIndex((segment) => keyed.includes(segment));
  if (index >= 0 && segments[index + 1]) return segments[index + 1];

  return null;
}

function getVimeoId(url: URL): string | null {
  if (!matchesHost(url.hostname, "vimeo.com")) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  const id = segments.find((segment) => /^\d+$/.test(segment));
  return id ?? null;
}

/**
 * Returns a parsed descriptor when `raw` looks like a usable video link,
 * otherwise `null`. A link qualifies when it is a valid http(s) URL that
 * either points at a video file or lives on a known video host.
 */
export function parseVideoUrl(raw: string | null | undefined): ParsedVideoUrl | null {
  if (!raw) return null;
  const value = raw.trim();

  // Site-relative paths to an uploaded file (e.g. /document/banners/reel.mp4).
  if (value.startsWith("/") && !value.startsWith("//")) {
    const pathname = value.split(/[?#]/)[0].toLowerCase();
    return VIDEO_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext))
      ? { kind: "file", url: value }
      : null;
  }

  const url = toUrl(raw);
  if (!url) return null;

  const youTubeId = getYouTubeId(url);
  if (youTubeId) {
    return {
      kind: "youtube",
      url: value,
      id: youTubeId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youTubeId}`,
    };
  }

  const vimeoId = getVimeoId(url);
  if (vimeoId) {
    return {
      kind: "vimeo",
      url: value,
      id: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  if (hasVideoExtension(url)) {
    return { kind: "file", url: value };
  }

  if (KNOWN_VIDEO_HOSTS.some((host) => matchesHost(url.hostname, host))) {
    return { kind: "external", url: value };
  }

  return null;
}

export function isValidVideoUrl(raw: string | null | undefined): boolean {
  return parseVideoUrl(raw) !== null;
}

/** True when the string parses as an http(s) URL, regardless of it being a video. */
export function isValidHttpUrl(raw: string | null | undefined): boolean {
  return raw ? toUrl(raw) !== null : false;
}

/**
 * Static poster image for a video link, when the provider exposes one at a
 * predictable URL. YouTube does; Vimeo needs an API call, so it returns null.
 */
export function getVideoThumbnailUrl(
  raw: string | null | undefined
): string | null {
  const parsed = parseVideoUrl(raw);
  if (parsed?.kind === "youtube" && parsed.id) {
    return `https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg`;
  }
  return null;
}
