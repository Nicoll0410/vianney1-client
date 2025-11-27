import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const diasSemana = [
  { id: 'lunes', nombre: 'Lunes' },
  { id: 'martes', nombre: 'Martes' },
  { id: 'miercoles', nombre: 'Miércoles' },
  { id: 'jueves', nombre: 'Jueves' },
  { id: 'viernes', nombre: 'Viernes' },
  { id: 'sabado', nombre: 'Sábado' },
  { id: 'domingo', nombre: 'Domingo' }
];

// Generar horas desde 8:00 hasta 22:00 con intervalos de 30 minutos
const generateHours = () => {
  const hours = [];
  for (let h = 8; h <= 22; h++) {
    ['00', '30'].forEach(min => {
      hours.push(`${h < 10 ? '0' + h : h}:${min}`);
    });
  }
  return hours;
};

const horasDisponibles = generateHours();

const defaultHorario = {
  diasLaborales: {
    lunes: { activo: false, horas: [] },
    martes: { activo: false, horas: [] },
    miercoles: { activo: false, horas: [] },
    jueves: { activo: false, horas: [] },
    viernes: { activo: false, horas: [] },
    sabado: { activo: false, horas: [] },
    domingo: { activo: false, horas: [] }
  },
  horarioAlmuerzo: { inicio: '13:00', fin: '14:00', activo: true },
  excepciones: []
};

const HorarioBarbero = ({ barberoId, visible, onClose }) => {
  const [horario, setHorario] = useState(defaultHorario);
  const [loading, setLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentDay, setCurrentDay] = useState(null);
  const [almuerzo, setAlmuerzo] = useState(defaultHorario.horarioAlmuerzo);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (visible && barberoId) {
      fetchHorario();
    } else {
      setHorario(defaultHorario);
      setAlmuerzo(defaultHorario.horarioAlmuerzo);
    }
  }, [visible, barberoId]);

  const fetchHorario = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`https://vianney-server.onrender.com/barberos/${barberoId}/horario`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data?.horario) {
        const horarioRecibido = response.data.horario;
        
        // Normalizar datos recibidos
        const diasLaboralesNormalizados = {
          lunes: horarioRecibido.diasLaborales?.lunes || { activo: false, horas: [] },
          martes: horarioRecibido.diasLaborales?.martes || { activo: false, horas: [] },
          miercoles: horarioRecibido.diasLaborales?.miercoles || { activo: false, horas: [] },
          jueves: horarioRecibido.diasLaborales?.jueves || { activo: false, horas: [] },
          viernes: horarioRecibido.diasLaborales?.viernes || { activo: false, horas: [] },
          sabado: horarioRecibido.diasLaborales?.sabado || { activo: false, horas: [] },
          domingo: horarioRecibido.diasLaborales?.domingo || { activo: false, horas: [] }
        };

        // Validar horario de almuerzo
        let horarioAlmuerzoNormalizado = horarioRecibido.horarioAlmuerzo || { 
          inicio: '13:00', 
          fin: '14:00', 
          activo: true 
        };

        // Asegurar que el horario de almuerzo sea válido
        if (!horarioAlmuerzoNormalizado.inicio || !horarioAlmuerzoNormalizado.fin) {
          horarioAlmuerzoNormalizado = { inicio: '13:00', fin: '14:00', activo: true };
        }

        setHorario({
          ...defaultHorario,
          diasLaborales: diasLaboralesNormalizados,
          horarioAlmuerzo: horarioAlmuerzoNormalizado,
          excepciones: horarioRecibido.excepciones || []
        });

        setAlmuerzo(horarioAlmuerzoNormalizado);
      }
    } catch (error) {
      console.error('Error al obtener horario:', error);
      Alert.alert('Error', 'No se pudo cargar el horario del barbero');
      setHorario(defaultHorario);
      setAlmuerzo(defaultHorario.horarioAlmuerzo);
    } finally {
      setLoading(false);
    }
  };

  // Función para seleccionar todos los días
  const toggleTodosLosDias = (activar) => {
    setHorario(prev => {
      const nuevosDias = {...prev.diasLaborales};
      
      Object.keys(nuevosDias).forEach(diaId => {
        nuevosDias[diaId] = {
          ...nuevosDias[diaId],
          activo: activar
        };
      });
      
      return {
        ...prev,
        diasLaborales: nuevosDias
      };
    });
  };

  // Función para seleccionar todas las horas de un día específico
  const toggleTodasLasHoras = (diaId, seleccionarTodas) => {
    setHorario(prev => {
      const diaActual = prev.diasLaborales[diaId] || { activo: false, horas: [] };
      
      return {
        ...prev,
        diasLaborales: {
          ...prev.diasLaborales,
          [diaId]: {
            ...diaActual,
            horas: seleccionarTodas ? [...horasDisponibles] : []
          }
        }
      };
    });
  };

  const toggleDiaActivo = (diaId) => {
    setHorario(prev => ({
      ...prev,
      diasLaborales: {
        ...prev.diasLaborales,
        [diaId]: {
          ...prev.diasLaborales[diaId],
          activo: !prev.diasLaborales[diaId]?.activo
        }
      }
    }));
  };

  const toggleHora = (diaId, hora) => {
    setHorario(prev => {
      const diaActual = prev.diasLaborales[diaId] || { activo: false, horas: [] };
      const horas = [...diaActual.horas];
      const index = horas.indexOf(hora);
      
      if (index === -1) {
        horas.push(hora);
      } else {
        horas.splice(index, 1);
      }

      return {
        ...prev,
        diasLaborales: {
          ...prev.diasLaborales,
          [diaId]: {
            ...diaActual,
            horas: horas.sort()
          }
        }
      };
    });
  };

  const handleAlmuerzoChange = (field, value) => {
    setAlmuerzo(prev => {
      const newAlmuerzo = { ...prev, [field]: value };
      
      // Validar que la hora de fin sea posterior a la de inicio
      if (field === 'inicio' || field === 'fin') {
        const [inicioH, inicioM] = (field === 'inicio' ? value : prev.inicio).split(':').map(Number);
        const [finH, finM] = (field === 'fin' ? value : prev.fin).split(':').map(Number);
        
        const inicioTotal = inicioH * 60 + inicioM;
        const finTotal = finH * 60 + finM;
        
        if (finTotal <= inicioTotal) {
          Alert.alert('Error', 'La hora de fin debe ser posterior a la hora de inicio');
          return prev;
        }
      }
      
      return newAlmuerzo;
    });
  };

  const toggleAlmuerzoActivo = () => {
    setAlmuerzo(prev => ({
      ...prev,
      activo: !prev.activo
    }));
  };

  const saveHorario = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      // Validar horario de almuerzo
      const [inicioH, inicioM] = almuerzo.inicio.split(':').map(Number);
      const [finH, finM] = almuerzo.fin.split(':').map(Number);
      
      const inicioTotal = inicioH * 60 + inicioM;
      const finTotal = finH * 60 + finM;
      
      if (finTotal <= inicioTotal) {
        Alert.alert('Error', 'La hora de fin debe ser posterior a la hora de inicio');
        return;
      }

      if ((finTotal - inicioTotal) < 30) {
        Alert.alert('Error', 'El horario de almuerzo debe ser de al menos 30 minutos');
        return;
      }

      const datosEnviar = {
        diasLaborales: horario.diasLaborales,
        horarioAlmuerzo: almuerzo,
        excepciones: horario.excepciones || []
      };

      await axios.put(`https://vianney-server.onrender.com/barberos/${barberoId}/horario`, datosEnviar, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Mostrar modal de éxito
      setShowSuccessModal(true);
      
      // Cerrar el modal después de 2 segundos
      setTimeout(() => {
        setShowSuccessModal(false);
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error al guardar horario:', error);
      Alert.alert('Error', 'No se pudo guardar el horario');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  if (loading) {
    return (
      <Modal visible={true} transparent animationType="fade">
        <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#424242" />
          <Text>Cargando horario...</Text>
        </View>
      </Modal>
    );
  }

  // Verificar si todos los días están seleccionados
  const todosLosDiasSeleccionados = Object.values(horario.diasLaborales).every(dia => dia.activo);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
      
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Horario del Barbero</Text>
            
            {/* Configuración de almuerzo */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Horario de Almuerzo</Text>
                <TouchableOpacity onPress={toggleAlmuerzoActivo}>
                  <MaterialIcons 
                    name={almuerzo.activo ? "check-box" : "check-box-outline-blank"} 
                    size={24} 
                    color={almuerzo.activo ? "#424242" : "#ccc"} 
                  />
                </TouchableOpacity>
              </View>
              
              {almuerzo.activo && (
                <View style={styles.timeInputContainer}>
                  <View style={styles.timeInput}>
                    <Text style={styles.timeLabel}>Inicio:</Text>
                    <TouchableOpacity 
                      style={styles.timeButton}
                      onPress={() => {
                        setCurrentDay('almuerzo-inicio');
                        setShowTimePicker(true);
                      }}
                    >
                      <Text style={styles.timeText}>{almuerzo.inicio}</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.timeInput}>
                    <Text style={styles.timeLabel}>Fin:</Text>
                    <TouchableOpacity 
                      style={styles.timeButton}
                      onPress={() => {
                        setCurrentDay('almuerzo-fin');
                        setShowTimePicker(true);
                      }}
                    >
                      <Text style={styles.timeText}>{almuerzo.fin}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Días laborales */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Días Laborales</Text>
                <TouchableOpacity 
                  style={styles.selectAllButton}
                  onPress={() => toggleTodosLosDias(!todosLosDiasSeleccionados)}
                >
                  <Text style={styles.selectAllText}>
                    {todosLosDiasSeleccionados ? 'Desmarcar todos' : 'Seleccionar todos'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {diasSemana.map(dia => {
                const diaData = horario.diasLaborales[dia.id] || { activo: false, horas: [] };
                const todasLasHorasSeleccionadas = diaData.horas.length === horasDisponibles.length;
                
                return (
                  <View key={dia.id} style={styles.dayContainer}>
                    <View style={styles.dayHeader}>
                      <TouchableOpacity onPress={() => toggleDiaActivo(dia.id)}>
                        <MaterialIcons 
                          name={diaData.activo ? "check-box" : "check-box-outline-blank"} 
                          size={24} 
                          color={diaData.activo ? "#424242" : "#ccc"} 
                        />
                      </TouchableOpacity>
                      <Text style={styles.dayName}>{dia.nombre}</Text>
                    </View>
                    
                    {diaData.activo && (
                      <View style={styles.hoursContainer}>
                        <View style={styles.hoursHeader}>
                          <Text style={styles.hoursTitle}>Horas disponibles:</Text>
                          <TouchableOpacity 
                            style={styles.selectAllHoursButton}
                            onPress={() => toggleTodasLasHoras(dia.id, !todasLasHorasSeleccionadas)}
                          >
                            <Text style={styles.selectAllHoursText}>
                              {todasLasHorasSeleccionadas ? 'Desmarcar todas' : 'Seleccionar todas'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.hoursGrid}>
                          {horasDisponibles.map(hora => {
                            const isSelected = diaData.horas.includes(hora);
                            return (
                              <TouchableOpacity
                                key={`${dia.id}-${hora}`}
                                style={[
                                  styles.hourButton,
                                  isSelected && styles.hourButtonSelected
                                ]}
                                onPress={() => toggleHora(dia.id, hora)}
                              >
                                <Text style={[
                                  styles.hourText,
                                  isSelected && styles.hourTextSelected
                                ]}>
                                  {hora}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Botones */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={saveHorario}
              >
                <Text style={styles.buttonText}>Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="fade">
        <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.timePickerModal}>
          <View style={styles.timePickerContent}>
            <Text style={styles.timePickerTitle}>
              Seleccionar Hora
            </Text>
            
            <ScrollView contentContainerStyle={styles.timePickerScroll}>
              {horasDisponibles.map(hora => (
                <TouchableOpacity
                  key={hora}
                  style={styles.timeOption}
                  onPress={() => {
                    if (currentDay === 'almuerzo-inicio') {
                      handleAlmuerzoChange('inicio', hora);
                    } else if (currentDay === 'almuerzo-fin') {
                      handleAlmuerzoChange('fin', hora);
                    }
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={styles.timeOptionText}>{hora}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.timePickerClose}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.timePickerCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.successModal}>
          <View style={styles.successContent}>
            <MaterialIcons name="check-circle" size={60} color="#4CAF50" />
            <Text style={styles.successText}>¡Horario guardado con éxito!</Text>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    maxWidth: 800,
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  scrollContent: {
    paddingBottom: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#424242'
  },
  section: {
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
    color: '#424242'
  },
  selectAllButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 5
  },
  selectAllText: {
    color: '#424242',
    fontWeight: '500'
  },
  timeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  timeInput: {
    flex: 1,
    marginHorizontal: 5
  },
  timeLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666'
  },
  timeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center'
  },
  timeText: {
    fontSize: 16
  },
  dayContainer: {
    marginBottom: 15
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  dayName: {
    fontSize: 16,
    marginLeft: 10,
    color: '#424242'
  },
  hoursContainer: {
    marginLeft: 35
  },
  hoursHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  hoursTitle: {
    fontSize: 14,
    color: '#666'
  },
  selectAllHoursButton: {
    padding: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5
  },
  selectAllHoursText: {
    fontSize: 12,
    color: '#424242',
    fontWeight: '500'
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  hourButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    margin: 3,
    minWidth: 70,
    alignItems: 'center'
  },
  hourButtonSelected: {
    backgroundColor: '#424242',
    borderColor: '#424242'
  },
  hourText: {
    fontSize: 14
  },
  hourTextSelected: {
    color: 'white'
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  saveButton: {
    backgroundColor: '#424242'
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  cancelButtonText: {
    color: '#424242'
  },
  timePickerModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  timePickerContent: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#424242'
  },
  timePickerScroll: {
    paddingBottom: 15
  },
  timeOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  timeOptionText: {
    fontSize: 16,
    textAlign: 'center'
  },
  timePickerClose: {
    marginTop: 15,
    padding: 10,
    alignItems: 'center'
  },
  timePickerCloseText: {
    fontSize: 16,
    color: '#424242',
    fontWeight: 'bold'
  },
  successModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  successContent: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#424242'
  }
});

export default HorarioBarbero;