"use client";

import { useRef, useState } from "react";
import { Button, IconButton, SectionCard, TextInput, cx } from "@/components/ui/controls";
import { IconDown, IconImage, IconTrash, IconUp, IconUpload } from "@/components/ui/icons";
import { approxSize, fileToDataUrl } from "@/lib/image";
import { useQuotations } from "@/lib/store";
import type { Quotation } from "@/lib/types";

export function VisualsTab({ quote }: { quote: Quotation }) {
  const { addImage, updateImage, removeImage, moveImage } = useQuotations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ingest = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" is not an image.`);
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(file);
        addImage(quote.id, { dataUrl, name: file.name, caption: "" });
      } catch {
        setError(`Could not read "${file.name}".`);
      }
    }
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="Design visuals"
        description="Optional. The first visual prints on the summary page; any others get their own page."
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void ingest(e.dataTransfer.files);
          }}
          className={cx(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition",
            dragging ? "border-brand bg-brand-light" : "border-line bg-paper/50",
          )}
        >
          <IconImage className="mb-2 h-6 w-6 text-ink-soft" />
          <p className="text-sm font-medium text-ink">Drop stand renders here</p>
          <p className="mt-0.5 mb-3 text-xs text-ink-soft">
            JPG or PNG — resized automatically so the quotation stays light
          </p>
          <Button onClick={() => inputRef.current?.click()}>
            <IconUpload /> Choose images
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              void ingest(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {error ? <p className="mt-2 text-xs text-brand">{error}</p> : null}

        <div className="mt-3 space-y-2">
          {quote.images.map((img, i) => (
            <div key={i} className="flex gap-3 rounded-lg border border-line bg-white p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.dataUrl}
                alt={img.caption || img.name || "visual"}
                className="h-16 w-24 flex-none rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-medium text-ink">
                    {i === 0 ? "Summary page" : `Visuals page · ${img.name || `Image ${i + 1}`}`}
                  </span>
                  <span className="flex-none text-xs text-ink-soft">{approxSize(img.dataUrl)}</span>
                </div>
                <TextInput
                  placeholder="Caption (optional)"
                  value={img.caption ?? ""}
                  onChange={(e) => updateImage(quote.id, i, { caption: e.target.value })}
                  className="mt-1.5 text-xs"
                />
              </div>
              <div className="flex flex-none flex-col justify-center">
                <IconButton
                  label="Move up"
                  disabled={i === 0}
                  onClick={() => moveImage(quote.id, i, -1)}
                >
                  <IconUp />
                </IconButton>
                <IconButton
                  label="Move down"
                  disabled={i === quote.images.length - 1}
                  onClick={() => moveImage(quote.id, i, 1)}
                >
                  <IconDown />
                </IconButton>
                <IconButton
                  label="Remove image"
                  className="hover:bg-brand-light hover:text-brand"
                  onClick={() => removeImage(quote.id, i)}
                >
                  <IconTrash />
                </IconButton>
              </div>
            </div>
          ))}
          {quote.images.length === 0 ? (
            <p className="py-2 text-center text-xs text-ink-soft">
              No visuals — the quotation prints fine without them.
            </p>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
