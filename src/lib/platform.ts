"use client";

export type Platform = "windows" | "mac" | "ios" | "android" | "other";
export type Browser = "safari" | "chrome" | "edge" | "firefox" | "other";

interface UserAgentData {
  platform?: string;
}

/**
 * Which print dialog the person is about to see. Saving a PDF looks completely
 * different on Windows Chrome, macOS Safari and an iPhone, so the help has to
 * know where it is being read.
 */
export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;

  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  // iPadOS reports itself as a Mac; the touch points give it away.
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  if (/Android/i.test(ua)) return "android";

  const platform = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData
    ?.platform;
  if (platform) {
    if (/windows/i.test(platform)) return "windows";
    if (/macos|mac/i.test(platform)) return "mac";
  }
  if (/Windows/i.test(ua)) return "windows";
  if (/Macintosh|Mac OS X/i.test(ua)) return "mac";
  return "other";
}

export function detectBrowser(): Browser {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return "edge";
  if (/Firefox\//i.test(ua)) return "firefox";
  if (/Chrome\/|CriOS\//i.test(ua)) return "chrome";
  if (/Safari\//i.test(ua)) return "safari";
  return "other";
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  windows: "Windows PC",
  mac: "Mac",
  ios: "iPhone / iPad",
  android: "Android",
  other: "This device",
};
