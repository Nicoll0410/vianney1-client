/*  Archivo: screens/clientes/ClientesScreen.js
    Pantalla principal de Clientes (Expo + React Native)
*/
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
  Platform
} from 'react-native';
import {
  MaterialIcons,
  FontAwesome,
  Feather,
  Ionicons,
} from '@expo/vector-icons';

import Paginacion from '../../components/Paginacion';
import Buscador from '../../components/Buscador';
import CrearCliente from './CrearCliente';
import DetalleCliente from './DetalleCliente';
import EditarCliente from './EditarCliente';
import Footer from '../../components/Footer';

import ConfirmarModal from '../../components/ConfirmarModal';
import InfoModal from '../../components/InfoModal';

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

/* --- medidas responsivas --- */
const { width } = Dimensions.get('window');
const isMobile = width < 768;

// Definir BASE_URL
const BASE_URL = Platform.OS === 'android'
  ? 'https://vianney-server.onrender.com'
  : 'https://vianney-server.onrender.com';

/* ╔══════════════╗
   ║  Sub‑componentes  ║
   ╚══════════════╝ */
const Avatar = ({ nombre, avatar }) => {
  const colors = ['#9BA6AE', '#8F9AA2', '#A2ADB4', '#90979F', '#9CA5AD'];
  const color = colors[nombre?.length % colors.length] || '#9BA6AE';

  // Mejor detección de avatares válidos
  const isAvatarValid = avatar && 
                      typeof avatar === 'string' && 
                      avatar.length > 500 &&
                      avatar.startsWith('data:image/') &&
                      !avatar.includes('undefined') &&
                      !avatar.endsWith('//CABEIAgACUQMBIgACEQEDEQH/');

  if (isAvatarValid) {
    return (
      <Image
        source={{ uri: avatar }}
        style={styles.avatarImage}
      />
    );
  }

  // Mostrar iniciales si el avatar no es válido
  return (
    <View style={[styles.avatarContainer, { backgroundColor: color }]}>
      <Text style={styles.avatarText}>
        {nombre?.split(' ').map(p => p[0]).join('').toUpperCase().substring(0, 2)}
      </Text>
    </View>
  );
};

const EstadoVerificacion = ({ verificado }) => (
  <View
    style={[
      styles.estadoContainer,
      verificado ? styles.verificado : styles.noVerificado,
    ]}
  >
    {verificado ? (
      <>
        <MaterialIcons name="verified" size={16} color="#2e7d32" />
        <Text style={[styles.estadoTexto, styles.textoVerificado]}>
          Verificado
        </Text>
      </>
    ) : (
      <>
        <MaterialIcons name="warning" size={16} color="#d32f2f" />
        <Text style={[styles.estadoTexto, styles.textoNoVerificado]}>
          No verificado
        </Text>
      </>
    )}
  </View>
);

const ClienteCard = ({
  item,
  onVer,
  onEditar,
  onEliminar,
  onReenviar,
}) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Avatar nombre={item.nombre} avatar={item.avatar} />
      <View style={styles.cardHeaderText}>
        <Text style={styles.cardNombre}>{item.nombre}</Text>
        <Text style={styles.cardTelefono}>{item.telefono}</Text>
      </View>
    </View>

    <View style={styles.cardDetails}>
      <View style={styles.detailRow}>
        <MaterialIcons
          name="email"
          size={16}
          color="#757575"
          style={styles.detailIcon}
        />
        <Text style={styles.detailText}>{item.email}</Text>
      </View>
      <View style={styles.detailRow}>
        <EstadoVerificacion verificado={item.estaVerificado} />
      </View>
    </View>

    <View style={styles.cardActions}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onVer(item.id)}
      >
        <FontAwesome name="eye" size={18} color="#424242" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onEditar(item.id)}
      >
        <Feather name="edit" size={18} color="#424242" />
      </TouchableOpacity>
      {!item.estaVerificado && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onReenviar(item.id, item.email)}
        >
          <MaterialIcons name="email" size={18} color="#424242" />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onEliminar(item.id)}
      >
        <Feather name="trash-2" size={18} color="#d32f2f" />
      </TouchableOpacity>
    </View>
  </View>
);

/* ╔════════════════════════════════╗
   ║  Pantalla principal de Clientes  ║
   ╚════════════════════════════════╝ */
const ClientesScreen = () => {
  /* --------- estados de datos --------- */
  const [clientes, setClientes] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [clientesPorPagina] = useState(4);
  const [busqueda, setBusqueda] = useState('');

  /* --------- modales --------- */
  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState(null);
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [infoType, setInfoType] = useState('info');

  /* --------- estados de carga --------- */
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /* --------- helper InfoModal --------- */
  const showInfo = (title, message, type = 'info') => {
    setInfoTitle(title);
    setInfoMsg(message);
    setInfoType(type);
    setInfoVisible(true);
  };

  /* ═════════════════════════════════╗
     ║  Cargar clientes desde backend  ║
     ╚════════════════════════════════╝ */
  const fetchClientes = async () => {
    try {
      if (!refreshing) setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(`${BASE_URL}/clientes`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {  // Usar params para query parameters
          all: true,
          search: busqueda
        }
      });
      

      const listaClientes = data.clientes || data;
      const clientesFinales = Array.isArray(listaClientes) ?
        listaClientes :
        listaClientes.clientes || [];
     

      const list = clientesFinales.map(c => {
        // Limpiar avatar si es inválido - mejor detección
        let avatar = c.avatar;
        if (avatar && (
            typeof avatar !== 'string' || 
            avatar.includes('undefined') ||
            (avatar.length < 100 && !avatar.startsWith('data:image/')) ||
            avatar.endsWith('//CABEIAgACUQMBIgACEQEDEQH/')
        )) {
          avatar = null;
        }
        
        return {
          ...c,
          avatar: avatar,
          estaVerificado: c.usuario?.estaVerificado || false,
          email: c.usuario?.email || '',
          usuarioID: c.usuario?.id || null,
        };
      });
     
      setClientes(list);
      setClientesFiltrados(list);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      showInfo('Error', 'No se pudieron cargar los clientes', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* --- cargar al montar y al cambiar búsqueda --- */
  useEffect(() => {
    fetchClientes();
  }, [busqueda]);

  /* --- recargar al volver a la pantalla --- */
  useFocusEffect(
    useCallback(() => {
      fetchClientes();
    }, [])
  );

  /* --- pull to refresh manual --- */
  const onRefresh = () => {
    setRefreshing(true);
    fetchClientes();
  };

  /* --- reajuste de página si quedó vacía (desktop) --- */
  useEffect(() => {
    const total = Math.max(
      1,
      Math.ceil(clientesFiltrados.length / clientesPorPagina)
    );
    if (paginaActual > total) setPaginaActual(total);
  }, [clientesFiltrados, clientesPorPagina, paginaActual]);

  /* ╔════════════════════╗
     ║  Paginación & filtros ║
     ╚════════════════════╝ */
  const i0 = (paginaActual - 1) * clientesPorPagina;
  const clientesMostrar = isMobile
    ? clientesFiltrados
    : clientesFiltrados.slice(i0, i0 + clientesPorPagina);
  const totalPaginas = Math.ceil(
    clientesFiltrados.length / clientesPorPagina
  );
  const cambiarPagina = p => {
    if (p > 0 && p <= totalPaginas) setPaginaActual(p);
  };

  /* ╔═══════════╗
     ║  CRUD acciones  ║
     ╚═══════════╝ */
  const crearCliente = () => setModalCrearVisible(true);
  const handleSearchChange = t => setBusqueda(t);

  const handleCreateCliente = async () => {
    try {
      // 🔥 En vez de hacer el POST aquí,
      // simplemente refrescamos desde el backend
      await fetchClientes();
      setModalCrearVisible(false);
    } catch (error) {
      console.error("Error al refrescar clientes:", error);
      showInfo("Error", "No se pudo refrescar la lista de clientes", "error");
    }
  };

  /* --- ver, editar y actualizar cliente --- */
  const verCliente = async id => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(
        `${BASE_URL}/clientes/by-id/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const c = data.cliente;
      setClienteSeleccionado({
        id: c.id,
        nombre: c.nombre,
        telefono: c.telefono,
        fechaNacimiento: c.fecha_nacimiento
          ? new Date(c.fecha_nacimiento)
          : null,
        avatar: c.avatar,
        estaVerificado: c.usuario?.estaVerificado || false,
        email: c.usuario?.email || '',
        usuarioID: c.usuario?.id || null,
      });
      setModalDetalleVisible(true);
    } catch {
      showInfo('Error', 'No se pudo cargar el cliente', 'error');
    }
  };

  const editarCliente = async id => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(
        `${BASE_URL}/clientes/by-id/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const c = data.cliente;
      setClienteSeleccionado({
        id: c.id,
        nombre: c.nombre,
        telefono: c.telefono,
        fechaNacimiento: c.fecha_nacimiento
          ? new Date(c.fecha_nacimiento)
          : null,
        avatar: c.avatar,
        estaVerificado: c.usuario?.estaVerificado || false,
        email: c.usuario?.email || '',
        usuarioID: c.usuario?.id || null,
      });
      setModalEditarVisible(true);
    } catch {
      showInfo('Error', 'No se pudo cargar para editar', 'error');
    }
  };

  const handleUpdateCliente = async (clienteActualizado) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Preparar los datos para enviar al backend
      const datosActualizacion = {
        nombre: clienteActualizado.nombre,
        telefono: clienteActualizado.telefono,
        fecha_nacimiento: clienteActualizado.fechaNacimiento?.toISOString().split('T')[0],
        email: clienteActualizado.email,
      };

      // Solo agregar avatarBase64 si existe y es válido (diferente del original)
      if (clienteActualizado.avatar && 
          typeof clienteActualizado.avatar === 'string' && 
          clienteActualizado.avatar.startsWith('data:image/') &&
          clienteActualizado.avatar !== clienteSeleccionado?.avatar) {
        datosActualizacion.avatarBase64 = clienteActualizado.avatar;
      }


      // Hacer la petición PUT
      const response = await axios.put(
        `${BASE_URL}/clientes/${clienteActualizado.id}`,
        datosActualizacion,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );

      // Actualizar el estado local con los nuevos datos del response
      if (response.data.cliente) {
        const nuevosClientes = clientes.map(c =>
          c.id === clienteActualizado.id
            ? {
                ...c,
                ...response.data.cliente,
                estaVerificado: response.data.cliente.usuario?.estaVerificado || false,
                email: response.data.cliente.usuario?.email || '',
              }
            : c
        );

        setClientes(nuevosClientes);
        setClientesFiltrados(nuevosClientes);
      }

      setModalEditarVisible(false);
      
      showInfo('✅ Cliente actualizado', 'Datos modificados correctamente', 'success');
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      console.error('Respuesta del error:', error.response?.data);
      
      showInfo(
        'Error',
        error.response?.data?.mensaje || 'Error al actualizar el cliente',
        'error'
      );
    }
  };

  const reenviarEmailVerificacion = async (id, email) => {
    try {
      setSendingEmail(true);
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${BASE_URL}/clientes/${id}/reenviar-verificacion`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showInfo(
        '📧 Email reenviado',
        'Se volvió a enviar el link de verificación',
        'success'
      );
    } catch (error) {
      showInfo(
        'Error',
        error.response?.data?.mensaje || 'No se pudo reenviar',
        'error'
      );
    } finally {
      setSendingEmail(false);
    }
  };

  const eliminarCliente = id => {
    setIdAEliminar(id);
    setConfirmVisible(true);
  };

  const confirmarEliminacion = async () => {
    setConfirmVisible(false);
    setDeleting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(
        `${BASE_URL}/clientes/${idAEliminar}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const nuevos = clientes.filter(c => c.id !== idAEliminar);
      setClientes(nuevos);
      setClientesFiltrados(nuevos);
      showInfo(
        '🗑️ Eliminado',
        'Cliente eliminado correctamente',
        'success'
      );
    } catch (error) {
      const msg = error.response?.data?.mensaje || '';
      if (msg.toLowerCase().includes('citas')) {
        showInfo(
          '⚠️ No puedes eliminar',
          'Este cliente tiene citas asociadas',
          'warning'
        );
      } else {
        showInfo('Error', msg || 'No se pudo eliminar', 'error');
      }
    } finally {
      setDeleting(false);
      setIdAEliminar(null);
    }
  };

  // Función para cancelar eliminación
  const cancelarEliminacion = () => {
    setConfirmVisible(false);
    setIdAEliminar(null);
  };

  /* ╔══════════╗
     ║  Render  ║
     ╚══════════╝ */
  return (
    <View style={styles.mainContainer}>
      <View style={styles.contentWrapper}>
        <View style={styles.contentContainer}>
          {/* --- cabecera + buscador --- */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Clientes</Text>
              <View style={styles.counter}>
                <Text style={styles.counterText}>
                  {clientesFiltrados.length}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={crearCliente}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Crear</Text>
            </TouchableOpacity>
          </View>

          <Buscador
            placeholder="Buscar clientes"
            value={busqueda}
            onChangeText={handleSearchChange}
          />

          {/* --- listado --- */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#424242" />
              <Text style={styles.loadingText}>
                Cargando clientes...
              </Text>
            </View>
          ) : !isMobile ? (
            <>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <View style={[styles.headerCell, styles.nameColumn]}>
                    <Text style={styles.headerText}>Nombre</Text>
                  </View>
                  <View style={[styles.headerCell, styles.telColumn]}>
                    <Text style={styles.headerText}>Teléfono</Text>
                  </View>
                  <View style={[styles.headerCell, styles.emailColumn]}>
                    <Text style={styles.headerText}>Email</Text>
                  </View>
                  <View style={[styles.headerCell, styles.stateColumn]}>
                    <Text style={styles.headerText}>Estado</Text>
                  </View>
                  <View style={[styles.headerCell, styles.actionsColumn]}>
                    <Text style={styles.headerText}>Acciones</Text>
                  </View>
                </View>

                <FlatList
                  data={clientesMostrar}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.tableRow}>
                      <View style={[styles.cell, styles.nameColumn]}>
                        <View style={styles.nameContainer}>
                          <Avatar
                            nombre={item.nombre}
                            avatar={item.avatar}
                          />
                          <Text style={styles.nameText}>
                            {item.nombre}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.cell, styles.telColumn]}>
                        <Text style={styles.telText}>
                          {item.telefono}
                        </Text>
                      </View>
                      <View style={[styles.cell, styles.emailColumn]}>
                        <Text style={styles.emailText}>{item.email}</Text>
                      </View>
                      <View style={[styles.cell, styles.stateColumn]}>
                        <EstadoVerificacion
                          verificado={item.estaVerificado}
                        />
                      </View>
                      <View style={[styles.cell, styles.actionsColumn]}>
                        <View style={styles.actionsContainer}>
                          <TouchableOpacity
                            onPress={() => verCliente(item.id)}
                            style={styles.actionIcon}
                          >
                            <FontAwesome
                              name="eye"
                              size={20}
                              color="#424242"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => editarCliente(item.id)}
                            style={styles.actionIcon}
                          >
                            <Feather
                              name="edit"
                              size={20}
                              color="#424242"
                            />
                          </TouchableOpacity>
                          {!item.estaVerificado && (
                            <TouchableOpacity
                              onPress={() =>
                                reenviarEmailVerificacion(
                                  item.id,
                                  item.email
                                )
                              }
                              style={styles.actionIcon}
                            >
                              <MaterialIcons
                                name="email"
                                size={20}
                                color="#424242"
                              />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            onPress={() => eliminarCliente(item.id)}
                            style={styles.actionIcon}
                            disabled={
                              deleting && idAEliminar === item.id
                            }
                          >
                            {deleting && idAEliminar === item.id ? (
                              <ActivityIndicator
                                size="small"
                                color="#d32f2f"
                              />
                            ) : (
                              <Feather
                                name="trash-2"
                                size={20}
                                color="#d32f2f"
                              />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                />
              </View>

              {totalPaginas > 1 && (
                <View style={styles.paginationContainer}>
                  <Paginacion
                    paginaActual={paginaActual}
                    totalPaginas={totalPaginas}
                    cambiarPagina={cambiarPagina}
                  />
                </View>
              )}
            </>
          ) : (
            <ScrollView
              style={styles.scrollContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                />
              }
            >
              <View style={styles.cardsContainer}>
                {clientesMostrar.map(item => (
                  <ClienteCard
                    key={item.id}
                    item={item}
                    onVer={verCliente}
                    onEditar={editarCliente}
                    onEliminar={eliminarCliente}
                    onReenviar={reenviarEmailVerificacion}
                  />
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* --- footer --- */}
        <View style={styles.footerContainer}>
          <Footer />
        </View>
      </View>

      {/* --- modales CRUD e info --- */}
      <CrearCliente
        visible={modalCrearVisible}
        onClose={() => setModalCrearVisible(false)}
        onCreate={handleCreateCliente}
      />

      <DetalleCliente
        visible={modalDetalleVisible}
        onClose={() => setModalDetalleVisible(false)}
        cliente={clienteSeleccionado}
      />

      <EditarCliente
        visible={modalEditarVisible}
        onClose={() => setModalEditarVisible(false)}
        cliente={clienteSeleccionado}
        onUpdate={handleUpdateCliente}
      />

      <ConfirmarModal
        visible={confirmVisible}
        onCancel={cancelarEliminacion} // CORRECCIÓN: Usar la función correcta
        onConfirm={confirmarEliminacion}
        title="Eliminar cliente"
        message="¿Estás seguro de eliminar este cliente?"
      />

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

/* ╔═════════╗
   ║  Estilos ║
   ╚═════════╝ */
const styles = StyleSheet.create({
  /* Layout general */
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  contentWrapper: { flex: 1, justifyContent: 'space-between' },
  contentContainer: { flex: 1, padding: 16 },
  footerContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  paginationContainer: { paddingBottom: 16 },

  /* Loading */
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#424242' },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#424242', marginRight: 12 },
  counter: {
    backgroundColor: '#EEEEEE',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: { fontWeight: 'bold', fontSize: 14, color: '#424242' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#424242',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addButtonText: { marginLeft: 8, color: '#fff', fontWeight: '500', fontSize: 14 },

  /* Tabla desktop */
  table: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#424242', paddingVertical: 12 },
  headerCell: { justifyContent: 'center', paddingHorizontal: 8 },
  headerText: { fontWeight: 'bold', color: '#fff', fontSize: 14 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  cell: { justifyContent: 'center', paddingHorizontal: 8 },
  nameColumn: { flex: 3, alignItems: 'flex-start' },
  telColumn: { flex: 2, alignItems: 'center' },
  emailColumn: { flex: 3, alignItems: 'center' },
  stateColumn: { flex: 2, alignItems: 'center' },
  actionsColumn: { flex: 2, alignItems: 'flex-end' },
  nameContainer: { flexDirection: 'row', alignItems: 'center' },
  nameText: { marginLeft: 10, fontWeight: '500', fontSize: 14, color: '#424242' },
  telText: { fontSize: 14, color: '#424242' },
  emailText: { fontSize: 14, color: '#424242' },
  actionsContainer: { flexDirection: 'row' },
  actionIcon: { marginHorizontal: 6, padding: 4 },

  /* Cards mobile */
  scrollContainer: { flex: 1 },
  cardsContainer: { paddingBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardHeaderText: { marginLeft: 12, flex: 1 },
  cardNombre: { fontSize: 16, fontWeight: '600', color: '#212121', marginBottom: 2 },
  cardTelefono: { fontSize: 14, color: '#757575' },
  cardDetails: { marginLeft: 52, marginBottom: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detailIcon: { marginRight: 8 },
  detailText: { fontSize: 14, color: '#616161' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  actionButton: { marginLeft: 12, padding: 8, borderRadius: 20, backgroundColor: '#f5f5f5' },

  /* Avatar */
  avatarContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover'
  },

  /* Estado */
  estadoContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, alignSelf: 'center' },
  verificado: { backgroundColor: '#E8F5E9' },
  noVerificado: { backgroundColor: '#FFEBEE' },
  estadoTexto: { marginLeft: 6, fontSize: 13, fontWeight: '500' },
  textoVerificado: { color: '#2e7d32' },
  textoNoVerificado: { color: '#d32f2f' },
});

export default ClientesScreen;