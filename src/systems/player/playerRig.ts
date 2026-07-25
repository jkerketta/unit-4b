import * as THREE from 'three'

/** Per-frame mutable player state. Written by PlayerController, read by Entity/AI/audio. */
export const playerRig = {
  position: new THREE.Vector3(0, 0, 0), // feet
  forcedPosition: undefined as THREE.Vector3 | undefined,
  yaw: 0,
  forcedYaw: undefined as number | undefined,
  /** Half-angle yaw clamp while peeping from a closet. */
  peepYawLimit: undefined as number | undefined,
  moving: false,
  sprinting: false,
  shake: 0,
  forcedEyeHeight: undefined as number | undefined,
  /** Scripted wake cutscene camera override. */
  cutsceneActive: false,
  cutsceneCamPos: null as THREE.Vector3 | null,
  cutsceneLookAt: null as THREE.Vector3 | null,
}
