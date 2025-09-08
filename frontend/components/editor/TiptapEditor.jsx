// frontend/components/editor/TiptapEditor.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import api from "@/lib/api";

export default function TiptapEditor({
  value = "",
  onChange,
  height = 280,
  disabled = false,
  uploadEndpoint = "/upload/image",
}) {
  const fileRef = useRef(null);
  const rafRef = useRef(null);
  const [uploadInfo, setUploadInfo] = useState(null); // { idx, total, pct } | null


  const editor = useEditor({
    editable: !disabled,
    immediatelyRender: false, // SSR 하이드레이션 불일치 방지
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: true,
        blockquote: true,
        horizontalRule: true,
        underline: false,
        link: false,
      }),
      Underline,
      Link.configure({
        autolink: true,
        openOnClick: true,
        linkOnPaste: true,
        protocols: ["http", "https", "mailto", "tel"],
      }),
      TiptapImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "tt-img",
          // 상세페이지와 동일하게 가로맞춤(컨테이너 폭 기준)
          style: "width:100%;max-width:100%;height:auto;display:block;object-fit:contain;",
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "상세설명을 입력하세요." }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => onChange?.(html));
    },
  });
  const placeCursorAtEnd = useCallback(() => {
    if (!editor) return;
    const end = editor.state.doc.content.size;
    editor.commands.setTextSelection(end);
    editor.view.focus();
  }, [editor]);
  
  // disabled ↔ 편집 가능 동기화
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  // 외부 value ↔ 에디터 동기화
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") !== current) editor.commands.setContent(value || "", false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

    // 링크
  const promptAndSetLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("링크 URL을 입력하세요.", prev || "https://");
    if (url === null) return;
    if (url === "") return editor.chain().focus().unsetLink().run();
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url, target: "_blank", rel: "noopener noreferrer" })
      .run();
  }, [editor]);

  // URL 이미지
  const insertImageFromUrl = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("이미지 URL을 입력하세요.", "https://");
    if (!url) return;
    placeCursorAtEnd();
editor.chain().focus().insertContent({
  type: "image",
  attrs: {
    src: url,
    alt: "",
    style: "width:100%;max-width:100%;height:auto;display:block;object-fit:contain;"
  }
}).run();
  }, [editor]);

  // 파일창 열기(다중)
  const openFileDialog = useCallback(() => fileRef.current?.click(), []);

  // 업로드 전 다운스케일(최대 변 1600px)
  const maybeDownscaleImage = useCallback((file, maxDim = 1600, quality = 0.85) => {
    return new Promise((resolve) => {
      const img = typeof window !== "undefined" ? new window.Image() : null;
if (!img) return resolve(file);
const url = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        if (scale >= 1) {
          URL.revokeObjectURL(url);
          return resolve(file);
        }
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(new File([blob], file.name, { type: blob.type || "image/jpeg" }));
        }, file.type || "image/jpeg", quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }, []);

  // 단일 업로드
 // 단일 업로드
const uploadImageFile = useCallback(
  async (file, progressCb) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) return alert("이미지 파일만 업로드 가능합니다.");
    if (file.size > 10 * 1024 * 1024) return alert("이미지 용량이 10MB를 초과합니다.");

    try {
      const toUpload = await maybeDownscaleImage(file, 1600, 0.85);
      const fd = new FormData();
      // ✅ 백엔드: upload.array("files") → key는 "files"
      fd.append("files", toUpload, toUpload.name || file.name);

      const res = await api.post(uploadEndpoint, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (!e.total) return;
          const pct = Math.round((e.loaded / e.total) * 100);
          progressCb?.(pct);
        },
      });

      // ✅ 응답: { success, urls: [{ original, thumbnail, detail }, ...] }
      const { success, urls } = res?.data || {};
      const first = Array.isArray(urls) ? urls[0] : null;
      const picked =
        typeof first === "string"
          ? first
          : (first?.detail || first?.original || first?.thumbnail);

      if (!success || !picked) throw new Error("업로드 실패");

      placeCursorAtEnd();
      editor?.chain().focus().insertContent({
        type: "image",
        attrs: {
          src: picked,
          alt: toUpload.name,
          style: "width:100%;max-width:100%;height:auto;display:block;object-fit:contain;"
        }
      }).run();
    } catch (e) {
      console.error("[TiptapEditor] 이미지 업로드 실패:", e);
      const reader = new FileReader();
      reader.onload = () => {
        placeCursorAtEnd();
        editor?.chain().focus().insertContent({
          type: "image",
          attrs: {
            src: String(reader.result),
            alt: file.name,
            style: "width:100%;max-width:100%;height:auto;display:block;object-fit:contain;"
          }
        }).run();
      };
      reader.readAsDataURL(file);
    }
  },
  [editor, uploadEndpoint, maybeDownscaleImage]
);

  // 다중 업로드(순차)
  const uploadMany = useCallback(
    async (files) => {
      const imgs = Array.from(files).filter((f) => /^image\//.test(f.type));
      if (!imgs.length) return;
  
      // 1) 배치 업로드 시도 (서버가 files[]와 urls[]를 지원할 때)
      try {
        setUploadInfo({ idx: 1, total: imgs.length, pct: 0 });
  
        // 다운스케일을 모두 적용한 뒤 한 번에 전송
        const resized = [];
        for (const f of imgs) resized.push(await maybeDownscaleImage(f, 1600, 0.85));
  
        const fd = new FormData();
        resized.forEach((f) => fd.append("files", f, f.name)); // 서버가 files[] 받는 경우
        const res = await api.post(uploadEndpoint, fd, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (!e.total) return;
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadInfo((info) => (info ? { ...info, pct } : { idx: 1, total: imgs.length, pct }));
          },
        });
  
        const { success, urls } = res?.data || {};
if (!success || !Array.isArray(urls) || urls.length === 0) throw new Error("batch unsupported");

// urls 원소: 문자열 또는 { original, thumbnail, detail }
for (const u of urls) {
  const picked =
    typeof u === "string"
      ? u
      : (u?.detail || u?.original || u?.thumbnail);
  if (!picked) continue;

  placeCursorAtEnd();
  editor?.chain().focus().insertContent({
    type: "image",
    attrs: {
      src: picked,
      alt: "",
      style: "width:100%;max-width:100%;height:auto;display:block;object-fit:contain;"
    }
  }).run();
}
setUploadInfo(null);
return;
  
      } catch (_) {
        // 2) 배치 미지원 또는 실패 → 개별 업로드 폴백
      }
  
      for (let i = 0; i < imgs.length; i++) {
        setUploadInfo({ idx: i + 1, total: imgs.length, pct: 0 });
        await uploadImageFile(imgs[i], (pct) => setUploadInfo({ idx: i + 1, total: imgs.length, pct }));
      }
      setUploadInfo(null);
    },
    [editor, uploadEndpoint, maybeDownscaleImage, uploadImageFile, placeCursorAtEnd]
  );
  

  // 파일 선택/드롭/붙여넣기
  const onFileChange = useCallback((e) => {
    const files = e.target.files;
    if (files?.length) uploadMany(files);
    e.target.value = "";
  }, [uploadMany]);

  const onDragOver = useCallback((e) => e.preventDefault(), []);
  const onDrop = useCallback((e) => {
    if (!editor) return;
    const dt = e.dataTransfer;
    if (!dt || !dt.files?.length) return;
    e.preventDefault();
    uploadMany(dt.files);
  }, [editor, uploadMany]);

  const onPaste = useCallback((e) => {
    if (!editor) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const imgs = [];
    for (const it of items) {
      if (it.type?.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) imgs.push(f);
      }
    }
    if (imgs.length) {
      e.preventDefault();
      uploadMany(imgs);
    }
  }, [editor, uploadMany]);
  
if (!editor) return null;

  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 8 }}>
      {/* 상단 바 */}
      <div className="tt-toolbar" style={toolbarWrapStyle}>
        <div style={toolbarRowStyle}>
          {/* 글자 */}
          <div className="grp">
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "on" : ""}>B</button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "on" : ""}>I</button>
            <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive("underline") ? "on" : ""}>U</button>
            <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive("strike") ? "on" : ""}>S</button>
          </div>
          {/* 제목/정렬 */}
          <div className="grp">
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive("heading", { level: 1 }) ? "on" : ""}>H1</button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive("heading", { level: 2 }) ? "on" : ""}>H2</button>
            <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive("heading", { level: 3 }) ? "on" : ""}>H3</button>
            <span className="sep" />
            <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={editor.isActive({ textAlign: "left" }) ? "on" : ""}>좌</button>
            <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={editor.isActive({ textAlign: "center" }) ? "on" : ""}>중</button>
            <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={editor.isActive({ textAlign: "right" }) ? "on" : ""}>우</button>
          </div>
          {/* 목록/코드/인용 */}
          <div className="grp">
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? "on" : ""}>●</button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive("orderedList") ? "on" : ""}>1.</button>
            <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive("blockquote") ? "on" : ""}>❝</button>
            <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive("codeBlock") ? "on" : ""}>{"</>"}</button>
            <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}>─</button>
          </div>
          {/* 링크/이미지 */}
          <div className="grp">
            <button type="button" onClick={promptAndSetLink} className={editor.isActive("link") ? "on" : ""}>링크</button>
            <button type="button" onClick={insertImageFromUrl}>이미지 URL</button>
            <button type="button" onClick={openFileDialog}>이미지 업로드</button>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onFileChange} />
          </div>
        </div>

                {/* 업로드 진행(다중) */}
        {uploadInfo && (
          <div style={{ padding: "6px 12px", fontSize: 12, color: "#555" }}>
            업로드 중… {uploadInfo.idx}/{uploadInfo.total} ( {uploadInfo.pct}% )
          </div>
        )}
      </div>

      {/* 에디터 영역 */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onPaste={onPaste}
        style={{
          minHeight: height,
          maxHeight: 800,
          overflowY: "auto",
          padding: 12,
          lineHeight: 1.7,
        }}
      >
        <EditorContent editor={editor} suppressHydrationWarning />
      </div>

      <style jsx>{`
        .on { background: #eef3ff; border-color: #a8c1ff !important; }
        .sep { width: 1px; height: 20px; background: #ddd; margin: 0 6px; }
      `}</style>

      {/* ProseMirror 이미지 가로맞춤(상세페이지와 동일) */}
      <style jsx global>{`
        .ProseMirror img.tt-img {
          width: 100%;
          max-width: 100%;
          height: auto;
          display: block;
          object-fit: contain;
        }
        .tt-toolbar button {
          border: 1px solid #ddd;
          background: #fff;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 12px;
        }
        .tt-toolbar .grp { display: inline-flex; gap: 6px; align-items: center; }
      `}</style>
    </div>
  );
}

/* ===== 상단바 스타일 ===== */
const toolbarWrapStyle = {
  position: "sticky",
  top: 0,
  zIndex: 5,
  borderBottom: "1px solid #eee",
  padding: 8,
  background: "#fafafa",
  borderTopLeftRadius: 8,
  borderTopRightRadius: 8,
};

const toolbarRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  alignItems: "center",
  marginBottom: 6,
};