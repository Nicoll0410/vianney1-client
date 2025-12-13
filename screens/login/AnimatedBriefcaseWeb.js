// screens/login/AnimatedBriefcaseWeb.js
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AnimatedBriefcaseWeb = ({ onAnimationComplete, children }) => {
  const canvasRef = useRef(null);
  const mountedRef = useRef(true);
  const [showContent, setShowContent] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setShowContent(true);
      return;
    }

    let scene, camera, renderer, briefcaseGroup, lidGroup, toolsArray = [], particles;
    let animationPhase = 'falling';
    let startTime = Date.now();
    let animationFrameId;

    const initScene = () => {
      const THREE = window.THREE;
      if (!THREE) {
        console.error('Three.js no está disponible');
        setShowContent(true);
        return;
      }

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);

      camera = new THREE.PerspectiveCamera(35, screenWidth / screenHeight, 0.1, 1000);
      camera.position.set(0, 0, 18);

      if (!canvasRef.current) {
        setShowContent(true);
        return;
      }
      
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
      });
      renderer.setSize(screenWidth, screenHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
      mainLight.position.set(8, 10, 8);
      mainLight.castShadow = true;
      scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0xb8d4ff, 0.3);
      fillLight.position.set(-5, 3, -5);
      scene.add(fillLight);

      createRealisticBriefcase(THREE, scene);
      animate(THREE);
    };

    const createRealisticBriefcase = (THREE, scene) => {
      briefcaseGroup = new THREE.Group();
      scene.add(briefcaseGroup);

      const blackLeatherMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x000000, // Negro puro como HTML
        roughness: 0.3,
        metalness: 0.1,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2,
      });

      const goldMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xd4af37, // Dorado exacto del HTML
        roughness: 0.2,
        metalness: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });

      // Cuerpo del maletín
      const bodyShape = new THREE.Shape();
      const bodyWidth = 7;
      const bodyHeight = 5;
      const radius = 0.3;

      bodyShape.moveTo(-bodyWidth / 2 + radius, -bodyHeight / 2);
      bodyShape.lineTo(bodyWidth / 2 - radius, -bodyHeight / 2);
      bodyShape.quadraticCurveTo(bodyWidth / 2, -bodyHeight / 2, bodyWidth / 2, -bodyHeight / 2 + radius);
      bodyShape.lineTo(bodyWidth / 2, bodyHeight / 2 - radius);
      bodyShape.quadraticCurveTo(bodyWidth / 2, bodyHeight / 2, bodyWidth / 2 - radius, bodyHeight / 2);
      bodyShape.lineTo(-bodyWidth / 2 + radius, bodyHeight / 2);
      bodyShape.quadraticCurveTo(-bodyWidth / 2, bodyHeight / 2, -bodyWidth / 2, bodyHeight / 2 - radius);
      bodyShape.lineTo(-bodyWidth / 2, -bodyHeight / 2 + radius);
      bodyShape.quadraticCurveTo(-bodyWidth / 2, -bodyHeight / 2, -bodyWidth / 2 + radius, -bodyHeight / 2);

      const extrudeSettings = {
        depth: 1.8,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 5,
      };

      const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
      const mainBody = new THREE.Mesh(bodyGeometry, blackLeatherMaterial);
      mainBody.position.z = -0.9;
      mainBody.castShadow = true;
      briefcaseGroup.add(mainBody);

      // Tapa
      lidGroup = new THREE.Group();
      const lidShape = new THREE.Shape();
      const lidWidth = 7;
      const lidHeight = 0.6;

      lidShape.moveTo(-lidWidth / 2 + radius, 0);
      lidShape.lineTo(lidWidth / 2 - radius, 0);
      lidShape.quadraticCurveTo(lidWidth / 2, 0, lidWidth / 2, radius);
      lidShape.lineTo(lidWidth / 2, lidHeight - radius);
      lidShape.quadraticCurveTo(lidWidth / 2, lidHeight, lidWidth / 2 - radius, lidHeight);
      lidShape.lineTo(-lidWidth / 2 + radius, lidHeight);
      lidShape.quadraticCurveTo(-lidWidth / 2, lidHeight, -lidWidth / 2, lidHeight - radius);
      lidShape.lineTo(-lidWidth / 2, radius);
      lidShape.quadraticCurveTo(-lidWidth / 2, 0, -lidWidth / 2 + radius, 0);

      const lidGeometry = new THREE.ExtrudeGeometry(lidShape, extrudeSettings);
      const lid = new THREE.Mesh(lidGeometry, blackLeatherMaterial);
      lid.position.z = -0.9;
      lid.castShadow = true;
      lidGroup.add(lid);
      lidGroup.position.y = 2.5;
      briefcaseGroup.add(lidGroup);

      // Costuras
      createStitching(THREE, briefcaseGroup, goldMaterial);

      // Esquinas plateadas
      const cornerGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.2);
      const cornerPositions = [
        [-3.2, 2.2, 0.9], [3.2, 2.2, 0.9],
        [-3.2, -2.2, 0.9], [3.2, -2.2, 0.9],
      ];

      cornerPositions.forEach((pos) => {
        const corner = new THREE.Mesh(cornerGeometry, goldMaterial);
        corner.position.set(...pos);
        corner.castShadow = true;
        briefcaseGroup.add(corner);
      });

      // Bordes laterales
      const sideEdgeGeometry = new THREE.BoxGeometry(0.12, 5.2, 0.12);
      const leftEdge = new THREE.Mesh(sideEdgeGeometry, goldMaterial);
      leftEdge.position.set(-3.5, 0, 0.9);
      briefcaseGroup.add(leftEdge);

      const rightEdge = new THREE.Mesh(sideEdgeGeometry, goldMaterial);
      rightEdge.position.set(3.5, 0, 0.9);
      briefcaseGroup.add(rightEdge);

      // Manija
      createHandle(THREE, briefcaseGroup, goldMaterial, goldMaterial);

      // Cerradura
      const lockBaseGeo = new THREE.BoxGeometry(0.9, 0.35, 0.25);
      const lockBase = new THREE.Mesh(lockBaseGeo, goldMaterial);
      lockBase.position.set(0, -1.8, 0.95);
      briefcaseGroup.add(lockBase);

      // HERRAMIENTAS DENTRO (se soltarán después)
      createToolsInside(THREE, scene);

      briefcaseGroup.position.y = 20;
      briefcaseGroup.rotation.x = 0.1;
    };

    const createStitching = (THREE, parent, stitchMaterial) => {
      const stitchCount = 60;
      const stitchRadius = 3.4;

      for (let i = 0; i < stitchCount; i++) {
        const angle = (i / stitchCount) * Math.PI * 2;
        const x = Math.cos(angle) * stitchRadius;
        const y = Math.sin(angle) * (stitchRadius * 0.7);

        const stitchGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8);
        const stitch = new THREE.Mesh(stitchGeo, stitchMaterial);
        stitch.position.set(x, y, 0.92);
        stitch.rotation.x = Math.PI / 2;
        parent.add(stitch);
      }
    };

    const createHandle = (THREE, parent, silverMat, stitchMat) => {
      const handleSupportGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.5, 16);
      const handleSupport1 = new THREE.Mesh(handleSupportGeo, silverMat);
      handleSupport1.position.set(-1.5, 3.2, 0);
      parent.add(handleSupport1);

      const handleSupport2 = new THREE.Mesh(handleSupportGeo, silverMat);
      handleSupport2.position.set(1.5, 3.2, 0);
      parent.add(handleSupport2);

      const handleCurveGeo = new THREE.TorusGeometry(1.5, 0.22, 16, 32, Math.PI);
      const handleCurve = new THREE.Mesh(
        handleCurveGeo,
        new THREE.MeshPhysicalMaterial({ color: 0x0f0f0f, roughness: 0.6 })
      );
      handleCurve.rotation.z = Math.PI;
      handleCurve.position.y = 3.6;
      parent.add(handleCurve);
    };

    const createToolsInside = (THREE, scene) => {
      const goldMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffd700,
        roughness: 0.12,
        metalness: 1.0,
        clearcoat: 1.0,
      });

      const silverMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xe8e8e8,
        roughness: 0.1,
        metalness: 1.0,
        clearcoat: 1.0,
      });

      const darkGoldMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xb8860b,
        roughness: 0.3,
        metalness: 0.8,
      });

      const darkSilverMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xa8a8a8,
        roughness: 0.25,
        metalness: 0.85,
      });

      // MUCHAS MÁS HERRAMIENTAS - 24 en total
      const tools = [
        // Tijeras grandes (6)
        { type: 'scissors', material: goldMaterial, handle: darkGoldMaterial, pos: [-1.5, 0, 0.5], scale: 1.3 },
        { type: 'scissors', material: silverMaterial, handle: darkSilverMaterial, pos: [1.5, 0, 0.5], scale: 1.3 },
        { type: 'scissors', material: goldMaterial, handle: darkGoldMaterial, pos: [-1.8, 0, 0.4], scale: 1.2 },
        { type: 'scissors', material: silverMaterial, handle: darkSilverMaterial, pos: [1.8, 0, 0.4], scale: 1.2 },
        { type: 'scissors', material: goldMaterial, handle: darkGoldMaterial, pos: [-1.2, 0, 0.6], scale: 1.1 },
        { type: 'scissors', material: silverMaterial, handle: darkSilverMaterial, pos: [1.2, 0, 0.6], scale: 1.1 },
        
        // Navajas (6)
        { type: 'razor', material: goldMaterial, handle: darkGoldMaterial, pos: [-2.2, 0, 0.3], scale: 1.2 },
        { type: 'razor', material: silverMaterial, handle: darkSilverMaterial, pos: [2.2, 0, 0.3], scale: 1.2 },
        { type: 'razor', material: goldMaterial, handle: darkGoldMaterial, pos: [-2.0, 0, 0.25], scale: 1.1 },
        { type: 'razor', material: silverMaterial, handle: darkSilverMaterial, pos: [2.0, 0, 0.25], scale: 1.1 },
        { type: 'razor', material: goldMaterial, handle: darkGoldMaterial, pos: [-2.4, 0, 0.35], scale: 1.0 },
        { type: 'razor', material: silverMaterial, handle: darkSilverMaterial, pos: [2.4, 0, 0.35], scale: 1.0 },
        
        // Peines (6)
        { type: 'comb', material: darkGoldMaterial, pos: [-1.6, 0, 0.2], scale: 1.2 },
        { type: 'comb', material: darkSilverMaterial, pos: [1.6, 0, 0.2], scale: 1.2 },
        { type: 'comb', material: darkGoldMaterial, pos: [-1.4, 0, 0.15], scale: 1.1 },
        { type: 'comb', material: darkSilverMaterial, pos: [1.4, 0, 0.15], scale: 1.1 },
        { type: 'comb', material: darkGoldMaterial, pos: [-1.8, 0, 0.25], scale: 1.0 },
        { type: 'comb', material: darkSilverMaterial, pos: [1.8, 0, 0.25], scale: 1.0 },
        
        // Clippers (6)
        { type: 'clipper', gold: goldMaterial, silver: silverMaterial, pos: [-0.5, 0, 0.3], scale: 1.2 },
        { type: 'clipper', gold: goldMaterial, silver: silverMaterial, pos: [0.5, 0, 0.3], scale: 1.2 },
        { type: 'clipper', gold: darkGoldMaterial, silver: darkSilverMaterial, pos: [-0.3, 0, 0.35], scale: 1.1 },
        { type: 'clipper', gold: darkGoldMaterial, silver: darkSilverMaterial, pos: [0.3, 0, 0.35], scale: 1.1 },
        { type: 'clipper', gold: goldMaterial, silver: silverMaterial, pos: [-0.7, 0, 0.25], scale: 1.0 },
        { type: 'clipper', gold: goldMaterial, silver: silverMaterial, pos: [0.7, 0, 0.25], scale: 1.0 },
      ];

      tools.forEach((toolData) => {
        let tool;
        const scale = toolData.scale || 1.0;
        
        if (toolData.type === 'scissors') {
          tool = createScissors(THREE, toolData.material, toolData.handle, scale);
        } else if (toolData.type === 'razor') {
          tool = createRazor(THREE, toolData.material, toolData.handle, scale);
        } else if (toolData.type === 'comb') {
          tool = createComb(THREE, toolData.material, scale);
        } else if (toolData.type === 'clipper') {
          tool = createClipper(THREE, toolData.gold, toolData.silver, scale);
        }

        tool.position.set(...toolData.pos);
        tool.visible = false;
        
        // Velocidades más dramáticas
        tool.userData.velocity = {
          x: (Math.random() - 0.5) * 0.25,
          y: Math.random() * 0.25 + 0.2,
          z: (Math.random() - 0.5) * 0.15,
          rotX: (Math.random() - 0.5) * 0.15,
          rotY: (Math.random() - 0.5) * 0.15,
          rotZ: (Math.random() - 0.5) * 0.15,
        };
        
        scene.add(tool);
        toolsArray.push(tool);
      });
    };

    const createScissors = (THREE, metalMat, handleMat, scale = 1.0) => {
      const group = new THREE.Group();
      const bladeGeo = new THREE.BoxGeometry(0.12 * scale, 1.3 * scale, 0.04 * scale);
      const blade1 = new THREE.Mesh(bladeGeo, metalMat);
      blade1.position.set(-0.1 * scale, 0.3 * scale, 0);
      blade1.rotation.z = 0.12;
      const blade2 = new THREE.Mesh(bladeGeo, metalMat);
      blade2.position.set(0.1 * scale, 0.3 * scale, 0);
      blade2.rotation.z = -0.12;
      const handleGeo = new THREE.TorusGeometry(0.2 * scale, 0.04 * scale, 12, 20);
      const handle1 = new THREE.Mesh(handleGeo, handleMat);
      handle1.position.set(-0.12 * scale, -0.65 * scale, 0);
      const handle2 = new THREE.Mesh(handleGeo, handleMat);
      handle2.position.set(0.12 * scale, -0.65 * scale, 0);
      group.add(blade1, blade2, handle1, handle2);
      return group;
    };

    const createRazor = (THREE, metalMat, handleMat, scale = 1.0) => {
      const group = new THREE.Group();
      const bladeGeo = new THREE.BoxGeometry(0.1 * scale, 1.2 * scale, 0.03 * scale);
      const blade = new THREE.Mesh(bladeGeo, metalMat);
      blade.position.y = 0.3 * scale;
      const handleGeo = new THREE.BoxGeometry(0.18 * scale, 0.8 * scale, 0.12 * scale);
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.position.y = -0.4 * scale;
      group.add(blade, handle);
      return group;
    };

    const createComb = (THREE, material, scale = 1.0) => {
      const group = new THREE.Group();
      const baseGeo = new THREE.BoxGeometry(0.25 * scale, 1.0 * scale, 0.04 * scale);
      const base = new THREE.Mesh(baseGeo, material);
      group.add(base);
      for (let i = 0; i < 15; i++) {
        const toothGeo = new THREE.BoxGeometry(0.2 * scale, 0.03 * scale, 0.02 * scale);
        const tooth = new THREE.Mesh(toothGeo, material);
        tooth.position.set(0.11 * scale, (0.45 - i * 0.06) * scale, 0);
        group.add(tooth);
      }
      return group;
    };

    const createClipper = (THREE, goldMat, silverMat, scale = 1.0) => {
      const group = new THREE.Group();
      const bodyGeo = new THREE.BoxGeometry(0.35 * scale, 1.0 * scale, 0.25 * scale);
      const body = new THREE.Mesh(bodyGeo, silverMat);
      const headGeo = new THREE.BoxGeometry(0.4 * scale, 0.25 * scale, 0.27 * scale);
      const head = new THREE.Mesh(headGeo, goldMat);
      head.position.y = 0.625 * scale;
      group.add(body, head);
      return group;
    };

    const createParticlesAfterLogin = (THREE, scene) => {
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = 250;
      const positions = new Float32Array(particlesCount * 3);
      const colors = new Float32Array(particlesCount * 3);

      const colorPalette = [
        new THREE.Color(0x0066cc),
        new THREE.Color(0xcc0000),
        new THREE.Color(0x1a1a1a),
      ];

      for (let i = 0; i < particlesCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = Math.random() * 30 + 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

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

      particles.userData.velocities = [];
      for (let i = 0; i < particlesCount; i++) {
        particles.userData.velocities.push({
          y: -0.02 - Math.random() * 0.03,
          x: (Math.random() - 0.5) * 0.01,
        });
      }
    };

    const animate = (THREE) => {
      if (!mountedRef.current) return;

      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000;

      // Animar partículas (solo después del login)
      if (particles && showParticles) {
        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.userData.velocities;

        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3 + 1] += velocities[i].y;
          positions[i * 3] += velocities[i].x;

          if (positions[i * 3 + 1] < -10) {
            positions[i * 3 + 1] = 30;
            positions[i * 3] = (Math.random() - 0.5) * 40;
          }
        }
        particles.geometry.attributes.position.needsUpdate = true;
      }

      if (animationPhase === 'falling') {
        const fallProgress = Math.min(elapsed / 1.5, 1);
        const easeOut = 1 - Math.pow(1 - fallProgress, 3);
        briefcaseGroup.position.y = 20 - easeOut * 20;
        briefcaseGroup.rotation.x = 0.1 + easeOut * 0.3;
        briefcaseGroup.rotation.y = Math.sin(elapsed * 2) * 0.1 * (1 - easeOut);

        if (fallProgress >= 1) {
          animationPhase = 'bounce';
          startTime = currentTime;
        }
      } else if (animationPhase === 'bounce') {
        const bounceProgress = Math.min(elapsed / 0.5, 1);
        const bounce = Math.abs(Math.sin(bounceProgress * Math.PI * 3)) * 0.6 * (1 - bounceProgress);
        briefcaseGroup.position.y = bounce;

        if (bounceProgress >= 1) {
          animationPhase = 'releaseTools';
          startTime = currentTime;
          briefcaseGroup.position.y = 0;
          
          // Hacer visibles las herramientas
          toolsArray.forEach(tool => {
            tool.visible = true;
            tool.position.y = 0;
          });
        }
      } else if (animationPhase === 'releaseTools') {
        const releaseProgress = Math.min(elapsed / 1.5, 1);
        
        // Animar herramientas saliendo/volando
        toolsArray.forEach((tool) => {
          const vel = tool.userData.velocity;
          tool.position.x += vel.x;
          tool.position.y += vel.y;
          tool.position.z += vel.z;
          
          // Rotación mientras vuelan
          tool.rotation.x += vel.rotX;
          tool.rotation.y += vel.rotY;
          tool.rotation.z += vel.rotZ;
          
          // Gravedad
          vel.y -= 0.008;
        });

        if (releaseProgress >= 1) {
          animationPhase = 'hideBriefcase';
          startTime = currentTime;
        }
      } else if (animationPhase === 'hideBriefcase') {
        const hideProgress = Math.min(elapsed / 0.8, 1);
        const easeIn = hideProgress * hideProgress;

        // Desaparecer maletín
        briefcaseGroup.scale.setScalar(1 - easeIn);
        briefcaseGroup.traverse((child) => {
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = 1 - easeIn;
          }
        });

        // Desaparecer herramientas
        toolsArray.forEach((tool) => {
          tool.traverse((child) => {
            if (child.material) {
              child.material.transparent = true;
              child.material.opacity = 1 - easeIn;
            }
          });
        });

        if (hideProgress >= 1) {
          animationPhase = 'showLogin';
          startTime = currentTime;
          briefcaseGroup.visible = false;
          toolsArray.forEach(tool => tool.visible = false);
        }
      } else if (animationPhase === 'showLogin') {
        const showProgress = Math.min(elapsed / 0.8, 1);

        if (showProgress >= 0.3 && !showContent) {
          setShowContent(true);
        }

        if (showProgress >= 0.6 && !showParticles) {
          createParticlesAfterLogin(THREE, scene);
          setShowParticles(true);
        }

        if (showProgress >= 1) {
          animationPhase = 'complete';
          if (onAnimationComplete) onAnimationComplete();
        }
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(() => animate(THREE));
    };

    if (typeof window !== 'undefined' && window.THREE) {
      initScene();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => initScene();
      script.onerror = () => setShowContent(true);
      document.head.appendChild(script);
    }

    return () => {
      mountedRef.current = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (renderer) renderer.dispose();
    };
  }, [onAnimationComplete]);

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && <canvas ref={canvasRef} style={styles.canvas} />}
      {showContent && <View style={styles.contentContainer}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  contentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 100,
  },
});

export default AnimatedBriefcaseWeb;