// frontend/components/common/ImageUploader.jsx
import { useRef, useState, useCallback } from "react";

export default function ImageUploader({
  value = "",
  onChange,          // (dataUrl: string) => void
  onReset,           // () => void
  accept = "image/*",
  maxSizeMB = 5,
  aspectRatio = "1/1", // "1/1" | "4/3" | "16/9" ...
  rounded = 10,
  disabled = false,
  placeholder = "[이미지 업로드]",
  showReset = true,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const readFileAsDataUrl = useCallback((file) => {
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`이미지 용량이 ${maxSizeMB}MB를 초과합니다.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange?.(String(reader.result || ""));
    reader.readAsDataURL(file);
  }, [maxSizeMB, onChange]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    readFileAsDataUrl(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    readFileAsDataUrl(file);
  };

  return (
    <div className="wrap">
      <label
        className={`box ${value ? "hasImage" : ""} ${dragOver ? "drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        aria-disabled={disabled}
      >
        {value ? (
          <img src={value} alt="썸네일" className="img" />
        ) : (
          <span className="ph">{placeholder}</span>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          className="hidden"
          onChange={handleFile}
        />
        {!disabled && (
          <div className="actions">
            <button type="button" className="btn" onClick={() => inputRef.current?.click()}>
              업로드
            </button>
            {showReset && value && (
              <button type="button" className="btn ghost" onClick={onReset}>
                초기화
              </button>
            )}
          </div>
        )}
      </label>

      <style jsx>{`
        .wrap { width: 100%; }
        .box {
          width: 100%;
          aspect-ratio: ${aspectRatio};
          border: 2px dashed #ccc;
          border-radius: ${rounded}px;
          background: #fafafa;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          cursor: ${disabled ? "default" : "pointer"};
          transition: border-color .15s ease, background .15s ease;
        }
        .box.hasImage { border-style: solid; }
        .box.drag { border-color: #0070f3; background: #eef6ff; }
        .img { width: 100%; height: 100%; object-fit: cover; }
        .ph { color: #777; font-size: 14px; }
        .hidden { display: none; }

        .actions {
          position: absolute;
          right: 8px;
          bottom: 8px;
          display: flex;
          gap: 6px;
        }
        .btn {
          padding: 6px 10px;
          font-size: 12px;
          border-radius: 8px;
          border: 1px solid #0070f3;
          background: #0070f3;
          color: #fff;
        }
        .btn.ghost {
          background: #fff;
          color: #333;
          border-color: #ccc;
        }

        /* 모바일에서도 동일한 aspect-ratio 유지 */
        @media (max-width: 768px) {
          .box { aspect-ratio: ${aspectRatio}; }
        }
      `}</style>
    </div>
  );
}
