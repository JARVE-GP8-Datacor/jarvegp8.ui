"use client";

import { useRef, useState, type DragEvent } from "react";
import { PaperclipIcon, ChevronMotif } from "../Icon";
import { ACCEPT_ATTR } from "@/lib/submit-types";

interface DropzoneProps {
  onFiles: (files: FileList) => void;
}

export function Dropzone({ onFiles }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const onDragEnterOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeaveDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
  };
  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files);
  };

  return (
    <label
      className={`dropzone ${dragging ? "dropzone--dragging" : ""}`}
      onDragEnter={onDragEnterOver}
      onDragOver={onDragEnterOver}
      onDragLeave={onDragLeaveDrop}
      onDrop={onDrop}
    >
      <ChevronMotif className="dropzone__chev" aria-hidden />
      <div className="dropzone__icon">
        <PaperclipIcon size={26} strokeWidth={1.75} />
      </div>
      <p className="dropzone__title">Drop files here</p>
      <p className="dropzone__hint">
        <span>or</span>{" "}
        <button
          type="button"
          className="link-btn"
          onClick={(e) => {
            e.preventDefault();
            openPicker();
          }}
        >
          browse your computer
        </button>
      </p>
      <div className="types" aria-label="Supported file types">
        <span className="type-pill">.PDF</span>
        <span className="type-pill">.CSV</span>
        <span className="type-pill">.XLS</span>
        <span className="type-pill">.XLSX</span>
        <span className="type-pill">.JPG</span>
        <span className="type-pill">.PNG</span>
        <span className="type-pill">.TIFF</span>
        <span className="type-pill">.WEBP</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        aria-label="Choose files to attach"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}
