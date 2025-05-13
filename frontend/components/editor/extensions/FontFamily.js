import { Mark, mergeAttributes } from "@tiptap/core";

export const FontFamily = Mark.create({
  name: "fontFamily",

  addAttributes() {
    return {
      family: {
        default: null,
        parseHTML: (el) => el.style.fontFamily,
        renderHTML: (attrs) => {
          if (!attrs.family) return {};
          return { style: `font-family: ${attrs.family}` };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "span", style: "font-family" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontFamily:
        (family) =>
        ({ commands }) =>
          commands.setMark(this.name, { family }),
    };
  },
});
