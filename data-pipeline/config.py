from pathlib import Path

# root of the data-pipeline folder
BASE_DIR = Path(__file__).parent

SONGS_DIR = BASE_DIR / "songs"
CLIP_LIBRARY_DIR = BASE_DIR / "clip_library"
OUTPUT_TIMELINES_DIR = BASE_DIR / "output_timelines"

# how many beats make up one "phrase" — one clip gets picked per phrase.
# 8 matches the traditional count-structure of an Adavu (danced in cycles
# of 8 beats), so this isn't an arbitrary number.
PHRASE_LENGTH_BEATS = 8

# how much we're willing to stretch/compress a clip's natural playback
# speed to make it fit a phrase exactly — keeps transitions landing on
# the beat without making anything look absurdly sped up or slowed down
MIN_PLAYBACK_SPEED = 0.6
MAX_PLAYBACK_SPEED = 1.8