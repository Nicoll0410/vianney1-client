// screens/perfil/MiPerfilScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Switch,
  Alert
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import Footer from '../../components/Footer';
import InfoModal from '../../components/InfoModal';
import { Calendar } from 'react-native-calendars';

const BASE_URL = 'https://vianney-server.onrender.com';

const MiPerfilScreen = () => {
  const { user, userRole, barberData } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  
  // Datos del barbero
  const [barberoID, setBarberoID] = useState(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('');
  
  // Redes sociales
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  
  // Horarios
  const [diasLaborales, setDiasLaborales] = useState({
    lunes: { activo: false, horas: [] },
    martes: { activo: false, horas: [] },
    miercoles: { activo: false, horas: [] },
    jueves: { activo: false, horas: [] },
    viernes: { activo: false, horas: [] },
    sabado: { activo: false, horas: [] },
    domingo: { activo: false, horas: [] }
  });
  
  const [horarioAlmuerzo, setHorarioAlmuerzo] = useState({
    inicio: '13:00',
    fin: '14:00',
    activo: true
  });
  
  const [excepciones, setExcepciones] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  
  // Modal de info
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [infoType, setInfoType] = useState('info');

  useEffect(() => {
    cargarDatosBarbero();
  }, []);

  const showInfo = (title, message, type = 'info') => {
    setInfoTitle(title);
    setInfoMsg(message);
    setInfoType(type);
    setInfoVisible(true);
  };

  const cargarDatosBarbero = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      let barberoID;
      if (userRole === 'Barbero' && barberData?.id) {
        barberoID = barberData.id;
        console.log('✅ Barbero ID desde barberData:', barberoID);
      } else if (userRole === 'Administrador') {
        const emailUsuario = user?.email;
        
        if (!emailUsuario) {
          showInfo('Error', 'No se pudo obtener el email del usuario', 'error');
          return;
        }

        const { data: respuestaBarberos } = await axios.get(
          `${BASE_URL}/barberos`,
          { 
            headers: { Authorization: `Bearer ${token}` },
            params: { all: true }
          }
        );
        
        const barberosArray = Array.isArray(respuestaBarberos) ? respuestaBarberos : 
                             (respuestaBarberos.barberos || respuestaBarberos.data || []);
        
        const miBarbero = barberosArray.find(b => 
          b.usuario?.email?.toLowerCase() === emailUsuario.toLowerCase()
        );
        
        if (!miBarbero) {
          showInfo('Error', 'No se encontró registro de barbero', 'error');
          return;
        }
        
        barberoID = miBarbero.id;
      }

      if (!barberoID) {
        showInfo('Error', 'No se pudo identificar al barbero', 'error');
        return;
      }

      // Cargar datos del barbero
      const { data } = await axios.get(
        `${BASE_URL}/barberos/by-id/${barberoID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const barbero = data.barbero || data;

      setBarberoID(barbero.id);
      setNombre(barbero.nombre || '');
      setTelefono(barbero.telefono || '');
      setEmail(barbero.usuario?.email || user?.email || '');
      setRol(barbero.usuario?.rol?.nombre || userRole || '');
      
      setInstagram(barbero.instagram || '');
      setFacebook(barbero.facebook || '');
      setTiktok(barbero.tiktok || '');

      // Cargar horario
      await cargarHorario(barberoID, token);

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      showInfo('Error', 'No se pudieron cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarHorario = async (id, token) => {
    try {
      const { data } = await axios.get(
        `${BASE_URL}/barberos/${id}/horario`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.horario) {
        setDiasLaborales(data.horario.diasLaborales || diasLaborales);
        setHorarioAlmuerzo(data.horario.horarioAlmuerzo || horarioAlmuerzo);
        setExcepciones(data.horario.excepciones || []);
        
        // Marcar fechas en el calendario
        const marked = {};
        (data.horario.excepciones || []).forEach(exc => {
          marked[exc.fecha] = {
            selected: true,
            marked: true,
            selectedColor: exc.activo ? '#4CAF50' : '#F44336',
            dotColor: exc.activo ? '#4CAF50' : '#F44336'
          };
        });
        setMarkedDates(marked);
      }
    } catch (error) {
      console.error('Error cargando horario:', error);
    }
  };

  const guardarRedesSociales = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');

      await axios.patch(
        `${BASE_URL}/barberos/${barberoID}`,
        {
          instagram: instagram || null,
          facebook: facebook || null,
          tiktok: tiktok || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showInfo('¡Éxito!', 'Redes sociales actualizadas correctamente', 'success');
      
    } catch (error) {
      console.error('❌ Error guardando:', error);
      showInfo('Error', error.response?.data?.mensaje || 'No se pudieron guardar los cambios', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleDiaLaboral = (dia) => {
    setDiasLaborales(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        activo: !prev[dia].activo
      }
    }));
  };

  const guardarHorario = async () => {
    try {
      setSavingSchedule(true);
      const token = await AsyncStorage.getItem('token');

      await axios.put(
        `${BASE_URL}/barberos/${barberoID}/horario`,
        {
          diasLaborales,
          horarioAlmuerzo,
          excepciones
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showInfo('¡Éxito!', 'Horario actualizado correctamente', 'success');
      
    } catch (error) {
      console.error('❌ Error guardando horario:', error);
      showInfo('Error', error.response?.data?.mensaje || 'No se pudo guardar el horario', 'error');
    } finally {
      setSavingSchedule(false);
    }
  };

  const onDayPress = (day) => {
    const fecha = day.dateString;
    
    Alert.alert(
      `Día ${fecha}`,
      '¿Qué deseas hacer?',
      [
        {
          text: 'Trabajar este día',
          onPress: () => agregarExcepcion(fecha, true)
        },
        {
          text: 'No trabajar este día',
          onPress: () => agregarExcepcion(fecha, false)
        },
        {
          text: 'Eliminar excepción',
          onPress: () => eliminarExcepcion(fecha),
          style: 'destructive'
        },
        {
          text: 'Cancelar',
          style: 'cancel'
        }
      ]
    );
  };

  const agregarExcepcion = (fecha, activo) => {
    const nuevasExcepciones = excepciones.filter(e => e.fecha !== fecha);
    nuevasExcepciones.push({ fecha, activo, motivo: '' });
    setExcepciones(nuevasExcepciones);
    
    setMarkedDates(prev => ({
      ...prev,
      [fecha]: {
        selected: true,
        marked: true,
        selectedColor: activo ? '#4CAF50' : '#F44336',
        dotColor: activo ? '#4CAF50' : '#F44336'
      }
    }));
  };

  const eliminarExcepcion = (fecha) => {
    setExcepciones(excepciones.filter(e => e.fecha !== fecha));
    
    const newMarked = { ...markedDates };
    delete newMarked[fecha];
    setMarkedDates(newMarked);
  };

  const limpiarRedSocial = (red) => {
    switch(red) {
      case 'instagram':
        setInstagram('');
        break;
      case 'facebook':
        setFacebook('');
        break;
      case 'tiktok':
        setTiktok('');
        break;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#424242" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="person-circle" size={60} color="#D4AF37" />
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <Text style={styles.headerSubtitle}>{nombre}</Text>
        </View>

        {/* CONTENEDOR 1: Información Básica */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="information-circle" size={20} color="#212121" /> Información Básica
          </Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{nombre}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Rol</Text>
              <Text style={styles.infoValue}>{rol}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{telefono}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>
        </View>

        {/* CONTENEDOR 2: Redes Sociales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="share-social" size={20} color="#212121" /> Mis Redes Sociales
          </Text>
          <Text style={styles.sectionDescription}>
            Estas aparecerán en tu perfil público de la galería
          </Text>

          {/* Instagram */}
          <View style={styles.socialInputContainer}>
            <View style={styles.socialHeader}>
              <FontAwesome name="instagram" size={24} color="#E4405F" />
              <Text style={styles.socialLabel}>Instagram</Text>
              {instagram && (
                <TouchableOpacity
                  onPress={() => limpiarRedSocial('instagram')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.socialInput}
              placeholder="https://instagram.com/tu_usuario"
              value={instagram}
              onChangeText={setInstagram}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Facebook */}
          <View style={styles.socialInputContainer}>
            <View style={styles.socialHeader}>
              <FontAwesome name="facebook" size={24} color="#1877F2" />
              <Text style={styles.socialLabel}>Facebook</Text>
              {facebook && (
                <TouchableOpacity
                  onPress={() => limpiarRedSocial('facebook')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.socialInput}
              placeholder="https://facebook.com/tu_pagina"
              value={facebook}
              onChangeText={setFacebook}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* TikTok */}
          <View style={styles.socialInputContainer}>
            <View style={styles.socialHeader}>
              <FontAwesome name="music" size={24} color="#000" />
              <Text style={styles.socialLabel}>TikTok</Text>
              {tiktok && (
                <TouchableOpacity
                  onPress={() => limpiarRedSocial('tiktok')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.socialInput}
              placeholder="https://tiktok.com/@tu_usuario"
              value={tiktok}
              onChangeText={setTiktok}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={guardarRedesSociales}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Guardar Redes Sociales</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* CONTENEDOR 3: Editar Horario */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="calendar" size={20} color="#212121" /> Editar Horario
          </Text>
          <Text style={styles.sectionDescription}>
            Configura tus días laborales y excepciones específicas
          </Text>

          {/* Días de la semana */}
          <View style={styles.daysContainer}>
            {Object.keys(diasLaborales).map(dia => (
              <View key={dia} style={styles.dayRow}>
                <Text style={styles.dayName}>{dia.charAt(0).toUpperCase() + dia.slice(1)}</Text>
                <Switch
                  value={diasLaborales[dia].activo}
                  onValueChange={() => toggleDiaLaboral(dia)}
                  trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                  thumbColor={diasLaborales[dia].activo ? '#fff' : '#fff'}
                />
              </View>
            ))}
          </View>

          {/* Horario de almuerzo */}
          <View style={styles.lunchContainer}>
            <View style={styles.lunchHeader}>
              <Ionicons name="restaurant" size={20} color="#666" />
              <Text style={styles.lunchTitle}>Horario de Almuerzo</Text>
              <Switch
                value={horarioAlmuerzo.activo}
                onValueChange={(val) => setHorarioAlmuerzo(prev => ({ ...prev, activo: val }))}
                trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                thumbColor={horarioAlmuerzo.activo ? '#fff' : '#fff'}
              />
            </View>
            
            {horarioAlmuerzo.activo && (
              <View style={styles.lunchTimes}>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>Inicio:</Text>
                  <TextInput
                    style={styles.timeValue}
                    value={horarioAlmuerzo.inicio}
                    onChangeText={(val) => setHorarioAlmuerzo(prev => ({ ...prev, inicio: val }))}
                    placeholder="13:00"
                  />
                </View>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>Fin:</Text>
                  <TextInput
                    style={styles.timeValue}
                    value={horarioAlmuerzo.fin}
                    onChangeText={(val) => setHorarioAlmuerzo(prev => ({ ...prev, fin: val }))}
                    placeholder="14:00"
                  />
                </View>
              </View>
            )}
          </View>

          {/* Calendario de excepciones */}
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => setShowCalendar(!showCalendar)}
          >
            <Ionicons name="calendar-outline" size={20} color="#fff" />
            <Text style={styles.calendarButtonText}>
              {showCalendar ? 'Ocultar Calendario' : 'Gestionar Días Específicos'}
            </Text>
          </TouchableOpacity>

          {showCalendar && (
            <View style={styles.calendarContainer}>
              <Text style={styles.calendarHelp}>
                Toca un día para marcarlo como día de trabajo (verde) o día libre (rojo)
              </Text>
              <Calendar
                onDayPress={onDayPress}
                markedDates={markedDates}
                theme={{
                  todayTextColor: '#D4AF37',
                  selectedDayBackgroundColor: '#424242',
                  arrowColor: '#424242'
                }}
              />
              
              {excepciones.length > 0 && (
                <View style={styles.exceptionsList}>
                  <Text style={styles.exceptionsTitle}>Excepciones Configuradas:</Text>
                  {excepciones.map((exc, index) => (
                    <View key={index} style={styles.exceptionItem}>
                      <Ionicons 
                        name={exc.activo ? "checkmark-circle" : "close-circle"} 
                        size={20} 
                        color={exc.activo ? "#4CAF50" : "#F44336"} 
                      />
                      <Text style={styles.exceptionDate}>{exc.fecha}</Text>
                      <Text style={styles.exceptionStatus}>
                        {exc.activo ? 'Trabajando' : 'No trabajo'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButton, savingSchedule && styles.saveButtonDisabled]}
            onPress={guardarHorario}
            disabled={savingSchedule}
          >
            {savingSchedule ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Guardar Horario</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* CONTENEDOR 4: Vista Previa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="eye" size={20} color="#212121" /> Vista Previa
          </Text>
          <Text style={styles.sectionDescription}>
            Así verán los clientes tu perfil
          </Text>

          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Ionicons name="person-circle" size={50} color="#D4AF37" />
              <View style={styles.previewInfo}>
                <Text style={styles.previewNombre}>{nombre}</Text>
                <Text style={styles.previewRol}>{rol}</Text>
              </View>
            </View>

            <View style={styles.previewContact}>
              <View style={styles.previewContactItem}>
                <Ionicons name="call" size={16} color="#666" />
                <Text style={styles.previewTelefono}>{telefono}</Text>
              </View>
              <View style={styles.previewContactItem}>
                <Ionicons name="mail" size={16} color="#666" />
                <Text style={styles.previewEmail}>{email}</Text>
              </View>
            </View>
            
            {(instagram || facebook || tiktok) ? (
              <View style={styles.previewRedesContainer}>
                <Text style={styles.previewRedesTitle}>Redes Sociales:</Text>
                <View style={styles.previewRedes}>
                  {instagram && <FontAwesome name="instagram" size={24} color="#E4405F" />}
                  {facebook && <FontAwesome name="facebook" size={24} color="#1877F2" />}
                  {tiktok && <FontAwesome name="music" size={24} color="#000" />}
                </View>
              </View>
            ) : (
              <Text style={styles.previewSinRedes}>
                No has agregado redes sociales
              </Text>
            )}

            <View style={styles.previewSchedule}>
              <Text style={styles.previewScheduleTitle}>Días de trabajo:</Text>
              <View style={styles.previewDays}>
                {Object.entries(diasLaborales).map(([dia, config]) => (
                  config.activo && (
                    <View key={dia} style={styles.previewDayBadge}>
                      <Text style={styles.previewDayText}>
                        {dia.substring(0, 3)}
                      </Text>
                    </View>
                  )
                ))}
              </View>
            </View>
          </View>
        </View>

        <Footer />
      </ScrollView>

      <InfoModal
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title={infoTitle}
        message={infoMsg}
        type={infoType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 20
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: 30,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#D4AF37',
    marginTop: 4
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  infoContent: {
    marginLeft: 16,
    flex: 1
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500'
  },
  socialInputContainer: {
    marginBottom: 20
  },
  socialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  socialLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 12,
    flex: 1
  },
  clearButton: {
    padding: 4
  },
  socialInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa'
  },
  daysContainer: {
    marginBottom: 20
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  dayName: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500'
  },
  lunchContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20
  },
  lunchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  lunchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 8,
    flex: 1
  },
  lunchTimes: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16
  },
  timeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  timeLabel: {
    fontSize: 14,
    color: '#666'
  },
  timeValue: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    textAlign: 'center'
  },
  calendarButton: {
    flexDirection: 'row',
    backgroundColor: '#424242',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8
  },
  calendarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  calendarContainer: {
    marginTop: 10
  },
  calendarHelp: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic'
  },
  exceptionsList: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8
  },
  exceptionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8
  },
  exceptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8
  },
  exceptionDate: {
    fontSize: 14,
    color: '#212121',
    flex: 1
  },
  exceptionStatus: {
    fontSize: 12,
    color: '#666'
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#424242',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8
  },
  saveButtonDisabled: {
    backgroundColor: '#999'
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  previewCard: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed'
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12
  },
  previewInfo: {
    flex: 1
  },
  previewNombre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121'
  },
  previewRol: {
    fontSize: 14,
    color: '#D4AF37',
    marginTop: 4
  },
  previewContact: {
    marginBottom: 16,
    gap: 8
  },
  previewContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  previewTelefono: {
    fontSize: 14,
    color: '#666'
  },
  previewEmail: {
    fontSize: 14,
    color: '#666'
  },
  previewRedesContainer: {
    marginBottom: 16
  },
  previewRedesTitle: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '600',
    marginBottom: 8
  },
  previewRedes: {
    flexDirection: 'row',
    gap: 16
  },
  previewSinRedes: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12
  },
  previewSchedule: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  previewScheduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8
  },
  previewDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  previewDayBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16
  },
  previewDayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize'
  }
});

export default MiPerfilScreen;