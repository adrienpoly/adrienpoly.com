// HTML-tree plugins for Sätteri, the Markdown processor Astro uses.
// Plugin API: https://satteri.bruits.org/docs/

const isElement = (node, tagName) => node.type === "element" && node.tagName === tagName;
const isBlankText = (node) => node.type === "text" && node.value.trim() === "";

/**
 * An image alone on its line with a title becomes a captioned figure:
 *
 *   ![Alt text](./photo.jpg "The caption")
 */
export const figureCaptions = {
  name: "figure-captions",
  element: {
    filter: ["p"],
    visit(node, ctx) {
      const children = node.children.filter((child) => !isBlankText(child));
      if (children.length !== 1 || !isElement(children[0], "img")) return;

      const { title, ...properties } = children[0].properties ?? {};
      if (typeof title !== "string" || title === "") return;

      ctx.replaceNode(node, {
        type: "element",
        tagName: "figure",
        properties: {},
        children: [
          { type: "element", tagName: "img", properties, children: [] },
          {
            type: "element",
            tagName: "figcaption",
            properties: {},
            children: [{ type: "text", value: title }],
          },
        ],
      });
    },
  },
};

/**
 * In a blockquote, a last paragraph that starts with an em dash is the attribution:
 *
 *   > The quote.
 *   >
 *   > — Author, *Source*
 */
export const quoteAttributions = {
  name: "quote-attributions",
  element: {
    filter: ["p"],
    visit(node, ctx) {
      const parent = ctx.parent(node);
      if (!parent || !isElement(parent, "blockquote")) return;

      const paragraphs = parent.children.filter((child) => isElement(child, "p"));
      const isLast = ctx.indexOf(node) === ctx.indexOf(paragraphs.at(-1));
      if (paragraphs.length < 2 || !isLast) return;
      if (!ctx.textContent(node).trimStart().startsWith("—")) return;

      ctx.setProperty(node, "className", ["quote-attribution"]);
    },
  },
};
