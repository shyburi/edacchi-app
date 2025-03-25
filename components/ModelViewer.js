// components/Viewer.js
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const ModelViewer = ({ url }) => {
  // ↓ここを修正（プロキシURL経由で読み込むように）
  const proxyUrl = `/api/proxyModel?modelUrl=${encodeURIComponent(url)}`;
  const gltf = useLoader(GLTFLoader, proxyUrl);
  return <primitive object={gltf.scene} />;
};

export default function Viewer({ modelUrl }) {
  return (
    <Canvas style={{ width: '500px', height: '500px' }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1.0} />
      <ModelViewer url={modelUrl} />
      <OrbitControls />
    </Canvas>
  );
}
