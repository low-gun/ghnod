// StyledTableHeader.js
import TableHeader from "@tiptap/extension-table-header";
import { mergeAttributes } from "@tiptap/core";

export const StyledTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute("style"),
        renderHTML: (attrs) => {
          return { style: attrs.style || null };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ["th", mergeAttributes(HTMLAttributes), 0]; // ✅ 반드시 "th"
  },
});
