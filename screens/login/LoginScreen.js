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
        {/* Layout original: logo izquierda, form derecha */}
        <View style={styles.desktopContent}>
          <View style={styles.logoContainer}>
            <View style={styles.titleContainerDesktop}>
              <Text style={styles.title}>NEW YORK BARBER</Text>
            </View>
            <Image 
              source={require('../../assets/images/newYorkBarber.jpeg')} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </View>
          <View style={styles.formWrapper}>
            <LoginForm />
          </View>
        </View>
        <View style={styles.desktopFooter}>
          <Footer />
        </View>
      </AnimatedBriefcaseWeb>
    );
  }

  // ANIMACIÓN PARA MÓVIL
  if (!isWeb) {
    return (
      <View style={styles.mobileContainer}>
        <AnimatedBriefcaseMobile onAnimationComplete={handleAnimationComplete}>
          <View style={styles.mobileContent}>
            <View style={styles.titleContainerMobile}>
              <Text style={styles.title}>NEW YORK BARBER</Text>
            </View>
            <Image 
              source={require('../../assets/images/newYorkBarber.jpeg')} 
              style={styles.logoMobile} 
              resizeMode="contain"
            />
            <LoginForm />
          </View>
        </AnimatedBriefcaseMobile>
        <View style={styles.mobileFooter}>
          <Footer />
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  // Estilos originales de tu LoginScreen
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: '#ffffff', // Fondo blanco
  },
  mobileContent: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  mobileFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  logoMobile: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  desktopContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 1200,
    flex: 1,
  },
  logoContainer: {
    marginRight: isDesktop ? 120 : 80,
    marginLeft: isDesktop ? 80 : 40,
    width: isDesktop ? 300 : 200,
    alignItems: 'center',
  },
  formWrapper: {
    flex: 1,
    maxWidth: 450,
  },
  logo: {
    width: '100%',
    height: isDesktop ? 300 : 200,
    marginBottom: isMobile ? 20 : 0,
  },
  desktopFooter: {
    width: '100%',
    maxWidth: 1200,
    paddingBottom: 40,
    alignSelf: 'center',
  },
  titleContainerMobile: {
    marginBottom: 20,
    alignItems: 'center',
  },
  titleContainerDesktop: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: isDesktop ? 28 : isMobile ? 22 : 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#000',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    textTransform: 'uppercase',
  },
});

export default LoginScreen;