import argparse
import json
import os
import subprocess
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PRODUCTION_ROOT = ROOT / "assets" / "sprite-production" / "higgsfield-v2"
JOBS_PATH = PRODUCTION_ROOT / "jobs.json"


def save_jobs(jobs: dict) -> None:
    JOBS_PATH.write_text(json.dumps(jobs, indent=2) + "\n", encoding="utf-8")


def wait_for_job(job_id: str) -> dict:
    command = [
        "higgsfield.cmd",
        "generate",
        "wait",
        job_id,
        "--timeout",
        "12m",
        "--interval",
        "4s",
        "--json",
    ]
    result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError((result.stderr or result.stdout).strip())
    return json.loads(result.stdout)


def download(url: str, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.with_suffix(target.suffix + ".part")
    urllib.request.urlretrieve(url, temporary)
    if temporary.stat().st_size < 100_000:
        temporary.unlink(missing_ok=True)
        raise RuntimeError(f"Downloaded file is unexpectedly small: {url}")
    os.replace(temporary, target)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--character", required=True)
    parser.add_argument("--motion", action="append")
    args = parser.parse_args()

    jobs = json.loads(JOBS_PATH.read_text(encoding="utf-8"))
    if args.character not in jobs["characters"]:
        raise SystemExit(f"Unknown character: {args.character}")
    motions = jobs["characters"][args.character]["motions"]
    if args.motion:
        unknown = set(args.motion) - set(motions)
        if unknown:
            raise SystemExit(f"Unknown motions: {sorted(unknown)}")
        selected = set(args.motion)
        motions = {motion: entry for motion, entry in motions.items() if motion in selected}
    output = PRODUCTION_ROOT / "raw" / args.character.lower().replace("_", "-")
    failures = []

    for index, (motion, entry) in enumerate(motions.items(), start=1):
        target = output / f"{motion.lower()}.png"
        try:
            if target.exists() and target.stat().st_size >= 100_000 and entry.get("resultUrl"):
                print(f"{args.character} {index}/{len(motions)} {motion} cached", flush=True)
                continue
            result = wait_for_job(entry["jobId"])
            entry["status"] = result.get("status", "unknown")
            entry["resultUrl"] = result.get("result_url")
            if entry["status"] != "completed" or not entry["resultUrl"]:
                raise RuntimeError(f"job status is {entry['status']}")
            download(entry["resultUrl"], target)
            entry["rawPath"] = target.relative_to(ROOT).as_posix()
            entry["rawBytes"] = target.stat().st_size
            save_jobs(jobs)
            print(
                f"{args.character} {index}/{len(motions)} {motion} {entry['rawBytes']} bytes",
                flush=True,
            )
        except Exception as error:
            entry["status"] = "failed"
            entry["error"] = str(error)
            failures.append(f"{motion}: {error}")
            save_jobs(jobs)

    if failures:
        raise SystemExit("\n".join(failures))


if __name__ == "__main__":
    main()
