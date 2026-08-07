import * as THREE from "three";

export interface SceneRefs {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

/**
 * Sets up the base 3D scene: camera, renderer, lighting, and the grid
 * floor. Doesn't animate anything itself — main.ts drives the render loop.
 */
export function setupScene(container: HTMLElement): SceneRefs {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);

  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  // positioned to look at a standing human-sized figure from a bit above and in front
  camera.position.set(0, 1.6, 4);
  camera.lookAt(0, 1, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // grid floor — the "3D viewport" look
  const grid = new THREE.GridHelper(10, 20, 0x444444, 0x333333);
  scene.add(grid);

  // basic lighting so the grey doll actually has visible shading, not a flat silhouette
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(2, 4, 3);
  scene.add(directional);

  window.addEventListener("resize", () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  return { scene, camera, renderer };
}