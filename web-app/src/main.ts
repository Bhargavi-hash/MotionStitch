import { setupScene } from "./scene/sceneSetup";
import { DollRig } from "./scene/dollRig";
import { loadSongData } from "./data/loadTimeline";
import { AudioPlayer } from "./audio/audioPlayer";
import { AnimationPlayer } from "./scene/animationPlayer";

const SONG_FILENAME = "alex-morgan-indian-classical-raga-537491.mp3";

async function main() {
  const container = document.getElementById("app")!;
  const { scene, camera, renderer } = setupScene(container);

  const doll = new DollRig();
  scene.add(doll.group);

  const { timeline, clips } = await loadSongData(SONG_FILENAME);
  const animationPlayer = new AnimationPlayer(timeline, clips);
  const audioPlayer = new AudioPlayer(`${import.meta.env.BASE_URL}songs/${SONG_FILENAME}`);

  // browsers require a real user click before audio can play
  const playButton = document.createElement("button");
  playButton.textContent = "▶ Play";
  playButton.style.cssText = "position:fixed;top:20px;left:20px;padding:12px 20px;font-size:16px;z-index:10;";
  document.body.appendChild(playButton);
  playButton.addEventListener("click", () => {
    audioPlayer.play();
    playButton.remove();
  });

  function animate() {
    requestAnimationFrame(animate);

    if (audioPlayer.isPlaying) {
      const pose = animationPlayer.getPoseAtTime(audioPlayer.currentTimeSec);
      if (pose) doll.updatePose(pose);
    }

    renderer.render(scene, camera);
  }
  animate();
}

main();