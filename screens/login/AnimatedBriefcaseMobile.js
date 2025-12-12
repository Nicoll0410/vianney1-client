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

  // Animaciones del maletín (más pequeño para móvil)
  const briefcaseY = useRef(new Animated.Value(-screenHeight)).current;
  const briefcaseRotate = useRef(new Animated.Value(0)).current;
  const briefcaseScale = useRef(new Animated.Value(0.5)).current; // MÁS PEQUEÑO
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
      
      // Secuencia de animación para cada partícula
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          // Aparecer
          Animated.timing(particle.opacity, {
            toValue: 0.9,
            duration: 200,
            useNativeDriver: true,
          }),
          // Caer con bamboleo
          Animated.timing(particle.y, {
            toValue: screenHeight + 50,
            duration: 2000 + Math.random() * 1000,
            easing: Easing.bezier(0.3, 0, 0.7, 1),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
      
      // Rotación continua
      Animated.loop(
        Animated.timing(particle.rotate, {
          toValue: 1,
          duration: 1000 + Math.random() * 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
      
      // Bamboleo lateral
      if (particle.wobble !== 0) {
        const wobbleAnim = new Animated.Value(0);
        Animated.loop(
          Animated.sequence([
            Animated.timing(wobbleAnim, {
              toValue: 1,
              duration: 1000 / particle.speed,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(wobbleAnim, {
              toValue: 0,
              duration: 1000 / particle.speed,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();
        
        particle.x = wobbleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [particle.x._value, particle.x._value + particle.wobble],
        });
      }
    });
  };

  const animateTools = () => {
    // Posiciones iniciales dentro del maletín
    const centerX = screenWidth / 2 - 30;
    const centerY = screenHeight * 0.3;
    
    toolsRef.current = [
      // Tijeras
      { x: new Animated.Value(centerX - 15), y: new Animated.Value(centerY), 
        rotate: new Animated.Value(0), scale: new Animated.Value(0), opacity: new Animated.Value(0),
        type: 'scissors', color: 'gold', size: 1.2 },
      { x: new Animated.Value(centerX + 15), y: new Animated.Value(centerY), 
        rotate: new Animated.Value(0), scale: new Animated.Value(0), opacity: new Animated.Value(0),
        type: 'scissors', color: 'silver', size: 1.2 },
      
      // Navajas
      { x: new Animated.Value(centerX - 5), y: new Animated.Value(centerY + 20), 
        rotate: new Animated.Value(0), scale: new Animated.Value(0), opacity: new Animated.Value(0),
        type: 'razor', color: 'gold', size: 1.1 },
      { x: new Animated.Value(centerX + 5), y: new Animated.Value(centerY + 20), 
        rotate: new Animated.Value(0), scale: new Animated.Value(0), opacity: new Animated.Value(0),
        type: 'razor', color: 'silver', size: 1.1 },
      
      // Peines
      { x: new Animated.Value(centerX - 25), y: new Animated.Value(centerY - 10), 
        rotate: new Animated.Value(0), scale: new Animated.Value(0), opacity: new Animated.Value(0),
        type: 'comb', color: 'gold', size: 1.0 },
      { x: new Animated.Value(centerX + 25), y: new Animated.Value(centerY - 10), 
        rotate: new Animated.Value(0), scale: new Animated.Value(0), opacity: new Animated.Value(0),
        type: 'comb', color: 'silver', size: 1.0 },
    ];

    // Animación de salida de herramientas
    const animations = toolsRef.current.map((tool, index) => {
      const angle = (index / toolsRef.current.length) * Math.PI * 2;
      const distance = 150 + Math.random() * 100;
      const targetX = centerX + Math.cos(angle) * distance;
      const targetY = centerY + Math.sin(angle) * distance;
      const rotation = Math.random() * 720 - 360;
      
      return Animated.sequence([
        Animated.delay(index * 100),
        Animated.parallel([
          // Escalar y aparecer
          Animated.timing(tool.scale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(tool.opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          // Volar hacia afuera
          Animated.timing(tool.x, {
            toValue: targetX,
            duration: 800,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(tool.y, {
            toValue: targetY,
            duration: 800,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(tool.rotate, {
            toValue: rotation,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(300),
        // Desvanecer
        Animated.timing(tool.opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(80, animations).start();
  };

  useEffect(() => {
    // Secuencia de animación completa
    Animated.sequence([
      // 1. Caída con estilo
      Animated.parallel([
        Animated.timing(briefcaseY, {
          toValue: screenHeight * 0.3,
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
        toValue: screenHeight * 0.28,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),

      // 3. Pausa dramática
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

      // 5. Soltar herramientas
      Animated.delay(300),
    ]).start(() => {
      // Activar animación de herramientas
      setShowTools(true);
      animateTools();

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
          
          // Animación de entrada del login
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
      }, 1500);
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

        {/* Maletín (más pequeño) */}
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
          {/* Cuerpo principal */}
          <View style={styles.briefcaseBody}>
            {/* Textura de cuero */}
            <View style={styles.leatherTexture}>
              {[...Array(8)].map((_, i) => (
                <View key={`grain-${i}`} style={styles.leatherGrain} />
              ))}
            </View>

            {/* Costuras detalladas */}
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
                        transform: [{ rotate: `${angle}rad` }],
                      },
                    ]}
                  />
                );
              })}
            </View>

            {/* Esquinas metálicas */}
            {[
              { top: 5, left: 5, borderTopLeftRadius: 8 },
              { top: 5, right: 5, borderTopRightRadius: 8 },
              { bottom: 5, left: 5, borderBottomLeftRadius: 8 },
              { bottom: 5, right: 5, borderBottomRightRadius: 8 },
            ].map((cornerStyle, i) => (
              <View key={`corner-${i}`} style={[styles.corner, cornerStyle]}>
                <View style={styles.cornerInner}>
                  {[...Array(4)].map((_, j) => (
                    <View key={`rivet-${j}`} style={[
                      styles.rivet,
                      j === 0 && styles.rivetTL,
                      j === 1 && styles.rivetTR,
                      j === 2 && styles.rivetBL,
                      j === 3 && styles.rivetBR,
                    ]} />
                  ))}
                </View>
              </View>
            ))}

            {/* Manija */}
            <View style={styles.handleContainer}>
              <View style={[styles.handleSupport, { left: 35 }]} />
              <View style={[styles.handleSupport, { right: 35 }]} />
              <View style={styles.handle}>
                <View style={styles.handleGrip} />
              </View>
            </View>

            {/* Cerradura */}
            <View style={styles.lockContainer}>
              <View style={styles.lock}>
                <View style={styles.lockHole} />
              </View>
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
              <View style={styles.lidContent}>
                <View style={styles.lidStitching}>
                  {[...Array(12)].map((_, i) => (
                    <View key={`lid-stitch-${i}`} style={styles.lidStitch} />
                  ))}
                </View>
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Herramientas volando */}
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
                {[...Array(10)].map((_, i) => (
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
    left: screenWidth / 2 - 60, // MÁS PEQUEÑO
    top: screenHeight * 0.1,
    width: 120, // MÁS PEQUEÑO
    height: 90, // MÁS PEQUEÑO
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
  leatherTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  leatherGrain: {
    position: 'absolute',
    backgroundColor: '#2a2a2a',
    width: '100%',
    height: 1,
    top: Math.random() * 100,
    left: 0,
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
  cornerInner: {
    ...StyleSheet.absoluteFillObject,
  },
  rivet: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#888',
  },
  rivetTL: { top: 3, left: 3 },
  rivetTR: { top: 3, right: 3 },
  rivetBL: { bottom: 3, left: 3 },
  rivetBR: { bottom: 3, right: 3 },
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleGrip: {
    width: 40,
    height: 3,
    backgroundColor: '#c8c8c8',
    borderRadius: 1.5,
  },
  lockContainer: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    marginLeft: -10,
    alignItems: 'center',
  },
  lock: {
    width: 20,
    height: 10,
    backgroundColor: '#c8c8c8',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockHole: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
  },
  lid: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    height: 20,
    transformOrigin: 'center bottom',
  },
  lidContent: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  lidStitching: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  lidStitch: {
    width: 2,
    height: 4,
    backgroundColor: '#e8e8e8',
    borderRadius: 1,
  },
  toolContainer: {
    position: 'absolute',
    zIndex: 50,
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