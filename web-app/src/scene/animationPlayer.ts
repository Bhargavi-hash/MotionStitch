import type { Timeline, ClipData } from "../data/loadTimeline";
import type { Joint } from "./dollRig";

/**
 * Given the current song time, figures out which timeline segment we're
 * in, maps that to a position inside the corresponding clip (accounting
 * for playback_speed), and interpolates between the two nearest captured
 * frames for smooth motion even though the clip's own frame rate and the
 * screen's render rate don't match.
 */
export class AnimationPlayer {
  private timeline: Timeline;
  private clips: Map<string, ClipData>;

  constructor(timeline: Timeline, clips: Map<string, ClipData>) {
    this.timeline = timeline;
    this.clips = clips;
  }

  
  getPoseAtTime(songTimeSec: number): Joint[] | null {
    const segment = this.timeline.segments.find(
      (s) => songTimeSec >= s.song_start_sec && songTimeSec < s.song_end_sec
    );
    if (!segment) return null;

    const clip = this.clips.get(segment.adavu_name);
    if (!clip || clip.frames.length < 2) return null;

    // how far we are into this segment, converted into the clip's own
    // internal timeline (faster or slower than real time, per playback_speed)
    const elapsedInSegmentSec = songTimeSec - segment.song_start_sec;
    let clipTimeMs = elapsedInSegmentSec * segment.playback_speed * 1000;

    // clip frames don't necessarily start at t_ms=0 (auto-trim sliced from
    // the middle of the original video) — normalize against the first frame
    const firstFrameMs = clip.frames[0].t_ms;
    const lastFrameMs = clip.frames[clip.frames.length - 1].t_ms;
    const clipDurationMs = lastFrameMs - firstFrameMs;

    // loop the clip if the segment runs longer than one playthrough
    clipTimeMs = clipTimeMs % clipDurationMs;
    const targetMs = firstFrameMs + clipTimeMs;

    // find the two frames surrounding targetMs
    let frameA = clip.frames[0];
    let frameB = clip.frames[1];
    for (let i = 0; i < clip.frames.length - 1; i++) {
      if (clip.frames[i].t_ms <= targetMs && clip.frames[i + 1].t_ms >= targetMs) {
        frameA = clip.frames[i];
        frameB = clip.frames[i + 1];
        break;
      }
    }

    if (!frameA.joints) return frameB.joints;
    if (!frameB.joints) return frameA.joints;

    // linear interpolation between the two frames' joint positions
    const span = frameB.t_ms - frameA.t_ms || 1;
    const t = (targetMs - frameA.t_ms) / span;

    return frameA.joints.map((jointA, i) => {
      const jointB = frameB.joints![i];
      return {
        x: jointA.x + (jointB.x - jointA.x) * t,
        y: jointA.y + (jointB.y - jointA.y) * t,
        z: jointA.z + (jointB.z - jointA.z) * t,
      };
    });
  }
}