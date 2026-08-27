"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { QuotationDocument } from "./QuotationDocument";
import { IconButton } from "@/components/ui/controls";
import { IconClose } from "@/components/ui/icons";
import { MM } from "./DocPage";
import type { Quotation } from "@/lib/types";

const PAGE_W = 210 * MM;

/**
 * Renders the live A4 document and scales it to fit the pane. The scale is a
 * CSS transform only — layout stays at true A4 size, so printing is unaffected.
 */
export function PreviewPane({ quote, onHide }: { quote: Quotation; onHide?: () => void }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.6);
  const [zoom, setZoom] = useState(1);
  const [stackHeight, setStackHeight] = useState(0);

  const measure = useCallback(() => {
    const frame = frameRef.current;
    const stack = stackRef.current;
    if (!frame) return;
    const available = frame.clientWidth - 48;
    setFitScale(Math.min(1.2, Math.max(0.18, available / PAGE_W)));
    if (stack) setStackHeight(stack.scrollHeight);
  }, []);

  useLayoutEffect(measure);

  useEffect(() => {
    const frame = frameRef.current;
    const stack = stackRef.current;
    if (!frame || !stack) return;
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    ro.observe(stack);
    return () => ro.disconnect();
  }, [measure]);

  const scale = fitScale * zoom;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#3d3b38] print-passthrough">
      <div className="no-print flex items-center justify-between gap-2 border-b border-black/30 bg-[#2f2d2b] px-3 py-2 text-white/80">
        <span className="text-xs font-medium tracking-wide uppercase">Live PDF preview</span>
        <div className="flex items-center gap-1">
          <IconButton
            label="Zoom out"
            onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)))}
            className="text-white/70 hover:bg-white/10 hover:text-white"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="7" cy="7" r="4.5" />
              <path d="M5 7h4M10.5 10.5 14 14" strokeLinecap="round" />
            </svg>
          </IconButton>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="min-w-[3.2rem] rounded px-1.5 py-1 text-xs tabular-nums hover:bg-white/10"
            title="Reset to fit width"
          >
            {Math.round(scale * 100)}%
          </button>
          <IconButton
            label="Zoom in"
            onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))}
            className="text-white/70 hover:bg-white/10 hover:text-white"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="7" cy="7" r="4.5" />
              <path d="M5 7h4M7 5v4M10.5 10.5 14 14" strokeLinecap="round" />
            </svg>
          </IconButton>
          {onHide ? (
            <IconButton
              label="Hide the preview"
              onClick={onHide}
              className="ml-1 hidden text-white/70 hover:bg-white/10 hover:text-white lg:inline-flex"
            >
              <IconClose />
            </IconButton>
          ) : null}
        </div>
      </div>

      <div ref={frameRef} className="scroll-slim flex-1 overflow-auto p-6 print-passthrough">
        <div
          style={{ height: stackHeight * scale, width: PAGE_W * scale }}
          className="mx-auto print-passthrough"
        >
          <div
            id="print-root"
            ref={stackRef}
            style={{
              width: PAGE_W,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <QuotationDocument quote={quote} />
          </div>
        </div>
      </div>
    </div>
  );
}
