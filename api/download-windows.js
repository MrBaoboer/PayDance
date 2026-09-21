// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

// The site's Windows download button (/download/windows, see vercel.json). Every Release carries
// one EXE named after its tag, so a link that never changes has to resolve the newest tag first:
// GitHub answers /releases/latest with a redirect to /releases/tag/<tag>, which needs no API call.

export const repositoryUrl = "https://github.com/MrBaoboer/PayDance";
export const releasesPageUrl = `${repositoryUrl}/releases/latest`;

const releaseTagPattern = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const releaseTagPath = /^\/MrBaoboer\/PayDance\/releases\/tag\/([^/]+)$/;

export function resolveLatestTag(location) {
  if (typeof location !== "string" || location.length === 0) return null;

  let pathname;
  try {
    pathname = new URL(location, repositoryUrl).pathname;
  } catch {
    return null;
  }

  const match = pathname.match(releaseTagPath);
  if (!match) return null;

  let tag;
  try {
    tag = decodeURIComponent(match[1]);
  } catch {
    return null;
  }

  return releaseTagPattern.test(tag) ? tag : null;
}

export function windowsAssetUrl(tag) {
  return `${repositoryUrl}/releases/download/${tag}/pay-dance-${tag}-windows-x64.exe`;
}

export async function resolveWindowsDownload(fetchImpl = fetch) {
  try {
    const response = await fetchImpl(releasesPageUrl, {
      redirect: "manual",
      // GitHub normally answers in well under a second; a slow answer must not hold the visitor.
      signal: AbortSignal.timeout(4000),
      headers: { "user-agent": "paydance-site-download-redirect" },
    });
    const tag = resolveLatestTag(response.headers.get("location"));
    if (tag) return { url: windowsAssetUrl(tag), resolved: true };
  } catch {
    // Network or GitHub trouble: fall through to the Release page, which always exists.
  }

  return { url: releasesPageUrl, resolved: false };
}

export default async function handler(request, response) {
  const { url, resolved } = await resolveWindowsDownload();

  response.setHeader(
    "Cache-Control",
    resolved ? "public, s-maxage=300, stale-while-revalidate=600" : "no-store",
  );
  response.setHeader("Location", url);
  response.statusCode = 302;
  response.end();
}
