interface FormatDateOptions {
  locale?: string;
  dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
  timeStyle?: Intl.DateTimeFormatOptions["timeStyle"];
  format?: "short" | "long" | "full" | "relative";
}

export function formatDate(
  date: Date | string | number,
  options: FormatDateOptions = {}
): string {
  const { locale = "en-IN", format = "short" } = options;
  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }

  if (format === "relative") {
    return getRelativeTimeString(dateObj);
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    dateStyle: options.dateStyle,
    timeStyle: options.timeStyle,
  };

  if (format === "short") {
    formatOptions.dateStyle = "short";
  } else if (format === "long") {
    formatOptions.dateStyle = "long";
  } else if (format === "full") {
    formatOptions.dateStyle = "full";
    formatOptions.timeStyle = "short";
  }

  try {
    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
  } catch {
    return dateObj.toLocaleDateString();
  }
}

function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}
