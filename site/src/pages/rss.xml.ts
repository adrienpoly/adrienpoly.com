import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getArticles } from "../lib/articles";

export async function GET(context: APIContext) {
  const articles = await getArticles();

  return rss({
    title: "Adrien Poly",
    description: "Articles by Adrien Poly on building products, Ruby and Rails.",
    site: context.site!,
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.pubDate,
      link: `/articles/${article.id}/`,
    })),
  });
}
