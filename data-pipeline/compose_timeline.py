import sys
import json
from config import (
    OUTPUT_TIMELINES_DIR,
    CLIP_LIBRARY_DIR,
    PHRASE_LENGTH_BEATS,
    MIN_PLAYBACK_SPEED,
    MAX_PLAYBACK_SPEED,
)


def load_audio_features(song_filename: str) -> dict:
    """Loads the JSON that extract_audio_features.py already produced for this song."""
    path = OUTPUT_TIMELINES_DIR / f"{song_filename}.audio_features.json"
    with open(path) as f:
        return json.load(f)


def load_clip_library() -> list:
    """
    Loads every clip in clip_library/, and for each one computes its own
    natural duration directly from its saved frame timestamps (the t_ms
    field on the first and last frame) — no extra bookkeeping needed since
    we already saved real timing data during extraction.
    """
    manifest_path = CLIP_LIBRARY_DIR / "manifest.json"
    with open(manifest_path) as f:
        manifest = json.load(f)

    clips = []
    for entry in manifest:
        clip_path = CLIP_LIBRARY_DIR / entry["file"]
        with open(clip_path) as f:
            data = json.load(f)

        frames = data["frames"]
        duration_sec = (frames[-1]["t_ms"] - frames[0]["t_ms"]) / 1000 if len(frames) > 1 else 0

        clips.append({
            "adavu_name": data["adavu_name"],
            "duration_sec": duration_sec,
            "frame_count": data["frame_count"],
        })

    return clips


def compose(audio_features: dict, clips: list) -> dict:
    """
    Walks through the song's beats in groups of PHRASE_LENGTH_BEATS,
    assigning one clip per phrase (cycling through the available clips in
    order), and computes a playback speed so each clip's natural duration
    stretches or compresses to exactly fill its phrase — landing its end
    precisely on the beat.
    """
    beat_times = audio_features["beat_times_sec"]
    song_duration = audio_features["duration_sec"]

    segments = []
    clip_index = 0

    # step through the beat list in chunks of PHRASE_LENGTH_BEATS
    for i in range(0, len(beat_times), PHRASE_LENGTH_BEATS):
        phrase_start = beat_times[i]
        # the phrase ends at the next chunk's start beat, or the song's end
        # if this is the last phrase
        next_chunk_index = i + PHRASE_LENGTH_BEATS
        phrase_end = beat_times[next_chunk_index] if next_chunk_index < len(beat_times) else song_duration

        phrase_duration = phrase_end - phrase_start
        if phrase_duration <= 0:
            continue

        clip = clips[clip_index % len(clips)]  # cycle through available clips
        clip_index += 1

        # how much we'd need to speed up/slow down this clip to exactly
        # fill the phrase — then clamp to a reasonable range
        raw_speed = clip["duration_sec"] / phrase_duration if phrase_duration > 0 else 1.0
        playback_speed = max(MIN_PLAYBACK_SPEED, min(MAX_PLAYBACK_SPEED, raw_speed))

        segments.append({
            "adavu_name": clip["adavu_name"],
            "song_start_sec": phrase_start,
            "song_end_sec": phrase_end,
            "playback_speed": round(playback_speed, 3),
        })

    return {
        "song_duration_sec": song_duration,
        "tempo_bpm": audio_features["tempo_bpm"],
        "segments": segments,
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python compose_timeline.py <song_filename>")
        sys.exit(1)

    song_filename = sys.argv[1]
    audio_features = load_audio_features(song_filename)
    clips = load_clip_library()

    if not clips:
        print("No clips found in clip_library/ — run the Colab pipeline first.")
        sys.exit(1)

    timeline = compose(audio_features, clips)

    output_path = OUTPUT_TIMELINES_DIR / f"{song_filename}.timeline.json"
    with open(output_path, "w") as f:
        json.dump(timeline, f, indent=2)

    print(f"Composed {len(timeline['segments'])} segments from {len(clips)} clips.")
    print(f"Saved to: {output_path}")
    