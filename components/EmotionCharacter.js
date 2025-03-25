// components/EmotionCharacter.js
import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

const Character = ({ sentimentScore }) => {
  // あなたが用意した3Dキャラクター（GLBモデル）をpublicフォルダに置く
  const { scene } = useGLTF('/character.glb'); // 例: public/character.glbを用意する

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh && child.morphTargetInfluences) {
          // 感情スコアに応じた表情変化のロジック（例）
          if (sentimentScore > 0.25) {
            // 笑顔
            child.morphTargetInfluences[0] = 1;
            child.morphTargetInfluences[1] = 0;
            child.morphTargetInfluences[2] = 0;
          } else if (sentimentScore < -0.25) {
            // 悲しい顔
            child.morphTargetInfluences[0] = 0;
            child.morphTargetInfluences[1] = 0;
            child.morphTargetInfluences[2] = 1;
          } else {
            // 普通の顔
            child.morphTargetInfluences[0] = 0;
            child.morphTargetInfluences[1] = 1;
            child.morphTargetInfluences[2] = 0;
          }
        }
      });
    }
  }, [scene, sentimentScore]);

  return <primitive object={scene} />;
};

export default function EmotionCharacter({ sentimentScore }) {
  return (
    <Canvas style={{ width: 400, height: 400 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.0} />
      <Character sentimentScore={sentimentScore} />
      <OrbitControls />
    </Canvas>
  );
}
