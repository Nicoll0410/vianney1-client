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
  const [showLoginForm, setShowLoginForm] = useState(false);

  const handleAnimationComplete = () => {
    setAnimationComplete(true);
  };

  // Renderizar la animación para web
  if (isWeb) {
    return (
      <View style={{ flex: 1 }}>
        <AnimatedBriefcaseWeb onAnimationComplete={handleAnimationComplete}>
          <View style={styles.loginContentWeb}>
            <View style={styles.logoTitleContainer}>
              <Text style={styles.title}>NEW YORK</Text>
              <Text style={styles.title}>BARBER</Text>
              <Image 
                source={require('../../assets/images/newYorkBarber.jpeg')} 
                style={styles.logoInAnimation} 
                resizeMode="contain"
              />
            </View>
            <LoginForm />
            <View style={styles.footerInAnimation}>
              <Footer />
            </View>
          </View>
        </AnimatedBriefcaseWeb>
      </View>
    );
  }

  // Renderizar la animación para móvil
  if (!isWeb) {
    return (
      <View style={{ flex: 1 }}>
        <AnimatedBriefcaseMobile onAnimationComplete={handleAnimationComplete}>
          <View style={styles.loginContentMobile}>
            <View style={styles.logoTitleContainer}>
              <Text style={styles.titleMobile}>NEW YORK BARBER</Text>
              <Image 
                source={require('../../assets/images/newYorkBarber.jpeg')} 
                style={styles.logoInAnimationMobile} 
                resizeMode="contain"
              />
            </View>
            <LoginForm />
          </View>
        </AnimatedBriefcaseMobile>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  // Estilos para contenido dentro de la animación WEB
  loginContentWeb: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: isDesktop ? 40 : 30,
    maxWidth: 500,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  logoTitleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoInAnimation: {
    width: 120,
    height: 120,
    marginTop: 15,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#000',
  },
  footerInAnimation: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },

  // Estilos para contenido dentro de la animación MÓVIL
  loginContentMobile: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  logoInAnimationMobile: {
    width: 100,
    height: 100,
    marginTop: 12,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#000',
  },
  titleMobile: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#000',
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  // Estilos originales
  mobileContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  mobileContent: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  mobileFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  desktopContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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