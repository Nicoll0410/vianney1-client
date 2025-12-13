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
        roughness: 0.3,
        metalness: 0.1,
        clearcoat: 0.5,
      });

      // Material dorado para detalles
      const goldMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xd4af37,
        roughness: 0.2,
        metalness: 0.9,
        clearcoat: 1.0,
      });

      // CAJA PRINCIPAL SIMPLE
      const bodyGeometry = new THREE.BoxGeometry(7, 5, 1.2);
      const mainBody = new THREE.Mesh(bodyGeometry, blackMaterial);
      mainBody.castShadow = true;
      briefcaseGroup.add(mainBody);

      // BORDE DORADO
      const edgeGeometry = new THREE.EdgesGeometry(bodyGeometry);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xd4af37, linewidth: 2 });
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      briefcaseGroup.add(edges);

      // LÍNEA DORADA SUPERIOR
      const lineGeometry = new THREE.BoxGeometry(7, 0.05, 0.01);
      const topLine = new THREE.Mesh(lineGeometry, goldMaterial);
      topLine.position.set(0, 1.8, 0.61);
      briefcaseGroup.add(topLine);

      // TIJERAS DORADAS EN EL CENTRO
      const circleGeo = new THREE.TorusGeometry(0.4, 0.06, 16, 32);
      
      const leftCircle = new THREE.Mesh(circleGeo, goldMaterial);
      leftCircle.position.set(-0.35, 0, 0.61);
      leftCircle.rotation.z = Math.PI / 12;
      briefcaseGroup.add(leftCircle);

      const rightCircle = new THREE.Mesh(circleGeo, goldMaterial);
      rightCircle.position.set(0.35, 0, 0.61);
      rightCircle.rotation.z = -Math.PI / 12;
      briefcaseGroup.add(rightCircle);

      const centerGeo = new THREE.SphereGeometry(0.1, 16, 16);
      const center = new THREE.Mesh(centerGeo, goldMaterial);
      center.position.set(0, 0, 0.61);
      briefcaseGroup.add(center);

      // HERRAMIENTAS QUE SALDRÁN VOLANDO
      createFlyingTools(THREE, scene, goldMaterial);

      briefcaseGroup.position.y = 20;
      briefcaseGroup.rotation.x = 0.1;
    };

    const createFlyingTools = (THREE, scene, goldMat) => {
      const silverMat = new THREE.MeshPhysicalMaterial({
        color: 0xe8e8e8,
        roughness: 0.1,
        metalness: 1.0,
      });

      // 24 herramientas simples (esferas representando herramientas)
      for (let i = 0; i < 24; i++) {
        const toolGeo = new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 16, 16);
        const tool = new THREE.Mesh(toolGeo, i % 2 === 0 ? goldMat : silverMat);
        
        const angle = (i / 24) * Math.PI * 2;
        const radius = 0.5 + Math.random() * 0.3;
        tool.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.5,
          0.3
        );
        tool.visible = false;
        
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
      }
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