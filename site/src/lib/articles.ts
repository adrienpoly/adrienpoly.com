import { getCollection, type CollectionEntry } from "astro:content";

export type Article = CollectionEntry<"articles">;

/** Newest first. Drafts are visible in dev and left out of production builds. */
export async function getArticles(): Promise<Article[]> {
  const articles = await getCollection(
    "articles",
    ({ data }) => import.meta.env.DEV || !data.draft,
  );
  return articles.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

const WORDS_PER_MINUTE = 220;

export function readingMinutes(markdown = ""): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
