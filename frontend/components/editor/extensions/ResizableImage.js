import { Node, mergeAttributes } from "@tiptap/core";

export const ResizableImage = Node.create({
  name: "image",

  inline: false,
  group: "block",
  draggable: true,

  addAttributes() {
    return {
      src: {},
      alt: { default: null },
      width: { default: "auto" },
      height: { default: "auto" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)];
  },

  addCommands() {
    return {
      setImage:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "image",
            attrs,
          });
        },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const img = document.createElement("img");
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || "";
      img.style.width = node.attrs.width || "auto";
      img.style.height = node.attrs.height || "auto";
      img.style.maxWidth = "100%";
      img.style.cursor = "pointer";

      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.style.display = "inline-block";
      wrapper.appendChild(img);

      const resizer = document.createElement("div");
      resizer.style.position = "absolute";
      resizer.style.right = "0";
      resizer.style.bottom = "0";
      resizer.style.width = "12px";
      resizer.style.height = "12px";
      resizer.style.background = "#ddd";
      resizer.style.border = "1px solid #999";
      resizer.style.cursor = "nwse-resize";

      wrapper.appendChild(resizer);

      let startX, startY, startWidth, startHeight, aspectRatio, pos;

      resizer.addEventListener("mousedown", (e) => {
        e.preventDefault();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = img.offsetWidth;
        startHeight = img.offsetHeight;
        aspectRatio = startWidth / startHeight;

        pos = getPos();

        const onMouseMove = (e) => {
          const deltaX = e.clientX - startX;
          const newWidth = startWidth + deltaX;
          const newHeight = newWidth / aspectRatio;

          img.style.width = `${newWidth}px`;
          img.style.height = `${newHeight}px`;

          if (typeof pos === "number") {
            editor.view.dispatch(
              editor.view.state.tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                width: `${newWidth}px`,
                height: `${newHeight}px`,
              })
            );
          }
        };

        const onMouseUp = () => {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      });

      return {
        dom: wrapper,
      };
    };
  },
});

export default ResizableImage;
