import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
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
} from 'react-native';
import {
  MaterialIcons,
  FontAwesome,
  Feather,
  Ionicons,
} from '@expo/vector-icons';

import Paginacion from '../../components/Paginacion';
import Buscador from '../../components/Buscador';
import CrearBarbero from './CrearBarbero';
import DetalleBarbero from './DetalleBarbero';
import EditarBarbero from './EditarBarbero';
import Footer from '../../components/Footer';
import ConfirmarModal from '../../components/ConfirmarModal';
import InfoModal from '../../components/InfoModal';

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

/* —— responsivo —— */
const { width } = Dimensions.get('window');
const isMobile = width < 768;

/* —— util fechas —— */
const toYMD = (v) =>
  !v ? null : v instanceof Date ? v.toISOString().split('T')[0] : v.split('T')[0];

/* ╔══════════════╗  Sub‑componentes  ╚══════════════╝ */
const Avatar = ({ nombre, avatar }) => {
  const colors = ['#9BA6AE', '#8F9AA2', '#A2ADB4', '#90979F', '#9CA5AD'];
  const color = colors[nombre?.length % colors.length] || '#9BA6AE';

  // Mejor detección de avatares truncados (igual que en clientes)
  const isAvatarValid = avatar && 
                       typeof avatar === 'string' && 
                       avatar.length > 500 && // Mínimo razonable para una imagen
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
    ]}>
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

const RolBarbero = ({ rol }) => (
  <View
    style={[
      styles.rolContainer,
      rol === 'ADMIN' ? styles.rolAdmin : styles.rolBarbero,
    ]}>
    <Text
      style={[
        styles.rolTexto,
        rol === 'ADMIN' ? styles.textoAdmin : styles.textoBarbero,
      ]}>
      {rol} {/* Cambiado para mostrar directamente el valor del rol */}
    </Text>
  </View>
);

const BarberoCard = ({ item, onVer, onEditar, onEliminar, onReenviar }) => (
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
        <RolBarbero rol={item.rol} />
      </View>
    </View>

    <View style={styles.cardActions}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onVer(item.id)}>
        <FontAwesome name="eye" size={18} color="#424242" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onEditar(item.id)}>
        <Feather name="edit" size={18} color="#424242" />
      </TouchableOpacity>
      {!item.estaVerificado && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onReenviar(item.id)}>
          <MaterialIcons name="email" size={18} color="#424242" />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => onEliminar(item.id)}>
        <Feather name="trash-2" size={18} color="#d32f2f" />
      </TouchableOpacity>
    </View>
  </View>
);

/* ╔════════════════════════════════╗
  ║   Pantalla principal Barberos  ║
  ╚════════════════════════════════╝ */
const BarberosScreen = () => {
  /* —— estado base —— */
  const [barberos, setBarberos] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [barberosPorPagina] = useState(4);
  const [busqueda, setBusqueda] = useState('');

  /* modales e info */
  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState(null);
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [infoType, setInfoType] = useState('info');

  /* loading */
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const showInfo = (t, m, ty = 'info') => {
    setInfoTitle(t);
    setInfoMsg(m);
    setInfoType(ty);
    setInfoVisible(true);
  };

  /* —— fetch desde backend —— */

const fetchBarberos = async () => {
  try {
    if (!refreshing) setLoading(true);
    const token = await AsyncStorage.getItem('token');
    const { data } = await axios.get('https://vianney-server.onrender.com/barberos', {
      headers: { Authorization: `Bearer ${token}` },
      params: { 
        all: true,
        search: busqueda 
      },
    });

    const listaBarberos = data.barberos || data;
    const barberosFinales = Array.isArray(listaBarberos) ? 
      listaBarberos : 
      listaBarberos.barberos || [];

    // Procesar avatares como en clientes
    const list = barberosFinales.map((b) => {
      // Limpiar avatar si es inválido
      let avatar = b.avatar;
      if (avatar && (typeof avatar !== 'string' || avatar.includes('undefined'))) {
        avatar = null;
      }
      
      return {
        id: b.id,
        nombre: b.nombre,
        cedula: b.cedula,
        telefono: b.telefono,
        fecha_nacimiento: b.fecha_nacimiento,
        fecha_de_contratacion: b.fecha_de_contratacion,
        avatar: avatar, // Usar el avatar procesado
        usuarioID: b.usuarioID,
        estaVerificado: b.usuario?.estaVerificado || false,
        email: b.usuario?.email || '',
        rol: b.usuario?.rol?.nombre || 'BARBERO',
        rolID: b.usuario?.rol?.id || 2,
      };
    });

    setBarberos(list);
  } catch (err) {
    const msg = err.response?.data?.mensaje || 'No se pudieron cargar los barberos';
    showInfo('Error', msg, 'error');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  /* —— efectos de carga —— */
  useEffect(() => {
    fetchBarberos();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBarberos();
    }, [])
  );

  /* pull to refresh */
  const onRefresh = () => {
    setRefreshing(true);
    fetchBarberos();
  };

  /* —— filtrado derivado —— */
  const barberosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return barberos;
    const t = busqueda.toLowerCase();
    return barberos.filter(
      (b) =>
        b.nombre.toLowerCase().includes(t) ||
        b.cedula.includes(busqueda) ||
        b.email.toLowerCase().includes(t)
    );
  }, [busqueda, barberos]);

  /* paginación derivada */
  const i0 = (paginaActual - 1) * barberosPorPagina;
  const barberosMostrar = isMobile
    ? barberosFiltrados
    : barberosFiltrados.slice(i0, i0 + barberosPorPagina);
  const totalPaginas = Math.ceil(barberosFiltrados.length / barberosPorPagina);

  /* reajuste de página si queda vacía */
  useEffect(() => {
    const total = Math.max(1, totalPaginas);
    if (paginaActual > total) setPaginaActual(total);
  }, [totalPaginas, paginaActual]);

  const cambiarPagina = (p) => p > 0 && p <= totalPaginas && setPaginaActual(p);

  /* —— helpers CRUD —— */
  const crearBarbero = () => setModalCrearVisible(true);
  const handleSearchChange = (t) => setBusqueda(t);

  /* crear */
  const handleCreateBarbero = async (nuevo) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        'https://vianney-server.onrender.com/barberos',
        {
          nombre: nuevo.nombre,
          cedula: nuevo.cedula,
          telefono: nuevo.telefono,
          fecha_nacimiento: toYMD(nuevo.fechaNacimiento),
          fecha_de_contratacion: toYMD(nuevo.fechaContratacion),
          email: nuevo.email,
          password: nuevo.password,
          avatar: nuevo.avatar,
          rolID: nuevo.rolID || (nuevo.rol === 'ADMIN' ? 1 : 2),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setModalCrearVisible(false);
      setPaginaActual(1);
      await fetchBarberos();
      showInfo('🎉 ¡Barbero creado!', 'Email de verificación enviado', 'success');
    } catch (e) {
      const msg = e.response?.data?.mensaje || 'Error al crear barbero';
      showInfo('Error', msg, 'error');
    }
  };

  /* ver */
  const verBarbero = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(
        `https://vianney-server.onrender.com/barberos/by-id/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const b = data.barbero;
      setBarberoSeleccionado({
        id: b.id,
        nombre: b.nombre,
        cedula: b.cedula,
        telefono: b.telefono,
        fechaNacimiento: b.fecha_nacimiento ? new Date(b.fecha_nacimiento) : null,
        fechaContratacion: b.fecha_de_contratacion ? new Date(b.fecha_de_contratacion) : null,
        avatar: b.avatar,
        estaVerificado: b.usuario?.estaVerificado || false,
        email: b.usuario?.email || '',
        usuarioID: b.usuario?.id || null,
        rol: b.usuario?.rol?.nombre || 'BARBERO',
        rolID: b.usuario?.rol?.id || 2,
      });
      setModalDetalleVisible(true);
    } catch {
      showInfo('Error', 'No se pudo cargar el barbero', 'error');
    }
  };

  /* editar */
  const editarBarbero = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(
        `https://vianney-server.onrender.com/barberos/by-id/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const b = data.barbero;
      setBarberoSeleccionado({
        id: b.id,
        nombre: b.nombre,
        cedula: b.cedula,
        telefono: b.telefono,
        fechaNacimiento: b.fecha_nacimiento ? new Date(b.fecha_nacimiento) : null,
        fechaContratacion: b.fecha_de_contratacion ? new Date(b.fecha_de_contratacion) : null,
        avatar: b.avatar,
        estaVerificado: b.usuario?.estaVerificado || false,
        email: b.usuario?.email || '',
        usuarioID: b.usuario?.id || null,
        rol: b.usuario?.rol?.nombre || 'BARBERO',
        rolID: b.usuario?.rol?.id || 2,
      });
      setModalEditarVisible(true);
    } catch {
      showInfo('Error', 'No se pudo cargar el barbero', 'error');
    }
  };

  /* actualizar */
const handleUpdateBarbero = async (u) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    // Preparar datos para actualización (incluyendo avatar si existe)
    const datosActualizacion = {
      nombre: u.nombre,
      cedula: u.cedula,
      telefono: u.telefono,
      fecha_nacimiento: toYMD(u.fechaNacimiento),
      fecha_de_contratacion: toYMD(u.fechaContratacion),
      email: u.email,
      rolID: u.rolID || (u.rol === 'ADMIN' ? 1 : 2),
    };

    // Solo agregar avatar si existe y es válido
    if (u.avatar && 
        typeof u.avatar === 'string' && 
        u.avatar.startsWith('data:image/')) {
      datosActualizacion.avatar = u.avatar;
    }

    await axios.put(
      `https://vianney-server.onrender.com/barberos/${u.id}`,
      datosActualizacion,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setModalEditarVisible(false);
    await fetchBarberos();
    showInfo('✅ Barbero actualizado', 'Datos modificados correctamente', 'success');
  } catch (e) {
    const msg = e.response?.data?.mensaje || 'Error al actualizar';
    showInfo('Error', msg, 'error');
  }
};

  /* reenviar verificación */
  const reenviarEmailVerificacion = async (id) => {
    try {
      setSendingEmail(true);
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `https://vianney-server.onrender.com/barberos/${id}/reenviar-verificacion`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showInfo('📧 Email reenviado', 'Se volvió a enviar el link de verificación', 'success');
    } catch (e) {
      const msg = e.response?.data?.mensaje || 'No se pudo reenviar';
      showInfo('Error', msg, 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  /* eliminar */
  const eliminarBarbero = (id) => {
    setIdAEliminar(id);
    setConfirmVisible(true);
  };

  const confirmarEliminacion = async () => {
    setConfirmVisible(false);
    setDeleting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`https://vianney-server.onrender.com/barberos/${idAEliminar}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchBarberos();
      setPaginaActual(1);
      showInfo('🗑️ Eliminado', 'Barbero eliminado correctamente', 'success');
    } catch (e) {
      const msg = e.response?.data?.mensaje || '';
      if (msg.toLowerCase().includes('citas')) {
        showInfo('⚠️ No puedes eliminar', 'Este barbero tiene citas asociadas', 'warning');
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

  /* ╔══════════╗  Render  ╚══════════╝ */
  return (
    <View style={styles.mainContainer}>
      <View style={styles.contentWrapper}>
        <View style={styles.contentContainer}>
          {/* — header + buscador — */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Barberos</Text>
              <View style={styles.counter}>
                <Text style={styles.counterText}>{barberosFiltrados.length}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={crearBarbero}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Crear</Text>
            </TouchableOpacity>
          </View>

          <Buscador
            placeholder="Buscar barberos"
            value={busqueda}
            onChangeText={handleSearchChange}
          />

          {/* — listado — */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#424242" />
              <Text style={styles.loadingText}>Cargando barberos...</Text>
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
                  <View style={[styles.headerCell, styles.roleColumn]}>
                    <Text style={styles.headerText}>Rol</Text>
                  </View>
                  <View style={[styles.headerCell, styles.actionsColumn]}>
                    <Text style={styles.headerText}>Acciones</Text>
                  </View>
                </View>

                <FlatList
                  data={barberosMostrar}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.tableRow}>
                      <View style={[styles.cell, styles.nameColumn]}>
                        <View style={styles.nameContainer}>
                          <Avatar nombre={item.nombre} avatar={item.avatar} />
                          <Text style={styles.nameText}>{item.nombre}</Text>
                        </View>
                      </View>
                      <View style={[styles.cell, styles.telColumn]}>
                        <Text style={styles.telText}>{item.telefono}</Text>
                      </View>
                      <View style={[styles.cell, styles.emailColumn]}>
                        <Text style={styles.emailText}>{item.email}</Text>
                      </View>
                      <View style={[styles.cell, styles.stateColumn]}>
                        <EstadoVerificacion verificado={item.estaVerificado} />
                      </View>
                      <View style={[styles.cell, styles.roleColumn]}>
                        <RolBarbero rol={item.rol} />
                      </View>
                      <View style={[styles.cell, styles.actionsColumn]}>
                        <View style={styles.actionsContainer}>
                          <TouchableOpacity
                            onPress={() => verBarbero(item.id)}
                            style={styles.actionIcon}>
                            <FontAwesome name="eye" size={20} color="#424242" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => editarBarbero(item.id)}
                            style={styles.actionIcon}>
                            <Feather name="edit" size={20} color="#424242" />
                          </TouchableOpacity>
                          {!item.estaVerificado && (
                            <TouchableOpacity
                              onPress={() => reenviarEmailVerificacion(item.id)}
                              style={styles.actionIcon}>
                              <MaterialIcons name="email" size={20} color="#424242" />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            onPress={() => eliminarBarbero(item.id)}
                            style={styles.actionIcon}
                            disabled={deleting && idAEliminar === item.id}>
                            {deleting && idAEliminar === item.id ? (
                              <ActivityIndicator size="small" color="#d32f2f" />
                            ) : (
                              <Feather name="trash-2" size={20} color="#d32f2f" />
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
            <ScrollView style={styles.scrollContainer}>
              <View style={styles.cardsContainer}>
                {barberosMostrar.map((item) => (
                  <BarberoCard
                    key={item.id}
                    item={item}
                    onVer={verBarbero}
                    onEditar={editarBarbero}
                    onEliminar={eliminarBarbero}
                    onReenviar={reenviarEmailVerificacion}
                  />
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* — footer — */}
        <View style={styles.footerContainer}>
          <Footer />
        </View>
      </View>

      {/* — modales — */}
      <CrearBarbero
        visible={modalCrearVisible}
        onClose={() => setModalCrearVisible(false)}
        onCreate={handleCreateBarbero}
      />
      <DetalleBarbero
        visible={modalDetalleVisible}
        onClose={() => setModalDetalleVisible(false)}
        barbero={barberoSeleccionado}
      />
      <EditarBarbero
        visible={modalEditarVisible}
        onClose={() => setModalEditarVisible(false)}
        barbero={barberoSeleccionado}
        onUpdate={handleUpdateBarbero}
      />
      <ConfirmarModal
        visible={confirmVisible}
        onCancel={cancelarEliminacion} // CORRECCIÓN: Usar la función correcta
        onConfirm={confirmarEliminacion}
        title="Eliminar barbero"
        message="¿Estás seguro de eliminar este barbero?"
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

/* —— estilos —— */
const styles = StyleSheet.create({
  /* Layout */
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  contentWrapper: { flex: 1, justifyContent: 'space-between' },
  contentContainer: { flex: 1, padding: 16 },
  footerContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  paginationContainer: { paddingBottom: 16 },

  /* Loading */
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#424242' },

  /* Header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#424242', marginRight: 12 },
  counter: { backgroundColor: '#EEEEEE', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  counterText: { fontWeight: 'bold', fontSize: 14, color: '#424242' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#424242', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  addButtonText: { marginLeft: 8, color: '#fff', fontWeight: '500', fontSize: 14 },

  /* Tabla */
  table: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#424242', paddingVertical: 12 },
  headerCell: { justifyContent: 'center', paddingHorizontal: 8 },
  headerText: { fontWeight: 'bold', color: '#fff', fontSize: 14 },
  tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#fff' },
  cell: { justifyContent: 'center', paddingHorizontal: 8 },
  nameColumn: { flex: 3, alignItems: 'flex-start' },
  telColumn: { flex: 2, alignItems: 'center' },
  emailColumn: { flex: 3, alignItems: 'center' },
  stateColumn: { flex: 2, alignItems: 'center' },
  roleColumn: { flex: 2, alignItems: 'center' },
  actionsColumn: { flex: 2, alignItems: 'flex-end' },
  nameContainer: { flexDirection: 'row', alignItems: 'center' },
  nameText: { marginLeft: 10, fontWeight: '500', fontSize: 14, color: '#424242' },
  telText: { fontSize: 14, color: '#424242' },
  emailText: { fontSize: 14, color: '#424242' },
  actionsContainer: { flexDirection: 'row' },
  actionIcon: { marginHorizontal: 6, padding: 4 },

  /* Cards */
  scrollContainer: { flex: 1 },
  cardsContainer: { paddingBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
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

  /* Rol */
  rolContainer: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  rolAdmin: { backgroundColor: '#E3F2FD' },
  rolBarbero: { backgroundColor: '#E8F5E9' },
  rolTexto: { fontSize: 13, fontWeight: '500' },
  textoAdmin: { color: '#0D47A1' },
  textoBarbero: { color: '#2e7d32' },
});

export default BarberosScreen;