import argparse
import json
import subprocess
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
JOBS_PATH = ROOT / "assets" / "sprite-production" / "higgsfield-v2" / "jobs.json"

CHARACTERS = {
    "KALYX": {
        "master_job": "1fd06f4d-cb3e-44a0-838c-e8f9989565ea",
        "profile": (
            "Kalyx: powerful dark-skinned middle-aged man, tied-back black dreadlocks, short gray "
            "goatee, long layered black raven-feather coat, fitted black leather clothing, gold "
            "pendant, clawed black gauntlets, and tall black boots"
        ),
        "magic": "restrained orange ember and shadow energy",
    },
    "MASTER_EZRA": {
        "master_job": "c6063b17-b216-4e7d-8331-bf960eaf8e6b",
        "profile": (
            "Master Ezra: formidable elderly dark-skinned man, close white beard, patterned gold "
            "kufi cap, black martial-arts robe, antique-gold inner garments, deep crimson sash, "
            "and black shoes"
        ),
        "magic": "restrained cool-blue spirit energy",
    },
    "DETROIT_LENS": {
        "master_job": "8c3e4e29-296b-4ffa-b1d9-9104f945075c",
        "profile": (
            "Detroit Lens: tall athletic dark-skinned middle-aged man, full salt-and-pepper beard, "
            "black fedora, gold rectangular sunglasses, hoop earrings, fitted black three-piece suit, "
            "black dress shirt and tie, black tactical gloves, black combat dress boots, and a small "
            "gold camera-shutter lapel brooch"
        ),
        "magic": "restrained gold-white camera flash and ruby eye-laser energy",
    },
    "AMARA_VALENTINE": {
        "master_job": "7853d5f2-685c-49d2-90da-eeb63eee4589",
        "profile": (
            "Amara Valentine: powerful curvy dark-skinned Black woman, warm oval face, expressive "
            "brown eyes, full lips, long voluminous side-parted dark curls with warm highlights, large "
            "gold hoop earrings, layered gold necklaces, fitted deep-cobalt armored combat tunic and "
            "bodysuit, rose-gold chest and shoulder armor, subtle magenta seam lines, cobalt forearm "
            "gauntlets, articulated knee guards, and full dark-cobalt combat boots"
        ),
        "magic": "rose-magenta love energy, attraction fields, and heart-shaped light",
    },
}

AMARA_GRID_MOTIONS = {"LIGHT_PUNCH", "SUPER_RELEASE"}

MOTIONS = {
    "IDLE": "subtle combat-idle breathing loop with small weight and cloth shifts",
    "READY_STANCE": "transition into a deep guarded fighting stance, settle, then guarded bounce",
    "CROUCH_IDLE": "low crouched guard breathing loop while remaining balanced and alert",
    "CROUCH_WALK": "low crouch-walk cycle with alternating careful steps and guarded hands",
    "DASH_BACK": "explosive backward dash toward screen-left, coat and cloth trailing, then brake",
    "DASH_FORWARD": "explosive forward dash toward screen-right, low acceleration, burst, then brake",
    "JUMP_FALL": "airborne descending sequence with controlled limbs preparing to land",
    "JUMP_PEAK": "airborne apex sequence, rise slows, body tucks, then begins descending",
    "JUMP_RISE": "airborne rising sequence from extension through upward momentum",
    "JUMP_START": "grounded crouch compression, forceful launch, and feet leaving the ground",
    "LANDING": "feet contact, deep impact compression, cloth follow-through, then guarded recovery",
    "RUN_BACK": "fast backward run cycle toward screen-left while still facing screen-right",
    "RUN_FORWARD": "powerful forward sprint cycle toward screen-right with clear contact and flight poses",
    "WALK_BACK": "guarded backward walking cycle toward screen-left with alternating steps",
    "WALK_FORWARD": "guarded forward walking cycle toward screen-right with alternating steps",
    "AIR_ATTACK": "airborne diagonal attack with anticipation, fully extended strike, and recovery",
    "COMBO_1": "rapid three-hit close-range combo: jab, second strike, finishing cross, then recovery",
    "COMBO_2": "four-part combo: body strike, low kick, turning strike, strong finishing blow",
    "CROUCH_ATTACK": "low crouching sweep attack with windup, full extension, follow-through, recovery",
    "HEAVY_KICK": "powerful high roundhouse kick with large windup, full extension, impact, recovery",
    "HEAVY_PUNCH": "powerful committed heavy hand strike with windup, impact extension, recoil",
    "LIGHT_KICK": "quick front snap kick with guard held, extension, retraction, recovery",
    "LIGHT_PUNCH": "quick straight jab with compact windup, full extension, retraction, recovery",
    "SPECIAL_PROJECTILE": "conjure energy between the hands, thrust forward, launch projectile, recover",
    "SPECIAL_RECOVER": "recover from a major magic attack as residual energy fades and guard returns",
    "SPECIAL_START": "begin a special move by planting stance and gathering energy around both hands",
    "SUPER_CHARGE": "dramatic super-move charge as energy intensifies around the body and hands",
    "SUPER_RELEASE": "explosive super-move release with full-body thrust, peak energy, follow-through",
    "THROW_FINISH": "solo grappling-drill finish: lift effort, wide pivot, controlled arm sweep, recover",
    "THROW_GRAB": "solo grappling-drill entry: lunge forward, close both arms into a firm hold, brace",
    "BLOCK_HIGH": "standing high guard absorbs an imagined upper-body impact, recoils, and resets",
    "BLOCK_LOW": "crouched low guard absorbs an imagined low impact, recoils, and resets",
    "DEFEAT": "stagger from exhaustion, knees buckle, collapse fully to the ground, final defeated pose",
    "GET_UP": "begin fully prone, push to knees, plant one foot, rise, and regain guard",
    "HURT_HEAVY": "severe full-body hit reaction with chest recoil, stagger, near fall, recovery attempt",
    "HURT_LIGHT": "short readable hit reaction with torso recoil, brief stagger, and guard recovery",
    "KNOCKDOWN": "violent hit launches balance away, body falls, impacts ground, ends fully down",
    "TAUNT": "confident character-specific taunt gesture, hold the challenge, then return to guard",
    "VICTORY": "character-specific victorious celebration rising into a strong final victory pose",
}

BODY_ONLY_MOTIONS = {
    "SPECIAL_PROJECTILE": "empty-hand martial-arts palm thrust: chamber both empty hands, drive them forward, fully extend, then retract",
    "SPECIAL_RECOVER": "recover balance after a committed empty-hand palm thrust, settle the feet, and restore guard",
    "SPECIAL_START": "plant into a rooted stance, chamber both empty hands near the torso, and prepare a powerful technique",
    "SUPER_CHARGE": "dramatic rooted power stance using only posture, breath, and empty-hand preparation, then brace",
    "SUPER_RELEASE": "explosive empty-hand two-palm thrust with full-body drive, extension, follow-through, and guarded recovery",
}

DETROIT_LENS_MOTIONS = {
    "SPECIAL_START": "six body-only beats: plant both feet, glance briefly behind, lower one open hand as a companion signal, then point decisively toward screen-right",
    "SPECIAL_PROJECTILE": "six body-only command beats with both boots visible: grounded guard, sharp whistle gesture near the mouth, open hand drops behind the hip, arm drives forward, index finger points screen-right, guarded follow-through",
    "SPECIAL_RECOVER": "six body-only beats after issuing a companion command: retract the pointing arm, check screen-right, settle shoulders, reset both feet, and restore guard",
    "SUPER_CHARGE": "six restrained beats only: guarded stance, lower hands, square shoulders, lift chin, focus the stare through the glasses, lock the final braced stance",
    "SUPER_RELEASE": "lock the head toward screen-right as if firing eye beams through the glasses, recoil through the torso, then recover to guard",
    "KNOCKDOWN": "six beats only: standing impact, backward stagger, knees buckle, controlled fall, floor impact, fully down final pose",
    "THROW_GRAB": "one-person empty-hand reach drill in six beats: guard, step forward, extend both open hands toward empty air, close both empty hands, retract them, return to guard; exactly one person in each panel and never any partner or duplicate",
    "TAUNT": "form a camera-frame rectangle with both gloved hands, hold the composed challenge, then return to guard",
}

KALYX_AERIAL_MOTIONS = {
    "JUMP_START": "six connected launch beats: upright guard, deep compression, leg drive, toe-off, both boots leaving the floor, and a clean airborne extension",
    "JUMP_RISE": "six airborne rising beats from launch extension into a compact ascent; both boots stay above the floor after the first beat and no grounded pose returns",
    "JUMP_PEAK": "six airborne apex beats: ascent slows, knees tuck, coat follows the same body, weight floats briefly, then the body begins to descend",
    "JUMP_FALL": "six airborne descending beats with one compact silhouette, controlled arm balance, boots lowering toward the floor, and a clear landing preparation",
    "LANDING": "six connected landing beats: both boots contact, knees absorb impact, coat settles around the same body, torso rises, guard reforms, and stance stabilizes",
    "AIR_ATTACK": "six airborne attack beats: compact anticipation, diagonal claw strike, full extension, clean follow-through, limb retraction, and airborne recovery before descent",
}

AMARA_VALENTINE_MOTIONS = {
    "READY_STANCE": "raise both guarded hands and settle into a poised boxing-and-grappling stance with grounded hips and confident eye contact",
    "WALK_FORWARD": "powerful guarded forward walk toward screen-right with clear heel-to-toe weight transfer and controlled shoulder rhythm",
    "WALK_BACK": "guarded backward walk toward screen-left while facing screen-right, with clear alternating foot plants and no sliding",
    "RUN_FORWARD": "athletic forward sprint toward screen-right with strong arm drive, clear contact and flight beats, then a controlled stride",
    "RUN_BACK": "fast tactical retreat toward screen-left while staying oriented screen-right, with alternating footfalls and stable guard",
    "DASH_FORWARD": "low explosive shoulder-led burst toward screen-right, armor and curls following one connected body, then a planted brake",
    "DASH_BACK": "sharp evasive burst toward screen-left, one connected body and hair silhouette, then a balanced planted recovery",
    "JUMP_START": "six connected beats: upright guard, deep leg compression, forceful drive, toe-off, both boots leave the floor, clean airborne extension",
    "JUMP_RISE": "six airborne rising beats with both boots off the ground, compact knees, controlled arms, and hair attached to one head",
    "JUMP_PEAK": "six airborne apex beats with a compact floating silhouette, knees tucking, momentum pausing, then descent beginning",
    "JUMP_FALL": "six airborne descending beats, limbs balancing, boots lowering, and body preparing for a stable landing",
    "LANDING": "six connected landing beats: boots contact, knees absorb impact, torso compresses, hair settles, guard reforms, stance stabilizes",
    "AIR_ATTACK": "airborne flying knee followed by a diagonal armored forearm strike, full extension, clean follow-through, and airborne recovery",
    "LIGHT_PUNCH": "compact fast rose-guard jab using the lead fist, full extension, immediate retraction, and stable rear-hand guard",
    "HEAVY_PUNCH": "powerful committed armored hook with hip rotation, full impact extension, recoil, and guarded recovery",
    "LIGHT_KICK": "quick low front kick with a clear chamber, boot extension, retraction, and planted recovery",
    "HEAVY_KICK": "strong spinning side kick with large anticipation, full boot extension, rotation follow-through, and balanced recovery",
    "CROUCH_ATTACK": "low crouching leg sweep with guard, full boot extension, follow-through, and recovery without changing body scale",
    "COMBO_1": "three-hit Heartline combination: lead jab, armored elbow, finishing palm strike, then guarded recovery",
    "COMBO_2": "four-part Valentine combination: body hook, low kick, turning backfist, strong rising knee finish",
    "THROW_GRAB": "one-person empty-hand clinch entry drill: guarded step, both open hands reach into empty air, close to a firm hold, brace, recover",
    "THROW_FINISH": "one-person hip-throw finish drill with an imaginary opponent: planted lift effort, wide pivot, arm sweep, balanced recovery",
    "SPECIAL_START": "body-only love technique preparation: plant both boots, place one fist over the heart, cross both forearms, then open the lead palm toward screen-right",
    "SPECIAL_PROJECTILE": "body-only Heartline Pulse release: draw both empty hands to the chest, step forward, drive one open palm screen-right, fully extend, retract",
    "SPECIAL_RECOVER": "body-only recovery after a committed open-palm release: retract the arm, settle shoulders, reset both feet, restore guard",
    "SUPER_CHARGE": "body-only Heartbreak Nova charge: grounded stance, cross both hands over the chest, widen the elbows, lift the chin, brace with focused confidence",
    "SUPER_RELEASE": "body-only Heartbreak Nova release: drive both empty palms toward screen-right with full-body force, hold peak extension, recoil, recover",
    "BLOCK_HIGH": "standing crossed-forearm guard absorbs an imagined upper-body impact, armor recoils, then guard resets",
    "BLOCK_LOW": "low crouched armored guard absorbs an imagined low impact while preserving consistent body proportions, then resets",
    "HURT_LIGHT": "short readable upper-body recoil from an imagined hit, one stagger step, then guarded recovery",
    "HURT_HEAVY": "severe full-body recoil and two-step stagger from an imagined hit, near fall, then recovery attempt",
    "KNOCKDOWN": "standing impact, loss of balance, knees buckle, controlled fall, floor impact, fully down final pose",
    "GET_UP": "begin fully down, push to one knee, plant one boot, rise through the hips, restore the Heartline guard",
    "TAUNT": "confidently trace a small heart shape with both gloved hands near the chest, point toward the opponent, return to guard",
    "VICTORY": "modest fully armored victory sequence: touch one closed gauntlet to the heart plate, raise one open gauntlet overhead, then settle into a dignified upright final pose",
    "DEFEAT": "stagger from exhaustion, drop to one knee, brace with one hand, collapse fully, final defeated pose",
}

PILOTS = {
    "KALYX": {"IDLE": "3ecb1159-8c5e-4778-99d1-8f031c4d4582"},
    "MASTER_EZRA": {"IDLE": "1083e12e-6c79-4801-ab58-2c5b7d481383"},
}


def load_jobs() -> dict:
    if JOBS_PATH.exists():
        jobs = json.loads(JOBS_PATH.read_text(encoding="utf-8"))
    else:
        jobs = {
            "provider": "Higgsfield Nano Banana Pro",
            "layout": {"columns": 3, "rows": 2, "frames": 6},
            "characters": {},
        }
    for character, config in CHARACTERS.items():
        character_jobs = jobs["characters"].setdefault(
            character,
            {"masterJobId": config["master_job"], "motions": {}},
        )
        character_jobs["masterJobId"] = config["master_job"]
        for motion, job_id in PILOTS.get(character, {}).items():
            character_jobs["motions"].setdefault(
                motion,
                {"jobId": job_id, "status": "submitted"},
            )
    return jobs


def save_jobs(jobs: dict) -> None:
    JOBS_PATH.parent.mkdir(parents=True, exist_ok=True)
    JOBS_PATH.write_text(json.dumps(jobs, indent=2) + "\n", encoding="utf-8")


def build_prompt(character: str, motion: str) -> str:
    config = CHARACTERS[character]
    body_only = motion.startswith("SPECIAL") or motion.startswith("SUPER")
    if character == "DETROIT_LENS":
        motion_description = DETROIT_LENS_MOTIONS.get(motion, MOTIONS[motion])
    elif character == "AMARA_VALENTINE":
        motion_description = AMARA_VALENTINE_MOTIONS.get(motion, MOTIONS[motion])
    elif character == "KALYX" and motion in KALYX_AERIAL_MOTIONS:
        motion_description = KALYX_AERIAL_MOTIONS[motion]
    else:
        motion_description = BODY_ONLY_MOTIONS.get(motion, MOTIONS[motion])
    head_rule = (
        "Preserve Kalyx's tied-back dreadlocks and bare head; never add a hat or head covering."
        if character == "KALYX"
        else "Preserve the exact character headwear from the reference."
    )
    single_body_rule = (
        "Each cell must contain one and only one connected Kalyx body: exactly one head, one face, one "
        "torso, two arms, and two legs. Never clone, overlap, echo, trail, mirror, or repeat any body, "
        "face, head, torso, limb, silhouette, or pose inside a cell. No afterimage, motion duplicate, "
        "shadow-double, ghost body, detached coat figure, or second fighter. Every feather and coat panel "
        "must remain visibly attached to that one body. "
        if character == "KALYX" and motion in KALYX_AERIAL_MOTIONS
        else (
            "Each cell must contain one and only one connected Amara body: exactly one head, one face, "
            "one torso, two arms, and two legs. Never clone, overlap, echo, trail, mirror, or repeat her "
            "body, face, hair mass, torso, limb, silhouette, or pose inside a cell. Every curl must remain "
            "visibly attached to the same single head. No afterimage, ghost body, detached hair figure, or "
            "second fighter. "
            if character == "AMARA_VALENTINE"
            else ""
        )
    )
    energy = (
        "body-only performance with absolutely no visible energy, aura, fire, smoke, glow, projectile, "
        "lightning, magic trail, or detached effect; the game engine renders every visual effect separately"
        if body_only
        else "no aura"
    )
    if character == "AMARA_VALENTINE":
        if motion in AMARA_GRID_MOTIONS:
            return (
                f"RIGID 3 BY 2 ANIMATION CONTACT SHEET: exactly TWO ROWS and exactly THREE EQUAL COLUMNS, "
                f"with exactly one complete fighter in each of the six cells. Draw two thin vertical dividers "
                f"and one thin horizontal divider. Never add a seventh pose, inset, portrait, duplicate body, "
                f"or second character. Use the exact reference identity and rendering style. Character lock: "
                f"{config['profile']}. Create six clearly distinct sequential full-body frames of this motion: "
                f"{motion_description}. Chronological row-major order, anticipation through recovery. Side-view "
                f"3/4 profile facing screen-right. Preserve the identical face, long side-parted curls, costume, "
                f"jewelry, curvy strong body proportions, camera distance, and lighting in every frame. "
                f"{single_body_rule}Energy rule: {energy}. Each figure occupies no more than 50 percent of its "
                f"cell height and 70 percent of its cell width. Every one of the six cells must show the same "
                f"small full-body camera scale; torso-only or waist-up cells invalidate the entire sheet. Keep "
                f"uninterrupted green clearance around every "
                f"body part, including a fully extended arm, plus green above the hair and below both complete "
                f"boots. Flat pure chroma green #00FF00 background. No crop, close-up, floor, shadow, scenery, "
                f"text, labels, frame numbers, effects, opponent, animal, prop, or partial figure. Production "
                f"animation sheet, not concept art."
            )
        return (
            f"RIGID HORIZONTAL ANIMATION STRIP: exactly ONE ROW and exactly SIX EQUAL COLUMNS. Draw "
            f"exactly five thin black vertical divider lines and no horizontal divider. Place exactly one "
            f"complete fighter in each column, for exactly six figures total. Never create a second row, "
            f"seventh figure, inset, portrait, bonus pose, or duplicate body. Use the exact character in the "
            f"reference as an immutable identity, costume, body-proportion, and rendering-style lock. "
            f"Character lock: {config['profile']}. Create six clearly distinct sequential full-body frames "
            f"of this fighting-game motion: {motion_description}. Chronological left-to-right order: frames "
            f"ONE, TWO, THREE, FOUR, FIVE, SIX. Show anticipation, buildup, peak action, follow-through, "
            f"recoil, and recovery as appropriate. Side-view 3/4 profile facing screen-right in every frame. "
            f"Preserve the identical face, long side-parted curls, hair length, clothing construction, colors, "
            f"armor, jewelry, curvy strong body proportions, outline weight, camera distance, and lighting in "
            f"all six frames. {single_body_rule}Energy rule: {energy}. The camera is pulled far back in every "
            f"column: show one complete uncropped hair-to-boot figure occupying no more than 58 percent of "
            f"the column height and no more than 78 percent of the column width, even when a punch or kick is "
            f"fully extended. Keep a broad band of uninterrupted green between every body part and every "
            f"divider, plus empty green above the hair and below both complete boot soles. "
            f"Flat pure chroma green #00FF00 fills every column. No crop, close-up, scenery, floor, cast shadow, "
            f"text, labels, frame numbers, border, detached effect, opponent, animal, or handheld prop. This is "
            f"a production animation strip, not concept art or a poster."
        )
    return (
        f"RIGID CONTACT SHEET: exactly TWO ROWS and exactly THREE COLUMNS, never four columns. Draw exactly "
        f"two vertical divider lines and exactly one horizontal divider line, producing exactly six equal cells. "
        f"Two rows, exactly three equal cells per row, exactly one fighter centered "
        f"inside each cell. Count the top row ONE, TWO, THREE and stop. Count the bottom row FOUR, FIVE, "
        f"SIX and stop. Never create a fourth column, a seventh pose, or two poses in one cell. "
        f"Use the exact character in the reference as an immutable identity, costume, and rendering-style lock. "
        f"Character lock: {config['profile']}. Create a production 3-column by 2-row sprite sheet with "
        f"exactly SIX clearly distinct sequential full-body frames of this fighting-game motion and no "
        f"seventh or eighth figure anywhere on the canvas: "
        f"{motion_description}. Chronological row-major order: frames 1, 2, 3 across the top row, then "
        f"frames 4, 5, 6 across the bottom row. The figure count must be exactly 3 + 3 = 6; a sheet "
        f"with five, seven, eight, or any other count is invalid. Never add a bonus pose, inset, overlap, or "
        f"partial figure near a separator. Show anticipation, "
        f"buildup, peak action, follow-through, "
        f"recoil, and recovery as appropriate. Side-view 3/4 profile facing screen-right in every frame. "
        f"Preserve the identical face, age, hair, facial hair, clothing construction, colors, accessories, "
        f"body proportions, outline weight, camera distance, game-scale detail, and lighting in all six "
        f"frames. {head_rule} {single_body_rule}Energy rule: {energy}. The camera is pulled far back in every cell: each equal cell contains "
        f"exactly one complete uncropped hat-to-boot figure occupying no more than 82 percent of the cell "
        f"height. The full top of the head or headwear, both knees, full trouser legs, ankles, both complete boots, and empty green "
        f"margin below the boot soles must be visible in all six frames. Use exactly three equal columns and "
        f"exactly two equal rows with thin black grid separators. Flat pure chroma green #00FF00 fills "
        f"every cell. No waist crop, thigh crop, missing feet, close-up, scenery, floor, cast "
        f"shadow, text, labels, decorative panel borders, duplicate pose, extra body parts, opponent, owl, "
        f"or extra character. Do not draw any handheld prop; companion animals and effects are rendered separately. "
        f"This is a production animation sheet, not concept art or a poster."
    )


def submit(character: str, motion: str) -> str:
    command = [
        "higgsfield.cmd",
        "generate",
        "create",
        "nano_banana_2",
        "--prompt",
        build_prompt(character, motion),
        "--image",
        CHARACTERS[character]["master_job"],
        "--aspect_ratio",
        "3:2" if character != "AMARA_VALENTINE" or motion in AMARA_GRID_MOTIONS else "16:9",
        "--resolution",
        "2k",
        "--json",
    ]
    last_error = ""
    for attempt in range(1, 5):
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True)
        if result.returncode == 0:
            ids = json.loads(result.stdout)
            if ids:
                return ids[0]
        last_error = (result.stderr or result.stdout).strip()
        if attempt < 4:
            time.sleep(attempt * 4)
    raise RuntimeError(f"Higgsfield failed for {character} {motion}: {last_error}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--character", choices=CHARACTERS, required=True)
    parser.add_argument("--motion", action="append", choices=MOTIONS)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    jobs = load_jobs()
    character_data = jobs["characters"][args.character]
    character_jobs = character_data["motions"]
    requested = list(dict.fromkeys(args.motion or MOTIONS))
    pending = requested if args.force else [motion for motion in requested if motion not in character_jobs]
    if args.limit > 0:
        pending = pending[: args.limit]

    for index, motion in enumerate(pending, start=1):
        job_id = submit(args.character, motion)
        previous = character_jobs.get(motion)
        if previous:
            history = character_data.setdefault("replacementHistory", {}).setdefault(motion, [])
            history.append({key: previous[key] for key in ("jobId", "status", "resultUrl") if key in previous})
        character_jobs[motion] = {"jobId": job_id, "status": "submitted"}
        save_jobs(jobs)
        print(f"{args.character} {index}/{len(pending)} {motion} {job_id}", flush=True)
        time.sleep(0.35)

    save_jobs(jobs)
    print(f"Tracked {len(character_jobs)}/{len(MOTIONS)} motions for {args.character}")


if __name__ == "__main__":
    main()
