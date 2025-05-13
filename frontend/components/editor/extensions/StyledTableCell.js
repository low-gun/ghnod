import TableCell from "@tiptap/extension-table-cell";
import { mergeAttributes } from "@tiptap/core";

export const StyledTableCell = TableCell.extend({
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
    return ["td", mergeAttributes(HTMLAttributes), 0];
  },
});
