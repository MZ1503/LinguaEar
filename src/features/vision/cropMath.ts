export type Rect = { x: number; y: number; width: number; height: number };
export type Handle = 'move' | 'tl' | 'tr' | 'bl' | 'br';

export const MIN_BOX = 64;

/** Where an image of `imgW`x`imgH` lands when shown "contain" inside an `areaW`x`areaH` box. */
export function containRect(areaW: number, areaH: number, imgW: number, imgH: number) {
  const scale = Math.min(areaW / imgW, areaH / imgH);
  const width = imgW * scale;
  const height = imgH * scale;
  return { scale, x: (areaW - width) / 2, y: (areaH - height) / 2, width, height };
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/** Applies a drag of (`dx`, `dy`) to `start`, keeping the box inside `bounds` and at least MIN_BOX in size. */
export function dragBox(start: Rect, handle: Handle, dx: number, dy: number, bounds: Rect): Rect {
  if (handle === 'move') {
    return {
      ...start,
      x: clamp(start.x + dx, bounds.x, bounds.x + bounds.width - start.width),
      y: clamp(start.y + dy, bounds.y, bounds.y + bounds.height - start.height),
    };
  }

  let left = start.x;
  let top = start.y;
  let right = start.x + start.width;
  let bottom = start.y + start.height;

  if (handle === 'tl' || handle === 'bl') left = clamp(left + dx, bounds.x, right - MIN_BOX);
  if (handle === 'tr' || handle === 'br') right = clamp(right + dx, left + MIN_BOX, bounds.x + bounds.width);
  if (handle === 'tl' || handle === 'tr') top = clamp(top + dy, bounds.y, bottom - MIN_BOX);
  if (handle === 'bl' || handle === 'br')
    bottom = clamp(bottom + dy, top + MIN_BOX, bounds.y + bounds.height);

  return { x: left, y: top, width: right - left, height: bottom - top };
}

/** Converts a box in screen coordinates to whole pixels of the original image. */
export function toImageRect(
  box: Rect,
  shown: { scale: number; x: number; y: number },
  imgW: number,
  imgH: number,
): Rect {
  const x = clamp(Math.round((box.x - shown.x) / shown.scale), 0, imgW - 1);
  const y = clamp(Math.round((box.y - shown.y) / shown.scale), 0, imgH - 1);
  return {
    x,
    y,
    width: clamp(Math.round(box.width / shown.scale), 1, imgW - x),
    height: clamp(Math.round(box.height / shown.scale), 1, imgH - y),
  };
}

/** A starting box: a wide band across the middle, where signs and lines of text usually are. */
export function defaultBox(bounds: Rect): Rect {
  const width = bounds.width * 0.9;
  const height = Math.max(MIN_BOX, bounds.height * 0.3);
  return {
    x: bounds.x + (bounds.width - width) / 2,
    y: bounds.y + (bounds.height - height) / 2,
    width,
    height,
  };
}
