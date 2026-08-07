import sys
import json
import librosa
import numpy as np
from config import SONGS_DIR, OUTPUT_TIMELINES_DIR

def analyze_song(song_filename: str) -> dict:
    """
    Loads a song and extracts three things MotionStitch needs:
    1. Tempo (BPM) — how fast the whole song is
    2. Beat times — the exact moment (in seconds) of every beat, so the
       doll's movements can be timed to land exactly on the beat
    3. An energy curve over time — quiet/calm sections vs loud/intense
       ones, so we can later pick calmer Adavus for quiet parts and more
       energetic ones for intense parts
    """
    song_path = SONGS_DIR / song_filename

    # librosa.load reads the audio and returns:
    #   y = the actual audio waveform (just numbers representing sound pressure over time)
    #   sr = sample rate (how many of those numbers represent one second)
    y, sr = librosa.load(song_path)

    # --- 1. Tempo + beats ---
    # librosa listens for the repeating pulse in the audio and returns:
    #   tempo = a single BPM number for the whole song
    #   beat_frames = positions (in a librosa-internal unit) of each beat
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    tempo = float(np.asarray(tempo).item())  # unwrap the array librosa returns, extract the single number
    # convert those frame positions into actual seconds, which is what
    # we'll actually use to time the doll's movements
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)

    # --- 2. Energy curve ---
    # RMS = Root Mean Square, a standard measure of loudness/intensity
    # over short windows of audio. This gives us one number per short
    # time-slice describing how "energetic" that moment sounds.
    rms = librosa.feature.rms(y=y)[0]
    rms_times = librosa.frames_to_time(np.arange(len(rms)), sr=sr)

    # normalize energy to a 0-1 scale, easier to reason about later
    rms_normalized = (rms - rms.min()) / (rms.max() - rms.min() + 1e-8)

    energy_curve = [
        {"t_sec": float(t), "energy": float(e)}
        for t, e in zip(rms_times, rms_normalized)
    ]

    duration_sec = float(librosa.get_duration(y=y, sr=sr))

    return {
        "song_filename": song_filename,
        "duration_sec": duration_sec,
        "tempo_bpm": float(tempo),
        "beat_times_sec": [float(t) for t in beat_times],
        "energy_curve": energy_curve,
    }


if __name__ == "__main__":
    # run this as: python extract_audio_features.py your_song.mp3
    if len(sys.argv) != 2:
        print("Usage: python extract_audio_features.py <song_filename>")
        sys.exit(1)

    song_filename = sys.argv[1]
    result = analyze_song(song_filename)

    OUTPUT_TIMELINES_DIR.mkdir(exist_ok=True)
    output_path = OUTPUT_TIMELINES_DIR / f"{song_filename}.audio_features.json"
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"Tempo: {result['tempo_bpm']:.1f} BPM")
    print(f"Beats found: {len(result['beat_times_sec'])}")
    print(f"Saved to: {output_path}")