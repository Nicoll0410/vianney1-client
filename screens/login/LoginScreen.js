// screens/login/LoginScreen.js
import React, { useState } from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  Dimensions, 
  Platform,
  ScrollView,
  Text 
} from 'react-native';
import LoginForm from './LoginForm';
import Footer from '../../components/Footer';
import AnimatedBriefcaseWeb from './AnimatedBriefcaseWeb';
import AnimatedBriefcaseMobile from './AnimatedBriefcaseMobile';

const { width, height } = Dimensions.get('window');
const isDesktop = width >= 1024;
const isMobile = width < 768;
const isWeb = Platform.OS === 'web';

const LoginScreen = () => {
  const [animationComplete, setAnimationComplete] = useState(false);

  const handleAnimationComplete = () => {
    setAnimationComplete(true);
  };

  // ANIMACIÓN PARA WEB
  if (isWeb) {
    return (
      <AnimatedBriefcaseWeb onAnimationComplete={handleAnimationComplete}>
        {/* Tu LoginForm original dentro del maletín */}
        <View style={styles.webAnimatedContainer}>
          <View style={styles.titleContainerDesktop}>
            <Text style={styles.title}>NEW YORK BARBER</Text>
          </View>
          <Image 
            source={require('../../assets/images/newYorkBarber.jpeg')} 
            style={styles.logoInAnimation} 
            resizeMode="contain"
          />
          <LoginForm />
          <View style={styles.footerInAnimation}>
            <Footer />
          </View>
        </View>
      </AnimatedBriefcaseWeb>
    );
  }

  // ANIMACIÓN PARA MÓVIL
  if (!isWeb) {
    return (
      <AnimatedBriefcaseMobile onAnimationComplete={handleAnimationComplete}>
        {/* Tu LoginForm original dentro del maletín */}
        <View style={styles.mobileAnimatedContainer}>
          <View style={styles.titleContainerMobile}>
            <Text style={styles.titleMobile}>NEW YORK BARBER</Text>
          </View>
          <Image 
            source={require('../../assets/images/newYorkBarber.jpeg')} 
            style={styles.logoInAnimationMobile} 
            resizeMode="contain"
          />
          <LoginForm />
        </View>
      </AnimatedBriefcaseMobile>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  // Estilos para la animación WEB
  webAnimatedContainer: {
    backgroundColor: 'transparent',
    padding: 20,
    maxWidth: 450,
    width: '90%',
  },
  logoInAnimation: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#000',
  },
  footerInAnimation: {
    marginTop: 20,
  },

  // Estilos para la animación MÓVIL
  mobileAnimatedContainer: {
    backgroundColor: 'transparent',
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  logoInAnimationMobile: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 15,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#000',
  },

  // Títulos
  titleContainerMobile: {
    marginBottom: 15,
    alignItems: 'center',
  },
  titleContainerDesktop: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: isDesktop ? 28 : 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#000',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    textTransform: 'uppercase',
  },
  titleMobile: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#000',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});

export default LoginScreen;