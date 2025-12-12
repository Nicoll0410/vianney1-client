// screens/login/AnimatedBriefcaseMobile.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AnimatedBriefcaseMobile = ({ onAnimationComplete, children }) => {
  const [showContent, setShowContent] = useState(false);
  const [hideCase, setHideCase] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showTools, setShowTools] = useState(false);

  // Valores animados del maletín
  const briefcaseY = useRef(new Animated.Value(-screenHeight)).current;
  const briefcaseRotate = useRef(new Animated.Value(0)).current;
  const briefcaseScale = useRef(new Animated.Value(0.6)).current; // MÁS PEQUEÑO
  const briefcaseOpacity = useRef(new Animated.Value(1)).current;
  const lidRotate = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(50)).current;

  // Herramientas que vuelan
  const toolsRef = useRef([]);
  const particlesRef = useRef([]);
  const particleCount = 25;

  // Inicializar herramientas
  useEffect(() => {
    toolsRef.current = [
      // Tijeras doradas
      { x: new Animated.Value(screenWidth / 2 - 140), y: new Animated.Value(screenHeight * 0.25), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'gold', type: 'scissors' },
      // Tijeras plateadas
      { x: new Animated.Value(screenWidth / 2 - 100), y: new Animated.Value(screenHeight * 0.25), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'silver', type: 'scissors' },
      // Navaja dorada
      { x: new Animated.Value(screenWidth / 2 - 130), y: new Animated.Value(screenHeight * 0.25), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'gold', type: 'razor' },
      // Navaja plateada
      { x: new Animated.Value(screenWidth / 2 - 110), y: new Animated.Value(screenHeight * 0.25), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'silver', type: 'razor' },
      // Peine dorado
      { x: new Animated.Value(screenWidth / 2 - 125), y: new Animated.Value(screenHeight * 0.25), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'gold', type: 'comb' },
      // Peine plateado
      { x: new Animated.Value(screenWidth / 2 - 115), y: new Animated.Value(screenHeight * 0.25), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'silver', type: 'comb' },
    ];
  }, []);

  const animateToolsFlying = () => {
    const animations = toolsRef.current.map((tool, index) => {
      const randomX = (Math.random() - 0.5) * screenWidth * 0.8;
      const randomRotate = Math.random() * 720 - 360;
      
      return Animated.parallel([
        Animated.timing(tool.opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(tool.x, {
              toValue: tool.x._value + randomX,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(tool.y, {
              toValue: -100 + Math.random() * screenHeight * 0.3,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(tool.rotate, {
              toValue: randomRotate,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(tool.opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.stagger(80, animations).start();
  };

  const animateParticles = () => {
    particlesRef.current.forEach((particle, index) => {
      const duration = 3000 + Math.random() * 2000;
      const delay = index * 100;

      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(particle.y, {
              toValue: screenHeight + 50,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(particle.x, {
              toValue: particle.x._value + (Math.random() - 0.5) * 100,
              duration: duration,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.y, {
            toValue: -50,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  useEffect(() => {
    Animated.sequence([
      // 1. Caída
      Animated.parallel([
        Animated.timing(briefcaseY, {
          toValue: screenHeight * 0.25,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(briefcaseRotate, {
          toValue: 360,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),

      // 2. Rebote
      Animated.spring(briefcaseY, {
        toValue: screenHeight * 0.22,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),

      // 3. Pausa antes de soltar herramientas
      Animated.delay(300),
    ]).start(() => {
      // Soltar herramientas
      setShowTools(true);
      animateToolsFlying();

      // Esperar que las herramientas vuelen, luego ocultar maletín
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(briefcaseScale, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(briefcaseOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setHideCase(true);
          
          // Mostrar login
          setTimeout(() => {
            setShowContent(true);
            Animated.parallel([
              Animated.timing(contentOpacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(contentTranslateY, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
              }),
            ]).start();

            // Iniciar partículas DESPUÉS del login
            setTimeout(() => {
              particlesRef.current = Array.from({ length: particleCount }, () => ({
                x: new Animated.Value(Math.random() * screenWidth),
                y: new Animated.Value(-Math.random() * 100),
                opacity: new Animated.Value(0.8),
                color: ['#0066cc', '#cc0000', '#1a1a1a'][Math.floor(Math.random() * 3)],
              }));
              setShowParticles(true);
              animateParticles();
            }, 500);

            if (onAnimationComplete) onAnimationComplete();
          }, 400);
        });
      }, 1300);
    });
  }, []);

  const rotateInterpolate = briefcaseRotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Partículas SOLO después del login */}
      {showParticles &&
        particlesRef.current.map((particle, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                backgroundColor: particle.color,
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                ],
                opacity: particle.opacity,
              },
            ]}
          />
        ))}

      {/* Maletín MÁS PEQUEÑO */}
      {!hideCase && (
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
              {[...Array(30)].map((_, i) => {
                const angle = (i / 30) * Math.PI * 2;
                const radius = 110;
                const x = 120 + Math.cos(angle) * radius;
                const y = 70 + Math.sin(angle) * (radius * 0.55);
                return (
                  <View
                    key={i}
                    style={[styles.stitch, { left: x - 2, top: y - 2 }]}
                  />
                );
              })}
            </View>

            {/* Esquinas */}
            {[styles.cornerTL, styles.cornerTR, styles.cornerBL, styles.cornerBR].map((cornerStyle, i) => (
              <View key={i} style={[styles.corner, cornerStyle]}>
                <View style={[styles.rivet, styles.rivetTL]} />
                <View style={[styles.rivet, styles.rivetTR]} />
                <View style={[styles.rivet, styles.rivetBL]} />
                <View style={[styles.rivet, styles.rivetBR]} />
              </View>
            ))}

            {/* Manija */}
            <View style={styles.handleContainer}>
              <View style={styles.handleSupport} />
              <View style={[styles.handleSupport, { right: 60 }]} />
              <View style={styles.handle} />
            </View>

            {/* Cerradura */}
            <View style={styles.lockContainer}>
              <View style={styles.lock} />
              <View style={styles.lockLatch} />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Herramientas volando */}
      {showTools &&
        toolsRef.current.map((tool, index) => (
          <Animated.View
            key={index}
            style={[
              styles.toolFlying,
              {
                transform: [
                  { translateX: tool.x },
                  { translateY: tool.y },
                  { rotate: tool.rotate.interpolate({
                    inputRange: [-360, 360],
                    outputRange: ['-360deg', '360deg'],
                  })},
                ],
                opacity: tool.opacity,
              },
            ]}
          >
            {tool.type === 'scissors' && (
              <View style={styles.scissors}>
                <View style={[styles.scissorBlade, tool.color === 'gold' ? styles.goldTool : styles.silverTool]} />
                <View style={[styles.scissorBlade, tool.color === 'gold' ? styles.goldTool : styles.silverTool, { transform: [{ rotate: '20deg' }] }]} />
              </View>
            )}
            {tool.type === 'razor' && (
              <View style={[styles.razor, tool.color === 'gold' ? styles.goldTool : styles.silverTool]} />
            )}
            {tool.type === 'comb' && (
              <View style={[styles.comb, tool.color === 'gold' ? styles.darkGoldTool : styles.darkSilverTool]}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={[styles.combTooth, tool.color === 'gold' ? styles.darkGoldTool : styles.darkSilverTool]} />
                ))}
              </View>
            )}
          </Animated.View>
        ))}

      {/* Contenido (Login) */}
      {showContent && (
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  briefcaseContainer: {
    position: 'absolute',
    left: screenWidth / 2 - 120,
    width: 240,
    height: 180,
  },
  briefcaseBody: {
    width: '100%',
    height: 140,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 15,
  },
  stitchingContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  stitch: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e8e8e8',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    backgroundColor: '#c8c8c8',
    borderWidth: 1,
    borderColor: '#999',
  },
  cornerTL: { top: 5, left: 5, borderTopLeftRadius: 6 },
  cornerTR: { top: 5, right: 5, borderTopRightRadius: 6 },
  cornerBL: { bottom: 5, left: 5, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 5, right: 5, borderBottomRightRadius: 6 },
  rivet: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#888',
  },
  rivetTL: { top: 4, left: 4 },
  rivetTR: { top: 4, right: 4 },
  rivetBL: { bottom: 4, left: 4 },
  rivetBR: { bottom: 4, right: 4 },
  handleContainer: {
    position: 'absolute',
    top: -25,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  handleSupport: {
    position: 'absolute',
    left: 60,
    width: 15,
    height: 20,
    backgroundColor: '#c8c8c8',
    borderRadius: 3,
    top: 0,
  },
  handle: {
    width: 100,
    height: 18,
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#c8c8c8',
  },
  lockContainer: {
    position: 'absolute',
    bottom: 15,
    left: '50%',
    marginLeft: -15,
    alignItems: 'center',
  },
  lock: {
    width: 30,
    height: 14,
    backgroundColor: '#c8c8c8',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#999',
  },
  lockLatch: {
    width: 10,
    height: 8,
    backgroundColor: '#c8c8c8',
    borderRadius: 2,
    marginTop: -4,
  },
  toolFlying: {
    position: 'absolute',
    width: 40,
    height: 40,
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
  scissors: {
    width: 30,
    height: 30,
  },
  scissorBlade: {
    width: 3,
    height: 25,
    position: 'absolute',
    left: 13,
    borderRadius: 2,
  },
  razor: {
    width: 4,
    height: 30,
    borderRadius: 2,
  },
  comb: {
    width: 25,
    height: 6,
    borderRadius: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  combTooth: {
    width: 2,
    height: 8,
  },
  contentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 80,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
});

export default AnimatedBriefcaseMobile;