// components/editor/extensions/ToolbarButtons.jsx
import { useState, useEffect } from "react";
import { CellSelection, TableMap } from "@tiptap/pm/tables";

export default function ToolbarButtons({
  editor,
  fileInputRef,
  fontSizes = ["12px", "14px", "16px", "18px", "20px", "24px"],
}) {
  const [borderColor, setBorderColor] = useState("#000000");
  const [borderWidth, setBorderWidth] = useState("1px");
  const [showCellToolbar, setShowCellToolbar] = useState(false);
  const [selectionRect, setSelectionRect] = useState(null);
  const [showTableGrid, setShowTableGrid] = useState(false);
  const [hoverX, setHoverX] = useState(0);
  const [hoverY, setHoverY] = useState(0);
  const [bgColor, setBgColor] = useState("#ffffff");
  const buttonStyle = {
    padding: "6px 10px",
    fontSize: "13px",
    border: "1px solid #ccc",
    borderRadius: 4,
    backgroundColor: "#f4f4f4",
    cursor: "pointer",
  };

  useEffect(() => {
    const checkTableSelection = () => {
      const selection = editor?.state.selection;
      if (selection instanceof CellSelection) {
        const dom = editor.view.domAtPos(selection.$anchorCell.pos)?.node;
        if (dom instanceof HTMLElement) {
          const rect = dom.getBoundingClientRect();
          setSelectionRect({
            top: rect.top + window.scrollY - 40,
            left: rect.left + window.scrollX,
          });
          setShowCellToolbar(true);
        }
      } else {
        setShowCellToolbar(false);
      }
    };
    checkTableSelection();
    const interval = setInterval(checkTableSelection, 300);
    return () => clearInterval(interval);
  }, [editor]);

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("링크 URL을 입력하세요:", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      if (editor.state.selection.empty) {
        alert("링크를 적용할 텍스트를 먼저 선택하세요.");
        return;
      }
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  };

  const handleInsertTable = () => {
    setShowTableGrid((prev) => !prev);
  };

  const applyCellStyle = () => {
    const { state, view } = editor;
    const tr = state.tr;
    const cells = [];

    if (!(state.selection instanceof CellSelection)) {
      alert("선택된 셀이 없습니다.");
      return;
    }

    state.selection.forEachCell((node, pos) => {
      const cell = view.nodeDOM(pos);
      if (!cell || (cell.tagName !== "TD" && cell.tagName !== "TH")) {
        console.warn("❌ 정확한 셀 DOM 못 찾음", pos, cell);
        return;
      }

      const x = cell.cellIndex;
      const y = cell.parentElement?.rowIndex;

      if (typeof x === "number" && typeof y === "number") {
        cells.push({ node, pos, x, y });
      }
    });

    if (cells.length === 0) {
      alert("적용할 셀이 없습니다.");
      return;
    }

    const xs = cells.map((c) => c.x);
    const ys = cells.map((c) => c.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    cells.forEach(({ node, pos, x, y }) => {
      // 기존 스타일을 파싱해서 key-value 형태로 변환
      const existingStyles = Object.fromEntries(
        (node.attrs.style || "")
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => s.split(":").map((part) => part.trim()))
      );

      // 덮어쓸 방향별 테두리만 준비
      const borderUpdates = {
        ...(y === minY && {
          "border-top": `${borderWidth} solid ${borderColor}`,
        }),
        ...(y === maxY && {
          "border-bottom": `${borderWidth} solid ${borderColor}`,
        }),
        ...(x === minX && {
          "border-left": `${borderWidth} solid ${borderColor}`,
        }),
        ...(x === maxX && {
          "border-right": `${borderWidth} solid ${borderColor}`,
        }),
      };

      // 기존 스타일과 덮을 스타일 병합
      const finalStyles = {
        ...existingStyles,
        ...borderUpdates,
      };

      // 최종 style 문자열 조합
      const newStyle = Object.entries(finalStyles)
        .map(([key, val]) => `${key}: ${val}`)
        .join("; ");

      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        style: newStyle,
      });
    });

    view.dispatch(tr);
  };

  // ✅ 트랜잭션 이후 HTML 확인
  setTimeout(() => {}, 100);

  const handleTextAlign = (e) => {
    const align = e.target.value;
    editor.chain().focus().setTextAlign(align).run();
  };

  const mergeCells = () => editor.chain().focus().mergeCells().run();
  const addRow = () => editor.chain().focus().addRowAfter().run();
  const addColumn = () => editor.chain().focus().addColumnAfter().run();
  const deleteRow = () => editor.chain().focus().deleteRow().run();
  const deleteColumn = () => editor.chain().focus().deleteColumn().run();

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginRight: "auto",
        }}
      >
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={buttonStyle}
        >
          <b>B</b>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={buttonStyle}
        >
          <i>I</i>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={buttonStyle}
        >
          <u>U</u>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={buttonStyle}
        >
          리스트
        </button>
        <button onClick={handleSetLink} style={buttonStyle}>
          🔗 링크
        </button>
        <button
          onClick={() => {
            const url = window.prompt("이미지 URL을 입력하세요:");
            if (!url) return;
            editor.chain().focus().setImage({ src: url }).run();
          }}
          style={buttonStyle}
        >
          이미지 URL
        </button>
        <div style={{ position: "relative" }}>
          <button onClick={handleInsertTable} style={buttonStyle}>
            ▦ 테이블
          </button>

          {showTableGrid && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                background: "#fff",
                border: "1px solid #ccc",
                padding: 8,
                marginTop: 4,
                zIndex: 100,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(10, 20px)",
                  gap: 2,
                }}
              >
                {Array.from({ length: 100 }, (_, i) => {
                  const x = (i % 10) + 1;
                  const y = Math.floor(i / 10) + 1;
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => {
                        setHoverX(x);
                        setHoverY(y);
                      }}
                      onClick={() => {
                        console.log(
                          "📦 생성하려는 테이블 크기:",
                          hoverX,
                          "x",
                          hoverY
                        ); // 이거 추가
                        editor
                          .chain()
                          .focus()
                          .insertTable({
                            rows: hoverY,
                            cols: hoverX,
                            withHeaderRow: false,
                          })
                          .run();
                        setShowTableGrid(false);
                      }}
                      style={{
                        width: 20,
                        height: 20,
                        background:
                          x <= hoverX && y <= hoverY ? "#0070f3" : "#eee",
                        cursor: "pointer",
                      }}
                    />
                  );
                })}
              </div>
              <div style={{ marginTop: 6, fontSize: 12 }}>
                {hoverX} x {hoverY}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={buttonStyle}
        >
          📁 파일
        </button>
        <select
          onChange={(e) =>
            editor.chain().focus().setFontSize(e.target.value).run()
          }
          defaultValue="16px"
          style={buttonStyle}
        >
          {fontSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <select
          onChange={(e) =>
            editor.chain().focus().setFontFamily(e.target.value).run()
          }
          defaultValue=""
          style={buttonStyle}
        >
          <option value="">기본폰트</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Noto Sans KR">Noto Sans KR</option>
          <option value="Courier New">Courier New</option>
        </select>
        <input
          type="color"
          onChange={(e) =>
            editor.chain().focus().setColor(e.target.value).run()
          }
          title="폰트 색상"
          style={{ ...buttonStyle, padding: 4, width: 36 }}
        />
        <select
          onChange={handleTextAlign}
          defaultValue="left"
          style={buttonStyle}
        >
          <option value="left">좌측정렬</option>
          <option value="center">가운데정렬</option>
          <option value="right">우측정렬</option>
        </select>
      </div>

      {showCellToolbar && selectionRect && (
        <div
          style={{
            position: "absolute",
            top: selectionRect.top,
            left: selectionRect.left,
            background: "#fff",
            border: "1px solid #ccc",
            padding: 8,
            borderRadius: 4,
            display: "flex",
            gap: 6,
            zIndex: 100,
          }}
        >
          <select
            onChange={(e) => setBorderWidth(e.target.value)}
            defaultValue={borderWidth}
            style={buttonStyle}
          >
            <option value="1px">1px</option>
            <option value="2px">2px</option>
            <option value="3px">3px</option>
          </select>
          <input
            type="color"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            style={{ width: 36, height: 30 }}
          />

          <button onClick={applyCellStyle} style={buttonStyle}>
            테두리 적용
          </button>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => {
              const color = e.target.value;
              setBgColor(color);
              editor.commands.setCellAttribute("backgroundColor", color); // ⬅ 적용
            }}
            title="배경색"
            style={{ width: 32, height: 28, cursor: "pointer" }}
          />
          <button onClick={mergeCells} style={buttonStyle}>
            🧩 병합
          </button>
          <button onClick={addRow} style={buttonStyle}>
            ➕ 행
          </button>
          <button onClick={addColumn} style={buttonStyle}>
            ➕ 열
          </button>
          <button onClick={deleteRow} style={buttonStyle}>
            ➖ 행
          </button>
          <button onClick={deleteColumn} style={buttonStyle}>
            ➖ 열
          </button>
        </div>
      )}
    </>
  );
}
