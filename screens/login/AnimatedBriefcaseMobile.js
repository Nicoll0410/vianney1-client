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

  // Valores animados
  const briefcaseY = useRef(new Animated.Value(-screenHeight)).current;
  const briefcaseRotate = useRef(new Animated.Value(0)).current;
  const briefcaseScale = useRef(new Animated.Value(1)).current;
  const briefcaseOpacity = useRef(new Animated.Value(1)).current;
  const lidRotate = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(50)).current;

  // Partículas (se crean después)
  const particlesRef = useRef([]);
  const particleCount = 25;

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
    // Secuencia de animación
    Animated.sequence([
      // 1. Caída del maletín
      Animated.parallel([
        Animated.timing(briefcaseY, {
          toValue: screenHeight * 0.3,
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
        toValue: screenHeight * 0.25,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),

      // 3. Pausa
      Animated.delay(600),

      // 4. Abrir tapa
      Animated.timing(lidRotate, {
        toValue: -110,
        duration: 1200,
        useNativeDriver: true,
      }),

      // 5. Pausa y mostrar partículas + contenido
      Animated.delay(400),

      // 6. Mostrar contenido
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
      ]),

      // 7. Pausa
      Animated.delay(500),

      // 8. Ocultar maletín
      Animated.parallel([
        Animated.timing(briefcaseScale, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(briefcaseOpacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setHideCase(true);
      if (onAnimationComplete) onAnimationComplete();
    });

    // Mostrar partículas cuando se abre
    const particlesTimeout = setTimeout(() => {
      // Inicializar partículas
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: new Animated.Value(Math.random() * screenWidth),
        y: new Animated.Value(-Math.random() * 100),
        opacity: new Animated.Value(0.8),
        color: ['#0066cc', '#cc0000', '#1a1a1a'][Math.floor(Math.random() * 3)],
      }));
      setShowParticles(true);
      animateParticles();
    }, 3700); // Cuando la tapa se abre

    // Mostrar contenido
    const contentTimeout = setTimeout(() => {
      setShowContent(true);
    }, 4300);

    return () => {
      clearTimeout(particlesTimeout);
      clearTimeout(contentTimeout);
    };
  }, []);

  const rotateInterpolate = briefcaseRotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Partículas SOLO después de abrir */}
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

      {/* Maletín */}
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
          {/* Cuerpo del maletín */}
          <View style={styles.briefcaseBody}>
            {/* Costuras punteadas realistas */}
            <View style={styles.stitchingContainer}>
              {[...Array(40)].map((_, i) => {
                const angle = (i / 40) * Math.PI * 2;
                const radius = 110;
                const x = 120 + Math.cos(angle) * radius;
                const y = 70 + Math.sin(angle) * (radius * 0.55);
                return (
                  <View
                    key={i}
                    style={[
                      styles.stitch,
                      { left: x - 2, top: y - 2 },
                    ]}
                  />
                );
              })}
            </View>

            {/* Herramientas DORADAS Y PLATEADAS */}
            <View style={styles.toolsContainer}>
              {/* Tijeras DORADAS (izquierda) */}
              <View style={[styles.scissors, styles.goldTool, { left: '20%', top: '20%', transform: [{ rotate: '-30deg' }] }]}>
                <View style={[styles.scissorBlade, styles.goldTool]} />
                <View style={[styles.scissorBlade, styles.goldTool, { transform: [{ rotate: '20deg' }] }]} />
                <View style={[styles.scissorHandle, styles.darkGoldTool]} />
              </View>

              {/* Tijeras PLATEADAS (derecha) */}
              <View style={[styles.scissors, styles.silverTool, { right: '20%', top: '20%', transform: [{ rotate: '30deg' }] }]}>
                <View style={[styles.scissorBlade, styles.silverTool]} />
                <View style={[styles.scissorBlade, styles.silverTool, { transform: [{ rotate: '20deg' }] }]} />
                <View style={[styles.scissorHandle, styles.darkSilverTool]} />
              </View>

              {/* Navaja DORADA (izquierda) */}
              <View style={[styles.razor, styles.goldTool, { left: '8%', top: '50%' }]} />
              
              {/* Navaja PLATEADA (derecha) */}
              <View style={[styles.razor, styles.silverTool, { right: '8%', top: '50%' }]} />

              {/* Peine DORADO (izquierda) */}
              <View style={[styles.comb, styles.darkGoldTool, { left: '12%', bottom: '12%' }]}>
                {[...Array(8)].map((_, i) => (
                  <View key={i} style={[styles.combTooth, styles.darkGoldTool]} />
                ))}
              </View>

              {/* Peine PLATEADO (derecha) */}
              <View style={[styles.comb, styles.darkSilverTool, { right: '12%', bottom: '12%' }]}>
                {[...Array(8)].map((_, i) => (
                  <View key={i} style={[styles.combTooth, styles.darkSilverTool]} />
                ))}
              </View>

              {/* Máquina cortapelo (centro - dorado y plateado) */}
              <View style={styles.clipper}>
                <View style={[styles.clipperBody, styles.silverTool]} />
                <View style={[styles.clipperHead, styles.goldTool]} />
              </View>
            </View>

            {/* Esquinas plateadas con remaches */}
            <View style={[styles.corner, styles.cornerTL]}>
              <View style={[styles.rivet, styles.rivetTL]} />
              <View style={[styles.rivet, styles.rivetTR]} />
              <View style={[styles.rivet, styles.rivetBL]} />
              <View style={[styles.rivet, styles.rivetBR]} />
            </View>
            <View style={[styles.corner, styles.cornerTR]}>
              <View style={[styles.rivet, styles.rivetTL]} />
              <View style={[styles.rivet, styles.rivetTR]} />
              <View style={[styles.rivet, styles.rivetBL]} />
              <View style={[styles.rivet, styles.rivetBR]} />
            </View>
            <View style={[styles.corner, styles.cornerBL]}>
              <View style={[styles.rivet, styles.rivetTL]} />
              <View style={[styles.rivet, styles.rivetTR]} />
              <View style={[styles.rivet, styles.rivetBL]} />
              <View style={[styles.rivet, styles.rivetBR]} />
            </View>
            <View style={[styles.corner, styles.cornerBR]}>
              <View style={[styles.rivet, styles.rivetTL]} />
              <View style={[styles.rivet, styles.rivetTR]} />
              <View style={[styles.rivet, styles.rivetBL]} />
              <View style={[styles.rivet, styles.rivetBR]} />
            </View>

            {/* Manija mejorada */}
            <View style={styles.handleContainer}>
              <View style={styles.handleSupport} />
              <View style={[styles.handleSupport, { right: 60 }]} />
              <View style={styles.handle} />
              <View style={styles.handleStitching} />
            </View>

            {/* Cerradura */}
            <View style={styles.lockContainer}>
              <View style={styles.lock} />
              <View style={styles.lockLatch} />
            </View>
          </View>

          {/* Tapa (se abre) */}
          <Animated.View
            style={[
              styles.briefcaseLid,
              {
                transform: [
                  { translateY: -110 },
                  {
                    rotateX: lidRotate.interpolate({
                      inputRange: [-110, 0],
                      outputRange: ['-110deg', '0deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.corner, styles.cornerTL]}>
              <View style={[styles.rivet, styles.rivetTL]} />
              <View style={[styles.rivet, styles.rivetTR]} />
              <View style={[styles.rivet, styles.rivetBL]} />
              <View style={[styles.rivet, styles.rivetBR]} />
            </View>
            <View style={[styles.corner, styles.cornerTR]}>
              <View style={[styles.rivet, styles.rivetTL]} />
              <View style={[styles.rivet, styles.rivetTR]} />
              <View style={[styles.rivet, styles.rivetBL]} />
              <View style={[styles.rivet, styles.rivetBR]} />
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* Contenido (Login) - UNA SOLA VEZ */}
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
    backgroundColor: '#f0f0f0',
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
  briefcaseLid: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 35,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    transformOrigin: 'top',
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
  toolsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    padding: 10,
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
    position: 'absolute',
    width: 40,
    height: 40,
  },
  scissorBlade: {
    width: 3,
    height: 30,
    position: 'absolute',
    left: 18,
    borderRadius: 2,
  },
  scissorHandle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 2,
    position: 'absolute',
    bottom: 0,
    left: 12,
  },
  razor: {
    position: 'absolute',
    width: 4,
    height: 35,
    borderRadius: 2,
  },
  comb: {
    position: 'absolute',
    width: 30,
    height: 6,
    borderRadius: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  combTooth: {
    width: 2,
    height: 10,
  },
  clipper: {
    position: 'absolute',
    left: '50%',
    top: '55%',
    marginLeft: -12,
    marginTop: -20,
  },
  clipperBody: {
    width: 24,
    height: 35,
    borderRadius: 3,
  },
  clipperHead: {
    width: 26,
    height: 8,
    marginTop: -2,
    marginLeft: -1,
    borderRadius: 2,
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
  handleStitching: {
    position: 'absolute',
    width: 100,
    height: 2,
    backgroundColor: '#e8e8e8',
    top: 8,
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
  contentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 80, // Espacio para el footer
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