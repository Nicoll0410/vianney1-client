/* ───────────────────────────────────────────────────────────
    CitasScreen.js – Con botón de cancelar en la lista
    ─────────────────────────────────────────────────────────── */
import React, {
  useState, useEffect, useContext, useCallback,
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView,
  Alert, ActivityIndicator, Dimensions, Modal,
} from 'react-native';
import {
  MaterialIcons, FontAwesome, AntDesign, Ionicons,
} from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import Paginacion  from '../../components/Paginacion';
import Buscador    from '../../components/Buscador';
import Footer      from '../../components/Footer';
import CrearCita   from './CrearCita';
import DetalleCita from './DetalleCita';
import ConfirmarModal from '../../components/ConfirmarModal'; // Importar el modal de confirmación
import { AuthContext } from '../../contexts/AuthContext';

/* ------------------------ Constantes ------------------------ */
const API = 'https://vianney-server.onrender.com';
const { width } = Dimensions.get('window');
const isMobile  = width <= 768;

/* ------------------ Componentes auxiliares ----------------- */
const Avatar = ({ nombre }) => {
  const colores = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF5'];
  const bg = colores[nombre?.length % colores.length] || '#FF5733';
  return (
    <View style={[styles.avatarContainer, { backgroundColor: bg }]}>
      <Text style={styles.avatarText}>
        {nombre?.split(' ').map((p) => p[0]).join('').toUpperCase()}
      </Text>
    </View>
  );
};

const EtiquetaEstado = ({ estado = '' }) => {
  const map = {
    pendiente : ['rgba(206,209,0,0.2)', '#CED100'],
    confirmada: ['rgba(0,123,255,0.2)', '#007BFF'], // Nuevo estado
    expirada  : ['rgba(130,23,23,0.2)', '#821717'],
    cancelada : ['rgba(255,0,0,0.2)',   'red'],
    completa  : ['rgba(0,255,0,0.2)',   'green'],
    completada: ['rgba(0,255,0,0.2)',   'green'],
  };
  const [bg, color] = map[estado.toLowerCase()] || map.pendiente;
  return (
    <View style={[styles.estadoContainer, { backgroundColor: bg }]}>
      <Text style={[styles.estadoTexto, { color }]}>{estado}</Text>
    </View>
  );
};

/* --------------------- CARD (móvil) ------------------------ */
const CitaCard = ({ item, onCancel, onView }) => (
  <View style={styles.cardContainer}>
    <View style={styles.cardHeader}>
      <View style={styles.cardBarberContainer}>
        <Avatar nombre={item.barbero?.nombre} />
        <Text style={styles.cardBarberName}>{item.barbero?.nombre}</Text>
      </View>
      <EtiquetaEstado estado={item.estado} />
    </View>

    <View style={styles.cardBody}>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Servicio:</Text>
        <Text style={styles.cardValue}>{item.servicio?.nombre}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Fecha:</Text>
        <Text style={styles.cardValue}>{item.fechaFormateada}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.cardLabel}>Hora:</Text>
        <Text style={styles.cardValue}>{item.hora}</Text>
      </View>
    </View>

    <View style={styles.cardActions}>
      {/* Botón de cancelar para citas confirmadas o pendientes */}
      {(item.estado === 'Confirmada' || item.estado === 'Pendiente') && (
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => onCancel(item)}
        >
          <AntDesign name="closecircle" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Cancelar</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity 
        style={styles.viewButton} 
        onPress={() => onView(item)}
      >
        <FontAwesome name="eye" size={20} color="#000" />
      </TouchableOpacity>
    </View>
  </View>
);

/* ===================== COMPONENTE ========================== */
const CitasScreen = () => {
  const { userRole } = useContext(AuthContext);

  const [citas,          setCitas]          = useState([]);
  const [filtradas,      setFiltradas]      = useState([]);
  const [pagina,         setPagina]         = useState(1);
  const porPagina                         = isMobile ? 6 : 4;
  const [search,         setSearch]         = useState('');
  const [filtroEstado,   setFiltroEstado]   = useState('todos');
  const [showFiltroModal, setShowFiltroModal] = useState(false);

  /* Modales */
  const [showCrear,      setShowCrear]      = useState(false);
  const [showDetalle,    setShowDetalle]    = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [citaACancelar,  setCitaACancelar]  = useState(null);
  const [detalle,        setDetalle]        = useState(null);
  const [infoCreacion,   setInfoCreacion]   = useState(null);

  const [loading,        setLoading]        = useState(false);

  /* ---------------- Helpers endpoint -------------------- */
  const listEndpoint = () => {
    if (userRole === 'Cliente') return '/citas/patient-dates';
    if (userRole === 'Barbero') return '/citas/by-barber?all=true';
    return '/citas?all=true';
  };

  /* ----------------- Fetch citas ------------------------ */
  const fetchCitas = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(`${API}${listEndpoint()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const lista = data.citas || data;
      setCitas(lista);
      setFiltradas(lista);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { 
    fetchCitas(); 
  }, [userRole]));

  /* ------------------ Búsqueda y Filtrado -------------------------- */
  useEffect(() => {
    let resultado = citas;

    // Aplicar filtro por estado
    if (filtroEstado !== 'todos') {
      resultado = resultado.filter(cita => 
        cita.estado?.toLowerCase() === filtroEstado.toLowerCase()
      );
    }

    // Aplicar búsqueda por texto
    if (search.trim()) {
      const t = search.toLowerCase();
      resultado = resultado.filter((c) =>
        (c.barbero?.nombre  || '').toLowerCase().includes(t) ||
        (c.cliente?.nombre  || '').toLowerCase().includes(t) ||
        (c.servicio?.nombre || '').toLowerCase().includes(t) ||
        (c.estado           || '').toLowerCase().includes(t)
      );
    }

    setFiltradas(resultado);
    setPagina(1);
  }, [search, citas, filtroEstado]);

  const idxStart   = (pagina - 1) * porPagina;
  const show       = isMobile ? filtradas : filtradas.slice(idxStart, idxStart + porPagina);
  const totalPags  = Math.max(1, Math.ceil(filtradas.length / porPagina));

  /* ---------------- Cancelar cita ---------------------- */
const cancelarCita = async () => {
  if (!citaACancelar) return;
  
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.put(
      `${API}/citas/cancelar-cita/${citaACancelar.id}`, 
      {
        zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    // Actualizar lista de citas
    await fetchCitas();
    
    // Mostrar mensaje de éxito
    Alert.alert(
      "Éxito", 
      response.data.mensaje || "Cita cancelada correctamente"
    );
    
    setShowCancelModal(false);
    setCitaACancelar(null);
    
  } catch (error) {
    console.error("Error al cancelar cita:", error);
    Alert.alert(
      "Error", 
      error.response?.data?.mensaje || "Error al cancelar la cita"
    );
  }
};

  /* -------------------- UI ------------------------------ */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#424242" />
        <Text style={styles.loadingText}>Cargando citas…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* -------- Header -------- */}
      <View style={styles.header}>
        <View style={styles.tituloContainer}>
          <Text style={styles.titulo}>Citas</Text>
          <View style={styles.contadorContainer}>
            <Text style={styles.contadorTexto}>{filtradas.length}</Text>
          </View>
        </View>
        
        {/* Botón de Filtrado */}
        <TouchableOpacity 
          style={styles.filtroButton}
          onPress={() => setShowFiltroModal(true)}
        >
          <MaterialIcons name="filter-list" size={20} color="#fff" />
          <Text style={styles.filtroButtonText}>Filtrado</Text>
        </TouchableOpacity>
      </View>

      {/* Indicador de filtro activo */}
      {filtroEstado !== 'todos' && (
        <View style={styles.filtroActivoContainer}>
          <Text style={styles.filtroActivoText}>
            Filtrado por: <Text style={styles.filtroEstadoText}>{filtroEstado}</Text>
          </Text>
          <TouchableOpacity 
            onPress={() => setFiltroEstado('todos')}
            style={styles.quitarFiltroButton}
          >
            <AntDesign name="close" size={16} color="#424242" />
          </TouchableOpacity>
        </View>
      )}

      <Buscador
        placeholder="Buscar cita por barbero, servicio, estado…"
        value={search}
        onChangeText={setSearch}
      />

      {/* ----------- Lista ----------- */}
      {isMobile ? (
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.cardsContainer}>
            {filtradas.map((c) => (
              <CitaCard
                item={c}
                key={c.id}
                onCancel={(item) => {
                  setCitaACancelar(item);
                  setShowCancelModal(true);
                }}
                onView={(item) => { 
                  setDetalle(item); 
                  setShowDetalle(true); 
                }}
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        <>
          {/* ---- Tabla Desktop ---- */}
          <View style={styles.tabla}>
            <View style={styles.filaEncabezado}>
              {[
                ['Barbero', 2], ['Estado', 1.5], ['Servicio', 2],
                ['Fecha', 1.5], ['Hora', 1], ['Acciones', 1.5],
              ].map(([txt, flex], i) => (
                <View
                  key={i}
                  style={[
                    styles.celdaEncabezado,
                    { flex, alignItems: i === 0 ? 'flex-start' : 'center' },
                  ]}
                >
                  <Text style={styles.encabezado}>{txt}</Text>
                </View>
              ))}
            </View>

            <FlatList
              data={show}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <View style={styles.fila}>
                  <View style={[styles.celda, styles.columnaBarbero]}>
                    <View style={styles.contenedorBarbero}>
                      <Avatar nombre={item.barbero?.nombre} />
                      <Text style={styles.textoBarbero}>{item.barbero?.nombre}</Text>
                    </View>
                  </View>
                  <View style={[styles.celda, styles.columnaEstado]}>
                    <EtiquetaEstado estado={item.estado} />
                  </View>
                  <View style={[styles.celda, styles.columnaServicio]}>
                    <Text style={styles.textoServicio}>{item.servicio?.nombre}</Text>
                  </View>
                  <View style={[styles.celda, styles.columnaFecha]}>
                    <Text style={styles.fechaTexto}>{item.fechaFormateada}</Text>
                  </View>
                  <View style={[styles.celda, styles.columnaHora]}>
                    <Text style={styles.horaTexto}>{item.hora}</Text>
                  </View>
                  <View style={[styles.celda, styles.columnaAcciones]}>
                    <View style={styles.contenedorAcciones}>
                      {/* Botón de cancelar */}
                      {(item.estado === 'Confirmada' || item.estado === 'Pendiente') && (
                        <TouchableOpacity 
                          onPress={() => {
                            setCitaACancelar(item);
                            setShowCancelModal(true);
                          }} 
                          style={[styles.botonAccion, styles.cancelButtonDesktop]}
                        >
                          <AntDesign name="closecircle" size={20} color="#fff" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity 
                        onPress={() => { 
                          setDetalle(item); 
                          setShowDetalle(true); 
                        }} 
                        style={styles.viewButtonDesktop}
                      >
                        <FontAwesome name="eye" size={20} color="#000" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
          </View>

          <View style={styles.paginacionContainer}>
            <Paginacion
              paginaActual={pagina}
              totalPaginas={totalPags}
              cambiarPagina={setPagina}
            />
          </View>
        </>
      )}

      {/* -------- Modales -------- */}
      
      {/* Modal de Filtrado Mejorado */}
      <Modal
        visible={showFiltroModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFiltroModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
            <View style={styles.modalFiltroContent}>
              {/* Header del Modal */}
              <View style={styles.modalFiltroHeader}>
                <View style={styles.modalHeaderIcon}>
                  <Ionicons name="options" size={28} color="#424242" />
                </View>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalFiltroTitle}>Filtrar por Estado</Text>
                  <Text style={styles.modalFiltroSubtitle}>Selecciona el estado que deseas visualizar</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setShowFiltroModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close-circle" size={28} color="#666" />
                </TouchableOpacity>
              </View>
              
              {/* Opciones de Filtrado */}
              <View style={styles.filtroOptionsContainer}>
                {[
                  { 
                    key: 'todos', 
                    label: 'Todos los estados', 
                    icon: 'grid-outline',
                    color: '#424242',
                    description: 'Mostrar todas las citas'
                  },
                  { 
                    key: 'Confirmada', 
                    label: 'Confirmada', 
                    icon: 'checkmark-done-circle',
                    color: '#007BFF',
                    description: 'Citas confirmadas por el cliente'
                  },
                  { 
                    key: 'Completa', 
                    label: 'Completa', 
                    icon: 'checkmark-circle',
                    color: '#4CAF50',
                    description: 'Citas finalizadas exitosamente'
                  },
                  { 
                    key: 'Cancelada', 
                    label: 'Cancelada', 
                    icon: 'close-circle',
                    color: '#FF4444',
                    description: 'Citas canceladas'
                  },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filtroOption,
                      filtroEstado === option.key && styles.filtroOptionSelected
                    ]}
                    onPress={() => {
                      setFiltroEstado(option.key);
                      setShowFiltroModal(false);
                    }}
                  >
                    <View style={styles.filtroOptionLeft}>
                      <View style={[
                        styles.optionIconContainer,
                        { backgroundColor: filtroEstado === option.key ? option.color : '#f0f0f0' }
                      ]}>
                        <Ionicons 
                          name={option.icon} 
                          size={22} 
                          color={filtroEstado === option.key ? '#fff' : option.color} 
                        />
                      </View>
                      <View style={styles.optionTextContainer}>
                        <Text style={[
                          styles.filtroOptionText,
                          filtroEstado === option.key && styles.filtroOptionTextSelected
                        ]}>
                          {option.label}
                        </Text>
                        <Text style={styles.filtroOptionDescription}>
                          {option.description}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.optionRight}>
                      {filtroEstado === option.key ? (
                        <View style={[styles.selectedIndicator, { backgroundColor: option.color }]}>
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                      ) : (
                        <View style={styles.unselectedIndicator}>
                          <View style={[styles.radioOuter, { borderColor: option.color }]} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Footer del Modal */}
              <View style={styles.modalFiltroFooter}>
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={() => {
                    setFiltroEstado('todos');
                    setShowFiltroModal(false);
                  }}
                >
                  <Ionicons name="refresh" size={18} color="#666" />
                  <Text style={styles.resetButtonText}>Restablecer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>

      <DetalleCita
        visible={showDetalle}
        onClose={() => setShowDetalle(false)}
        cita={detalle}
        onRefresh={fetchCitas}
      />

      {/* Modal de Confirmación para Cancelar */}
      <ConfirmarModal
        visible={showCancelModal}
        onCancel={() => {
          setShowCancelModal(false);
          setCitaACancelar(null);
        }}
        onConfirm={cancelarCita}
        titulo="Cancelar Cita"
        mensaje={`¿Estás seguro de que quieres cancelar la cita de ${
          citaACancelar?.cliente?.nombre || citaACancelar?.pacienteTemporalNombre || 'este cliente'
        } programada para el ${citaACancelar?.fechaFormateada} a las ${citaACancelar?.hora}?`}
        textoConfirmar="Sí, Cancelar"
        textoCancelar="No, Conservar"
        tipo="peligro"
        icono="danger"
      />

      <Footer />
    </View>
  );
};

/* ─────────────────── ESTILOS ─────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: isMobile ? 10 : 16,
    backgroundColor: '#fff',
  },
  cancelButton: {
    backgroundColor: '#FF4444',
  },
  cancelButtonDesktop: {
    backgroundColor: '#FF4444',
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#424242',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tituloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titulo: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: 'bold',
    marginRight: 10,
  },
  contadorContainer: {
    backgroundColor: '#D9D9D9',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contadorTexto: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  filtroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#424242',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  filtroButtonText: {
    marginLeft: 8,
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  filtroActivoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  filtroActivoText: {
    fontSize: 14,
    color: '#666',
  },
  filtroEstadoText: {
    fontWeight: 'bold',
    color: '#424242',
  },
  quitarFiltroButton: {
    padding: 4,
  },
  
  /* Estilos Mejorados para el Modal de Filtrado */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  blurContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalFiltroContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 450,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalFiltroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 24,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalHeaderIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalFiltroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 4,
  },
  modalFiltroSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    marginTop: 2,
  },
  filtroOptionsContainer: {
    padding: 8,
  },
  filtroOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filtroOptionSelected: {
    backgroundColor: 'rgba(66, 66, 66, 0.05)',
    borderColor: '#e9ecef',
  },
  filtroOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  filtroOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 2,
  },
  filtroOptionTextSelected: {
    color: '#424242',
  },
  filtroOptionDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 16,
  },
  optionRight: {
    marginLeft: 12,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  modalFiltroFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  resetButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#424242',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addButtonText: {
    marginLeft: 8,
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  scrollContainer: {
    flex: 1,
  },
  cardsContainer: {
    paddingBottom: 20,
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardBarberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBarberName: {
    marginLeft: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardBody: {
    marginVertical: 10,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  cardLabel: {
    fontWeight: 'bold',
    width: 80,
    color: '#555',
  },
  cardValue: {
    flex: 1,
    color: '#333',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 10,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  expireButton: {
    backgroundColor: '#F44336',
  },
  viewButton: {
    backgroundColor: '#D9D9D9',
    padding: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  actionButtonText: {
    marginLeft: 5,
    color: 'white',
    fontSize: 14,
  },
  tabla: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
    flex: 1,
    marginBottom: 10,
  },
  filaEncabezado: {
    flexDirection: 'row',
    backgroundColor: '#424242',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  celdaEncabezado: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  fila: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  celda: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  columnaBarbero: {
    flex: 2,
    alignItems: 'flex-start',
  },
  columnaEstado: {
    flex: 1.5,
    alignItems: 'center',
  },
  columnaServicio: {
    flex: 2,
    alignItems: 'center',
  },
  columnaFecha: {
    flex: 1.5,
    alignItems: 'center',
  },
  columnaHora: {
    flex: 1,
    alignItems: 'center',
  },
  columnaAcciones: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  contenedorBarbero: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textoBarbero: {
    marginLeft: 10,
    fontWeight: 'bold',
  },
  textoServicio: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  fechaTexto: {
    fontSize: 14,
    color: '#424242',
  },
  horaTexto: {
    fontSize: 14,
    color: '#424242',
  },
  encabezado: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
  },
  contenedorAcciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  botonAccion: {
    marginHorizontal: 6,
  },
  viewButtonDesktop: {
    backgroundColor: '#D9D9D9',
    padding: 6,
    borderRadius: 20,
    marginLeft: 6,
  },
  estadoContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  estadoTexto: {
    fontWeight: 'bold',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  paginacionContainer: {
    marginBottom: 35,
  },
});

export default CitasScreen;