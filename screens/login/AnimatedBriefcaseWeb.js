// screens/login/AnimatedBriefcaseWeb.js
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AnimatedBriefcaseWeb = ({ onAnimationComplete, children }) => {
  const canvasRef = useRef(null);
  const mountedRef = useRef(true);
  const [showContent, setShowContent] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [toolsFlying, setToolsFlying] = useState(false);

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

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
      mainLight.position.set(8, 12, 8);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 1024;
      mainLight.shadow.mapSize.height = 1024;
      scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0xb8d4ff, 0.4);
      fillLight.position.set(-5, 5, -5);
      scene.add(fillLight);

      createRealisticBriefcase(THREE, scene);
      animate(THREE);
    };

    const createRealisticBriefcase = (THREE, scene) => {
      briefcaseGroup = new THREE.Group();
      scene.add(briefcaseGroup);

      const blackLeatherMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x1a1a1a,
        roughness: 0.35,
        metalness: 0.05,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
        side: THREE.DoubleSide,
      });

      const silverMetalMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xc8c8c8,
        roughness: 0.12,
        metalness: 0.98,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        side: THREE.DoubleSide,
      });

      const stitchingMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xe8e8e8,
        roughness: 0.6,
        metalness: 0.0,
      });

      // Cuerpo del maletín
      const bodyShape = new THREE.Shape();
      const bodyWidth = 6.5;
      const bodyHeight = 4.5;
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
        depth: 1.6,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize: 0.08,
        bevelSegments: 8,
        curveSegments: 32,
      };

      const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, extrudeSettings);
      const mainBody = new THREE.Mesh(bodyGeometry, blackLeatherMaterial);
      mainBody.position.z = -0.8;
      mainBody.castShadow = true;
      mainBody.receiveShadow = true;
      briefcaseGroup.add(mainBody);

      // Tapa con animación de apertura
      lidGroup = new THREE.Group();
      lidGroup.userData = { isOpen: false, openProgress: 0 };
      
      const lidShape = new THREE.Shape();
      const lidWidth = 6.5;
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
      lid.position.z = -0.8;
      lid.castShadow = true;
      lid.receiveShadow = true;
      lidGroup.add(lid);
      lidGroup.position.y = 2.2;
      lidGroup.rotation.x = 0.1;
      briefcaseGroup.add(lidGroup);

      // Costuras más detalladas
      createStitching(THREE, briefcaseGroup, stitchingMaterial);

      // Esquinas plateadas con brillo
      const cornerGeometry = new THREE.BoxGeometry(0.65, 0.65, 0.18);
      const cornerPositions = [
        [-2.95, 1.95, 0.8], [2.95, 1.95, 0.8],
        [-2.95, -1.95, 0.8], [2.95, -1.95, 0.8],
      ];

      cornerPositions.forEach((pos) => {
        const corner = new THREE.Mesh(cornerGeometry, silverMetalMaterial);
        corner.position.set(...pos);
        corner.castShadow = true;
        briefcaseGroup.add(corner);
      });

      // Manija detallada
      createHandle(THREE, briefcaseGroup, silverMetalMaterial);

      // HERRAMIENTAS INTERIORES CON MEJORES ANIMACIONES
      createToolsInside(THREE, scene);

      briefcaseGroup.position.y = 15;
      briefcaseGroup.rotation.x = 0.15;
      briefcaseGroup.rotation.y = -0.1;
    };

    const createStitching = (THREE, parent, stitchMaterial) => {
      const stitchCount = 80;
      const stitchRadius = 3.2;

      for (let i = 0; i < stitchCount; i++) {
        const angle = (i / stitchCount) * Math.PI * 2;
        const x = Math.cos(angle) * stitchRadius;
        const y = Math.sin(angle) * (stitchRadius * 0.7);

        const stitchGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.06, 10);
        const stitch = new THREE.Mesh(stitchGeo, stitchMaterial);
        stitch.position.set(x, y, 0.85);
        stitch.rotation.x = Math.PI / 2;
        stitch.rotation.z = angle;
        parent.add(stitch);
      }
    };

    const createHandle = (THREE, parent, silverMat) => {
      // Soporte de manija izquierdo
      const handleSupportGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.45, 20);
      const handleSupport1 = new THREE.Mesh(handleSupportGeo, silverMat);
      handleSupport1.position.set(-1.2, 2.8, 0);
      handleSupport1.rotation.z = Math.PI / 2;
      parent.add(handleSupport1);

      // Soporte de manija derecho
      const handleSupport2 = new THREE.Mesh(handleSupportGeo, silverMat);
      handleSupport2.position.set(1.2, 2.8, 0);
      handleSupport2.rotation.z = Math.PI / 2;
      parent.add(handleSupport2);

      // Manija curva
      const handleCurveGeo = new THREE.TorusGeometry(1.2, 0.18, 20, 40, Math.PI);
      const handleCurve = new THREE.Mesh(
        handleCurveGeo,
        new THREE.MeshPhysicalMaterial({ 
          color: 0x0f0f0f, 
          roughness: 0.5,
          metalness: 0.3,
          clearcoat: 0.8,
        })
      );
      handleCurve.rotation.z = Math.PI;
      handleCurve.position.y = 3.15;
      handleCurve.castShadow = true;
      parent.add(handleCurve);
    };

    const createToolsInside = (THREE, scene) => {
      const goldMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffd700,
        roughness: 0.08,
        metalness: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        side: THREE.DoubleSide,
      });

      const silverMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xe8e8e8,
        roughness: 0.08,
        metalness: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        side: THREE.DoubleSide,
      });

      const darkGoldMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xb8860b,
        roughness: 0.25,
        metalness: 0.9,
        side: THREE.DoubleSide,
      });

      const darkSilverMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xa8a8a8,
        roughness: 0.2,
        metalness: 0.9,
        side: THREE.DoubleSide,
      });

      const woodMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x8b4513,
        roughness: 0.8,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });

      // Herramientas con más variedad y mejores animaciones
      const tools = [
        // Tijeras grandes animadas
        { type: 'scissors', material: goldMaterial, handle: darkGoldMaterial, 
          pos: [-1.5, 0, 0.6], scale: 1.4, velocity: { x: -0.3, y: 0.25, z: 0.1, rotX: 0.2, rotY: 0.15, rotZ: 0.1 } },
        { type: 'scissors', material: silverMaterial, handle: darkSilverMaterial, 
          pos: [1.5, 0, 0.6], scale: 1.4, velocity: { x: 0.3, y: 0.25, z: -0.1, rotX: -0.2, rotY: 0.15, rotZ: -0.1 } },
        
        // Navajas con giros dramáticos
        { type: 'razor', material: goldMaterial, handle: darkGoldMaterial, 
          pos: [-2.0, 0, 0.4], scale: 1.3, velocity: { x: -0.25, y: 0.3, z: 0.08, rotX: 0.25, rotY: 0.3, rotZ: 0.15 } },
        { type: 'razor', material: silverMaterial, handle: darkSilverMaterial, 
          pos: [2.0, 0, 0.4], scale: 1.3, velocity: { x: 0.25, y: 0.3, z: -0.08, rotX: -0.25, rotY: 0.3, rotZ: -0.15 } },
        
        // Peines
        { type: 'comb', material: darkGoldMaterial, 
          pos: [-1.0, 0, 0.3], scale: 1.2, velocity: { x: -0.15, y: 0.2, z: 0.05, rotX: 0.1, rotY: 0.1, rotZ: 0.05 } },
        { type: 'comb', material: darkSilverMaterial, 
          pos: [1.0, 0, 0.3], scale: 1.2, velocity: { x: 0.15, y: 0.2, z: -0.05, rotX: -0.1, rotY: 0.1, rotZ: -0.05 } },
        
        // Clippers con efectos
        { type: 'clipper', gold: goldMaterial, silver: silverMaterial, 
          pos: [-0.5, 0, 0.5], scale: 1.3, velocity: { x: -0.2, y: 0.22, z: 0.06, rotX: 0.15, rotY: 0.2, rotZ: 0.08 } },
        { type: 'clipper', gold: darkGoldMaterial, silver: darkSilverMaterial, 
          pos: [0.5, 0, 0.5], scale: 1.3, velocity: { x: 0.2, y: 0.22, z: -0.06, rotX: -0.15, rotY: 0.2, rotZ: -0.08 } },
        
        // Cepillos de madera
        { type: 'brush', material: woodMaterial, handle: darkGoldMaterial, 
          pos: [-2.5, 0, 0.2], scale: 1.1, velocity: { x: -0.35, y: 0.18, z: 0.12, rotX: 0.18, rotY: 0.25, rotZ: 0.12 } },
        { type: 'brush', material: woodMaterial, handle: darkSilverMaterial, 
          pos: [2.5, 0, 0.2], scale: 1.1, velocity: { x: 0.35, y: 0.18, z: -0.12, rotX: -0.18, rotY: 0.25, rotZ: -0.12 } },
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
        } else if (toolData.type === 'brush') {
          tool = createBrush(THREE, toolData.material, toolData.handle, scale);
        }

        if (tool) {
          tool.position.set(...toolData.pos);
          tool.visible = false;
          tool.userData = {
            velocity: toolData.velocity,
            originalScale: scale,
            wiggleSpeed: 0.5 + Math.random() * 1.5,
            wiggleAmount: 0.05 + Math.random() * 0.1,
            hoverHeight: 0.1 + Math.random() * 0.2,
            initialY: toolData.pos[1]
          };
          
          scene.add(tool);
          toolsArray.push(tool);
        }
      });
    };

    const createScissors = (THREE, metalMat, handleMat, scale = 1.0) => {
      const group = new THREE.Group();
      
      // Cuchillas
      const bladeGeo = new THREE.BoxGeometry(0.1 * scale, 1.2 * scale, 0.03 * scale);
      const blade1 = new THREE.Mesh(bladeGeo, metalMat);
      blade1.position.set(-0.08 * scale, 0.25 * scale, 0);
      blade1.rotation.z = 0.15;
      blade1.castShadow = true;
      
      const blade2 = new THREE.Mesh(bladeGeo, metalMat);
      blade2.position.set(0.08 * scale, 0.25 * scale, 0);
      blade2.rotation.z = -0.15;
      blade2.castShadow = true;
      
      // Eje central
      const pivotGeo = new THREE.CylinderGeometry(0.04 * scale, 0.04 * scale, 0.06 * scale, 12);
      const pivot = new THREE.Mesh(pivotGeo, metalMat);
      pivot.position.y = 0.25 * scale;
      pivot.rotation.x = Math.PI / 2;
      pivot.castShadow = true;
      
      // Mangos
      const handleGeo = new THREE.TorusGeometry(0.18 * scale, 0.035 * scale, 12, 24);
      const handle1 = new THREE.Mesh(handleGeo, handleMat);
      handle1.position.set(-0.1 * scale, -0.55 * scale, 0);
      handle1.castShadow = true;
      
      const handle2 = new THREE.Mesh(handleGeo, handleMat);
      handle2.position.set(0.1 * scale, -0.55 * scale, 0);
      handle2.castShadow = true;
      
      group.add(blade1, blade2, pivot, handle1, handle2);
      return group;
    };

    const createRazor = (THREE, metalMat, handleMat, scale = 1.0) => {
      const group = new THREE.Group();
      
      // Hoja
      const bladeGeo = new THREE.BoxGeometry(0.08 * scale, 1.1 * scale, 0.02 * scale);
      const blade = new THREE.Mesh(bladeGeo, metalMat);
      blade.position.y = 0.25 * scale;
      blade.castShadow = true;
      
      // Mango
      const handleGeo = new THREE.BoxGeometry(0.15 * scale, 0.7 * scale, 0.1 * scale);
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.position.y = -0.4 * scale;
      handle.castShadow = true;
      
      // Detalles del mango
      const detailGeo = new THREE.BoxGeometry(0.02 * scale, 0.3 * scale, 0.12 * scale);
      for (let i = 0; i < 3; i++) {
        const detail = new THREE.Mesh(detailGeo, metalMat);
        detail.position.set(0, -0.4 * scale + (i - 1) * 0.12 * scale, 0);
        detail.castShadow = true;
        group.add(detail);
      }
      
      group.add(blade, handle);
      return group;
    };

    const createComb = (THREE, material, scale = 1.0) => {
      const group = new THREE.Group();
      
      // Base
      const baseGeo = new THREE.BoxGeometry(0.22 * scale, 0.9 * scale, 0.035 * scale);
      const base = new THREE.Mesh(baseGeo, material);
      base.castShadow = true;
      
      // Dientes
      const toothCount = 17;
      const toothSpacing = 0.85 * scale / toothCount;
      
      for (let i = 0; i < toothCount; i++) {
        const toothHeight = (0.2 + Math.random() * 0.1) * scale;
        const toothGeo = new THREE.BoxGeometry(0.18 * scale, 0.025 * scale, 0.02 * scale);
        const tooth = new THREE.Mesh(toothGeo, material);
        tooth.position.set(
          0,
          (0.4 - i * toothSpacing) * scale,
          0.028 * scale
        );
        tooth.castShadow = true;
        group.add(tooth);
      }
      
      group.add(base);
      return group;
    };

    const createClipper = (THREE, goldMat, silverMat, scale = 1.0) => {
      const group = new THREE.Group();
      
      // Cuerpo principal
      const bodyGeo = new THREE.BoxGeometry(0.32 * scale, 0.9 * scale, 0.22 * scale);
      const body = new THREE.Mesh(bodyGeo, silverMat);
      body.castShadow = true;
      
      // Cabezal
      const headGeo = new THREE.BoxGeometry(0.38 * scale, 0.22 * scale, 0.25 * scale);
      const head = new THREE.Mesh(headGeo, goldMat);
      head.position.y = 0.56 * scale;
      head.castShadow = true;
      
      // Botones
      const buttonGeo = new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, 0.08 * scale, 16);
      const button1 = new THREE.Mesh(buttonGeo, goldMat);
      button1.position.set(-0.1 * scale, -0.35 * scale, 0.15 * scale);
      button1.rotation.x = Math.PI / 2;
      button1.castShadow = true;
      
      const button2 = new THREE.Mesh(buttonGeo, goldMat);
      button2.position.set(0.1 * scale, -0.35 * scale, 0.15 * scale);
      button2.rotation.x = Math.PI / 2;
      button2.castShadow = true;
      
      group.add(body, head, button1, button2);
      return group;
    };

    const createBrush = (THREE, material, handleMat, scale = 1.0) => {
      const group = new THREE.Group();
      
      // Mango
      const handleGeo = new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.7 * scale, 16);
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.castShadow = true;
      
      // Cerdas
      const bristlesGeo = new THREE.CylinderGeometry(0.12 * scale, 0.15 * scale, 0.4 * scale, 16);
      const bristles = new THREE.Mesh(bristlesGeo, material);
      bristles.position.y = 0.55 * scale;
      bristles.castShadow = true;
      
      group.add(handle, bristles);
      return group;
    };

    const createConfettiParticles = (THREE, scene) => {
      const particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = 300;
      const positions = new Float32Array(particlesCount * 3);
      const colors = new Float32Array(particlesCount * 3);
      const sizes = new Float32Array(particlesCount);
      const rotations = new Float32Array(particlesCount * 3);

      const colorPalette = [
        new THREE.Color(0xcc0000), // Rojo
        new THREE.Color(0x0066cc), // Azul
        new THREE.Color(0x1a1a1a), // Negro
      ];

      for (let i = 0; i < particlesCount; i++) {
        // Posición inicial: desde arriba de la pantalla
        positions[i * 3] = (Math.random() - 0.5) * 50; // Ancho
        positions[i * 3 + 1] = 30 + Math.random() * 10; // Altura
        positions[i * 3 + 2] = (Math.random() - 0.5) * 25; // Profundidad

        // Color aleatorio de la paleta
        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        // Tamaños variados
        sizes[i] = 0.1 + Math.random() * 0.3;

        // Rotaciones iniciales
        rotations[i * 3] = Math.random() * Math.PI * 2;
        rotations[i * 3 + 1] = Math.random() * Math.PI * 2;
        rotations[i * 3 + 2] = Math.random() * Math.PI * 2;
      }

      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      particlesGeometry.setAttribute('rotation', new THREE.BufferAttribute(rotations, 3));

      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.25,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);

      // Velocidades y comportamientos para cada partícula
      particles.userData.velocities = [];
      particles.userData.rotationSpeeds = [];
      particles.userData.wobble = [];
      
      for (let i = 0; i < particlesCount; i++) {
        particles.userData.velocities.push({
          y: -0.03 - Math.random() * 0.04, // Velocidad de caída
          x: (Math.random() - 0.5) * 0.015, // Movimiento horizontal
          z: (Math.random() - 0.5) * 0.01, // Movimiento en profundidad
          spinX: (Math.random() - 0.5) * 0.02, // Rotación X
          spinY: (Math.random() - 0.5) * 0.02, // Rotación Y
          spinZ: (Math.random() - 0.5) * 0.02, // Rotación Z
        });
        
        particles.userData.rotationSpeeds.push({
          x: (Math.random() - 0.5) * 0.05,
          y: (Math.random() - 0.5) * 0.05,
          z: (Math.random() - 0.5) * 0.05,
        });
        
        particles.userData.wobble.push({
          amplitude: Math.random() * 0.5,
          speed: 1 + Math.random() * 2,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const animate = (THREE) => {
      if (!mountedRef.current) return;

      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000;

      // Animar partículas confetti (solo después del login)
      if (particles && showParticles) {
        const positions = particles.geometry.attributes.position.array;
        const rotations = particles.geometry.attributes.rotation.array;
        const velocities = particles.userData.velocities;
        const rotationSpeeds = particles.userData.rotationSpeeds;
        const wobbles = particles.userData.wobble;

        for (let i = 0; i < positions.length / 3; i++) {
          const idx = i * 3;
          
          // Actualizar posición con caída y bamboleo
          positions[idx + 1] += velocities[i].y;
          positions[idx] += velocities[i].x + Math.sin(elapsed * wobbles[i].speed + wobbles[i].phase) * wobbles[i].amplitude * 0.01;
          positions[idx + 2] += velocities[i].z;
          
          // Actualizar rotación
          rotations[idx] += rotationSpeeds[i].x + velocities[i].spinX;
          rotations[idx + 1] += rotationSpeeds[i].y + velocities[i].spinY;
          rotations[idx + 2] += rotationSpeeds[i].z + velocities[i].spinZ;
          
          // Reiniciar partícula cuando cae fuera de la pantalla
          if (positions[idx + 1] < -15) {
            positions[idx + 1] = 30 + Math.random() * 10;
            positions[idx] = (Math.random() - 0.5) * 50;
            positions[idx + 2] = (Math.random() - 0.5) * 25;
          }
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.rotation.needsUpdate = true;
      }

      // Animar herramientas volando
      if (toolsFlying && toolsArray.length > 0) {
        toolsArray.forEach((tool) => {
          if (tool.visible) {
            const vel = tool.userData.velocity;
            const userData = tool.userData;
            
            // Movimiento con gravedad
            tool.position.x += vel.x;
            tool.position.y += vel.y;
            tool.position.z += vel.z;
            
            // Gravedad
            vel.y -= 0.006;
            
            // Rotación dramática
            tool.rotation.x += vel.rotX;
            tool.rotation.y += vel.rotY;
            tool.rotation.z += vel.rotZ;
            
            // Efecto de bamboleo
            const wiggleTime = elapsed * userData.wiggleSpeed;
            tool.position.y += Math.sin(wiggleTime) * userData.wiggleAmount;
            
            // Rotación adicional
            tool.rotation.z += Math.sin(wiggleTime * 1.3) * 0.02;
            
            // Rebote suave en el "suelo"
            if (tool.position.y < -5) {
              tool.position.y = -4.9;
              vel.y = Math.abs(vel.y) * 0.6; // Rebote con pérdida de energía
              vel.x *= 0.9;
              vel.z *= 0.9;
            }
          }
        });
      }

      // Animar maletín
      if (animationPhase === 'falling') {
        const fallProgress = Math.min(elapsed / 1.8, 1);
        const easeOut = 1 - Math.pow(1 - fallProgress, 4);
        
        briefcaseGroup.position.y = 15 - easeOut * 14;
        briefcaseGroup.rotation.x = 0.15 + easeOut * 0.25;
        briefcaseGroup.rotation.y = -0.1 + Math.sin(elapsed * 2.5) * 0.15 * (1 - easeOut);
        
        // Ligeros movimientos durante la caída
        briefcaseGroup.position.x = Math.sin(elapsed * 3) * 0.2 * (1 - easeOut);

        if (fallProgress >= 1) {
          animationPhase = 'bounce';
          startTime = currentTime;
        }
      } else if (animationPhase === 'bounce') {
        const bounceProgress = Math.min(elapsed / 0.6, 1);
        const bounce = Math.sin(bounceProgress * Math.PI * 4) * 0.4 * (1 - bounceProgress);
        briefcaseGroup.position.y = bounce;

        // Rotación durante el rebote
        briefcaseGroup.rotation.y += Math.sin(elapsed * 10) * 0.02;

        if (bounceProgress >= 1) {
          animationPhase = 'openLid';
          startTime = currentTime;
        }
      } else if (animationPhase === 'openLid') {
        const openProgress = Math.min(elapsed / 0.8, 1);
        
        // Animar apertura de tapa
        lidGroup.rotation.x = 0.1 - openProgress * 1.3;
        lidGroup.position.y = 2.2 + openProgress * 0.3;
        lidGroup.position.z = openProgress * 0.5;

        if (openProgress >= 1) {
          animationPhase = 'releaseTools';
          startTime = currentTime;
          
          // Hacer visibles las herramientas y activar animación
          toolsArray.forEach(tool => {
            tool.visible = true;
          });
          setToolsFlying(true);
        }
      } else if (animationPhase === 'releaseTools') {
        const releaseProgress = Math.min(elapsed / 2.0, 1);
        
        if (releaseProgress >= 1) {
          animationPhase = 'hideBriefcase';
          startTime = currentTime;
        }
      } else if (animationPhase === 'hideBriefcase') {
        const hideProgress = Math.min(elapsed / 0.9, 1);
        const easeIn = Math.pow(hideProgress, 2);

        // Desvanecer maletín
        briefcaseGroup.scale.setScalar(1 - easeIn * 0.5);
        briefcaseGroup.traverse((child) => {
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = Math.max(0, 1 - easeIn * 1.5);
          }
        });

        // Desvanecer herramientas
        toolsArray.forEach((tool) => {
          tool.traverse((child) => {
            if (child.material) {
              child.material.transparent = true;
              child.material.opacity = Math.max(0, 1 - easeIn * 1.8);
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
        const showProgress = Math.min(elapsed / 0.9, 1);

        if (showProgress >= 0.3 && !showContent) {
          setShowContent(true);
        }

        if (showProgress >= 0.5 && !showParticles) {
          createConfettiParticles(THREE, scene);
          setShowParticles(true);
        }

        if (showProgress >= 1) {
          animationPhase = 'complete';
          if (onAnimationComplete) onAnimationComplete();
        }
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
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
    overflow: 'hidden',
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
    pointerEvents: 'auto',
  },
});

export default AnimatedBriefcaseWeb;