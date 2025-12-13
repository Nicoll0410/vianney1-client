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
            {/* Línea dorada superior (separación de tapa) */}
            <View style={styles.topGoldLine} />
            
            {/* Tijeras doradas en el centro */}
            <View style={styles.scissorsInside}>
              <View style={styles.scissorCircleLeft} />
              <View style={styles.scissorCircleRight} />
              <View style={styles.scissorCenter} />
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
    left: screenWidth / 2 - 100,
    width: 200,
    height: 130,
  },
  briefcaseBody: {
    width: 200,
    height: 130,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#d4af37',
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#d4af37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  // Línea dorada horizontal superior
  topGoldLine: {
    position: 'absolute',
    top: 25,
    left: 2,
    right: 2,
    height: 2,
    backgroundColor: '#d4af37',
  },
  // Tijeras doradas en el centro
  scissorsInside: {
    width: 70,
    height: 50,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scissorCircleLeft: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderWidth: 3,
    borderColor: '#d4af37',
    borderRadius: 17.5,
    left: 0,
    top: 7,
    transform: [{ rotate: '15deg' }],
  },
  scissorCircleRight: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderWidth: 3,
    borderColor: '#d4af37',
    borderRadius: 17.5,
    right: 0,
    top: 7,
    transform: [{ rotate: '-15deg' }],
  },
  scissorCenter: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#d4af37',
    borderRadius: 5,
    top: 20,
    left: 30,
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