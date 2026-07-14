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
}

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

PILOTS = {
    "KALYX": {"IDLE": "3ecb1159-8c5e-4778-99d1-8f031c4d4582"},
    "MASTER_EZRA": {"IDLE": "1083e12e-6c79-4801-ab58-2c5b7d481383"},
}


def load_jobs() -> dict:
    if JOBS_PATH.exists():
        return json.loads(JOBS_PATH.read_text(encoding="utf-8"))
    jobs = {
        "provider": "Higgsfield Nano Banana Pro",
        "layout": {"columns": 3, "rows": 2, "frames": 6},
        "characters": {},
    }
    for character, config in CHARACTERS.items():
        jobs["characters"][character] = {
            "masterJobId": config["master_job"],
            "motions": {
                motion: {"jobId": job_id, "status": "submitted"}
                for motion, job_id in PILOTS[character].items()
            },
        }
    return jobs


def save_jobs(jobs: dict) -> None:
    JOBS_PATH.parent.mkdir(parents=True, exist_ok=True)
    JOBS_PATH.write_text(json.dumps(jobs, indent=2) + "\n", encoding="utf-8")


def build_prompt(character: str, motion: str) -> str:
    config = CHARACTERS[character]
    energy = config["magic"] if motion.startswith("SPECIAL") or motion.startswith("SUPER") else "no aura"
    return (
        f"Use the exact character in the reference as an immutable identity, costume, and rendering-style lock. "
        f"Character lock: {config['profile']}. Create a production 3-column by 2-row sprite sheet with "
        f"exactly SIX clearly distinct sequential full-body frames of this fighting-game motion: "
        f"{MOTIONS[motion]}. Chronological row-major order: frames 1, 2, 3 across the top row, then "
        f"frames 4, 5, 6 across the bottom row. Show anticipation, buildup, peak action, follow-through, "
        f"recoil, and recovery as appropriate. Side-view 3/4 profile facing screen-right in every frame. "
        f"Preserve the identical face, age, hair, facial hair, clothing construction, colors, accessories, "
        f"body proportions, outline weight, camera distance, game-scale detail, and lighting in all six "
        f"frames. Energy rule: {energy}. Each equal cell contains exactly one complete uncropped character "
        f"with generous margins. Flat pure chroma green #00FF00 fills every cell. No scenery, floor, cast "
        f"shadow, text, labels, separators, panel borders, duplicate pose, extra body parts, opponent, owl, "
        f"or extra character. This is a production animation sheet, not concept art or a poster."
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
        "3:2",
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
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    jobs = load_jobs()
    character_jobs = jobs["characters"][args.character]["motions"]
    pending = [motion for motion in MOTIONS if motion not in character_jobs]
    if args.limit > 0:
        pending = pending[: args.limit]

    for index, motion in enumerate(pending, start=1):
        job_id = submit(args.character, motion)
        character_jobs[motion] = {"jobId": job_id, "status": "submitted"}
        save_jobs(jobs)
        print(f"{args.character} {index}/{len(pending)} {motion} {job_id}", flush=True)
        time.sleep(0.35)

    save_jobs(jobs)
    print(f"Tracked {len(character_jobs)}/{len(MOTIONS)} motions for {args.character}")


if __name__ == "__main__":
    main()
