import React from 'react';
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

const { width, height } = Dimensions.get('window');
const isDesktop = width >= 1024;
const isMobile = width < 768;

const LoginScreen = () => {
  return (
    <View style={styles.container}>
      {isMobile ? (
        <View style={styles.mobileContainer}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.mobileContent}>
              {/* Título para móvil */}
              <View style={styles.titleContainerMobile}>
                <Text style={styles.title}>NEW YORK BARBER</Text>
              </View>
              <Image 
                source={require('../../assets/images/newYorkBarber.jpeg')} 
                style={styles.logo} 
                resizeMode="contain"
              />
              <LoginForm />
            </View>
          </ScrollView>
          {/* Footer fijo en móvil */}
          <View style={styles.mobileFooter}>
            <Footer />
          </View>
        </View>
      ) : (
        <View style={styles.desktopContainer}>
          <View style={styles.desktopContent}>
            <View style={styles.logoContainer}>
              {/* Título para desktop */}
              <View style={styles.titleContainerDesktop}>
                <Text style={styles.title}>NEW YORK BARBER</Text>
              </View>
              <Image 
                source={require('../../assets/images/newYorkBarber.jpeg')} 
                style={styles.logo} 
                resizeMode="contain"
              />
            </View>
            <LoginForm />
          </View>
          <View style={styles.desktopFooter}>
            <Footer />
          </View>
        </View>
      )}
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
    justifyContent: 'center',
    paddingBottom: 80, // Espacio para el footer
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
  // Nuevos estilos para el título
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
  }
});

export default LoginScreen;