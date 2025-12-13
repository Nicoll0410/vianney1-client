// screens/login/AnimatedBriefcaseMobile.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  // Inicializar herramientas - ÍCONOS BONITOS
  useEffect(() => {
    const centerX = screenWidth / 2;
    const centerY = screenHeight * 0.22;
    
    toolsRef.current = [
      // Tijeras (8)
      { x: new Animated.Value(centerX - 20), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'gold', icon: 'cut-outline', size: 1.8 },
      { x: new Animated.Value(centerX + 20), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'silver', icon: 'cut-outline', size: 1.8 },
      { x: new Animated.Value(centerX - 15), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'gold', icon: 'cut', size: 1.5 },
      { x: new Animated.Value(centerX + 15), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'silver', icon: 'cut', size: 1.5 },
      { x: new Animated.Value(centerX - 10), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'gold', icon: 'cut-outline', size: 1.3 },
      { x: new Animated.Value(centerX + 10), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'silver', icon: 'cut-outline', size: 1.3 },
      { x: new Animated.Value(centerX - 25), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'gold', icon: 'cut', size: 1.2 },
      { x: new Animated.Value(centerX + 25), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'silver', icon: 'cut', size: 1.2 },
      
      // Navajas/Cuchillas (8)
      { x: new Animated.Value(centerX - 5), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'gold', icon: 'fitness-outline', size: 1.6 },
      { x: new Animated.Value(centerX + 5), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'silver', icon: 'fitness-outline', size: 1.6 },
      { x: new Animated.Value(centerX - 8), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'gold', icon: 'fitness', size: 1.4 },
      { x: new Animated.Value(centerX + 8), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'silver', icon: 'fitness', size: 1.4 },
      { x: new Animated.Value(centerX - 12), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'gold', icon: 'fitness-outline', size: 1.3 },
      { x: new Animated.Value(centerX + 12), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'silver', icon: 'fitness-outline', size: 1.3 },
      { x: new Animated.Value(centerX - 18), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'gold', icon: 'fitness', size: 1.2 },
      { x: new Animated.Value(centerX + 18), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'silver', icon: 'fitness', size: 1.2 },
      
      // Peines (6)
      { x: new Animated.Value(centerX - 3), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'gold', icon: 'menu-outline', size: 1.5 },
      { x: new Animated.Value(centerX + 3), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'silver', icon: 'menu-outline', size: 1.5 },
      { x: new Animated.Value(centerX - 7), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'gold', icon: 'menu', size: 1.3 },
      { x: new Animated.Value(centerX + 7), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'silver', icon: 'menu', size: 1.3 },
      { x: new Animated.Value(centerX - 11), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'gold', icon: 'menu-outline', size: 1.2 },
      { x: new Animated.Value(centerX + 11), y: new Animated.Value(centerY), rotate: new Animated.Value(0), opacity: new Animated.Value(0), color: 'silver', icon: 'menu-outline', size: 1.2 },
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
            {/* Borde dorado superior */}
            <View style={styles.goldBorderTop} />
            
            {/* Esquinas doradas */}
            {[styles.cornerTL, styles.cornerTR, styles.cornerBL, styles.cornerBR].map((cornerStyle, i) => (
              <View key={i} style={[styles.cornerGold, cornerStyle]} />
            ))}

            {/* Manija dorada */}
            <View style={styles.handleContainer}>
              <View style={styles.handleGold} />
            </View>

            {/* Cerradura dorada */}
            <View style={styles.lockContainer}>
              <View style={styles.lockGold} />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Herramientas volando - ÍCONOS BONITOS */}
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
                  { scale: tool.size || 1 },
                ],
                opacity: tool.opacity,
              },
            ]}
          >
            <Ionicons 
              name={tool.icon} 
              size={50 * (tool.size || 1)} 
              color={tool.color === 'gold' ? '#ffd700' : '#e8e8e8'} 
            />
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
          {children}
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
    backgroundColor: '#000000', // Negro como en HTML
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d4af37', // Dorado como en HTML
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 15,
  },
  goldBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#d4af37',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cornerGold: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#d4af37',
    borderRadius: 6,
  },
  cornerTL: { top: 8, left: 8 },
  cornerTR: { top: 8, right: 8 },
  cornerBL: { bottom: 8, left: 8 },
  cornerBR: { bottom: 8, right: 8 },
  handleContainer: {
    position: 'absolute',
    top: -25,
    left: '50%',
    marginLeft: -40,
    alignItems: 'center',
  },
  handleGold: {
    width: 80,
    height: 20,
    backgroundColor: '#d4af37',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#000',
  },
  lockContainer: {
    position: 'absolute',
    bottom: 15,
    left: '50%',
    marginLeft: -15,
    alignItems: 'center',
  },
  lockGold: {
    width: 30,
    height: 15,
    backgroundColor: '#d4af37',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#000',
  },
  toolFlying: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    zIndex: 10,
  },
});

export default AnimatedBriefcaseMobile;