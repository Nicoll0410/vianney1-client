import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import InfoModal from '../../components/InfoModal';

const BASE_URL = Platform.OS === 'android'
  ? 'https://vianney-server.onrender.com'
  : 'https://vianney-server.onrender.com';

const VerifyEmailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [email, setEmail] = useState(route.params?.email || '');
  const [code, setCode] = useState(route.params?.code || '');
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [autoVerifyAttempted, setAutoVerifyAttempted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info'); // 'info', 'success', 'error'

  const showModal = (title, message, type = 'info') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  // Manejar parámetros de URL para verificación automática
  useEffect(() => {
    const checkParams = async () => {
      const { params } = route;
      
      // Si llegamos con parámetros de auto-verificación
      if (params?.autoVerify === 'true' && params?.email && params?.code) {
        setEmail(params.email);
        setCode(params.code);
        setAutoVerifyAttempted(true);
        await handleVerify(true); // Auto-verificar
      }
      
      // Si llegamos con éxito desde verificación por email
      if (params?.success === 'true' && params?.verified === 'true') {
        setIsVerified(true);
        setEmail(params.email || '');
      }
    };

    checkParams();
  }, [route.params]);

  const handleVerify = async (isAutoVerify = false) => {
    if (!code || code.length !== 6) {
      if (!isAutoVerify) {
        showModal('Error', 'Por favor ingresa un código válido de 6 dígitos', 'error');
      }
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/auth/verify-account`, {
        email,
        codigo: code,
      });

      if (response.data.success) {
        setIsVerified(true);
        showModal('¡Éxito!', 'Tu cuenta ha sido verificada correctamente.', 'success');
      } else {
        showModal('Error', response.data.mensaje || 'Error al verificar la cuenta', 'error');
      }
    } catch (error) {
      const errorData = error.response?.data;
      let errorMessage = 'No se pudo verificar la cuenta';
      
      if (errorData) {
        if (errorData.mensaje) {
          errorMessage = errorData.mensaje;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      }
      
      // No mostrar modal en auto-verificación silenciosa
      if (!isAutoVerify) {
        showModal('Error', errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/auth/resend-verification`, { email });
      
      if (response.data.success) {
        showModal('Éxito', 'Se ha enviado un nuevo código de verificación a tu email.', 'success');
      } else {
        showModal('Error', response.data.mensaje || 'Error al reenviar el código', 'error');
      }
    } catch (error) {
      showModal('Error', 'No se pudo reenviar el código de verificación', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigation.navigate('Login', { 
      verifiedEmail: email,
      message: '¡Cuenta verificada exitosamente! Ya puedes iniciar sesión.' 
    });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Image 
            source={require('../../assets/images/newYorkBarber.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
          
          {isVerified ? (
            <>
              <Text style={styles.title}>¡Verificación Exitosa!</Text>
              <Text style={styles.subtitle}>
                Tu cuenta ha sido verificada correctamente. Ahora puedes iniciar sesión.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>Verifica tu correo electrónico</Text>
              
              <Text style={styles.subtitle}>
                Hemos enviado un código de 6 dígitos a:
              </Text>
              
              <Text style={styles.emailText}>{email || 'correo@ejemplo.com'}</Text>

              <TextInput
                style={styles.input}
                placeholder="Código de verificación"
                placeholderTextColor="#999"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={!autoVerifyAttempted}
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.button, (loading || code.length !== 6) && styles.buttonDisabled]}
                onPress={() => handleVerify(false)}
                disabled={loading || code.length !== 6}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verificar Cuenta</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={resendCode}
                disabled={loading}
              >
                <Text style={styles.resendText}>Reenviar código</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <InfoModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        onClose={() => setModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 25,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#424242',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 22,
  },
  emailText: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#424242',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    color: '#333',
  },
  button: {
    width: '100%',
    backgroundColor: '#424242',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendButton: {
    padding: 10,
  },
  resendText: {
    color: '#424242',
    textDecorationLine: 'underline',
  },
});

export default VerifyEmailScreen;