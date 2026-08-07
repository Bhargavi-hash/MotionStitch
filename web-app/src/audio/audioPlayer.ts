export class AudioPlayer {
  private audio: HTMLAudioElement;

  constructor(songUrl: string) {
    this.audio = new Audio(songUrl);
  }

  play() {
    this.audio.play();
  }

  get currentTimeSec(): number {
    return this.audio.currentTime;
  }

  get isPlaying(): boolean {
    return !this.audio.paused;
  }
}