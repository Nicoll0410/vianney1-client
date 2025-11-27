import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';

// Configuración del calendario en español
LocaleConfig.locales.es = {
  monthNames: [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ],
  monthNamesShort: [
    'Ene','Feb','Mar','Abr','May','Jun',
    'Jul','Ago','Sep','Oct','Nov','Dic'
  ],
  dayNames: [
    'Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'
  ],
  dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

const { width, height } = Dimensions.get('window');
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 81 }, (_, i) => currentYear - i);
const months = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

const BASE_URL = Platform.OS === 'android'
  ? 'https://vianney-server.onrender.com'
  : 'https://vianney-server.onrender.com';

const RegisterScreen = () => {
  const navigation = useNavigation();

  // Estado del formulario
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    fechaNacimiento: null,
    email: '',
    password: '',
    confirmPassword: '',
    avatar: null,
  });

  const [errors, setErrors] = useState({
    nombre: '',
    telefono: '',
    fechaNacimiento: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Validaciones
  const validateField = (key, value) => {
    let error = '';
    
    switch (key) {
      case 'nombre':
        if (!value.trim()) error = 'El nombre es obligatorio';
        else if (value.trim().length < 3) error = 'El nombre debe tener al menos 3 caracteres';
        break;
      case 'telefono':
        if (!value.trim()) error = 'El teléfono es obligatorio';
        else if (!/^\d{10}$/.test(value.trim())) error = 'El teléfono debe tener 10 dígitos';
        break;
      case 'fechaNacimiento':
        if (!value) error = 'La fecha de nacimiento es obligatoria';
        break;
      case 'email':
        if (!value.trim()) error = 'El email es obligatorio';
        else if (!/^\S+@\S+\.\S+$/.test(value.trim())) error = 'El formato del email no es válido';
        break;
      case 'password':
        if (!value.trim()) error = 'La contraseña es obligatoria';
        else if (value.length < 6) error = 'La contraseña debe tener al menos 6 caracteres';
        break;
      case 'confirmPassword':
        if (!value.trim()) error = 'Debes confirmar tu contraseña';
        else if (value !== form.password) error = 'Las contraseñas no coinciden';
        break;
      default:
        break;
    }
    
    setErrors(prev => ({ ...prev, [key]: error }));
    return error === '';
  };

  // Helpers
  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
    
    // Si ya hay un error en este campo, validamos de nuevo al escribir
    if (errors[key]) {
      validateField(key, value);
    }
  };

  const formatDateLabel = (date) => {
    if (!date) return 'dd/mm/aaaa';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isoDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const disabledDates = () => {
    const obj = {};
    const today = new Date();
    const start = new Date(calendarYear, calendarMonth, 1);
    const end = new Date(calendarYear, calendarMonth + 1, 0);
    const tmp = new Date(start);
    
    while (tmp <= end) {
      if (tmp > today || tmp.getFullYear() < currentYear - 80) {
        obj[isoDate(tmp)] = { disabled: true, disableTouchEvent: true };
      }
      tmp.setDate(tmp.getDate() + 1);
    }
    return obj;
  };

  // Image picker
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Activa los permisos de galería');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        handleChange('avatar', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Validar todo el formulario
  const validateForm = () => {
    const newErrors = {
      nombre: '',
      telefono: '',
      fechaNacimiento: '',
      email: '',
      password: '',
      confirmPassword: '',
    };
    
    let isValid = true;
    
    // Validar cada campo
    if (!validateField('nombre', form.nombre)) isValid = false;
    if (!validateField('telefono', form.telefono)) isValid = false;
    if (!validateField('fechaNacimiento', form.fechaNacimiento)) isValid = false;
    if (!validateField('email', form.email)) isValid = false;
    if (!validateField('password', form.password)) isValid = false;
    if (!validateField('confirmPassword', form.confirmPassword)) isValid = false;
    
    return isValid;
  };

  // Registro
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: form.nombre,
        telefono: form.telefono,
        fecha_nacimiento: isoDate(form.fechaNacimiento),
        email: form.email,
        password: form.password,
      };

      const response = await axios.post(`${BASE_URL}/auth/signup`, payload);
      
      if (response.data.success) {
        setRegisteredEmail(form.email);
        setShowSuccessModal(true);
      } else {
        throw new Error(response.data.mensaje || 'Error en el registro');
      }
    } catch (error) {
      console.error('Error completo:', error);
      let errorMessage = 'No se pudo completar el registro';
      
      if (error.response) {
        errorMessage = error.response.data?.mensaje || 
                      error.response.data?.message || 
                      error.message;
      } else if (error.request) {
        errorMessage = 'No se recibió respuesta del servidor';
      } else {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.container} 
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo y título */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/newYorkBarber.jpeg')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <View style={styles.headerText}>
            <Text style={styles.title}>Únete a New York Barber</Text>
            <Text style={styles.subtitle}>
              Crea tu cuenta para reservar citas y disfrutar de nuestros servicios
            </Text>
          </View>
        </View>

        {/* Formulario */}
        <View style={styles.formContainer}>
          {/* Nombre */}
          <View style={styles.group}>
            <Text style={styles.label}>
              Nombre completo <Text style={styles.req}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.nombre && styles.inputError]}
              placeholder="Ej: Carlos Gómez"
              placeholderTextColor="#929292"
              value={form.nombre}
              onChangeText={(text) => handleChange('nombre', text)}
              onBlur={() => validateField('nombre', form.nombre)}
            />
            {errors.nombre ? <Text style={styles.errorText}>{errors.nombre}</Text> : null}
          </View>

          {/* Teléfono & Fecha */}
          <View style={styles.row}>
            <View style={[styles.group, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>
                Teléfono <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.telefono && styles.inputError]}
                placeholder="3001234567"
                placeholderTextColor="#929292"
                keyboardType="phone-pad"
                value={form.telefono}
                onChangeText={(text) => handleChange('telefono', text)}
                onBlur={() => validateField('telefono', form.telefono)}
              />
              {errors.telefono ? <Text style={styles.errorText}>{errors.telefono}</Text> : null}
            </View>

            <View style={[styles.group, { flex: 1 }]}>
              <Text style={styles.label}>
                Fecha nacimiento <Text style={styles.req}>*</Text>
              </Text>
              <TouchableOpacity 
                style={[styles.dateInput, errors.fechaNacimiento && styles.inputError]} 
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={[
                    styles.dateText,
                    form.fechaNacimiento && { color: '#333' },
                  ]}
                >
                  {formatDateLabel(form.fechaNacimiento)}
                </Text>
                <MaterialIcons name="calendar-today" size={20} color="#666" />
              </TouchableOpacity>
              {errors.fechaNacimiento ? <Text style={styles.errorText}>{errors.fechaNacimiento}</Text> : null}
            </View>
          </View>

          {/* Email */}
          <View style={styles.group}>
            <Text style={styles.label}>
              Email <Text style={styles.req}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="correo@dominio.com"
              placeholderTextColor="#929292"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(text) => handleChange('email', text)}
              onBlur={() => validateField('email', form.email)}
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          {/* Passwords */}
          <View style={styles.row}>
            <View style={[styles.group, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>
                Contraseña <Text style={styles.req}>*</Text>
              </Text>
              <View style={[styles.pwWrap, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.pwInput}
                  placeholder="••••••••"
                  placeholderTextColor="#929292"
                  secureTextEntry={!showPassword}
                  value={form.password}
                  onChangeText={(text) => handleChange('password', text)}
                  onBlur={() => validateField('password', form.password)}
                />
                <TouchableOpacity
                  style={styles.eye}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>
            <View style={[styles.group, { flex: 1 }]}>
              <Text style={styles.label}>
                Confirmar <Text style={styles.req}>*</Text>
              </Text>
              <View style={[styles.pwWrap, errors.confirmPassword && styles.inputError]}>
                <TextInput
                  style={styles.pwInput}
                  placeholder="••••••••"
                  placeholderTextColor="#929292"
                  secureTextEntry={!showConfirm}
                  value={form.confirmPassword}
                  onChangeText={(text) => handleChange('confirmPassword', text)}
                  onBlur={() => validateField('confirmPassword', form.confirmPassword)}
                />
                <TouchableOpacity
                  style={styles.eye}
                  onPress={() => setShowConfirm(!showConfirm)}
                >
                  <MaterialIcons
                    name={showConfirm ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
            </View>
          </View>

          {/* Avatar opcional */}
          <View style={styles.group}>
            <Text style={styles.label}>Foto de perfil (opcional)</Text>
            <TouchableOpacity style={styles.avatarBox} onPress={pickImage}>
              {form.avatar ? (
                <Image source={{ uri: form.avatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="add-a-photo" size={24} color="#666" />
                  <Text style={styles.avatarText}>Seleccionar imagen</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Botón de Registro */}
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnTxt}>Registrarse</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Enlace de Inicio de Sesión */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal del calendario */}
        <Modal
          visible={showDatePicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Header month/year */}
              <View style={styles.dpHeader}>
                <TouchableOpacity
                  onPress={() => {
                    const m = calendarMonth === 0 ? 11 : calendarMonth - 1;
                    const y = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
                    if (y >= currentYear - 80) {
                      setCalendarMonth(m);
                      setCalendarYear(y);
                    }
                  }}
                >
                  <MaterialIcons name="chevron-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.dpTitle}>
                  {months[calendarMonth]} de {calendarYear}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const today = new Date();
                    const m = calendarMonth === 11 ? 0 : calendarMonth + 1;
                    const y = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
                    if (y < currentYear || (y === currentYear && m <= today.getMonth())) {
                      setCalendarMonth(m);
                      setCalendarYear(y);
                    }
                  }}
                >
                  <MaterialIcons name="chevron-right" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              {/* Years horizontal scroll */}
              <View style={styles.yearsScrollContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={true}
                  contentContainerStyle={styles.yearsContainer}
                  snapToInterval={70}
                  decelerationRate="fast"
                >
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.yearBtn,
                        year === calendarYear && styles.yearBtnSel,
                      ]}
                      onPress={() => setCalendarYear(year)}
                    >
                      <Text
                        style={[
                          styles.yearText,
                          year === calendarYear && styles.yearTextSel,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Calendar days */}
              <Calendar
                key={`${calendarYear}-${calendarMonth}`}
                current={`${calendarYear}-${(calendarMonth + 1)
                  .toString()
                  .padStart(2, '0')}-01`}
                hideArrows
                hideExtraDays
                disableMonthChange
                onDayPress={(day) => {
                  handleChange(
                    'fechaNacimiento',
                    new Date(day.year, day.month - 1, day.day)
                  );
                  setShowDatePicker(false);
                }}
                markedDates={{
                  ...disabledDates(),
                  [form.fechaNacimiento ? isoDate(form.fechaNacimiento) : '']: {
                    selected: true,
                    selectedColor: '#424242',
                    selectedTextColor: '#fff',
                  },
                }}
                theme={{
                  calendarBackground: 'transparent',
                  textSectionTitleColor: '#666',
                  dayTextColor: '#333',
                  todayTextColor: '#424242',
                  selectedDayTextColor: '#fff',
                  selectedDayBackgroundColor: '#424242',
                  monthTextColor: '#333',
                  textDayFontSize: 14,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 14,
                }}
                disableAllTouchEventsForDisabledDays
              />
              
              {/* Close button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal de éxito en registro */}
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowSuccessModal(false);
            navigation.navigate('Login');
          }}
        >
          <View style={styles.successModalOverlay}>
            <View style={styles.successModalContent}>
              <View style={styles.successModalIcon}>
                <MaterialIcons name="check-circle" size={60} color="#4CAF50" />
              </View>
              <Text style={styles.successModalTitle}>¡Registro exitoso!</Text>
              <Text style={styles.successModalText}>
                Hemos enviado un correo de verificación a:
              </Text>
              <Text style={styles.successModalEmail}>{registeredEmail}</Text>
              <Text style={styles.successModalText}>
                Por favor revisa tu bandeja de entrada y sigue las instrucciones para verificar tu cuenta.
              </Text>
              <TouchableOpacity
                style={styles.successModalButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.navigate('Login');
                }}
              >
                <Text style={styles.successModalButtonText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    backgroundColor: '#f8f9fa',
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
    width: '90%',
    maxWidth: 400,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#333',
    marginBottom: 4,
  },
  subtitle: { 
    color: '#666', 
    fontSize: 14,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    width: '90%',
    maxWidth: 400,
  },
  group: { 
    marginBottom: 16,
  },
  label: { 
    fontSize: 14, 
    color: '#444', 
    marginBottom: 6, 
    fontWeight: '500' 
  },
  req: { 
    color: '#e74c3c' 
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#f8f9fa',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  row: { 
    flexDirection: 'row' 
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: { 
    fontSize: 15, 
    color: '#999' 
  },
  pwWrap: { 
    position: 'relative',
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  pwInput: {
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    fontSize: 15,
    paddingRight: 40,
  },
  eye: { 
    position: 'absolute', 
    right: 10, 
    top: 12 
  },
  avatarBox: {
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8,
    height: 100, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f8f9fa', 
    overflow: 'hidden',
  },
  avatarImg: { 
    width: '100%', 
    height: '100%' 
  },
  avatarPlaceholder: { 
    alignItems: 'center' 
  },
  avatarText: { 
    marginTop: 4, 
    fontSize: 13, 
    color: '#666' 
  },
  buttonWrapper: {
    alignItems: 'center',
    marginTop: 10,
  },
  btnPrimary: {
    backgroundColor: '#424242',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: '70%',
    minWidth: 180,
    maxWidth: 220,
    shadowColor: '#424242',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  btnTxt: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 16 
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    maxHeight: height * 0.8,
  },
  dpHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 10,
  },
  dpTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  yearsScrollContainer: {
    height: 50,
    marginVertical: 10,
  },
  yearsContainer: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  yearBtn: { 
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  yearBtnSel: { 
    backgroundColor: '#424242' 
  },
  yearText: { 
    color: '#666',
    fontSize: 14,
  },
  yearTextSel: { 
    color: '#fff' 
  },
  closeButton: {
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#424242',
    fontWeight: 'bold',
    fontSize: 16,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  successModalIcon: {
    marginBottom: 20,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#424242',
    textAlign: 'center',
  },
  successModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  successModalEmail: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    textAlign: 'center',
    marginBottom: 15,
  },
  successModalButton: {
    backgroundColor: '#424242',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  successModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RegisterScreen;