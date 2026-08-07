export interface ClipData {
  adavu_name: string;
  frames: { t_ms: number; joints: { x: number; y: number; z: number }[] | null }[];
}

export interface TimelineSegment {
  adavu_name: string;
  song_start_sec: number;
  song_end_sec: number;
  playback_speed: number;
}

export interface Timeline {
  song_duration_sec: number;
  tempo_bpm: number;
  segments: TimelineSegment[];
}

/** Loads the timeline JSON, then loads every distinct clip it references (only once each, even if reused across many segments). */
export async function loadSongData(songFilename: string): Promise<{ timeline: Timeline; clips: Map<string, ClipData> }> {
  const timelineRes = await fetch(`/timelines/${songFilename}.timeline.json`);
  const timeline: Timeline = await timelineRes.json();

  const uniqueClipNames = [...new Set(timeline.segments.map((s) => s.adavu_name))];
  const clips = new Map<string, ClipData>();

  for (const name of uniqueClipNames) {
    const clipRes = await fetch(`/clips/${name}.json`);
    const clipData: ClipData = await clipRes.json();
    clips.set(name, clipData);
  }

  return { timeline, clips };
}