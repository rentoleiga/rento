import React, { useCallback, useEffect, useRef, useState } from "react";

function clamp(n) {
  return Math.min(100, Math.max(0, n));
}

// Drag-to-position editor. The image fills the frame with object-fit: cover and
// the pointer drag moves the visible crop (object-position). Dragging right
// reveals the left side of the photo, which is what people expect when they
// "pull the picture".
export default function ImagePositioner({ url, position, onChange, aspect = "4 / 3", alt = "" }) {
  const frameRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0, nw: 0, nh: 0 });

  const measure = useCallback(() => {
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    setBox({
      w: rect.width,
      h: rect.height,
      nw: img?.naturalWidth || 0,
      nh: img?.naturalHeight || 0,
    });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    let ro = null;
    if (typeof ResizeObserver !== "undefined" && frameRef.current) {
      ro = new ResizeObserver(measure);
      ro.observe(frameRef.current);
    }
    return () => {
      window.removeEventListener("resize", measure);
      if (ro) ro.disconnect();
    };
  }, [measure, url]);

  const imgAspect = box.nw && box.nh ? box.nw / box.nh : 0;
  const frameAspect = box.w && box.h ? box.w / box.h : 0;
  const overflowX = imgAspect && frameAspect && imgAspect > frameAspect ? box.h * imgAspect - box.w : 0;
  const overflowY = imgAspect && frameAspect && imgAspect < frameAspect ? box.w / imgAspect - box.h : 0;
  const canDrag = overflowX > 0.5 || overflowY > 0.5;

  const emit = (x, y) => {
    onChange({ x: Math.round(clamp(x) * 10) / 10, y: Math.round(clamp(y) * 10) / 10 });
  };

  const onPointerDown = (e) => {
    if (!canDrag || e.button > 0) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* synthetic events may not have an active pointer */
    }
    dragRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    setDragging(true);
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    emit(
      overflowX > 0 ? drag.posX - (dx / overflowX) * 100 : drag.posX,
      overflowY > 0 ? drag.posY - (dy / overflowY) * 100 : drag.posY
    );
  };

  const endDrag = (e) => {
    if (!dragRef.current || dragRef.current.id !== e.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  };

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 2;
    let { x, y } = position;
    if (e.key === "ArrowLeft") x += step;
    else if (e.key === "ArrowRight") x -= step;
    else if (e.key === "ArrowUp") y += step;
    else if (e.key === "ArrowDown") y -= step;
    else return;
    e.preventDefault();
    emit(x, y);
  };

  return (
    <div
      ref={frameRef}
      className={`image-crop-frame${dragging ? " is-dragging" : ""}${canDrag ? "" : " is-static"}`}
      style={{ aspectRatio: aspect }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="img"
      aria-label={alt || "Staðsetja mynd — dragðu til að velja útskot"}
    >
      <img
        ref={imgRef}
        src={url}
        alt=""
        draggable={false}
        onLoad={measure}
        style={{ objectPosition: `${position.x}% ${position.y}%` }}
      />
      {canDrag && !dragging && (
        <span className="image-crop-hint" aria-hidden="true">
          <DragIcon /> Dragðu myndina
        </span>
      )}
      {dragging && <span className="image-crop-grid" aria-hidden="true" />}
    </div>
  );
}

export function DragIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
    </svg>
  );
}
