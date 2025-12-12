// screens/login/AnimatedBriefcaseMobile.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AnimatedBriefcaseMobile = ({ onAnimationComplete, children }) => {
  const [showContent, setShowContent] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lidOpen, setLidOpen] = useState(false);

  // Animaciones del maletín
  const briefcaseY = useRef(new Animated.Value(-screenHeight)).current;
  const briefcaseRotate = useRef(new Animated.Value(0)).current;
  const briefcaseScale = useRef(new Animated.Value(0.5)).current;
  const briefcaseOpacity = useRef(new Animated.Value(1)).current;
  const lidRotate = useRef(new Animated.Value(0)).current;
  const lidTranslateY = useRef(new Animated.Value(0)).current;
  
  // Animaciones del contenido
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.9)).current;

  // Ref para herramientas y confeti
  const toolsRef = useRef([]);
  const confettiRef = useRef([]);
  const confettiCount = 60;

  // Posición del maletín para referencia de las herramientas
  const briefcasePosition = useRef({
    x: screenWidth / 2 - 60,
    y: screenHeight * 0.28
  });

  // Inicializar confetti
  useEffect(() => {
    confettiRef.current = Array.from({ length: confettiCount }, (_, i) => ({
      x: new Animated.Value(Math.random() * screenWidth),
      y: new Animated.Value(-Math.random() * 50),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(0),
      color: ['#cc0000', '#0066cc', '#1a1a1a'][Math.floor(Math.random() * 3)],
      size: 6 + Math.random() * 8,
      speed: 1 + Math.random() * 2,
      wobble: Math.random() * 20 - 10,
    }));
  }, []);

  const startConfetti = () => {
    setShowConfetti(true);
    
    confettiRef.current.forEach((particle, index) => {
      const delay = index * 30;
      
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 0.9,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: screenHeight + 50,
            duration: 2000 + Math.random() * 1000,
            easing: Easing.bezier(0.3, 0, 0.7, 1),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
      
      Animated.loop(
        Animated.timing(particle.rotate, {
          toValue: 1,
          duration: 1000 + Math.random() * 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });
  };

  const animateToolsFromBriefcase = () => {
    if (!lidOpen) return;
    
    // Posición de la abertura del maletín (centro del maletín abierto)
    const briefcaseCenterX = briefcasePosition.current.x + 60; // centro horizontal
    const briefcaseCenterY = briefcasePosition.current.y + 45; // parte superior donde sale
    
    // Crear herramientas que salen DIRECTAMENTE del maletín
    toolsRef.current = [
      // Tijeras - SALEN del centro
      { 
        x: new Animated.Value(briefcaseCenterX - 25), 
        y: new Animated.Value(briefcaseCenterY - 10),
        startX: briefcaseCenterX - 25,
        startY: briefcaseCenterY - 10,
        rotate: new Animated.Value(0), 
        scale: new Animated.Value(1), 
        opacity: new Animated.Value(0),
        type: 'scissors', 
        color: 'gold', 
        size: 1.0 
      },
      { 
        x: new Animated.Value(briefcaseCenterX + 25), 
        y: new Animated.Value(briefcaseCenterY - 10),
        startX: briefcaseCenterX + 25,
        startY: briefcaseCenterY - 10,
        rotate: new Animated.Value(0), 
        scale: new Animated.Value(1), 
        opacity: new Animated.Value(0),
        type: 'scissors', 
        color: 'silver', 
        size: 1.0 
      },
      
      // Navajas - SALEN ligeramente abajo
      { 
        x: new Animated.Value(briefcaseCenterX - 15), 
        y: new Animated.Value(briefcaseCenterY + 5),
        startX: briefcaseCenterX - 15,
        startY: briefcaseCenterY + 5,
        rotate: new Animated.Value(0), 
        scale: new Animated.Value(1), 
        opacity: new Animated.Value(0),
        type: 'razor', 
        color: 'gold', 
        size: 0.9 
      },
      { 
        x: new Animated.Value(briefcaseCenterX + 15), 
        y: new Animated.Value(briefcaseCenterY + 5),
        startX: briefcaseCenterX + 15,
        startY: briefcaseCenterY + 5,
        rotate: new Animated.Value(0), 
        scale: new Animated.Value(1), 
        opacity: new Animated.Value(0),
        type: 'razor', 
        color: 'silver', 
        size: 0.9 
      },
      
      // Peines - SALEN de los lados
      { 
        x: new Animated.Value(briefcaseCenterX - 35), 
        y: new Animated.Value(briefcaseCenterY),
        startX: briefcaseCenterX - 35,
        startY: briefcaseCenterY,
        rotate: new Animated.Value(0), 
        scale: new Animated.Value(1), 
        opacity: new Animated.Value(0),
        type: 'comb', 
        color: 'gold', 
        size: 0.8 
      },
      { 
        x: new Animated.Value(briefcaseCenterX + 35), 
        y: new Animated.Value(briefcaseCenterY),
        startX: briefcaseCenterX + 35,
        startY: briefcaseCenterY,
        rotate: new Animated.Value(0), 
        scale: new Animated.Value(1), 
        opacity: new Animated.Value(0),
        type: 'comb', 
        color: 'silver', 
        size: 0.8 
      },
    ];

    // Animación de salida DESDE EL MALETÍN
    const animations = toolsRef.current.map((tool, index) => {
      // Direcciones de salida radial desde el centro del maletín
      const angle = (index / toolsRef.current.length) * Math.PI * 2;
      const distance = 120 + Math.random() * 80; // Distancia de vuelo
      const targetX = tool.startX + Math.cos(angle) * distance;
      const targetY = tool.startY - Math.abs(Math.sin(angle)) * distance - 50; // Vuelan más hacia arriba
      const rotation = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360);
      
      return Animated.sequence([
        Animated.delay(index * 120), // Retraso escalonado
        Animated.parallel([
          // Aparecer en el maletín
          Animated.timing(tool.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          // Salir volando del maletín
          Animated.timing(tool.x, {
            toValue: targetX,
            duration: 1000,
            easing: Easing.out(Easing.back(1.8)),
            useNativeDriver: true,
          }),
          Animated.timing(tool.y, {
            toValue: targetY,
            duration: 1000,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(tool.rotate, {
            toValue: rotation,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(400),
        // Desvanecer en el aire
        Animated.timing(tool.opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(100, animations).start();
  };

  useEffect(() => {
    // Secuencia de animación completa
    Animated.sequence([
      // 1. Caída
      Animated.parallel([
        Animated.timing(briefcaseY, {
          toValue: briefcasePosition.current.y,
          duration: 1800,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(briefcaseRotate, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),

      // 2. Rebote final
      Animated.spring(briefcaseY, {
        toValue: briefcasePosition.current.y - 10,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),

      // 3. Pausa
      Animated.delay(400),

      // 4. Abrir tapa
      Animated.parallel([
        Animated.timing(lidRotate, {
          toValue: -60,
          duration: 700,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(lidTranslateY, {
          toValue: -10,
          duration: 700,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),

      // 5. Pausa antes de soltar herramientas
      Animated.delay(300),
    ]).start(() => {
      // Marcar tapa como abierta
      setLidOpen(true);
      
      // Pequeña pausa dramática
      setTimeout(() => {
        // Activar animación de herramientas QUE SALEN DEL MALETÍN
        setShowTools(true);
        animateToolsFromBriefcase();

        // Ocultar maletín después de que salgan las herramientas
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(briefcaseScale, {
              toValue: 0,
              duration: 600,
              easing: Easing.in(Easing.back(2)),
              useNativeDriver: true,
            }),
            Animated.timing(briefcaseOpacity, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]).start();

          // Mostrar contenido del login
          setTimeout(() => {
            setShowContent(true);
            
            Animated.parallel([
              Animated.timing(contentOpacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.spring(contentScale, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
              }),
            ]).start();

            // Iniciar confetti DESPUÉS de mostrar el login
            setTimeout(() => {
              startConfetti();
              if (onAnimationComplete) onAnimationComplete();
            }, 300);
          }, 400);
        }, 1800); // Tiempo suficiente para que las herramientas salgan y vuelen
      }, 500);
    });
  }, []);

  // Interpolaciones
  const rotateInterpolate = briefcaseRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const lidRotateInterpolate = lidRotate.interpolate({
    inputRange: [0, -60],
    outputRange: ['0deg', '-60deg'],
  });

  return (
    <TouchableWithoutFeedback>
      <View style={styles.container}>
        {/* Confetti */}
        {showConfetti && confettiRef.current.map((particle, index) => (
          <Animated.View
            key={`confetti-${index}`}
            style={[
              styles.confetti,
              {
                backgroundColor: particle.color,
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 4,
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { 
                    rotate: particle.rotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  },
                ],
                opacity: particle.opacity,
              },
            ]}
          />
        ))}

        {/* Maletín */}
        <Animated.View
          style={[
            styles.briefcaseContainer,
            {
              transform: [
                { translateY: briefcaseY },
                { rotate: rotateInterpolate },
                { scale: briefcaseScale },
              ],
              opacity: briefcaseOpacity,
            },
          ]}
        >
          <View style={styles.briefcaseBody}>
            {/* Costuras */}
            <View style={styles.stitchingContainer}>
              {[...Array(24)].map((_, i) => {
                const angle = (i / 24) * Math.PI * 2;
                const radius = 55;
                const x = 60 + Math.cos(angle) * radius;
                const y = 45 + Math.sin(angle) * (radius * 0.6);
                return (
                  <View
                    key={`stitch-${i}`}
                    style={[
                      styles.stitch,
                      {
                        left: x,
                        top: y,
                      },
                    ]}
                  />
                );
              })}
            </View>

            {/* Esquinas */}
            {[
              { top: 5, left: 5, borderTopLeftRadius: 8 },
              { top: 5, right: 5, borderTopRightRadius: 8 },
              { bottom: 5, left: 5, borderBottomLeftRadius: 8 },
              { bottom: 5, right: 5, borderBottomRightRadius: 8 },
            ].map((cornerStyle, i) => (
              <View key={`corner-${i}`} style={[styles.corner, cornerStyle]} />
            ))}

            {/* Manija */}
            <View style={styles.handleContainer}>
              <View style={[styles.handleSupport, { left: 35 }]} />
              <View style={[styles.handleSupport, { right: 35 }]} />
              <View style={styles.handle} />
            </View>

            {/* Tapa animada */}
            <Animated.View
              style={[
                styles.lid,
                {
                  transform: [
                    { rotate: lidRotateInterpolate },
                    { translateY: lidTranslateY },
                  ],
                },
              ]}
            >
              <View style={styles.lidContent} />
            </Animated.View>

            {/* INTERIOR DEL MALETÍN (visible cuando se abre) */}
            {lidOpen && (
              <View style={styles.briefcaseInterior}>
                <View style={styles.interiorFabric} />
              </View>
            )}
          </View>
        </Animated.View>

        {/* Herramientas SALIENDO DEL MALETÍN */}
        {showTools && toolsRef.current.map((tool, index) => (
          <Animated.View
            key={`tool-${index}`}
            style={[
              styles.toolContainer,
              {
                position: 'absolute',
                width: 50 * (tool.size || 1),
                height: 50 * (tool.size || 1),
                transform: [
                  { translateX: tool.x },
                  { translateY: tool.y },
                  { 
                    rotate: tool.rotate.interpolate({
                      inputRange: [-360, 360],
                      outputRange: ['-360deg', '360deg'],
                    })
                  },
                  { scale: tool.scale },
                ],
                opacity: tool.opacity,
              },
            ]}
          >
            {tool.type === 'scissors' && (
              <View style={[
                styles.scissors,
                tool.color === 'gold' ? styles.goldTool : styles.silverTool
              ]}>
                <View style={[styles.scissorBlade, { transform: [{ rotate: '15deg' }] }]} />
                <View style={[styles.scissorBlade, { transform: [{ rotate: '-15deg' }] }]} />
                <View style={[styles.scissorHandle, 
                  tool.color === 'gold' ? styles.darkGoldTool : styles.darkSilverTool
                ]} />
              </View>
            )}
            
            {tool.type === 'razor' && (
              <View style={[
                styles.razor,
                tool.color === 'gold' ? styles.goldTool : styles.silverTool
              ]}>
                <View style={styles.razorBlade} />
                <View style={[
                  styles.razorHandle,
                  tool.color === 'gold' ? styles.darkGoldTool : styles.darkSilverTool
                ]} />
              </View>
            )}
            
            {tool.type === 'comb' && (
              <View style={[
                styles.comb,
                tool.color === 'gold' ? styles.darkGoldTool : styles.darkSilverTool
              ]}>
                {[...Array(8)].map((_, i) => (
                  <View key={`tooth-${i}`} style={styles.combTooth} />
                ))}
              </View>
            )}
          </Animated.View>
        ))}

        {/* Contenido del Login */}
        {showContent && (
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: contentOpacity,
                transform: [{ scale: contentScale }],
              },
            ]}
          >
            {children}
          </Animated.View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  briefcaseContainer: {
    position: 'absolute',
    left: screenWidth / 2 - 60,
    top: screenHeight * 0.1,
    width: 120,
    height: 90,
    zIndex: 100,
  },
  briefcaseBody: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  stitchingContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  stitch: {
    position: 'absolute',
    width: 4,
    height: 2,
    backgroundColor: '#e8e8e8',
    borderRadius: 1,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#c8c8c8',
    borderWidth: 1,
    borderColor: '#999',
  },
  handleContainer: {
    position: 'absolute',
    top: -18,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  handleSupport: {
    position: 'absolute',
    width: 12,
    height: 16,
    backgroundColor: '#c8c8c8',
    borderRadius: 2,
    top: 0,
  },
  handle: {
    width: 60,
    height: 14,
    backgroundColor: '#0f0f0f',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#c8c8c8',
  },
  lid: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    height: 20,
    transformOrigin: 'center bottom',
    zIndex: 2,
  },
  lidContent: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  briefcaseInterior: {
    position: 'absolute',
    top: 20,
    left: 5,
    right: 5,
    bottom: 5,
    backgroundColor: '#2a2a2a',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
    zIndex: 1,
  },
  interiorFabric: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#3a3a3a',
    opacity: 0.7,
  },
  toolContainer: {
    position: 'absolute',
    zIndex: 90, // Debajo del maletín cuando sale
  },
  scissors: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scissorBlade: {
    position: 'absolute',
    width: 3,
    height: 25,
    borderRadius: 1.5,
  },
  scissorHandle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 2,
    position: 'absolute',
    bottom: 0,
  },
  razor: {
    width: 30,
    height: 40,
    alignItems: 'center',
  },
  razorBlade: {
    width: 4,
    height: 25,
    borderRadius: 2,
  },
  razorHandle: {
    width: 12,
    height: 15,
    borderRadius: 3,
    marginTop: 5,
  },
  comb: {
    width: 25,
    height: 30,
    borderRadius: 3,
    paddingHorizontal: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  combTooth: {
    width: 1.5,
    height: 12,
    backgroundColor: '#fff',
  },
  goldTool: {
    backgroundColor: '#ffd700',
  },
  silverTool: {
    backgroundColor: '#e8e8e8',
  },
  darkGoldTool: {
    backgroundColor: '#b8860b',
  },
  darkSilverTool: {
    backgroundColor: '#a8a8a8',
  },
  confetti: {
    position: 'absolute',
    zIndex: 20,
  },
  contentContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AnimatedBriefcaseMobile;