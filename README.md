# MotionStitch

Upload a song. Watch a plain grey 3D doll perform a real Bharatanatyam
composition, assembled and timed to match your song's tempo, beats, and
energy — built entirely from real reference dance footage, not AI-generated
motion.

## How it works

1. **Song analysis** — the uploaded song is analyzed for tempo, beat
   timing, and energy over time.
2. **Composition** — real Bharatanatyam Adavu clips (from the project's
   own open dataset, see below) are selected and stitched together,
   timed to land on the song's beats.
3. **3D playback** — a plain grey humanoid figure, built from simple
   spheres and cylinders on a 3D grid floor, performs the composed
   sequence live as the song plays.

Every movement the doll performs is real, correct Bharatanatyam movement —
nothing is AI-generated or invented. The system's role is choosing and
timing real reference clips, not synthesizing new motion.

## Project structure

- **`data-pipeline/`** — Python. Analyzes songs and composes the
  performance timeline. Runs locally, lightweight.
- **`web-app/`** — TypeScript + Three.js. The live 3D viewer that plays
  back what the pipeline produces.
- **Pose extraction** — a separate one-time step (see `docs/` for the
  Colab notebook) that processes reference dance videos into the pose
  dataset in `data-pipeline/clip_library/`. This runs in the cloud, not
  locally, so no video files are ever stored on a contributor's machine.

## Setup

```bash
# Python side
cd data-pipeline
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Web app
cd ../web-app
npm install
```

## Usage

**1. Analyze a song:**
```bash
cd data-pipeline
python3 extract_audio_features.py your_song.mp3
```

**2. Compose the timeline:**
```bash
python3 compose_timeline.py your_song.mp3
```

**3. Copy the results into the web app and run it:**
```bash
cd ../web-app
cp ../data-pipeline/clip_library/*.json public/clips/
cp ../data-pipeline/output_timelines/*.timeline.json public/timelines/
cp ../data-pipeline/songs/your_song.mp3 public/songs/
npm run dev
```

Open the printed local URL and click Play.

## The dataset

`data-pipeline/clip_library/` contains the pose data driving the doll —
real movement extracted from real Bharatanatyam performances, not
synthesized. This is an open, growing dataset; see `clip_library/manifest.json`
for what's currently included and its sourcing.

**Current status**: seed dataset, sourced from public tutorial/demonstration
videos. Full creator permissions are being sought before any public
release of derived data — see credit notes in the manifest for status per
clip. Contributions of properly-licensed reference footage are welcome.

## Known limitations

- **Small library, repetitive output.** The current seed dataset has
  limited Adavu variety, so compositions will noticeably repeat the same
  few movements. This is a data-scale limitation, not a bug in the
  matching/composition logic.
- **Depth is estimated, not exact.** Reference footage is standard 2D
  video, so the doll's front-to-back depth is inferred, not measured —
  most movements look correct, but very front-to-back motion may appear
  slightly flattened.
- **No live user input.** The current version takes a song only — no
  webcam or live movement input.

## Tech stack

MediaPipe (pose extraction), librosa (audio analysis), Three.js (3D
rendering), TypeScript, Python.