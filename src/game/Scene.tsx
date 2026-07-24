export default function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[10, 10]} />
        <meshLambertMaterial color="#555" />
      </mesh>
    </>
  )
}
