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
    // Solo ejecutar en web
    if (Platform.OS !== 'web') {
      setShowContent(true);
      return;
    }

    let scene, camera, renderer, briefcaseGroup, lidGroup, particles;
    let animationPhase = 'falling';
    let startTime = Date.now();
    let animationFrameId;

    const initScene = () => {
      const THREE = window.THREE;
      if (!THREE) {
        console.error('Three.js no está disponible');
        // Mostrar login directamente si Three.js falla
        setShowContent(true);
        return;
      }

      // Crear escena
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);

      // Crear cámara
      camera = new THREE.PerspectiveCamera(
        35,
        screenWidth / screenHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 18);

      // Crear renderer
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

      // Iluminación mejorada para realismo
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
      mainLight.position.set(8, 10, 8);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 2048;
      mainLight.shadow.mapSize.height = 2048;
      scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0xb8d4ff, 0.3);
      fillLight.position.set(-5, 3, -5);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xffd700, 0.4);
      rimLight.position.set(0, -3, -8);
      scene.add(rimLight);

      // Crear maletín realista
      createRealisticBriefcase(THREE, scene);

      // Iniciar animación
      animate(THREE);
    };

    const createRealisticBriefcase = (THREE, scene) => {
      briefcaseGroup = new THREE.Group();
      scene.add(briefcaseGroup);

      // MATERIALES REALISTAS
      const blackLeatherMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x1a1a1a,
        roughness: 0.45,
        metalness: 0.05,
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
      });

      const silverMetalMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xc8c8c8,
        roughness: 0.15,
        metalness: 0.95,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
      });

      const stitchingMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xe8e8e8,
        roughness: 0.7,
        metalness: 0.0,
      });

      // CUERPO PRINCIPAL con bordes redondeados
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
      mainBody.receiveShadow = true;
      briefcaseGroup.add(mainBody);

      // TAPA con forma redondeada
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

      const lidExtrudeSettings = {
        depth: 1.8,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 5,
      };

      const lidGeometry = new THREE.ExtrudeGeometry(lidShape, lidExtrudeSettings);
      const lid = new THREE.Mesh(lidGeometry, blackLeatherMaterial);
      lid.position.z = -0.9;
      lid.castShadow = true;
      lidGroup.add(lid);
      lidGroup.position.y = 2.5;
      briefcaseGroup.add(lidGroup);

      // COSTURAS PUNTEADAS REALISTAS (como la imagen)
      createStitching(THREE, briefcaseGroup, stitchingMaterial);

      // Protectores de esquina con remaches
      const cornerGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.2);
      const cornerPositions = [
        [-3.2, 2.2, 0.9], [3.2, 2.2, 0.9],
        [-3.2, -2.2, 0.9], [3.2, -2.2, 0.9],
      ];

      cornerPositions.forEach((pos) => {
        const corner = new THREE.Mesh(cornerGeometry, silverMetalMaterial);
        corner.position.set(...pos);
        corner.castShadow = true;
        briefcaseGroup.add(corner);

        // Remaches en las esquinas
        for (let i = 0; i < 4; i++) {
          const rivetGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.1, 12);
          const rivet = new THREE.Mesh(rivetGeo, silverMetalMaterial);
          const offsetX = (i % 2) * 0.4 - 0.2;
          const offsetY = Math.floor(i / 2) * 0.4 - 0.2;
          rivet.position.set(pos[0] + offsetX, pos[1] + offsetY, pos[2] + 0.05);
          rivet.rotation.z = Math.PI / 2;
          rivet.castShadow = true;
          briefcaseGroup.add(rivet);
        }
      });

      // Bordes metálicos laterales
      const sideEdgeGeometry = new THREE.BoxGeometry(0.12, 5.2, 0.12);
      const leftEdge = new THREE.Mesh(sideEdgeGeometry, silverMetalMaterial);
      leftEdge.position.set(-3.5, 0, 0.9);
      leftEdge.castShadow = true;
      briefcaseGroup.add(leftEdge);

      const rightEdge = new THREE.Mesh(sideEdgeGeometry, silverMetalMaterial);
      rightEdge.position.set(3.5, 0, 0.9);
      rightEdge.castShadow = true;
      briefcaseGroup.add(rightEdge);

      // MANIJA realista
      const handleGroup = new THREE.Group();
      
      const handleSupportGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.5, 16);
      const handleSupport1 = new THREE.Mesh(handleSupportGeo, silverMetalMaterial);
      handleSupport1.position.set(-1.5, 3.2, 0);
      handleSupport1.castShadow = true;

      const handleSupport2 = new THREE.Mesh(handleSupportGeo, silverMetalMaterial);
      handleSupport2.position.set(1.5, 3.2, 0);
      handleSupport2.castShadow = true;

      // Manija de cuero acolchada
      const handleCurveGeo = new THREE.TorusGeometry(1.5, 0.22, 16, 32, Math.PI);
      const handleCurve = new THREE.Mesh(
        handleCurveGeo,
        new THREE.MeshPhysicalMaterial({
          color: 0x0f0f0f,
          roughness: 0.6,
          metalness: 0.0,
          clearcoat: 0.2,
        })
      );
      handleCurve.rotation.z = Math.PI;
      handleCurve.position.y = 3.6;
      handleCurve.castShadow = true;

      // Detalles de la manija
      const handleDetailGeo = new THREE.TorusGeometry(1.5, 0.03, 8, 32, Math.PI);
      const handleDetail1 = new THREE.Mesh(handleDetailGeo, stitchingMaterial);
      handleDetail1.rotation.z = Math.PI;
      handleDetail1.position.set(0, 3.6, 0.15);

      const handleDetail2 = new THREE.Mesh(handleDetailGeo, stitchingMaterial);
      handleDetail2.rotation.z = Math.PI;
      handleDetail2.position.set(0, 3.6, -0.15);

      handleGroup.add(handleSupport1, handleSupport2, handleCurve, handleDetail1, handleDetail2);
      briefcaseGroup.add(handleGroup);

      // CERRADURA central con detalle
      const lockBaseGeo = new THREE.BoxGeometry(0.9, 0.35, 0.25);
      const lockBase = new THREE.Mesh(lockBaseGeo, silverMetalMaterial);
      lockBase.position.set(0, -1.8, 0.95);
      lockBase.castShadow = true;
      briefcaseGroup.add(lockBase);

      const lockLatchGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 16);
      const lockLatch = new THREE.Mesh(lockLatchGeo, silverMetalMaterial);
      lockLatch.position.set(0, -1.8, 1.15);
      lockLatch.rotation.x = Math.PI / 2;
      lockLatch.castShadow = true;
      briefcaseGroup.add(lockLatch);

      // HERRAMIENTAS DORADAS Y PLATEADAS (50/50)
      createMixedColorTools(THREE, briefcaseGroup);

      // Posición inicial
      briefcaseGroup.position.y = 20;
      briefcaseGroup.rotation.x = 0.1;
    };

    const createStitching = (THREE, parent, stitchMaterial) => {
      // Costuras punteadas alrededor del borde (como la imagen)
      const stitchCount = 60;
      const stitchRadius = 3.4;

      for (let i = 0; i < stitchCount; i++) {
        const angle = (i / stitchCount) * Math.PI * 2;
        const x = Math.cos(angle) * stitchRadius;
        const y = Math.sin(angle) * (stitchRadius * 0.7); // Elíptico

        const stitchGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8);
        const stitch = new THREE.Mesh(stitchGeo, stitchMaterial);
        stitch.position.set(x, y, 0.92);
        stitch.rotation.x = Math.PI / 2;
        parent.add(stitch);
      }

      // Línea de costuras horizontales
      const horizontalStitches = [-1.5, 0, 1.5];
      horizontalStitches.forEach((yPos) => {
        for (let i = -25; i <= 25; i++) {
          const stitchGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 6);
          const stitch = new THREE.Mesh(stitchGeo, stitchMaterial);
          stitch.position.set(i * 0.25, yPos, 0.91);
          stitch.rotation.x = Math.PI / 2;
          parent.add(stitch);
        }
      });
    };

    const createMixedColorTools = (THREE, parent) => {
      const toolsGroup = new THREE.Group();
      toolsGroup.position.z = 0.95;
      parent.add(toolsGroup);

      // Material DORADO brillante
      const goldMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffd700,
        roughness: 0.12,
        metalness: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
      });

      // Material PLATEADO brillante
      const silverMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xe8e8e8,
        roughness: 0.1,
        metalness: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
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

      // Tijeras DORADAS cruzadas (izquierda)
      const scissors1 = createScissors(THREE, goldMaterial, darkGoldMaterial, 1.0);
      scissors1.position.set(-1.2, 0.8, 0.05);
      scissors1.rotation.z = -0.4;
      toolsGroup.add(scissors1);

      // Tijeras PLATEADAS cruzadas (derecha)
      const scissors2 = createScissors(THREE, silverMaterial, darkSilverMaterial, 1.0);
      scissors2.position.set(1.2, 0.8, 0.05);
      scissors2.rotation.z = 0.4;
      toolsGroup.add(scissors2);

      // Navaja DORADA (izquierda)
      const razor1 = createRazor(THREE, goldMaterial, darkGoldMaterial);
      razor1.position.set(-2.2, -0.3, 0.05);
      razor1.rotation.z = -0.3;
      toolsGroup.add(razor1);

      // Navaja PLATEADA (derecha)
      const razor2 = createRazor(THREE, silverMaterial, darkSilverMaterial);
      razor2.position.set(2.2, -0.3, 0.05);
      razor2.rotation.z = 0.3;
      toolsGroup.add(razor2);

      // Peine DORADO (izquierda)
      const comb1 = createComb(THREE, darkGoldMaterial);
      comb1.position.set(-2.0, -1.5, 0.05);
      comb1.rotation.z = 0.2;
      toolsGroup.add(comb1);

      // Peine PLATEADO (derecha)
      const comb2 = createComb(THREE, darkSilverMaterial);
      comb2.position.set(2.0, -1.5, 0.05);
      comb2.rotation.z = -0.2;
      toolsGroup.add(comb2);

      // Máquina cortapelo DORADA Y PLATEADA
      const clipper = createClipper(THREE, goldMaterial, silverMaterial);
      clipper.position.set(0, -0.5, 0.05);
      toolsGroup.add(clipper);

      // Cuchillas alternando DORADO/PLATEADO
      for (let i = 0; i < 6; i++) {
        const material = i % 2 === 0 ? goldMaterial : silverMaterial;
        const blade = createSmallBlade(THREE, material);
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

    const createScissors = (THREE, metalMat, handleMat, scale = 1.0) => {
      const group = new THREE.Group();

      const bladeGeo = new THREE.BoxGeometry(0.12 * scale, 1.3 * scale, 0.04 * scale);
      const blade1 = new THREE.Mesh(bladeGeo, metalMat);
      blade1.position.set(-0.1 * scale, 0.3 * scale, 0);
      blade1.rotation.z = 0.12;
      blade1.castShadow = true;

      const blade2 = new THREE.Mesh(bladeGeo, metalMat);
      blade2.position.set(0.1 * scale, 0.3 * scale, 0);
      blade2.rotation.z = -0.12;
      blade2.castShadow = true;

      const tipGeo = new THREE.ConeGeometry(0.06 * scale, 0.25 * scale, 8);
      const tip1 = new THREE.Mesh(tipGeo, metalMat);
      tip1.position.set(-0.17 * scale, 0.93 * scale, 0);
      tip1.rotation.z = Math.PI + 0.12;

      const tip2 = new THREE.Mesh(tipGeo, metalMat);
      tip2.position.set(0.17 * scale, 0.93 * scale, 0);
      tip2.rotation.z = Math.PI - 0.12;

      const handleGeo = new THREE.TorusGeometry(0.2 * scale, 0.04 * scale, 12, 20);
      const handle1 = new THREE.Mesh(handleGeo, handleMat);
      handle1.position.set(-0.12 * scale, -0.65 * scale, 0);

      const handle2 = new THREE.Mesh(handleGeo, handleMat);
      handle2.position.set(0.12 * scale, -0.65 * scale, 0);

      const pivotGeo = new THREE.SphereGeometry(0.1 * scale, 12, 12);
      const pivot = new THREE.Mesh(pivotGeo, metalMat);

      group.add(blade1, blade2, tip1, tip2, handle1, handle2, pivot);
      return group;
    };

    const createRazor = (THREE, metalMat, handleMat) => {
      const group = new THREE.Group();

      const bladeGeo = new THREE.BoxGeometry(0.1, 1.5, 0.03);
      const blade = new THREE.Mesh(bladeGeo, metalMat);
      blade.position.y = 0.4;
      blade.castShadow = true;

      const handleGeo = new THREE.BoxGeometry(0.18, 0.9, 0.12);
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.position.y = -0.5;

      group.add(blade, handle);
      return group;
    };

    const createComb = (THREE, material) => {
      const group = new THREE.Group();

      const baseGeo = new THREE.BoxGeometry(0.25, 1.2, 0.04);
      const base = new THREE.Mesh(baseGeo, material);
      group.add(base);

      for (let i = 0; i < 18; i++) {
        const toothGeo = new THREE.BoxGeometry(0.2, 0.03, 0.02);
        const tooth = new THREE.Mesh(toothGeo, material);
        tooth.position.set(0.11, 0.55 - i * 0.06, 0);
        group.add(tooth);
      }

      return group;
    };

    const createClipper = (THREE, goldMat, silverMat) => {
      const group = new THREE.Group();

      const bodyGeo = new THREE.BoxGeometry(0.35, 1.0, 0.25);
      const body = new THREE.Mesh(bodyGeo, silverMat);

      const headGeo = new THREE.BoxGeometry(0.4, 0.25, 0.27);
      const head = new THREE.Mesh(headGeo, goldMat);
      head.position.y = 0.625;

      group.add(body, head);
      return group;
    };

    const createSmallBlade = (THREE, material) => {
      const bladeGeo = new THREE.BoxGeometry(0.06, 0.4, 0.02);
      const blade = new THREE.Mesh(bladeGeo, material);
      blade.castShadow = true;
      return blade;
    };

    const createParticlesAfterOpening = (THREE, scene) => {
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = 250;
      const positions = new Float32Array(particlesCount * 3);
      const colors = new Float32Array(particlesCount * 3);

      const colorPalette = [
        new THREE.Color(0x0066cc), // Azul
        new THREE.Color(0xcc0000), // Rojo
        new THREE.Color(0x1a1a1a), // Negro
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

      // Animar partículas solo si están visibles
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

      // Animación del maletín
      if (animationPhase === 'falling') {
        const fallProgress = Math.min(elapsed / 1.8, 1);
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
          animationPhase = 'settle';
          startTime = currentTime;
          briefcaseGroup.position.y = 0;
        }
      } else if (animationPhase === 'settle') {
        const settleProgress = Math.min(elapsed / 0.8, 1);
        briefcaseGroup.rotation.x = 0.4 - settleProgress * 0.4;

        if (settleProgress >= 1) {
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

        // Crear partículas cuando empieza a abrir
        if (openProgress >= 0.3 && !showParticles) {
          createParticlesAfterOpening(THREE, scene);
          setShowParticles(true);
        }

        // Mostrar contenido (login) cuando está medio abierto
        if (openProgress >= 0.6) {
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

    // Cargar Three.js
    if (typeof window !== 'undefined' && window.THREE) {
      initScene();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => initScene();
      script.onerror = () => {
        console.error('Error cargando Three.js');
        setShowContent(true);
      };
      document.head.appendChild(script);
    }

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
      {Platform.OS === 'web' && <canvas ref={canvasRef} style={styles.canvas} />}
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