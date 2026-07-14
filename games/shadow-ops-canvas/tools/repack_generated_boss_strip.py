"""Repack an AI-generated horizontal boss strip into clean fixed cells."""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


def dilate(mask: np.ndarray, iterations: int) -> np.ndarray:
    out = mask.copy()
    for _ in range(iterations):
        padded = np.pad(out, 1)
        neighbors = [
            padded[dy : dy + out.shape[0], dx : dx + out.shape[1]]
            for dy in range(3)
            for dx in range(3)
        ]
        out = np.logical_or.reduce(neighbors)
    return out


def components(mask: np.ndarray) -> list[tuple[int, int, int, int, int]]:
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    found: list[tuple[int, int, int, int, int]] = []
    for y in range(height):
        for x in range(width):
            if not mask[y, x] or seen[y, x]:
                continue
            queue = deque([(x, y)])
            seen[y, x] = True
            min_x = max_x = x
            min_y = max_y = y
            area = 0
            while queue:
                cx, cy = queue.popleft()
                area += 1
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < width and 0 <= ny < height and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((nx, ny))
            found.append((area, min_x, min_y, max_x + 1, max_y + 1))
    return found


def keep_largest_component(image: Image.Image) -> Image.Image:
    alpha = np.asarray(image.getchannel("A"))
    small_image = Image.fromarray(alpha).resize((image.width // 2, image.height // 2), Image.Resampling.BOX)
    small = np.asarray(small_image) > 12
    height, width = small.shape
    seen = np.zeros_like(small, dtype=bool)
    best: list[tuple[int, int]] = []
    for y in range(height):
        for x in range(width):
            if not small[y, x] or seen[y, x]:
                continue
            queue = deque([(x, y)])
            seen[y, x] = True
            pixels: list[tuple[int, int]] = []
            while queue:
                cx, cy = queue.popleft()
                pixels.append((cx, cy))
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < width and 0 <= ny < height and small[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((nx, ny))
            if len(pixels) > len(best):
                best = pixels
    keep = np.zeros_like(small, dtype=bool)
    for x, y in best:
        keep[y, x] = True
    keep = dilate(keep, 1)
    keep_image = Image.fromarray((keep * 255).astype(np.uint8)).resize(image.size, Image.Resampling.NEAREST)
    rgba = np.asarray(image).copy()
    rgba[:, :, 3] = np.minimum(rgba[:, :, 3], np.asarray(keep_image))
    rgba[:, :14, 3] = 0
    rgba[:, -14:, 3] = 0
    return Image.fromarray(rgba, "RGBA")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--frames-dir", required=True)
    parser.add_argument("--frames", type=int, default=8)
    parser.add_argument("--frame-size", type=int, default=384)
    parser.add_argument("--downsample", type=int, default=4)
    parser.add_argument("--dilate", type=int, default=0)
    parser.add_argument("--nominal", action="store_true")
    args = parser.parse_args()

    image = Image.open(args.input).convert("RGBA")
    alpha = np.asarray(image.getchannel("A"))
    boxes: list[tuple[int, int, int, int]] = []
    if args.nominal:
        cell = image.width / args.frames
        overlap = 0
        for index in range(args.frames):
            left = max(0, round(index * cell - overlap))
            right = min(image.width, round((index + 1) * cell + overlap))
            local_alpha = alpha[:, left:right]
            small = Image.fromarray(local_alpha).resize(
                (max(1, local_alpha.shape[1] // args.downsample), max(1, local_alpha.shape[0] // args.downsample)),
                Image.Resampling.BOX,
            )
            local_blobs = [item for item in components(np.asarray(small) > 28) if item[0] > 120]
            if not local_blobs:
                raise SystemExit(f"No silhouette found in frame {index + 1}")
            expected = ((index + 0.5) * cell - left) / args.downsample
            local_blobs.sort(key=lambda item: item[0] / (1 + abs((item[1] + item[3]) * 0.5 - expected) * 0.05), reverse=True)
            _, x0, y0, x1, y1 = local_blobs[0]
            x0 = max(0, left + x0 * args.downsample - 18)
            y0 = max(0, y0 * args.downsample - 18)
            x1 = min(image.width, left + x1 * args.downsample + 18)
            y1 = min(image.height, y1 * args.downsample + 18)
            boxes.append((x0, y0, x1, y1))
    else:
        small = Image.fromarray(alpha).resize(
            (max(1, image.width // args.downsample), max(1, image.height // args.downsample)),
            Image.Resampling.BOX,
        )
        mask = np.asarray(small) > 28
        merged = dilate(mask, args.dilate)
        blobs = [item for item in components(merged) if item[0] > 180]
        blobs.sort(reverse=True)
        blobs = blobs[: args.frames]
        if len(blobs) != args.frames:
            raise SystemExit(f"Expected {args.frames} silhouettes, found {len(blobs)}")
        blobs.sort(key=lambda item: (item[1] + item[3]) * 0.5)
        for _, x0, y0, x1, y1 in blobs:
            x0 = max(0, x0 * args.downsample - 18)
            y0 = max(0, y0 * args.downsample - 18)
            x1 = min(image.width, x1 * args.downsample + 18)
            y1 = min(image.height, y1 * args.downsample + 18)
            boxes.append((x0, y0, x1, y1))

    max_w = max(x1 - x0 for x0, _, x1, _ in boxes)
    max_h = max(y1 - y0 for _, y0, _, y1 in boxes)
    available = args.frame_size - 28
    shared_scale = min(available / max_w, available / max_h)

    frames_dir = Path(args.frames_dir)
    frames_dir.mkdir(parents=True, exist_ok=True)
    strip = Image.new("RGBA", (args.frame_size * args.frames, args.frame_size), (0, 0, 0, 0))
    for index, box in enumerate(boxes, 1):
        crop = image.crop(box)
        size = (max(1, round(crop.width * shared_scale)), max(1, round(crop.height * shared_scale)))
        crop = crop.resize(size, Image.Resampling.LANCZOS)
        frame = Image.new("RGBA", (args.frame_size, args.frame_size), (0, 0, 0, 0))
        px = (args.frame_size - crop.width) // 2
        py = args.frame_size - crop.height - 10
        frame.alpha_composite(crop, (px, py))
        frame = keep_largest_component(frame)
        frame.save(frames_dir / f"{index:02d}.png")
        strip.alpha_composite(frame, ((index - 1) * args.frame_size, 0))
    strip.save(args.output)


if __name__ == "__main__":
    main()
