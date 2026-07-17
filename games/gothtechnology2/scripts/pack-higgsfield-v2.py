import argparse
import hashlib
import json
import math
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from stabilize_motion_atlases import stabilize_manifest


ROOT = Path(__file__).resolve().parents[1]
PRODUCTION_ROOT = ROOT / "assets" / "sprite-production" / "higgsfield-v2"
JOBS_PATH = PRODUCTION_ROOT / "jobs.json"
OUTPUT_ROOT = ROOT / "assets" / "motion-atlases"
OUTPUT_MANIFEST = OUTPUT_ROOT / "motion-atlas-manifest.json"
PREVIEW_ROOT = PRODUCTION_ROOT / "previews"

CELL_SIZE = 192
ATLAS_COLUMNS = 8
SOURCE_COLUMNS = 3
SOURCE_ROWS = 2
SOURCE_PANEL_GUTTER = 6
FRAME_COUNT = SOURCE_COLUMNS * SOURCE_ROWS
COMPONENT_SCALE = 4
SOURCE_MAX_WIDTH = 1536

CATEGORIES = {
    "locomotion": [
        "IDLE",
        "READY_STANCE",
        "CROUCH_IDLE",
        "CROUCH_WALK",
        "DASH_BACK",
        "DASH_FORWARD",
        "JUMP_FALL",
        "JUMP_PEAK",
        "JUMP_RISE",
        "JUMP_START",
        "LANDING",
        "RUN_BACK",
        "RUN_FORWARD",
        "WALK_BACK",
        "WALK_FORWARD",
    ],
    "combat": [
        "AIR_ATTACK",
        "COMBO_1",
        "COMBO_2",
        "CROUCH_ATTACK",
        "HEAVY_KICK",
        "HEAVY_PUNCH",
        "LIGHT_KICK",
        "LIGHT_PUNCH",
        "SPECIAL_PROJECTILE",
        "SPECIAL_RECOVER",
        "SPECIAL_START",
        "SUPER_CHARGE",
        "SUPER_RELEASE",
        "THROW_FINISH",
        "THROW_GRAB",
    ],
    "reaction": [
        "BLOCK_HIGH",
        "BLOCK_LOW",
        "DEFEAT",
        "GET_UP",
        "HURT_HEAVY",
        "HURT_LIGHT",
        "KNOCKDOWN",
        "TAUNT",
        "VICTORY",
    ],
}

FRAME_DURATIONS = {
    "IDLE": 118,
    "READY_STANCE": 92,
    "CROUCH_IDLE": 112,
    "CROUCH_WALK": 92,
    "RUN_BACK": 72,
    "RUN_FORWARD": 72,
    "WALK_BACK": 98,
    "WALK_FORWARD": 98,
    "BLOCK_HIGH": 88,
    "BLOCK_LOW": 88,
    "DEFEAT": 112,
    "VICTORY": 108,
}


def chroma_key(image: Image.Image, *, neutral_cleanup: bool = True) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.uint8).copy()
    rgb = rgba[:, :, :3].astype(np.int16)
    red, green, blue = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    green_delta = np.minimum(green - red, green - blue)
    chroma = (green > 72) & (green_delta > 18) & (green > red * 1.08) & (green > blue * 1.08)

    alpha = np.full(green.shape, 255, dtype=np.float32)
    hard_background = chroma & (green_delta >= 52)
    soft_background = chroma & ~hard_background
    alpha[hard_background] = 0
    alpha[soft_background] = np.clip((52 - green_delta[soft_background]) / 34 * 255, 0, 255)
    alpha[alpha < 20] = 0

    spill = (alpha > 0) & (green > red) & (green > blue)
    neutral_green = np.maximum(red, blue) + 4
    rgba[:, :, 1][spill] = np.minimum(green[spill], neutral_green[spill]).astype(np.uint8)
    rgba[:, :, 3] = alpha.astype(np.uint8)
    keyed = Image.fromarray(rgba, "RGBA")

    keyed_alpha = np.asarray(keyed.getchannel("A"))
    ys, xs = np.where(keyed_alpha > 24)
    if len(xs):
        box_area = (xs.max() - xs.min() + 1) * (ys.max() - ys.min() + 1)
        rectangularity = len(xs) / max(1, box_area)
        coverage = len(xs) / (keyed.width * keyed.height)
        if neutral_cleanup and (rectangularity > 0.7 or coverage > 0.5):
            keyed_rgba = np.asarray(keyed, dtype=np.uint8).copy()
            edge_rgb = np.concatenate(
                (
                    keyed_rgba[0, :, :3],
                    keyed_rgba[-1, :, :3],
                    keyed_rgba[:, 0, :3],
                    keyed_rgba[:, -1, :3],
                )
            )
            edge_alpha = np.concatenate(
                (
                    keyed_rgba[0, :, 3],
                    keyed_rgba[-1, :, 3],
                    keyed_rgba[:, 0, 3],
                    keyed_rgba[:, -1, 3],
                )
            )
            opaque_edge = edge_rgb[edge_alpha > 24]
            if len(opaque_edge):
                edge_color = np.median(opaque_edge, axis=0)
                edge_saturation = float(edge_color.max() - edge_color.min())
                edge_luminance = float(edge_color.mean())
                if edge_saturation < 44:
                    frame_rgb = keyed_rgba[:, :, :3].astype(np.int16)
                    channel_max = frame_rgb.max(axis=2)
                    channel_min = frame_rgb.min(axis=2)
                    saturation = channel_max - channel_min
                    luminance = frame_rgb.mean(axis=2)
                    if edge_luminance >= 110:
                        neutral_panel = (saturation < 48) & (luminance > max(86, edge_luminance - 115))
                    else:
                        neutral_panel = (saturation < 48) & (luminance < min(150, edge_luminance + 110))
                    neutral_panel &= keyed_rgba[:, :, 3] > 24
                    panel_mask = Image.fromarray((neutral_panel * 255).astype(np.uint8), "L").copy()
                    neutral_edge_points = []
                    for x in range(0, keyed.width, max(4, keyed.width // 80)):
                        neutral_edge_points.extend(((x, 0), (x, keyed.height - 1)))
                    for y in range(0, keyed.height, max(4, keyed.height // 80)):
                        neutral_edge_points.extend(((0, y), (keyed.width - 1, y)))
                    for point in neutral_edge_points:
                        if panel_mask.getpixel(point) == 255:
                            ImageDraw.floodfill(panel_mask, point, 128, thresh=0)
                    connected_panel = np.asarray(panel_mask) == 128
                    keyed_rgba[:, :, 3][connected_panel] = 0
                    keyed = Image.fromarray(keyed_rgba, "RGBA")

            keyed_alpha = np.asarray(keyed.getchannel("A"))
            ys, xs = np.where(keyed_alpha > 24)
            if not len(xs):
                return keyed
            min_x, max_x = int(xs.min()), int(xs.max())
            min_y, max_y = int(ys.min()), int(ys.max())
            edge_points = []
            step = max(12, min(keyed.width, keyed.height) // 24)
            for x in range(0, keyed.width, step):
                edge_points.extend(((x, 0), (x, keyed.height - 1)))
            for y in range(0, keyed.height, step):
                edge_points.extend(((0, y), (keyed.width - 1, y)))
            edge_points.extend(
                ((0, 0), (keyed.width - 1, 0), (0, keyed.height - 1), (keyed.width - 1, keyed.height - 1))
            )
            bbox_step = max(8, min(max_x - min_x, max_y - min_y) // 20)
            for x in range(min_x, max_x + 1, bbox_step):
                edge_points.extend(((x, min_y), (x, max_y)))
            for y in range(min_y, max_y + 1, bbox_step):
                edge_points.extend(((min_x, y), (max_x, y)))
            for point in edge_points:
                if keyed.getpixel(point)[3] > 24:
                    ImageDraw.floodfill(keyed, point, (0, 0, 0, 0), thresh=48)

    return keyed


def validate_transparency(
    image: Image.Image,
    label: str,
    *,
    max_coverage: float = 0.55,
    max_rectangularity: float = 0.78,
) -> None:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > 24)
    if not len(xs):
        raise ValueError(f"{label} contains no foreground")
    box_area = (xs.max() - xs.min() + 1) * (ys.max() - ys.min() + 1)
    rectangularity = len(xs) / max(1, box_area)
    coverage = len(xs) / (image.width * image.height)
    if rectangularity > max_rectangularity or coverage > max_coverage:
        raise ValueError(
            f"{label} retained a panel background: coverage={coverage:.3f} rectangularity={rectangularity:.3f}"
        )


def connected_components(mask: np.ndarray) -> list[dict]:
    height, width = mask.shape
    seen = np.zeros(mask.shape, dtype=bool)
    components = []

    for start_y, start_x in zip(*np.where(mask & ~seen), strict=True):
        if seen[start_y, start_x]:
            continue
        queue = deque([(int(start_y), int(start_x))])
        seen[start_y, start_x] = True
        area = 0
        min_x = max_x = int(start_x)
        min_y = max_y = int(start_y)
        while queue:
            y, x = queue.pop()
            area += 1
            min_x, max_x = min(min_x, x), max(max_x, x)
            min_y, max_y = min(min_y, y), max(max_y, y)
            for next_y, next_x in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if (
                    0 <= next_y < height
                    and 0 <= next_x < width
                    and mask[next_y, next_x]
                    and not seen[next_y, next_x]
                ):
                    seen[next_y, next_x] = True
                    queue.append((next_y, next_x))
        components.append(
            {
                "area": area,
                "min_x": min_x,
                "max_x": max_x,
                "min_y": min_y,
                "max_y": max_y,
                "width": max_x - min_x + 1,
                "height": max_y - min_y + 1,
                "center_x": (min_x + max_x) / 2,
            }
        )
    return components


def remove_edge_grid_seams(image: Image.Image) -> Image.Image:
    rgba = np.asarray(image, dtype=np.uint8).copy()
    alpha = rgba[:, :, 3]
    dark_foreground = (alpha > 24) & (rgba[:, :, :3].max(axis=2) < 24)

    def clear_long_dark_runs(projection: np.ndarray, axis: str, span: int) -> None:
        indices = np.where(projection > span * 0.52)[0]
        if not len(indices):
            return
        run_start = previous = int(indices[0])
        for raw_index in (*indices[1:], None):
            index = None if raw_index is None else int(raw_index)
            if index is not None and index == previous + 1:
                previous = index
                continue
            if previous - run_start + 1 <= 18:
                start = max(0, run_start - 3)
                end = previous + 4
                if axis == "vertical":
                    alpha[:, start:end] = 0
                else:
                    alpha[start:end, :] = 0
            if index is not None:
                run_start = previous = index

    clear_long_dark_runs(dark_foreground.sum(axis=0), "vertical", image.height)
    clear_long_dark_runs(dark_foreground.sum(axis=1), "horizontal", image.width)

    reduced = Image.fromarray(alpha, "L").resize(
        (max(1, image.width // COMPONENT_SCALE), max(1, image.height // COMPONENT_SCALE)),
        Image.Resampling.NEAREST,
    )
    reduced_mask = np.asarray(reduced) > 24
    vertical_edge_band = max(4, round(reduced_mask.shape[1] * 0.25))
    horizontal_edge_band = max(4, round(reduced_mask.shape[0] * 0.25))
    for component in connected_components(reduced_mask):
        touches_vertical_edge = (
            component["min_x"] <= vertical_edge_band
            or component["max_x"] >= reduced_mask.shape[1] - vertical_edge_band - 1
        )
        touches_horizontal_edge = (
            component["min_y"] <= horizontal_edge_band
            or component["max_y"] >= reduced_mask.shape[0] - horizontal_edge_band - 1
        )
        if (
            touches_vertical_edge
            and component["width"] <= 5
            and component["height"] > reduced_mask.shape[0] * 0.62
        ):
            left = max(0, component["min_x"] * COMPONENT_SCALE - 2)
            right = min(image.width, (component["max_x"] + 1) * COMPONENT_SCALE + 2)
            alpha[:, left:right] = 0
        if (
            touches_horizontal_edge
            and component["height"] <= 5
            and component["width"] > reduced_mask.shape[1] * 0.62
        ):
            top = max(0, component["min_y"] * COMPONENT_SCALE - 2)
            bottom = min(image.height, (component["max_y"] + 1) * COMPONENT_SCALE + 2)
            alpha[top:bottom, :] = 0
    rgba[:, :, 3] = alpha
    return Image.fromarray(rgba, "RGBA")


def split_row_into_figures(row: Image.Image) -> list[Image.Image]:
    keyed = chroma_key(row)
    alpha = keyed.getchannel("A").resize(
        (max(1, keyed.width // COMPONENT_SCALE), max(1, keyed.height // COMPONENT_SCALE)),
        Image.Resampling.NEAREST,
    )
    mask = np.asarray(alpha) > 24
    components = connected_components(mask)
    mask_width = mask.shape[1]
    candidates = [
        component
        for component in components
        if component["area"] > 500
        and component["width"] > 12
        and component["height"] > 28
        and component["width"] < mask_width * 0.55
    ]
    candidates.sort(key=lambda component: component["area"], reverse=True)
    if len(candidates) < 3:
        raise ValueError(f"Could not detect three complete figures in generated row; found {len(candidates)}")

    figures = candidates[:3]
    if (
        len(candidates) >= 4
        and candidates[3]["area"] >= 9_000
        and candidates[3]["area"] >= candidates[2]["area"] * 0.78
    ):
        figures.append(candidates[3])
    figures.sort(key=lambda component: component["center_x"])

    centers = [component["center_x"] * COMPONENT_SCALE for component in figures]
    boundaries = [0]
    boundaries.extend(round((left + right) / 2) for left, right in zip(centers, centers[1:]))
    boundaries.append(keyed.width)

    frames = []
    for left, right in zip(boundaries, boundaries[1:]):
        panel = keyed.crop((left, 0, right, keyed.height))
        if panel.width <= SOURCE_PANEL_GUTTER * 2:
            raise ValueError("Detected figure panel is too narrow")
        panel = panel.crop(
            (
                SOURCE_PANEL_GUTTER,
                SOURCE_PANEL_GUTTER,
                panel.width - SOURCE_PANEL_GUTTER,
                panel.height - SOURCE_PANEL_GUTTER,
            )
        )
        frames.append(remove_edge_grid_seams(panel))
    return frames


def detect_row_boundary(source: Image.Image) -> int:
    rgb = np.asarray(source, dtype=np.float32)
    low = round(source.height * 0.36)
    high = round(source.height * 0.64)
    scores = []
    for y in range(low, high):
        strip = rgb[max(0, y - 2):min(source.height, y + 3), :, :].reshape(-1, 3)
        scores.append((float(np.std(strip, axis=0).mean()), y))
    return min(scores)[1]


def resize_source_for_runtime(source: Image.Image) -> Image.Image:
    if source.width <= SOURCE_MAX_WIDTH:
        return source
    scale = SOURCE_MAX_WIDTH / source.width
    return source.resize(
        (SOURCE_MAX_WIDTH, max(1, round(source.height * scale))),
        Image.Resampling.LANCZOS,
    )


def source_figure_counts(path: Path) -> list[int]:
    with Image.open(path) as source:
        source = resize_source_for_runtime(source.convert("RGB"))
        row_boundary = detect_row_boundary(source)
        y_edges = [0, row_boundary, source.height]
        counts = []
        for row in range(SOURCE_ROWS):
            row_image = source.crop(
                (0, y_edges[row] + SOURCE_PANEL_GUTTER, source.width, y_edges[row + 1] - SOURCE_PANEL_GUTTER)
            )
            reduced_row = row_image.resize(
                (max(1, row_image.width // COMPONENT_SCALE), max(1, row_image.height // COMPONENT_SCALE)),
                Image.Resampling.LANCZOS,
            )
            keyed = chroma_key(reduced_row)
            mask = np.asarray(keyed.getchannel("A")) > 24
            mask_width = mask.shape[1]
            candidates = [
                component
                for component in connected_components(mask)
                if component["area"] > 500
                and component["width"] > 12
                and component["height"] > 28
                and component["width"] < mask_width * 0.55
            ]
            counts.append(len(candidates))
        return counts


def split_sheet(path: Path) -> list[Image.Image]:
    with Image.open(path) as source:
        source = resize_source_for_runtime(source.convert("RGB"))
        row_boundary = detect_row_boundary(source)
        y_edges = [0, row_boundary, source.height]
        frames = []
        for row in range(SOURCE_ROWS):
            row_image = source.crop(
                (0, y_edges[row] + SOURCE_PANEL_GUTTER, source.width, y_edges[row + 1] - SOURCE_PANEL_GUTTER)
            )
            frames.extend(split_row_into_figures(row_image))
        if len(frames) < FRAME_COUNT:
            raise ValueError(f"Generated sheet {path.name} yielded only {len(frames)} complete figures")
        if len(frames) > FRAME_COUNT:
            indices = [round(index * (len(frames) - 1) / (FRAME_COUNT - 1)) for index in range(FRAME_COUNT)]
            frames = [frames[index] for index in indices]
        return frames


def panel_divider_runs(projection: np.ndarray, span: int) -> list[tuple[int, int]]:
    indices = np.where(projection > 0.80)[0]
    if not len(indices):
        return []

    runs = []
    start = previous = int(indices[0])
    for raw_index in (*indices[1:], None):
        index = None if raw_index is None else int(raw_index)
        if index is not None and index == previous + 1:
            previous = index
            continue
        width = previous - start + 1
        if 1 <= width <= max(24, round(span * 0.025)) and start > 2 and previous < span - 3:
            runs.append((start, previous + 1))
        if index is not None:
            start = previous = index
    return runs


def panel_intervals(span: int, divider_runs: list[tuple[int, int]]) -> list[tuple[int, int]]:
    intervals = []
    start = 0
    for divider_start, divider_end in divider_runs:
        if divider_start - start > SOURCE_PANEL_GUTTER * 2:
            intervals.append((start, divider_start))
        start = divider_end
    if span - start > SOURCE_PANEL_GUTTER * 2:
        intervals.append((start, span))
    return intervals


def split_horizontal_strip(path: Path) -> list[Image.Image]:
    with Image.open(path) as source:
        source = resize_source_for_runtime(source.convert("RGB"))
        rgb = np.asarray(source, dtype=np.uint8)
        dark = rgb.max(axis=2) < 90
        y_intervals = panel_intervals(
            source.height,
            panel_divider_runs(dark.mean(axis=1), source.height),
        )
        initial_x_intervals = panel_intervals(
            source.width,
            panel_divider_runs(dark.mean(axis=0), source.width),
        )
        if len(initial_x_intervals) < FRAME_COUNT and len(y_intervals) == 1:
            red = rgb[:, :, 0].astype(np.int16)
            green = rgb[:, :, 1].astype(np.int16)
            blue = rgb[:, :, 2].astype(np.int16)
            green_delta = np.minimum(green - red, green - blue)
            foreground = ~((green > 40) & (green_delta > 8))
            row_occupancy = foreground.mean(axis=1)
            low = round(source.height * 0.30)
            high = round(source.height * 0.70)
            split = low + int(np.argmin(row_occupancy[low:high]))
            if row_occupancy[split] < 0.12:
                y_intervals = [(0, split), (split + 1, source.height)]

        panel_specs = []
        row_widths = []
        for row, (top, bottom) in enumerate(y_intervals, start=1):
            row_dark = dark[top:bottom]
            x_intervals = panel_intervals(
                source.width,
                panel_divider_runs(row_dark.mean(axis=0), source.width),
            )
            row_widths.append(len(x_intervals))
            panel_specs.extend((row, column, left, top, right, bottom) for column, (left, right) in enumerate(x_intervals, start=1))

        if len(panel_specs) < FRAME_COUNT:
            raise ValueError(
                f"Generated sheet {path.name} exposed only "
                f"{' + '.join(map(str, row_widths))} complete panels"
            )

        frames = []
        for row, column, left, top, right, bottom in panel_specs:
            panel = source.crop((left, top, right, bottom))
            keyed = remove_edge_grid_seams(chroma_key(panel, neutral_cleanup=False))
            validate_transparency(
                keyed,
                f"{path.stem}/source-panel-{row}-{column}",
                max_coverage=0.72,
                max_rectangularity=0.86,
            )
            frames.append(keyed)

        if len(frames) > FRAME_COUNT:
            indices = [round(index * (len(frames) - 1) / (FRAME_COUNT - 1)) for index in range(FRAME_COUNT)]
            frames = [frames[index] for index in indices]
        return frames


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.where(alpha > 24)
    if not len(xs):
        raise ValueError("Frame contains no foreground after chroma removal")
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def repair_amara_aerial_frames(
    motion: str,
    frames: list[Image.Image],
    source_frames: dict[str, list[Image.Image]],
) -> list[Image.Image]:
    repaired = list(frames)
    if motion == "JUMP_PEAK":
        repaired[3] = source_frames["JUMP_RISE"][2]
    elif motion == "AIR_ATTACK":
        repaired = [
            frames[0],
            frames[1],
            source_frames["JUMP_START"][5],
            frames[3],
            source_frames["JUMP_PEAK"][4],
            source_frames["JUMP_FALL"][0],
        ]
    return repaired


def validate_detached_fragments(image: Image.Image, label: str) -> None:
    alpha = np.asarray(image.getchannel("A")) > 24
    total = int(alpha.sum())
    significant = [
        component
        for component in connected_components(alpha)
        if component["area"] >= total * 0.035
    ]
    if len(significant) > 1:
        ratios = sorted((component["area"] / total for component in significant), reverse=True)
        raise ValueError(f"{label} contains a detached foreground fragment: component ratios={ratios}")


def validate_internal_splits(image: Image.Image, label: str) -> None:
    alpha = np.asarray(image.getchannel("A")) > 24
    ys, xs = np.where(alpha)
    if not len(xs):
        raise ValueError(f"{label} contains no foreground")
    cropped = alpha[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    total = int(cropped.sum())

    for axis_name, projection in (
        ("vertical", cropped.sum(axis=0)),
        ("horizontal", cropped.sum(axis=1)),
    ):
        start = None
        for index, empty in enumerate(projection == 0):
            if empty and start is None:
                start = index
            if (not empty or index == len(projection) - 1) and start is not None:
                end = index if empty and index == len(projection) - 1 else index - 1
                gap = end - start + 1
                before = int(projection[:start].sum())
                after = int(projection[end + 1:].sum())
                if 2 <= gap <= 16 and min(before, after) > total * 0.2:
                    raise ValueError(f"{label} contains an internal {axis_name} cut of {gap} pixels")
                start = None


def normalize_frames(frames: list[Image.Image]) -> list[Image.Image]:
    boxes = [alpha_bbox(frame) for frame in frames]
    widths = [box[2] - box[0] for box in boxes]
    heights = [box[3] - box[1] for box in boxes]
    shared_scale = min(180 / max(widths), 178 / max(heights))
    output = []

    for frame, box in zip(frames, boxes, strict=True):
        cropped = frame.crop(box)
        size = (
            max(1, round(cropped.width * shared_scale)),
            max(1, round(cropped.height * shared_scale)),
        )
        resized = cropped.resize(size, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (CELL_SIZE, CELL_SIZE), (0, 0, 0, 0))
        x = (CELL_SIZE - resized.width) // 2
        y = CELL_SIZE - resized.height - 4
        canvas.alpha_composite(resized, (x, y))
        output.append(canvas)
    return output


def frame_hash(frame: Image.Image) -> str:
    return hashlib.sha1(frame.tobytes()).hexdigest()


def pack_category(character_slug: str, category: str, motion_frames: dict[str, list[Image.Image]]) -> tuple[str, dict]:
    motions = CATEGORIES[category]
    total_frames = len(motions) * FRAME_COUNT
    rows = math.ceil(total_frames / ATLAS_COLUMNS)
    atlas = Image.new("RGBA", (ATLAS_COLUMNS * CELL_SIZE, rows * CELL_SIZE), (0, 0, 0, 0))
    output_name = f"{character_slug}-{category}.webp"
    sheet_url = f"assets/motion-atlases/{output_name}"
    packed = {}
    cursor = 0

    for motion in motions:
        frames = motion_frames[motion]
        rectangles = []
        for frame in frames:
            column = cursor % ATLAS_COLUMNS
            row = cursor // ATLAS_COLUMNS
            x, y = column * CELL_SIZE, row * CELL_SIZE
            atlas.alpha_composite(frame, (x, y))
            rectangles.append(
                {
                    "x": x,
                    "y": y,
                    "w": CELL_SIZE,
                    "h": CELL_SIZE,
                    "duration_ms": FRAME_DURATIONS.get(motion, 78),
                }
            )
            cursor += 1
        packed[motion] = {
            "sheet": sheet_url,
            "frameCount": len(frames),
            "uniqueFrames": len({frame_hash(frame) for frame in frames}),
            "cellWidth": CELL_SIZE,
            "cellHeight": CELL_SIZE,
            "renderScale": 256 / CELL_SIZE,
            "sourceFacing": 1,
            "source": "higgsfield-v2",
            "frames": rectangles,
        }

    atlas.save(OUTPUT_ROOT / output_name, "WEBP", quality=92, method=6, exact=True)
    return output_name, packed


def save_preview(character_slug: str, motion_frames: dict[str, list[Image.Image]]) -> None:
    motions = [motion for group in CATEGORIES.values() for motion in group]
    columns = 9
    rows = math.ceil(len(motions) * 3 / columns)
    preview = Image.new("RGBA", (columns * CELL_SIZE, rows * CELL_SIZE), (22, 22, 24, 255))
    cursor = 0
    for motion in motions:
        for index in (0, 2, 5):
            x = (cursor % columns) * CELL_SIZE
            y = (cursor // columns) * CELL_SIZE
            preview.alpha_composite(motion_frames[motion][index], (x, y))
            cursor += 1
    PREVIEW_ROOT.mkdir(parents=True, exist_ok=True)
    preview.save(PREVIEW_ROOT / f"{character_slug}-all-motions.webp", "WEBP", quality=88, method=6)


def process_character(character_id: str, character_data: dict) -> tuple[str, dict]:
    slug = character_id.lower().replace("_", "-")
    raw_root = PRODUCTION_ROOT / "raw" / slug
    motion_frames = {}

    expected = {motion for motions in CATEGORIES.values() for motion in motions}
    missing = expected - set(character_data["motions"])
    if missing:
        raise ValueError(f"{character_id} is missing jobs: {sorted(missing)}")

    if character_id == "DETROIT_LENS":
        invalid_counts = []
        for motion in sorted(expected):
            raw_path = raw_root / f"{motion.lower()}.png"
            counts = source_figure_counts(raw_path)
            if counts != [SOURCE_COLUMNS, SOURCE_COLUMNS]:
                invalid_counts.append(f"{motion}={counts}")
        if invalid_counts:
            raise ValueError(
                f"{character_id} source sheets must contain exactly 3 poses per row: "
                + ", ".join(invalid_counts)
            )

    source_frames = {}
    if character_id == "AMARA_VALENTINE":
        source_frames = {
            motion: split_horizontal_strip(raw_root / f"{motion.lower()}.png")
            for motion in expected
        }

    for motion in expected:
        raw_path = raw_root / f"{motion.lower()}.png"
        keyed_frames = list(source_frames[motion]) if source_frames else split_sheet(raw_path)
        if character_id == "AMARA_VALENTINE":
            keyed_frames = repair_amara_aerial_frames(motion, keyed_frames, source_frames)
        for index, frame in enumerate(keyed_frames, start=1):
            validate_transparency(
                frame,
                f"{character_id}/{motion}/frame-{index}",
                max_coverage=0.72 if character_id == "AMARA_VALENTINE" else 0.55,
                max_rectangularity=0.86 if character_id == "AMARA_VALENTINE" else 0.78,
            )
        frames = normalize_frames(keyed_frames)
        for index, frame in enumerate(frames, start=1):
            validate_internal_splits(frame, f"{character_id}/{motion}/frame-{index}")
            if character_id == "AMARA_VALENTINE" and motion in {"JUMP_PEAK", "AIR_ATTACK"}:
                validate_detached_fragments(frame, f"{character_id}/{motion}/frame-{index}")
        if len({frame_hash(frame) for frame in frames}) < 5:
            raise ValueError(f"{character_id}/{motion} has fewer than five unique normalized frames")
        motion_frames[motion] = frames
        print(f"Normalized {character_id} {len(motion_frames)}/{len(expected)} {motion}", flush=True)

    save_preview(slug, motion_frames)
    packed = {}
    atlas_files = []
    for category in CATEGORIES:
        output_name, motions = pack_category(slug, category, motion_frames)
        atlas_files.append(output_name)
        packed.update(motions)

    for motion, data in packed.items():
        data["higgsfieldJobId"] = character_data["motions"][motion]["jobId"]
        if character_id == "AMARA_VALENTINE" and motion in {"JUMP_PEAK", "AIR_ATTACK"}:
            data["repair"] = "amara-aerial-v1"
    return slug, {"atlasFiles": atlas_files, "motions": packed}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--character", action="append")
    args = parser.parse_args()

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    jobs = json.loads(JOBS_PATH.read_text(encoding="utf-8"))
    if args.character and OUTPUT_MANIFEST.exists():
        manifest = json.loads(OUTPUT_MANIFEST.read_text(encoding="utf-8"))
    else:
        manifest = {
            "version": 3,
            "provider": "Higgsfield Nano Banana Pro",
            "cellSize": CELL_SIZE,
            "columns": ATLAS_COLUMNS,
            "framesPerMotion": FRAME_COUNT,
            "characters": {},
        }

    manifest["version"] = 3
    requested = list(dict.fromkeys(args.character or jobs["characters"].keys()))
    unknown = set(requested) - set(jobs["characters"])
    if unknown:
        raise SystemExit(f"Unknown characters: {sorted(unknown)}")

    for character_id in requested:
        character_data = jobs["characters"][character_id]
        _, packed = process_character(character_id, character_data)
        manifest["characters"][character_id] = packed

    OUTPUT_MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    stabilize_manifest(ROOT, OUTPUT_MANIFEST)
    total = sum(path.stat().st_size for path in OUTPUT_ROOT.glob("*.webp"))
    print(f"Packed {sum(len(value['motions']) for value in manifest['characters'].values())} motions")
    print(f"Runtime atlas payload: {total / 1024 / 1024:.2f} MiB")


if __name__ == "__main__":
    main()
