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

  // ANIMACIÓN PARA MÓVIL (CORREGIDO - Centrado exacto como en la imagen)
  return (
    <View style={styles.container}>
      <AnimatedBriefcaseMobile onAnimationComplete={handleAnimationComplete}>
        <View style={styles.mobileContainer}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.mobileContent}>
              <View style={styles.titleContainerMobile}>
                <Text style={styles.title}>NEW YORK BARBER</Text>
              </View>
              <Image 
                source={require('../../assets/images/newYorkBarber.jpeg')} 
                style={styles.mobileLogo} 
                resizeMode="contain"
              />
              <LoginForm />
            </View>
          </ScrollView>
        </View>
      </AnimatedBriefcaseMobile>
      
      {/* Footer separado fuera del scroll para que esté siempre visible */}
      <View style={styles.mobileFooter}>
        <Footer />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mobileContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Espacio para el footer
  },
  mobileContent: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    minHeight: height - 100, // Altura mínima menos el footer
  },
  mobileFooter: {
    width: '100%',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
  mobileLogo: {
    width: 150,
    height: 150,
    marginVertical: 20,
  },
  desktopFooter: {
    width: '100%',
    maxWidth: 1200,
    paddingBottom: 40,
    alignSelf: 'center',
  },
  titleContainerMobile: {
    marginBottom: 10,
    alignItems: 'center',
  },
  titleContainerDesktop: {
    marginBottom: 30,
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
    marginTop: 10,
  },
});

export default LoginScreen;