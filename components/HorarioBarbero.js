//HorarioBarbero.js - VERSIÓN CON PALETA DE COLORES ACTUALIZADA
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const diasSemana = [
  { id: 'lunes', nombre: 'Lunes', icon: 'wb-sunny' },
  { id: 'martes', nombre: 'Martes', icon: 'wb-sunny' },
  { id: 'miercoles', nombre: 'Miércoles', icon: 'wb-sunny' },
  { id: 'jueves', nombre: 'Jueves', icon: 'wb-sunny' },
  { id: 'viernes', nombre: 'Viernes', icon: 'wb-sunny' },
  { id: 'sabado', nombre: 'Sábado', icon: 'wb-sunny' },
  { id: 'domingo', nombre: 'Domingo', icon: 'brightness-3' }
];

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
        
        const diasLaboralesNormalizados = {
          lunes: horarioRecibido.diasLaborales?.lunes || { activo: false, horas: [] },
          martes: horarioRecibido.diasLaborales?.martes || { activo: false, horas: [] },
          miercoles: horarioRecibido.diasLaborales?.miercoles || { activo: false, horas: [] },
          jueves: horarioRecibido.diasLaborales?.jueves || { activo: false, horas: [] },
          viernes: horarioRecibido.diasLaborales?.viernes || { activo: false, horas: [] },
          sabado: horarioRecibido.diasLaborales?.sabado || { activo: false, horas: [] },
          domingo: horarioRecibido.diasLaborales?.domingo || { activo: false, horas: [] }
        };

        let horarioAlmuerzoNormalizado = horarioRecibido.horarioAlmuerzo || { 
          inicio: '13:00', 
          fin: '14:00', 
          activo: true 
        };

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

      setShowSuccessModal(true);
      
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
          <Text style={styles.loadingText}>Cargando horario...</Text>
        </View>
      </Modal>
    );
  }

  const todosLosDiasSeleccionados = Object.values(horario.diasLaborales).every(dia => dia.activo);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="access-time" size={32} color="#424242" />
            <Text style={styles.title}>Configurar Horario</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <MaterialIcons name="close" size={24} color="#424242" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            {/* Configuración de almuerzo */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <MaterialIcons name="restaurant" size={24} color="#424242" />
                  <Text style={styles.sectionTitle}>Horario de Almuerzo</Text>
                </View>
                <TouchableOpacity onPress={toggleAlmuerzoActivo} style={styles.switchContainer}>
                  <View style={[styles.switch, almuerzo.activo && styles.switchActive]}>
                    <View style={[styles.switchThumb, almuerzo.activo && styles.switchThumbActive]} />
                  </View>
                </TouchableOpacity>
              </View>
              
              {almuerzo.activo && (
                <View style={styles.timeInputContainer}>
                  <TouchableOpacity 
                    style={styles.timeInput}
                    onPress={() => {
                      setCurrentDay('almuerzo-inicio');
                      setShowTimePicker(true);
                    }}
                  >
                    <Text style={styles.timeLabel}>Inicio</Text>
                    <View style={styles.timeValueContainer}>
                      <MaterialIcons name="schedule" size={20} color="#424242" />
                      <Text style={styles.timeValue}>{almuerzo.inicio}</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <View style={styles.timeSeparator}>
                    <MaterialIcons name="arrow-forward" size={24} color="#666" />
                  </View>

                  <TouchableOpacity 
                    style={styles.timeInput}
                    onPress={() => {
                      setCurrentDay('almuerzo-fin');
                      setShowTimePicker(true);
                    }}
                  >
                    <Text style={styles.timeLabel}>Fin</Text>
                    <View style={styles.timeValueContainer}>
                      <MaterialIcons name="schedule" size={20} color="#424242" />
                      <Text style={styles.timeValue}>{almuerzo.fin}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Días laborales */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleContainer}>
                  <MaterialIcons name="event-available" size={24} color="#424242" />
                  <Text style={styles.sectionTitle}>Días Laborales</Text>
                </View>
                <TouchableOpacity 
                  style={styles.selectAllButton}
                  onPress={() => toggleTodosLosDias(!todosLosDiasSeleccionados)}
                >
                  <MaterialIcons 
                    name={todosLosDiasSeleccionados ? "check-box" : "check-box-outline-blank"} 
                    size={20} 
                    color="#424242" 
                  />
                  <Text style={styles.selectAllText}>
                    {todosLosDiasSeleccionados ? 'Desmarcar todos' : 'Seleccionar todos'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {diasSemana.map(dia => {
                const diaData = horario.diasLaborales[dia.id] || { activo: false, horas: [] };
                const todasLasHorasSeleccionadas = diaData.horas.length === horasDisponibles.length;
                
                return (
                  <View key={dia.id} style={styles.dayCard}>
                    <TouchableOpacity 
                      style={[styles.dayHeader, diaData.activo && styles.dayHeaderActive]}
                      onPress={() => toggleDiaActivo(dia.id)}
                    >
                      <View style={styles.dayTitleContainer}>
                        <MaterialIcons name={dia.icon} size={20} color={diaData.activo ? "#424242" : "#666"} />
                        <Text style={[styles.dayName, diaData.activo && styles.dayNameActive]}>
                          {dia.nombre}
                        </Text>
                      </View>
                      <MaterialIcons 
                        name={diaData.activo ? "check-circle" : "radio-button-unchecked"} 
                        size={24} 
                        color={diaData.activo ? "#424242" : "#666"} 
                      />
                    </TouchableOpacity>
                    
                    {diaData.activo && (
                      <View style={styles.hoursContainer}>
                        <View style={styles.hoursHeader}>
                          <Text style={styles.hoursTitle}>
                            <MaterialIcons name="schedule" size={16} color="#666" /> Horas disponibles
                          </Text>
                          <TouchableOpacity 
                            style={styles.selectAllHoursButton}
                            onPress={() => toggleTodasLasHoras(dia.id, !todasLasHorasSeleccionadas)}
                          >
                            <MaterialIcons 
                              name={todasLasHorasSeleccionadas ? "done-all" : "add"} 
                              size={16} 
                              color="#424242" 
                            />
                            <Text style={styles.selectAllHoursText}>
                              {todasLasHorasSeleccionadas ? 'Quitar todas' : 'Todas'}
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
                                  styles.hourChip,
                                  isSelected && styles.hourChipSelected
                                ]}
                                onPress={() => toggleHora(dia.id, hora)}
                              >
                                <MaterialIcons 
                                  name="access-time" 
                                  size={14} 
                                  color={isSelected ? "#fff" : "#666"} 
                                />
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
                style={styles.cancelButton}
                onPress={onClose}
              >
                <MaterialIcons name="close" size={20} color="black" />
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveHorario}
              >
                <MaterialIcons name="check-circle" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="fade">
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.timePickerModal}>
          <View style={styles.timePickerContent}>
            <View style={styles.timePickerHeader}>
              <MaterialIcons name="schedule" size={24} color="#424242" />
              <Text style={styles.timePickerTitle}>Seleccionar Hora</Text>
            </View>
            
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
                  <MaterialIcons name="access-time" size={20} color="#424242" />
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
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.successModal}>
          <View style={styles.successContent}>
            <View style={styles.successIconContainer}>
              <MaterialIcons name="check-circle" size={80} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>¡Perfecto!</Text>
            <Text style={styles.successText}>Horario guardado correctamente</Text>
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
    maxWidth: 900,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    position: 'relative'
  },
  closeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 15,
    padding: 30
  },
  loadingText: {
    marginTop: 15,
    color: '#424242',
    fontSize: 16,
    fontWeight: '600'
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#424242',
    marginLeft: 12
  },
  sectionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121'
  },
  switchContainer: {
    padding: 5
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D9D9D9',
    padding: 3,
    justifyContent: 'center'
  },
  switchActive: {
    backgroundColor: '#424242'
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }]
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#424242'
  },
  selectAllText: {
    color: '#424242',
    fontWeight: '600',
    fontSize: 13
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600'
  },
  timeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  timeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121'
  },
  timeSeparator: {
    paddingBottom: 20
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fafafa'
  },
  dayHeaderActive: {
    backgroundColor: '#f0f0f0'
  },
  dayTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666'
  },
  dayNameActive: {
    color: '#424242'
  },
  hoursContainer: {
    padding: 15,
    backgroundColor: '#fff'
  },
  hoursHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  hoursTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600'
  },
  selectAllHoursButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    gap: 4,
    borderWidth: 1,
    borderColor: '#424242'
  },
  selectAllHoursText: {
    fontSize: 12,
    color: '#424242',
    fontWeight: '600'
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  hourChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9D9D9',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6
  },
  hourChipSelected: {
    backgroundColor: '#424242',
    borderColor: '#424242'
  },
  hourText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666'
  },
  hourTextSelected: {
    color: '#fff'
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#D9D9D9',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    gap: 8
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black'
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#424242',
    borderRadius: 12,
    gap: 8
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  timePickerModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  timePickerContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242'
  },
  timePickerScroll: {
    padding: 15
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12
  },
  timeOptionText: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500'
  },
  timePickerClose: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  timePickerCloseText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600'
  },
  successModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  successContent: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10
  },
  successIconContainer: {
    marginBottom: 20
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8
  },
  successText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  }
});

export default HorarioBarbero;