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

    let scene, camera, renderer, briefcaseGroup, toolsArray = [], particles;
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

      createSimpleBriefcase(THREE, scene);
      animate(THREE);
    };

    const createSimpleBriefcase = (THREE, scene) => {
      briefcaseGroup = new THREE.Group();
      scene.add(briefcaseGroup);

      // Material negro para el maletín
      const blackMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x000000,
        roughness: 0.2,
        metalness: 0.2,
        clearcoat: 0.8,
      });

      // Material dorado MÁS BRILLANTE
      const goldMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffd700, // Dorado más brillante
        roughness: 0.1,
        metalness: 1.0,
        clearcoat: 1.0,
        emissive: 0xffd700,
        emissiveIntensity: 0.3, // BRILLO DORADO
      });

      const silverMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xe8e8e8,
        roughness: 0.1,
        metalness: 1.0,
        clearcoat: 1.0,
      });

      // CAJA PRINCIPAL SIMPLE
      const bodyGeometry = new THREE.BoxGeometry(7, 5, 1.2);
      const mainBody = new THREE.Mesh(bodyGeometry, blackMaterial);
      mainBody.castShadow = true;
      mainBody.receiveShadow = true;
      briefcaseGroup.add(mainBody);

      // BORDE DORADO MÁS GRUESO Y BRILLANTE
      const edgeGeometry = new THREE.EdgesGeometry(bodyGeometry);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffd700, linewidth: 3 });
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      briefcaseGroup.add(edges);

      // LÍNEA DORADA SUPERIOR
      const lineGeometry = new THREE.BoxGeometry(7, 0.08, 0.02);
      const topLine = new THREE.Mesh(lineGeometry, goldMaterial);
      topLine.position.set(0, 1.8, 0.61);
      briefcaseGroup.add(topLine);

      // TIJERAS DORADAS EN EL CENTRO
      const circleGeo = new THREE.TorusGeometry(0.4, 0.08, 16, 32);
      
      const leftCircle = new THREE.Mesh(circleGeo, goldMaterial);
      leftCircle.position.set(-0.35, 0, 0.61);
      leftCircle.rotation.z = Math.PI / 12;
      briefcaseGroup.add(leftCircle);

      const rightCircle = new THREE.Mesh(circleGeo, goldMaterial);
      rightCircle.position.set(0.35, 0, 0.61);
      rightCircle.rotation.z = -Math.PI / 12;
      briefcaseGroup.add(rightCircle);

      const centerGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const center = new THREE.Mesh(centerGeo, goldMaterial);
      center.position.set(0, 0, 0.61);
      briefcaseGroup.add(center);

      // SOMBRA DEBAJO DEL MALETÍN
      const shadowGeometry = new THREE.PlaneGeometry(8, 6);
      const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.5 });
      const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -2.6;
      shadow.receiveShadow = true;
      scene.add(shadow);

      // HERRAMIENTAS 3D REALES QUE SALDRÁN VOLANDO
      createRealTools(THREE, scene, goldMaterial, silverMaterial);

      briefcaseGroup.position.y = 20;
      briefcaseGroup.rotation.x = 0.3; // MÁS INCLINADO HACIA ARRIBA
    };

    const createRealTools = (THREE, scene, goldMat, silverMat) => {
      const tools = [];
      
      // TIJERAS (8)
      for (let i = 0; i < 8; i++) {
        const scissors = createScissors3D(THREE, i % 2 === 0 ? goldMat : silverMat);
        const angle = (i / 8) * Math.PI * 2;
        scissors.position.set(Math.cos(angle) * 0.8, Math.sin(angle) * 0.4, 0.3);
        scissors.visible = false;
        tools.push(scissors);
      }

      // NAVAJAS (8)
      for (let i = 0; i < 8; i++) {
        const razor = createRazor3D(THREE, i % 2 === 0 ? goldMat : silverMat);
        const angle = (i / 8) * Math.PI * 2 + Math.PI / 16;
        razor.position.set(Math.cos(angle) * 0.6, Math.sin(angle) * 0.3, 0.25);
        razor.visible = false;
        tools.push(razor);
      }

      // PEINES (6)
      for (let i = 0; i < 6; i++) {
        const comb = createComb3D(THREE, i % 2 === 0 ? goldMat : silverMat);
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 12;
        comb.position.set(Math.cos(angle) * 0.5, Math.sin(angle) * 0.25, 0.2);
        comb.visible = false;
        tools.push(comb);
      }

      tools.forEach(tool => {
        tool.userData.velocity = {
          x: (Math.random() - 0.5) * 0.3,
          y: Math.random() * 0.3 + 0.25,
          z: (Math.random() - 0.5) * 0.2,
          rotX: (Math.random() - 0.5) * 0.2,
          rotY: (Math.random() - 0.5) * 0.2,
          rotZ: (Math.random() - 0.5) * 0.2,
        };
        scene.add(tool);
        toolsArray.push(tool);
      });
    };

    const createScissors3D = (THREE, material) => {
      const group = new THREE.Group();
      
      // Hojas de tijeras
      const bladeGeo = new THREE.BoxGeometry(0.08, 0.8, 0.02);
      const blade1 = new THREE.Mesh(bladeGeo, material);
      blade1.position.set(-0.1, 0.3, 0);
      blade1.rotation.z = 0.15;
      group.add(blade1);
      
      const blade2 = new THREE.Mesh(bladeGeo, material);
      blade2.position.set(0.1, 0.3, 0);
      blade2.rotation.z = -0.15;
      group.add(blade2);
      
      // Mangos
      const handleGeo = new THREE.TorusGeometry(0.15, 0.03, 12, 20);
      const handle1 = new THREE.Mesh(handleGeo, material);
      handle1.position.set(-0.12, -0.4, 0);
      group.add(handle1);
      
      const handle2 = new THREE.Mesh(handleGeo, material);
      handle2.position.set(0.12, -0.4, 0);
      group.add(handle2);
      
      return group;
    };

    const createRazor3D = (THREE, material) => {
      const group = new THREE.Group();
      
      // Hoja
      const bladeGeo = new THREE.BoxGeometry(0.06, 0.8, 0.02);
      const blade = new THREE.Mesh(bladeGeo, material);
      blade.position.y = 0.2;
      group.add(blade);
      
      // Mango
      const handleGeo = new THREE.BoxGeometry(0.12, 0.5, 0.08);
      const handle = new THREE.Mesh(handleGeo, material);
      handle.position.y = -0.3;
      group.add(handle);
      
      return group;
    };

    const createComb3D = (THREE, material) => {
      const group = new THREE.Group();
      
      // Base del peine
      const baseGeo = new THREE.BoxGeometry(0.18, 0.7, 0.03);
      const base = new THREE.Mesh(baseGeo, material);
      group.add(base);
      
      // Dientes
      for (let i = 0; i < 12; i++) {
        const toothGeo = new THREE.BoxGeometry(0.15, 0.02, 0.015);
        const tooth = new THREE.Mesh(toothGeo, material);
        tooth.position.set(0.085, 0.32 - i * 0.055, 0);
        group.add(tooth);
      }
      
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
          
          toolsArray.forEach(tool => {
            tool.visible = true;
            tool.position.y = 0;
          });
        }
      } else if (animationPhase === 'releaseTools') {
        const releaseProgress = Math.min(elapsed / 1.5, 1);
        
        toolsArray.forEach((tool) => {
          const vel = tool.userData.velocity;
          tool.position.x += vel.x;
          tool.position.y += vel.y;
          tool.position.z += vel.z;
          
          tool.rotation.x += vel.rotX;
          tool.rotation.y += vel.rotY;
          tool.rotation.z += vel.rotZ;
          
          vel.y -= 0.008;
        });

        if (releaseProgress >= 1) {
          animationPhase = 'hideBriefcase';
          startTime = currentTime;
        }
      } else if (animationPhase === 'hideBriefcase') {
        const hideProgress = Math.min(elapsed / 0.8, 1);
        const easeIn = hideProgress * hideProgress;

        briefcaseGroup.scale.setScalar(1 - easeIn);
        briefcaseGroup.traverse((child) => {
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = 1 - easeIn;
          }
        });

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