// screens/login/AnimatedBriefcaseMobile.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AnimatedBriefcaseMobile = ({ onAnimationComplete, children }) => {
  const [showContent, setShowContent] = useState(false);
  const [hideCase, setHideCase] = useState(false);

  // Valores animados
  const briefcaseY = useRef(new Animated.Value(-screenHeight)).current;
  const briefcaseRotate = useRef(new Animated.Value(0)).current;
  const briefcaseScale = useRef(new Animated.Value(1)).current;
  const briefcaseOpacity = useRef(new Animated.Value(1)).current;
  const lidRotate = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(50)).current;

  // Partículas
  const particlesRef = useRef([]);
  const particleCount = 30;

  // Inicializar partículas
  useEffect(() => {
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: new Animated.Value(Math.random() * screenWidth),
      y: new Animated.Value(-Math.random() * screenHeight),
      opacity: new Animated.Value(0.8),
      color: ['#0066cc', '#cc0000', '#1a1a1a'][Math.floor(Math.random() * 3)],
    }));

    // Animar partículas continuamente
    animateParticles();
  }, []);

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
      Animated.sequence([
        Animated.spring(briefcaseY, {
          toValue: screenHeight * 0.25,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),

      // 3. Pausa
      Animated.delay(800),

      // 4. Abrir tapa
      Animated.timing(lidRotate, {
        toValue: -110,
        duration: 1200,
        useNativeDriver: true,
      }),

      // 5. Mostrar contenido
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 800,
          delay: 400,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 800,
          delay: 400,
          useNativeDriver: true,
        }),
      ]),

      // 6. Pausa antes de ocultar
      Animated.delay(500),

      // 7. Ocultar maletín
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

    // Mostrar contenido cuando la tapa se abre
    const timeout = setTimeout(() => {
      setShowContent(true);
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  const rotateInterpolate = briefcaseRotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Partículas de fondo */}
      {particlesRef.current.map((particle, index) => (
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
            {/* Herramientas doradas en el frente */}
            <View style={styles.toolsContainer}>
              {/* Tijeras cruzadas */}
              <View style={[styles.scissors, { left: '25%', top: '20%', transform: [{ rotate: '-30deg' }] }]}>
                <View style={styles.scissorBlade} />
                <View style={[styles.scissorBlade, { transform: [{ rotate: '20deg' }] }]} />
                <View style={styles.scissorHandle} />
              </View>

              <View style={[styles.scissors, { right: '25%', top: '20%', transform: [{ rotate: '30deg' }] }]}>
                <View style={styles.scissorBlade} />
                <View style={[styles.scissorBlade, { transform: [{ rotate: '20deg' }] }]} />
                <View style={styles.scissorHandle} />
              </View>

              {/* Navajas */}
              <View style={[styles.razor, { left: '10%', top: '50%' }]} />
              <View style={[styles.razor, { right: '10%', top: '50%' }]} />

              {/* Peines */}
              <View style={[styles.comb, { left: '15%', bottom: '15%' }]}>
                {[...Array(8)].map((_, i) => (
                  <View key={i} style={styles.combTooth} />
                ))}
              </View>
              <View style={[styles.comb, { right: '15%', bottom: '15%' }]}>
                {[...Array(8)].map((_, i) => (
                  <View key={i} style={styles.combTooth} />
                ))}
              </View>

              {/* Máquina cortapelo centro */}
              <View style={styles.clipper}>
                <View style={styles.clipperBody} />
                <View style={styles.clipperHead} />
              </View>
            </View>

            {/* Esquinas plateadas */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Manija */}
            <View style={styles.handle} />

            {/* Cerradura */}
            <View style={styles.lock} />
          </View>

          {/* Tapa (se abre) */}
          <Animated.View
            style={[
              styles.briefcaseLid,
              {
                transform: [
                  { translateY: -110 },
                  { rotateX: lidRotate.interpolate({
                    inputRange: [-110, 0],
                    outputRange: ['-110deg', '0deg'],
                  }) },
                ],
              },
            ]}
          >
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
          </Animated.View>
        </Animated.View>
      )}

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
          {children}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  briefcaseLid: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 30,
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    transformOrigin: 'top',
  },
  toolsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    padding: 10,
  },
  scissors: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  scissorBlade: {
    width: 3,
    height: 30,
    backgroundColor: '#ffd700',
    position: 'absolute',
    left: 18,
    borderRadius: 2,
  },
  scissorHandle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 2,
    borderColor: '#b8860b',
    position: 'absolute',
    bottom: 0,
    left: 12,
  },
  razor: {
    position: 'absolute',
    width: 4,
    height: 35,
    backgroundColor: '#ffd700',
    borderRadius: 2,
  },
  comb: {
    position: 'absolute',
    width: 30,
    height: 6,
    backgroundColor: '#b8860b',
    borderRadius: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  combTooth: {
    width: 2,
    height: 10,
    backgroundColor: '#b8860b',
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
    backgroundColor: '#b8860b',
    borderRadius: 3,
  },
  clipperHead: {
    width: 26,
    height: 8,
    backgroundColor: '#ffd700',
    marginTop: -2,
    marginLeft: -1,
    borderRadius: 2,
  },
  corner: {
    position: 'absolute',
    width: 25,
    height: 25,
    backgroundColor: '#c8c8c8',
    borderWidth: 1,
    borderColor: '#999',
  },
  cornerTL: { top: 5, left: 5, borderTopLeftRadius: 4 },
  cornerTR: { top: 5, right: 5, borderTopRightRadius: 4 },
  cornerBL: { bottom: 5, left: 5, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 5, right: 5, borderBottomRightRadius: 4 },
  handle: {
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -40,
    width: 80,
    height: 15,
    backgroundColor: '#0a0a0a',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#c8c8c8',
  },
  lock: {
    position: 'absolute',
    bottom: 15,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 12,
    backgroundColor: '#c8c8c8',
    borderRadius: 3,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});

export default AnimatedBriefcaseMobile;