import * as THREE from 'three'

/** Per-frame mutable player state. Written by PlayerController, read by Entity/AI/audio. */
export const playerRig = {
  position: new THREE.Vector3(0, 0, 0), // feet
  yaw: 0,
  moving: false,
  sprinting: false,
  shake: 0,
  forcedEyeHeight: undefined as number | undefined,
}
