import * as THREE from "three";

export interface Joint {
  x: number;
  y: number;
  z: number;
}

// MediaPipe Pose's 33 landmark indices — only naming the ones we actually use
const LANDMARK = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

// each pair is one "bone" — a cylinder drawn between these two joints
const BONES: [number, number][] = [
  [LANDMARK.LEFT_SHOULDER, LANDMARK.RIGHT_SHOULDER], // shoulder line
  [LANDMARK.LEFT_HIP, LANDMARK.RIGHT_HIP], // hip line
  [LANDMARK.LEFT_SHOULDER, LANDMARK.LEFT_HIP], // torso side
  [LANDMARK.RIGHT_SHOULDER, LANDMARK.RIGHT_HIP], // torso side
  [LANDMARK.LEFT_SHOULDER, LANDMARK.LEFT_ELBOW],
  [LANDMARK.LEFT_ELBOW, LANDMARK.LEFT_WRIST],
  [LANDMARK.RIGHT_SHOULDER, LANDMARK.RIGHT_ELBOW],
  [LANDMARK.RIGHT_ELBOW, LANDMARK.RIGHT_WRIST],
  [LANDMARK.LEFT_HIP, LANDMARK.LEFT_KNEE],
  [LANDMARK.LEFT_KNEE, LANDMARK.LEFT_ANKLE],
  [LANDMARK.RIGHT_HIP, LANDMARK.RIGHT_KNEE],
  [LANDMARK.RIGHT_KNEE, LANDMARK.RIGHT_ANKLE],
];

const JOINT_INDICES = [
  LANDMARK.NOSE,
  LANDMARK.LEFT_SHOULDER,
  LANDMARK.RIGHT_SHOULDER,
  LANDMARK.LEFT_ELBOW,
  LANDMARK.RIGHT_ELBOW,
  LANDMARK.LEFT_WRIST,
  LANDMARK.RIGHT_WRIST,
  LANDMARK.LEFT_HIP,
  LANDMARK.RIGHT_HIP,
  LANDMARK.LEFT_KNEE,
  LANDMARK.RIGHT_KNEE,
  LANDMARK.LEFT_ANKLE,
  LANDMARK.RIGHT_ANKLE,
];

const GREY_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x888888 });
const JOINT_RADIUS = 0.04;
const BONE_RADIUS = 0.025;

/**
 * A plain grey humanoid figure built from spheres (joints) and cylinders
 * (bones), with no fixed skeleton — every frame, updatePose() just moves
 * and re-orients each shape to match the current joint positions directly.
 */
export class DollRig {
  readonly group: THREE.Group;
  private jointMeshes: Map<number, THREE.Mesh> = new Map();
  private boneMeshes: Map<string, THREE.Mesh> = new Map();

  constructor() {
    this.group = new THREE.Group();

    for (const index of JOINT_INDICES) {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(JOINT_RADIUS, 12, 12), GREY_MATERIAL);
      this.group.add(sphere);
      this.jointMeshes.set(index, sphere);
    }

    for (const [a, b] of BONES) {
      // unit cylinder — we'll scale/position/rotate it per-frame to span each bone
      const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(BONE_RADIUS, BONE_RADIUS, 1, 8), GREY_MATERIAL);
      this.group.add(cylinder);
      this.boneMeshes.set(`${a}-${b}`, cylinder);
    }
  }

  /**
   * Positions every joint sphere and bone cylinder from a full 33-landmark
   * array. Landmarks are normalized (0-1) image coordinates from MediaPipe;
   * we convert them into human-scale 3D world coordinates here.
   */
  updatePose(landmarks: Joint[]) {
    const toWorld = (j: Joint): THREE.Vector3 => {
      // x: MediaPipe's 0-1 range, centered and scaled to ~human width
      // y: flipped (image y grows downward, but "up" should be +y in 3D) and scaled to ~human height
      // z: MediaPipe's rough relative depth, scaled down since it's less reliable than x/y
      return new THREE.Vector3((j.x - 0.5) * 1.6, (0.5 - j.y) * 1.8 + 0.9, -j.z * 1.6);
    };

    for (const index of JOINT_INDICES) {
      const mesh = this.jointMeshes.get(index)!;
      const world = toWorld(landmarks[index]);
      mesh.position.copy(world);
    }

    for (const [a, b] of BONES) {
      const cylinder = this.boneMeshes.get(`${a}-${b}`)!;
      const pointA = toWorld(landmarks[a]);
      const pointB = toWorld(landmarks[b]);

      const midpoint = pointA.clone().add(pointB).multiplyScalar(0.5);
      const direction = pointB.clone().sub(pointA);
      const length = direction.length();

      cylinder.position.copy(midpoint);
      cylinder.scale.set(1, length, 1); // cylinder's default height axis is Y

      // rotate the cylinder from its default "pointing up" orientation to
      // actually point along the direction between the two joints
      const up = new THREE.Vector3(0, 1, 0);
      cylinder.quaternion.setFromUnitVectors(up, direction.normalize());
    }
  }
}