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
  useWindowDimensions
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import Footer from '../../components/Footer';
import InfoModal from '../../components/InfoModal';
import HorarioBarbero from '../../components/HorarioBarbero';

const BASE_URL = 'https://vianney-server.onrender.com';

const MiPerfilScreen = () => {
  const { user, userRole, barberData } = useContext(AuthContext);
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [barberoID, setBarberoID] = useState(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('');

  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');

  const [showHorarioModal, setShowHorarioModal] = useState(false);
  const [horarioData, setHorarioData] = useState(null);

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
        setHorarioData(data.horario);
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

  const handleHorarioClose = async () => {
    setShowHorarioModal(false);
    if (barberoID) {
      const token = await AsyncStorage.getItem('token');
      await cargarHorario(barberoID, token);
    }
  };

  const limpiarRedSocial = (red) => {
    switch (red) {
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

  const getDiasActivos = () => {
    if (!horarioData?.diasLaborales) return [];

    return Object.entries(horarioData.diasLaborales)
      .filter(([_, config]) => config.activo)
      .map(([dia, _]) => dia);
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
        <View style={styles.header}>
          <Ionicons name="person-circle" size={60} color="#D4AF37" />
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <Text style={styles.headerSubtitle}>{nombre}</Text>
        </View>

        <View style={[styles.row, !isLargeScreen && styles.rowColumn]}>
          <View style={[styles.section, isLargeScreen && styles.sectionHalf]}>
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

// REEMPLAZAR la sección del horario en MiPerfilScreen.js

          <View style={[styles.section, isLargeScreen && styles.sectionHalf, styles.horarioContainer]}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="calendar" size={20} color="#212121" /> Mi Horario
            </Text>
            <Text style={styles.sectionDescription}>
              Configura tus días y horas de trabajo
            </Text>

            <View style={styles.horarioContent}>
              <TouchableOpacity
                style={styles.editScheduleButton}
                onPress={() => setShowHorarioModal(true)}
              >
                <Ionicons name="create-outline" size={24} color="#fff" />
                <Text style={styles.editScheduleText}>Editar Horario</Text>
              </TouchableOpacity>

              {/* VISUALIZACIÓN MEJORADA DEL HORARIO */}
              {horarioData && (
                <View style={styles.scheduleDisplay}>
                  <Text style={styles.scheduleDisplayTitle}>Horario Configurado:</Text>

                  {getDiasActivos().length > 0 ? (
                    <>
                      {/* Lista de días activos con sus horas */}
                      {Object.entries(horarioData.diasLaborales)
                        .filter(([_, config]) => config.activo)
                        .map(([dia, config]) => {
                          const horasInicio = config.horas.length > 0 ? config.horas[0] : '---';
                          const horasFin = config.horas.length > 0 ? config.horas[config.horas.length - 1] : '---';

                          return (
                            <View key={dia} style={styles.dayScheduleRow}>
                              <View style={styles.dayBadge}>
                                <Text style={styles.dayBadgeText}>
                                  {dia.charAt(0).toUpperCase() + dia.slice(1)}
                                </Text>
                              </View>
                              <View style={styles.dayHoursContainer}>
                                <Ionicons name="time-outline" size={16} color="#666" />
                                <Text style={styles.dayHoursText}>
                                  {horasInicio} - {horasFin}
                                </Text>
                              </View>
                            </View>
                          );
                        })}

                      {/* Información del almuerzo */}
                      {horarioData.horarioAlmuerzo?.activo && (
                        <View style={styles.lunchInfoCard}>
                          <Ionicons name="restaurant" size={18} color="#FF9800" />
                          <Text style={styles.lunchInfoText}>
                            Almuerzo: {horarioData.horarioAlmuerzo.inicio} - {horarioData.horarioAlmuerzo.fin}
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.noScheduleContainer}>
                      <Ionicons name="calendar-outline" size={48} color="#ccc" />
                      <Text style={styles.noScheduleText}>No has configurado tu horario</Text>
                      <Text style={styles.noScheduleSubtext}>Presiona "Editar Horario" para comenzar</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          <View style={[styles.row, !isLargeScreen && styles.rowColumn]}>
            <View style={[styles.section, isLargeScreen && styles.sectionHalf]}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="share-social" size={20} color="#212121" /> Mis Redes Sociales
              </Text>
              <Text style={styles.sectionDescription}>
                Aparecerán en tu perfil público
              </Text>

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
                    <Text style={styles.saveButtonText}>Guardar Redes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.section, isLargeScreen && styles.sectionHalf, styles.previewContainer]}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="eye" size={20} color="#212121" /> Vista Previa
              </Text>
              <Text style={styles.sectionDescription}>
                Así te verán los clientes
              </Text>

              <View style={styles.previewCardWrapper}>
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
                      Sin redes sociales
                    </Text>
                  )}

                  {horarioData && getDiasActivos().length > 0 && (
                    <View style={styles.previewSchedule}>
                      <Text style={styles.previewScheduleTitle}>Días de trabajo:</Text>
                      <View style={styles.previewDaysContainer}>
                        {getDiasActivos().map(dia => (
                          <View key={dia} style={styles.previewDayBadge}>
                            <Text style={styles.previewDayText}>
                              {dia.substring(0, 3)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
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

      <HorarioBarbero
        barberoId={barberoID}
        visible={showHorarioModal}
        onClose={handleHorarioClose}
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
  row: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 16,
    gap: 16,
    alignItems: 'stretch'
  },
  rowColumn: {
    flexDirection: 'column'
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16
  },
  sectionHalf: {
    flex: 1,
    minHeight: '100%'
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
  horarioContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  horarioContent: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  socialInputContainer: {
    marginBottom: 16
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
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#424242',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    gap: 8
  },
  saveButtonDisabled: {
    backgroundColor: '#999'
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  },
  editScheduleButton: {
    flexDirection: 'row',
    backgroundColor: '#424242',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    alignSelf: 'center',
    minWidth: 200
  },
  editScheduleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  },
  schedulePreview: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center'
  },
  schedulePreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center'
  },
  previewDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'center'
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
  },
  noDaysText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center'
  },
  lunchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    justifyContent: 'center'
  },
  lunchText: {
    fontSize: 14,
    color: '#666'
  },
  previewContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  previewCardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  previewCard: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    maxWidth: 400,
    width: '100%'
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
  previewDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  // AGREGAR estos estilos al final del StyleSheet en MiPerfilScreen.js

scheduleDisplay: {
  backgroundColor: '#f9f9f9',
  padding: 16,
  borderRadius: 12,
  marginTop: 16,
  width: '100%',
  maxWidth: 400,
  alignSelf: 'center',
  borderWidth: 1,
  borderColor: '#E0E0E0'
},
scheduleDisplayTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#212121',
  marginBottom: 16,
  textAlign: 'center'
},
dayScheduleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#fff',
  padding: 12,
  borderRadius: 8,
  marginBottom: 8,
  borderLeftWidth: 3,
  borderLeftColor: '#4CAF50'
},
dayBadge: {
  backgroundColor: '#4CAF50',
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 16,
  minWidth: 100
},
dayBadgeText: {
  color: '#fff',
  fontSize: 13,
  fontWeight: '600',
  textAlign: 'center',
  textTransform: 'capitalize'
},
dayHoursContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  flex: 1,
  justifyContent: 'flex-end'
},
dayHoursText: {
  fontSize: 14,
  color: '#424242',
  fontWeight: '500'
},
lunchInfoCard: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FFF8E1',
  padding: 12,
  borderRadius: 8,
  marginTop: 12,
  gap: 10,
  borderLeftWidth: 3,
  borderLeftColor: '#FF9800'
},
lunchInfoText: {
  fontSize: 14,
  color: '#E65100',
  fontWeight: '600'
},
noScheduleContainer: {
  alignItems: 'center',
  paddingVertical: 30
},
noScheduleText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#999',
  marginTop: 12
},
noScheduleSubtext: {
  fontSize: 13,
  color: '#bbb',
  marginTop: 6,
  textAlign: 'center'
},
});

export default MiPerfilScreen;