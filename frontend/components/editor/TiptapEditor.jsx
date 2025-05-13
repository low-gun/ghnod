import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import { StyledTableCell } from "./extensions/StyledTableCell";
import { StyledTableHeader } from "./extensions/StyledTableHeader";
import Blockquote from "@tiptap/extension-blockquote";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { FontSize } from "./extensions/FontSize";
import { FontFamily } from "./extensions/FontFamily";
import { ResizableImage } from "./extensions/ResizableImage";
import ToolbarButtons from "./extensions/ToolbarButtons";
import EditorModeButtons from "./extensions/EditorModeButtons";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";

export default function TiptapEditor({ value, onChange, height = 280 }) {
  const [sourceMode, setSourceMode] = useState(false);
  const [mounted, setMounted] = useState(false); // ✅ 추가
  const fileInputRef = useRef(null);

  useEffect(() => {
    setMounted(true); // 🔹 클라이언트에서만 editor 생성되도록
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Link.configure({ openOnClick: false }),
      Table.configure({
        resizable: true,
        allowTableNodeSelection: false,
      }),
      TableRow,
      StyledTableHeader,
      StyledTableCell,
      Blockquote,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      FontSize,
      FontFamily,
      ResizableImage,
      BulletList,
      OrderedList,
      ListItem,
    ],
    content: value?.trim() || "<p><br></p><p><br></p><p><br></p>",
    editorProps: {
      attributes: { class: "tiptap-editor" },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable: mounted, // ✅ 여기서 SSR일 땐 비활성화
    immediatelyRender: false, // ✅ hydration mismatch 방지
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  const insertImage = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      editor.commands.insertContent(
        `<img src="${reader.result}" alt="image" />`
      );
      onChange(editor.getHTML());
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && editor) insertImage(file);
  };

  if (!mounted || !editor) return null;
  return (
    <div>
      <style>
        {`
          .tiptap-editor ul {
            padding-left: 1.2rem;
            list-style-type: disc;
          }
          .tiptap-editor *:first-child {
            margin-top: 0;
          }
          .tiptap-editor img,
          .preview-wrapper img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0.5rem 0;
          }
          .tiptap-editor,
          .preview-wrapper {
            word-break: break-word;
            min-height: 280px;
          }
          .tiptap-editor table {
            border-collapse: separate;
            border-spacing: 0;
            table-layout: fixed;
            width: auto;
            max-width: 100%;
            transition: outline 0.2s ease-in-out;
          }
          .tiptap-editor table:hover {
            outline: 1px dashed #aaa;
            outline-offset: 2px;
          }
          .tiptap-editor td,
          .tiptap-editor th {
            border: 1px solid #ccc;
            box-sizing: border-box;
            position: relative;
            vertical-align: top;
            min-height: 30px;
          }
          .tiptap-editor th {
            font-weight: normal;
          }
          .tiptap-editor .selectedCell {
            background-color: rgba(0, 112, 243, 0.1);
          }

          /* 👉 가로 드래그 커서 영역 (우측 border 선 위에서만) */
          .tiptap-editor td::after,
          .tiptap-editor th::after {
            content: '';
            position: absolute;
            right: -2px;
            top: 0;
            width: 4px;
            height: 100%;
            cursor: col-resize;
            z-index: 10;
          }

          .tiptap-editor td:hover::after,
          .tiptap-editor th:hover::after {
            background-color: #eee;
          }
        `}
      </style>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        {!sourceMode && (
          <ToolbarButtons editor={editor} fileInputRef={fileInputRef} />
        )}
        <EditorModeButtons
          sourceMode={sourceMode}
          setSourceMode={setSourceMode}
        />
      </div>

      {sourceMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            minHeight: height,
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: 12,
            fontFamily: "monospace",
          }}
        />
      ) : (
        <div
          style={{
            position: "relative",
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: 12,
            minHeight: height,
            height: "100%",
            background: "#fff",
          }}
        >
          <EditorContent
            editor={editor}
            spellCheck={false}
            style={{ width: "100%", minHeight: "100%" }}
          />
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />
    </div>
  );
}
