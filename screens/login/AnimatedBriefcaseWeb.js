// screens/login/AnimatedBriefcaseWeb.js
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AnimatedBriefcaseWeb = ({ onAnimationComplete, children }) => {
  const canvasRef = useRef(null);
  const mountedRef = useRef(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    let scene, camera, renderer, briefcaseGroup, lidGroup, particles;
    let animationPhase = 'falling';
    let startTime = Date.now();
    let animationFrameId;

    const initScene = () => {
      // Importar Three.js dinámicamente para web
      const THREE = window.THREE;
      if (!THREE) {
        console.error('Three.js no está disponible');
        return;
      }

      // Crear escena
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5);

      // Crear cámara
      camera = new THREE.PerspectiveCamera(
        35,
        screenWidth / screenHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 18);

      // Crear renderer
      if (!canvasRef.current) return;
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
      });
      renderer.setSize(screenWidth, screenHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Iluminación
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
      mainLight.position.set(8, 10, 8);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 2048;
      mainLight.shadow.mapSize.height = 2048;
      scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0xb8d4ff, 0.4);
      fillLight.position.set(-5, 3, -5);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
      rimLight.position.set(0, -3, -8);
      scene.add(rimLight);

      // Crear partículas personalizadas (azul, rojo, negro)
      createCustomParticles(THREE, scene);

      // Crear maletín
      createBriefcase(THREE, scene);

      // Iniciar animación
      animate(THREE);
    };

    const createCustomParticles = (THREE, scene) => {
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = 300; // Más partículas
      const positions = new Float32Array(particlesCount * 3);
      const colors = new Float32Array(particlesCount * 3);

      const colorPalette = [
        new THREE.Color(0x0066cc), // Azul
        new THREE.Color(0xcc0000), // Rojo
        new THREE.Color(0x1a1a1a), // Negro
      ];

      for (let i = 0; i < particlesCount; i++) {
        // Posiciones - cayendo desde arriba
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = Math.random() * 30 + 10; // Empiezan arriba
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

        // Colores aleatorios del palette
        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });

      particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);

      // Guardar referencia para animación
      particles.userData.velocities = [];
      for (let i = 0; i < particlesCount; i++) {
        particles.userData.velocities.push({
          y: -0.02 - Math.random() * 0.03, // Velocidad de caída
          x: (Math.random() - 0.5) * 0.01,
        });
      }
    };

    const createBriefcase = (THREE, scene) => {
      briefcaseGroup = new THREE.Group();
      scene.add(briefcaseGroup);

      // Materiales ultra realistas
      const blackLeatherMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x0a0a0a,
        roughness: 0.25,
        metalness: 0.02,
        clearcoat: 0.6,
        clearcoatRoughness: 0.15,
      });

      const silverMetalMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xc8c8c8,
        roughness: 0.12,
        metalness: 0.98,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
      });

      // CUERPO PRINCIPAL
      const mainBodyGeometry = new THREE.BoxGeometry(7, 5, 1.8);
      const mainBody = new THREE.Mesh(mainBodyGeometry, blackLeatherMaterial);
      mainBody.castShadow = true;
      mainBody.receiveShadow = true;
      briefcaseGroup.add(mainBody);

      // TAPA SUPERIOR
      lidGroup = new THREE.Group();
      const lidGeometry = new THREE.BoxGeometry(7, 0.5, 1.8);
      const lid = new THREE.Mesh(lidGeometry, blackLeatherMaterial);
      lid.position.y = 0.25;
      lid.castShadow = true;
      lidGroup.add(lid);
      lidGroup.position.y = 2.75;
      briefcaseGroup.add(lidGroup);

      // Protectores de esquina plateados
      const cornerGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.2);
      const cornerPositions = [
        [-3.15, 2.25, 0.9], [3.15, 2.25, 0.9],
        [-3.15, -2.25, 0.9], [3.15, -2.25, 0.9],
        [-3.15, 2.25, -0.9], [3.15, 2.25, -0.9],
        [-3.15, -2.25, -0.9], [3.15, -2.25, -0.9],
      ];

      cornerPositions.forEach((pos) => {
        const corner = new THREE.Mesh(cornerGeometry, silverMetalMaterial);
        corner.position.set(...pos);
        corner.castShadow = true;
        briefcaseGroup.add(corner);
      });

      // Bordes metálicos
      const sideEdgeGeometry = new THREE.BoxGeometry(0.15, 5, 0.15);
      const leftEdge = new THREE.Mesh(sideEdgeGeometry, silverMetalMaterial);
      leftEdge.position.set(-3.5, 0, 0.9);
      leftEdge.castShadow = true;
      briefcaseGroup.add(leftEdge);

      const rightEdge = new THREE.Mesh(sideEdgeGeometry, silverMetalMaterial);
      rightEdge.position.set(3.5, 0, 0.9);
      rightEdge.castShadow = true;
      briefcaseGroup.add(rightEdge);

      // Manija
      const handleSupportGeo = new THREE.BoxGeometry(0.3, 0.5, 0.3);
      const handleSupport1 = new THREE.Mesh(handleSupportGeo, silverMetalMaterial);
      handleSupport1.position.set(-1.5, 3.2, 0);
      briefcaseGroup.add(handleSupport1);

      const handleSupport2 = new THREE.Mesh(handleSupportGeo, silverMetalMaterial);
      handleSupport2.position.set(1.5, 3.2, 0);
      briefcaseGroup.add(handleSupport2);

      const handleCurveGeo = new THREE.TorusGeometry(1.6, 0.18, 16, 32, Math.PI);
      const handleCurve = new THREE.Mesh(
        handleCurveGeo,
        new THREE.MeshPhysicalMaterial({
          color: 0x0a0a0a,
          roughness: 0.5,
          metalness: 0.0,
        })
      );
      handleCurve.rotation.z = Math.PI;
      handleCurve.position.y = 3.6;
      handleCurve.castShadow = true;
      briefcaseGroup.add(handleCurve);

      // Herramientas en la superficie (DORADAS para que resalten)
      createGoldenBarberTools(THREE, briefcaseGroup);

      // Posición inicial
      briefcaseGroup.position.y = 20;
      briefcaseGroup.rotation.x = 0.1;
    };

    const createGoldenBarberTools = (THREE, parent) => {
      const toolsGroup = new THREE.Group();
      toolsGroup.position.z = 0.95;
      parent.add(toolsGroup);

      // Material DORADO brillante para las herramientas
      const goldMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffd700,
        roughness: 0.1,
        metalness: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
      });

      const darkGoldMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xb8860b,
        roughness: 0.3,
        metalness: 0.8,
      });

      // Tijeras cruzadas
      const scissors1 = createScissors(THREE, goldMaterial, darkGoldMaterial, 1.0);
      scissors1.position.set(-1.2, 0.8, 0.05);
      scissors1.rotation.z = -0.4;
      toolsGroup.add(scissors1);

      const scissors2 = createScissors(THREE, goldMaterial, darkGoldMaterial, 1.0);
      scissors2.position.set(1.2, 0.8, 0.05);
      scissors2.rotation.z = 0.4;
      toolsGroup.add(scissors2);

      // Navajas
      const razor1 = createRazor(THREE, goldMaterial, darkGoldMaterial);
      razor1.position.set(-2.2, -0.3, 0.05);
      razor1.rotation.z = -0.3;
      toolsGroup.add(razor1);

      const razor2 = createRazor(THREE, goldMaterial, darkGoldMaterial);
      razor2.position.set(2.2, -0.3, 0.05);
      razor2.rotation.z = 0.3;
      toolsGroup.add(razor2);

      // Peines
      const comb1 = createComb(THREE, darkGoldMaterial);
      comb1.position.set(-2.0, -1.5, 0.05);
      comb1.rotation.z = 0.2;
      toolsGroup.add(comb1);

      const comb2 = createComb(THREE, darkGoldMaterial);
      comb2.position.set(2.0, -1.5, 0.05);
      comb2.rotation.z = -0.2;
      toolsGroup.add(comb2);

      // Máquina cortapelo
      const clipper = createClipper(THREE, goldMaterial, darkGoldMaterial);
      clipper.position.set(0, -0.5, 0.05);
      toolsGroup.add(clipper);

      // Cuchillas dispersas
      for (let i = 0; i < 6; i++) {
        const blade = createSmallBlade(THREE, goldMaterial);
        const angle = (i / 6) * Math.PI * 2;
        const radius = 1.8;
        blade.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius - 0.3,
          0.03
        );
        blade.rotation.z = angle + Math.PI / 2;
        toolsGroup.add(blade);
      }
    };

    const createScissors = (THREE, goldMat, darkGoldMat, scale = 1.0) => {
      const group = new THREE.Group();

      const bladeGeo = new THREE.BoxGeometry(0.12 * scale, 1.3 * scale, 0.04 * scale);
      const blade1 = new THREE.Mesh(bladeGeo, goldMat);
      blade1.position.set(-0.1 * scale, 0.3 * scale, 0);
      blade1.rotation.z = 0.12;
      blade1.castShadow = true;

      const blade2 = new THREE.Mesh(bladeGeo, goldMat);
      blade2.position.set(0.1 * scale, 0.3 * scale, 0);
      blade2.rotation.z = -0.12;
      blade2.castShadow = true;

      const handleGeo = new THREE.TorusGeometry(0.2 * scale, 0.04 * scale, 12, 20);
      const handle1 = new THREE.Mesh(handleGeo, darkGoldMat);
      handle1.position.set(-0.12 * scale, -0.65 * scale, 0);

      const handle2 = new THREE.Mesh(handleGeo, darkGoldMat);
      handle2.position.set(0.12 * scale, -0.65 * scale, 0);

      const pivotGeo = new THREE.SphereGeometry(0.1 * scale, 12, 12);
      const pivot = new THREE.Mesh(pivotGeo, goldMat);

      group.add(blade1, blade2, handle1, handle2, pivot);
      return group;
    };

    const createRazor = (THREE, goldMat, darkGoldMat) => {
      const group = new THREE.Group();

      const bladeGeo = new THREE.BoxGeometry(0.1, 1.5, 0.03);
      const blade = new THREE.Mesh(bladeGeo, goldMat);
      blade.position.y = 0.4;
      blade.castShadow = true;

      const handleGeo = new THREE.BoxGeometry(0.18, 0.9, 0.12);
      const handle = new THREE.Mesh(handleGeo, darkGoldMat);
      handle.position.y = -0.5;

      group.add(blade, handle);
      return group;
    };

    const createComb = (THREE, darkGoldMat) => {
      const group = new THREE.Group();

      const baseGeo = new THREE.BoxGeometry(0.25, 1.2, 0.04);
      const base = new THREE.Mesh(baseGeo, darkGoldMat);
      group.add(base);

      for (let i = 0; i < 18; i++) {
        const toothGeo = new THREE.BoxGeometry(0.2, 0.03, 0.02);
        const tooth = new THREE.Mesh(toothGeo, darkGoldMat);
        tooth.position.set(0.11, 0.55 - i * 0.06, 0);
        group.add(tooth);
      }

      return group;
    };

    const createClipper = (THREE, goldMat, darkGoldMat) => {
      const group = new THREE.Group();

      const bodyGeo = new THREE.BoxGeometry(0.35, 1.0, 0.25);
      const body = new THREE.Mesh(bodyGeo, darkGoldMat);

      const headGeo = new THREE.BoxGeometry(0.4, 0.25, 0.27);
      const head = new THREE.Mesh(headGeo, goldMat);
      head.position.y = 0.625;

      group.add(body, head);
      return group;
    };

    const createSmallBlade = (THREE, goldMat) => {
      const bladeGeo = new THREE.BoxGeometry(0.06, 0.4, 0.02);
      const blade = new THREE.Mesh(bladeGeo, goldMat);
      blade.castShadow = true;
      return blade;
    };

    const animate = (THREE) => {
      if (!mountedRef.current) return;

      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000;

      // Animar partículas
      if (particles) {
        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.userData.velocities;

        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3 + 1] += velocities[i].y;
          positions[i * 3] += velocities[i].x;

          // Reiniciar partículas que caen fuera
          if (positions[i * 3 + 1] < -10) {
            positions[i * 3 + 1] = 30;
            positions[i * 3] = (Math.random() - 0.5) * 40;
          }
        }
        particles.geometry.attributes.position.needsUpdate = true;
      }

      // Animación del maletín
      if (animationPhase === 'falling') {
        const fallProgress = Math.min(elapsed / 1.8, 1);
        const easeOut = 1 - Math.pow(1 - fallProgress, 3);
        briefcaseGroup.position.y = 20 - easeOut * 20;
        briefcaseGroup.rotation.x = 0.1 + easeOut * 0.3;

        if (fallProgress >= 1) {
          animationPhase = 'bounce';
          startTime = currentTime;
        }
      } else if (animationPhase === 'bounce') {
        const bounceProgress = Math.min(elapsed / 0.5, 1);
        const bounce = Math.abs(Math.sin(bounceProgress * Math.PI * 3)) * 0.6 * (1 - bounceProgress);
        briefcaseGroup.position.y = bounce;

        if (bounceProgress >= 1) {
          animationPhase = 'display';
          startTime = currentTime;
          briefcaseGroup.position.y = 0;
        }
      } else if (animationPhase === 'display') {
        const displayProgress = Math.min(elapsed / 1.5, 1);

        if (displayProgress >= 1) {
          animationPhase = 'openCase';
          startTime = currentTime;
        }
      } else if (animationPhase === 'openCase') {
        const openProgress = Math.min(elapsed / 1.5, 1);
        const easeInOut =
          openProgress < 0.5
            ? 4 * openProgress * openProgress * openProgress
            : 1 - Math.pow(-2 * openProgress + 2, 3) / 2;

        lidGroup.rotation.x = -easeInOut * Math.PI * 0.9;

        if (openProgress >= 0.5 && !showContent) {
          setShowContent(true);
        }

        if (openProgress >= 1) {
          animationPhase = 'hideCase';
          startTime = currentTime;
        }
      } else if (animationPhase === 'hideCase') {
        const hideProgress = Math.min(elapsed / 1.2, 1);
        const easeIn = hideProgress * hideProgress * hideProgress;

        briefcaseGroup.scale.setScalar(1 - easeIn);
        camera.position.z = 18 + easeIn * 4;

        briefcaseGroup.traverse((child) => {
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = 1 - easeIn;
          }
        });

        if (hideProgress >= 1) {
          animationPhase = 'complete';
          briefcaseGroup.visible = false;
          if (onAnimationComplete) onAnimationComplete();
        }
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(() => animate(THREE));
    };

    // Cargar Three.js y iniciar
    if (typeof window !== 'undefined' && window.THREE) {
      initScene();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => initScene();
      document.head.appendChild(script);
    }

    // Cleanup
    return () => {
      mountedRef.current = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (renderer) {
        renderer.dispose();
      }
    };
  }, [onAnimationComplete]);

  return (
    <View style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />
      {showContent && (
        <View style={styles.contentContainer}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
});

export default AnimatedBriefcaseWeb;