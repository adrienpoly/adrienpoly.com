/**
 * Shiki transformer: a `title` on a code fence wraps the block in a figure
 * with the title as its caption.
 *
 *   ```ruby title="app/models/user.rb"
 */
export function codeTitle() {
  return {
    name: "code-title",
    root(root) {
      const title = this.options.meta?.__raw?.match(/title="([^"]+)"/)?.[1];
      if (!title) return;

      root.children = [
        {
          type: "element",
          tagName: "figure",
          properties: { class: "code-block" },
          children: [
            {
              type: "element",
              tagName: "figcaption",
              properties: {},
              children: [{ type: "text", value: title }],
            },
            ...root.children,
          ],
        },
      ];
    },
  };
}
