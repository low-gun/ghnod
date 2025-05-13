import { Mark, mergeAttributes } from "@tiptap/core";

export const FontSize = Mark.create({
  name: "fontSize",

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (el) => el.style.fontSize,
        renderHTML: (attrs) => {
          if (!attrs.size) return {};
          return { style: `font-size: ${attrs.size}` };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "span", style: "font-size" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ commands }) =>
          commands.setMark(this.name, { size }),
    };
  },
});
