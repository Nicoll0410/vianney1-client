import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import InfoModal from '../../components/InfoModal';
import Footer from '../../components/Footer';

const { width } = Dimensions.get('window');
const isDesktop = width >= 1024;
const isMobile = width < 768;

const BASE_URL = Platform.OS === 'android' 
  ? 'https://vianney-server.onrender.com'
  : 'https://vianney-server.onrender.com';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [paso, setPaso] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info');
  const [modalAction, setModalAction] = useState(null);

  const showModal = (title, message, type = 'info', action = null) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalAction(action);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (modalAction) {
      modalAction();
    }
  };

  const handleSolicitarRecuperacion = async () => {
    if (!email) {
      showModal('Error', 'Por favor ingresa tu email', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/usuarios/solicitar-recuperacion`, { 
        email 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setPaso(2);
        showModal(
          'Código enviado', 
          'Si el email existe en nuestro sistema, recibirás un código de recuperación', 
          'success'
        );
      } else {
        showModal('Error', response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.data?.message) {
        showModal('Error', error.response.data.message, 'error');
      } else {
        showModal('Error', 'No se pudo procesar la solicitud', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificarCodigo = async () => {
    if (!codigo) {
      showModal('Error', 'Por favor ingresa el código', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/usuarios/verificar-codigo`, { 
        email, 
        codigo 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setPaso(3);
        showModal('Éxito', 'Código verificado correctamente', 'success');
      } else {
        showModal('Error', response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.data?.message) {
        showModal('Error', error.response.data.message, 'error');
      } else {
        showModal('Error', 'No se pudo verificar el código', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarPassword = async () => {
    if (!nuevaPassword || !confirmarPassword) {
      showModal('Error', 'Por favor completa todos los campos', 'error');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      showModal('Error', 'Las contraseñas no coinciden', 'error');
      return;
    }

    if (nuevaPassword.length < 6) {
      showModal('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/usuarios/cambiar-password-codigo`, { 
        email, 
        codigo, 
        nuevaPassword 
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        showModal(
          'Contraseña cambiada', 
          'Tu contraseña ha sido cambiada exitosamente', 
          'success',
          () => navigation.navigate('Login')
        );
      } else {
        showModal('Error', response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.data?.message) {
        showModal('Error', error.response.data.message, 'error');
      } else {
        showModal('Error', 'No se pudo cambiar la contraseña', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderPaso = () => {
    switch (paso) {
      case 1:
        return (
          <View style={styles.pasoContainer}>
            <Image 
              source={require('../../assets/images/newYorkBarber.jpeg')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.titulo}>Recuperar Contraseña</Text>
            <Text style={styles.subtitulo}>
              Ingresa tu email para recibir un código de verificación
            </Text>
            
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TouchableOpacity 
              style={styles.botonPrincipal} 
              onPress={handleSolicitarRecuperacion}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botonTexto}>Enviar Código</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.botonSecundario}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.botonSecundarioTexto}>Volver al Login</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 2:
        return (
          <View style={styles.pasoContainer}>
            <Image 
              source={require('../../assets/images/newYorkBarber.jpeg')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.titulo}>Verificar Código</Text>
            <Text style={styles.subtitulo}>
              Ingresa el código de 6 dígitos que recibiste en: {email}
            </Text>
            
            <Text style={styles.label}>Código de Verificación</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              placeholderTextColor="#A0A0A0"
              value={codigo}
              onChangeText={setCodigo}
              keyboardType="numeric"
              maxLength={6}
            />
            
            <TouchableOpacity 
              style={styles.botonPrincipal} 
              onPress={handleVerificarCodigo}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botonTexto}>Verificar Código</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.botonSecundario}
              onPress={() => setPaso(1)}
            >
              <Text style={styles.botonSecundarioTexto}>Cambiar Email</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.botonTerciario}
              onPress={handleSolicitarRecuperacion}
            >
              <Text style={styles.botonTerciarioTexto}>Reenviar código</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 3:
        return (
          <View style={styles.pasoContainer}>
            <Image 
              source={require('../../assets/images/newYorkBarber.jpeg')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.titulo}>Nueva Contraseña</Text>
            <Text style={styles.subtitulo}>
              Ingresa tu nueva contraseña
            </Text>
            
            <Text style={styles.label}>Nueva Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#A0A0A0"
              value={nuevaPassword}
              onChangeText={setNuevaPassword}
              secureTextEntry
            />
            
            <Text style={styles.label}>Confirmar Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Repite tu contraseña"
              placeholderTextColor="#A0A0A0"
              value={confirmarPassword}
              onChangeText={setConfirmarPassword}
              secureTextEntry
            />
            
            <TouchableOpacity 
              style={styles.botonPrincipal} 
              onPress={handleCambiarPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botonTexto}>Cambiar Contraseña</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.botonSecundario}
              onPress={() => setPaso(2)}
            >
              <Text style={styles.botonSecundarioTexto}>Volver atrás</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            {renderPaso()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer agregado */}
      <View style={isMobile ? styles.mobileFooter : styles.desktopFooter}>
        <Footer />
      </View>

      <InfoModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={handleModalClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  pasoContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
    fontWeight: '600',
    alignSelf: 'stretch',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 15,
    color: '#333',
    alignSelf: 'stretch',
  },
  botonPrincipal: {
    height: 50,
    backgroundColor: '#424242',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  botonSecundario: {
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'stretch',
  },
  botonSecundarioTexto: {
    fontSize: 14,
    color: '#424242',
    textDecorationLine: 'underline',
  },
  botonTerciario: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  botonTerciarioTexto: {
    fontSize: 14,
    color: '#666',
  },
  mobileFooter: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  desktopFooter: {
    width: '100%',
    paddingHorizontal: 40,
    paddingBottom: 40,
  }
});

export default ForgotPasswordScreen;