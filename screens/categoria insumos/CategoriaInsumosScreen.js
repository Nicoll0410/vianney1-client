import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  MaterialIcons,
  FontAwesome,
  Feather,
  Ionicons,
} from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

/* ───── componentes propios ───── */
import Buscador from '../../components/Buscador';
import Paginacion from '../../components/Paginacion';
import Footer from '../../components/Footer';
import CrearCategoria from './CrearCategoriaInsumos';
import EditarCategoria from './EditarCategoriaInsumos';
import DetalleCategoria from './DetalleCategoriaInsumos';
import ConfirmarModal from '../../components/ConfirmarModal';
import InfoModal from '../../components/InfoModal';

/* ───── helpers de tamaño ───── */
const { width } = Dimensions.get('window');
const isMobile = width < 768;

/* ───── interceptor opcional ───── */
axios.interceptors.response.use(
  r => r,
  e => {
    console.error('ERROR Axios:', e);
    return Promise.reject(e);
  }
);

/* ───────────────────────────────────── tarjeta móvil ───────────────────────────────────── */
const CategoriaCard = ({ item, onVer, onEditar, onEliminar }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderText}>
        <Text style={styles.cardNombre}>{item.nombre}</Text>
        <Text style={styles.cardDescripcion}>{item.descripcion}</Text>
      </View>
    </View>

    <View style={styles.cardDetails}>
      <View style={styles.detailRow}>
        <MaterialIcons name="inventory" size={16} color="#757575" style={styles.detailIcon} />
        <Text style={styles.detailText}>Insumos asociados: {item.insumosAsociados || 0}</Text>
      </View>
    </View>

    <View style={styles.cardActions}>
      <TouchableOpacity style={styles.actionButton} onPress={() => onVer(item.id)}>
        <FontAwesome name="eye" size={18} color="#424242" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={() => onEditar(item.id)}>
        <Feather name="edit" size={18} color="#424242" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={() => onEliminar(item.id)}>
        <Feather name="trash-2" size={18} color="#d32f2f" />
      </TouchableOpacity>
    </View>
  </View>
);

/* ───────────────────────────────────── pantalla principal ───────────────────────────────────── */
const CategoriaInsumosScreen = () => {
  /* ─── estado principal ─── */
  const [categorias, setCategorias] = useState([]);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [categoriasPorPagina] = useState(4);
  const [busqueda, setBusqueda] = useState('');

  /* modales CRUD */
  const [modalCrear,   setModalCrear]   = useState(false);
  const [modalEditar,  setModalEditar]  = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [catSel,       setCatSel]       = useState(null);

  /* modales de confirmación / info */
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [idAEliminar,    setIdAEliminar]    = useState(null);

  const [infoVisible, setInfoVisible] = useState(false);
  const [infoTitle,   setInfoTitle]   = useState('');
  const [infoMsg,     setInfoMsg]     = useState('');
  const [infoType,    setInfoType]    = useState('info'); // success | warning | error

  /* loading */
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ─── helpers de InfoModal ─── */
  const showInfo = (title, message, type = 'info') => {
    setInfoTitle(title);
    setInfoMsg(message);
    setInfoType(type);
    setInfoVisible(true);
  };

  /* ─── obtener categorías ─── */
  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(
        'https://vianney-server.onrender.com/categorias-insumos/all',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCategorias(data.categorias || []);
      setCategoriasFiltradas(data.categorias || []);
    } catch {
      showInfo('Error', 'No se pudieron cargar las categorías', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useFocusEffect(useCallback(fetchCategorias, []));

  /* ─── buscador ─── */
  const handleSearch = txt => {
    setBusqueda(txt);
    if (!txt.trim()) {
      setCategoriasFiltradas(categorias);
    } else {
      const t = txt.toLowerCase();
      setCategoriasFiltradas(
        categorias.filter(c =>
          c.nombre.toLowerCase().includes(t) ||
          c.descripcion.toLowerCase().includes(t)
        )
      );
    }
    setPaginaActual(1);
  };

  /* ─── crear ─── */
  const crearCategoria = () => setModalCrear(true);
  const handleCreate = async cat => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post('https://vianney-server.onrender.com/categorias-insumos', cat,
        { headers: { Authorization: `Bearer ${token}` } });
      await fetchCategorias();
      setModalCrear(false);
      showInfo('🎉 ¡Categoría creada!', 'La categoría se registró exitosamente.', 'success');
    } catch (e) {
      showInfo('Error', e.response?.data?.mensaje || 'Error al crear categoría', 'error');
    }
  };

  /* ─── detalle ─── */
  const verDetalles = async id => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(
        `https://vianney-server.onrender.com/categorias-insumos/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCatSel(data.categoria);
      setModalDetalle(true);
    } catch (e) {
      showInfo('Error', e.response?.data?.mensaje || 'No se pudo cargar la categoría', 'error');
    }
  };

  /* ─── editar ─── */
  const editarCategoria = async id => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(
        `https://vianney-server.onrender.com/categorias-insumos/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCatSel(data.categoria);
      setModalEditar(true);
    } catch (e) {
      showInfo('Error', e.response?.data?.mensaje || 'No se pudo cargar la categoría', 'error');
    }
  };
  const handleUpdate = async cat => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `https://vianney-server.onrender.com/categorias-insumos/${cat.id}`,
        cat,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCategorias();
      setModalEditar(false);
      showInfo('✅ ¡Actualizado!', 'La categoría se actualizó correctamente.', 'success');
    } catch (e) {
      showInfo('Error', e.response?.data?.mensaje || 'Error al actualizar', 'error');
    }
  };

  /* ─── eliminar ─── */
  const eliminarCategoria = id => { setIdAEliminar(id); setConfirmVisible(true); };
  const confirmarEliminacion = async () => {
    if (!idAEliminar) return;
    setConfirmVisible(false);
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(
        `https://vianney-server.onrender.com/categorias-insumos/${idAEliminar}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCategorias();
      showInfo('🗑️ Eliminada', 'La categoría se eliminó exitosamente.', 'success');
    } catch (e) {
      const msg = e.response?.data?.message || '';
      if (msg.toLowerCase().includes('insumos')) {
        showInfo('⚠️ No se puede eliminar', msg, 'warning');
      } else {
        showInfo('Error', msg || 'No se pudo eliminar la categoría', 'error');
      }
    } finally {
      setLoading(false);
      setIdAEliminar(null);
    }
  };

  /* ─── FIX: reajustar la página si queda fuera de rango ─── */
  useEffect(() => {
    const totalPaginas = Math.max(1, Math.ceil(categoriasFiltradas.length / categoriasPorPagina));
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [categoriasFiltradas, categoriasPorPagina, paginaActual]);

  /* ─── helpers tabla/paginación ─── */
  const i0 = (paginaActual - 1) * categoriasPorPagina;
  const mostrar = isMobile
    ? categoriasFiltradas
    : categoriasFiltradas.slice(i0, i0 + categoriasPorPagina);
  const total = Math.max(1, Math.ceil(categoriasFiltradas.length / categoriasPorPagina));

  /* ─── loading indicator ─── */
  if (loading && !categorias.length) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#424242" />
        <Text style={styles.loadingText}>Cargando categorías...</Text>
      </View>
    );
  }

  /* ───────────────────────────────────── JSX ───────────────────────────────────── */
  return (
    <View style={styles.mainContainer}>
      <View style={styles.contentWrapper}>
        {/* ───── cabecera + buscador ───── */}
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {isMobile ? (
                <View style={styles.mobileTitleContainer}>
                  <Text style={styles.title}>Categorías de</Text>
                  <View style={styles.mobileTitleRow}>
                    <Text style={styles.title}>Insumos</Text>
                    <View style={styles.counter}>
                      <Text style={styles.counterText}>{categoriasFiltradas.length}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.title}>Categorías de Insumos</Text>
                  <View style={styles.counter}>
                    <Text style={styles.counterText}>{categoriasFiltradas.length}</Text>
                  </View>
                </>
              )}
            </View>
            <TouchableOpacity style={styles.addButton} onPress={crearCategoria}>
              <Ionicons name="add-circle" size={20} color="white" />
              <Text style={styles.addButtonText}>Crear</Text>
            </TouchableOpacity>
          </View>

          <Buscador
            placeholder="Buscar categoría (ej: tijeras, máquinas)"
            value={busqueda}
            onChangeText={handleSearch}
          />

          {/* ───── tabla desktop / tarjetas mobile ───── */}
          {!isMobile ? (
            /* ========== TABLA DESKTOP ========== */
            <View style={styles.tableWrapper}>
              <View style={styles.tableContainer}>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <View style={[styles.headerCell, styles.nameColumn]}><Text style={styles.headerText}>Nombre</Text></View>
                    <View style={[styles.headerCell, styles.descColumn]}><Text style={styles.headerText}>Descripción</Text></View>
                    <View style={[styles.headerCell, styles.itemsColumn]}><Text style={styles.headerText}>Insumos</Text></View>
                    <View style={[styles.headerCell, styles.actionsColumn]}><Text style={styles.headerText}>Acciones</Text></View>
                  </View>

                  <View style={styles.tableBody}>
                    {mostrar.map(item => (
                      <View key={item.id} style={styles.tableRow}>
                        <View style={[styles.cell, styles.nameColumn]}><Text style={styles.nameText}>{item.nombre}</Text></View>
                        <View style={[styles.cell, styles.descColumn]}><Text style={styles.descText}>{item.descripcion}</Text></View>
                        <View style={[styles.cell, styles.itemsColumn]}><View style={styles.itemsBadge}><Text style={styles.itemsText}>{item.insumosAsociados || 0}</Text></View></View>
                        <View style={[styles.cell, styles.actionsColumn]}>
                          <View style={styles.actionsContainer}>
                            <TouchableOpacity onPress={() => verDetalles(item.id)} style={styles.actionIcon}><FontAwesome name="eye" size={20} color="#424242" /></TouchableOpacity>
                            <TouchableOpacity onPress={() => editarCategoria(item.id)} style={styles.actionIcon}><Feather name="edit" size={20} color="#424242" /></TouchableOpacity>
                            <TouchableOpacity onPress={() => eliminarCategoria(item.id)} style={styles.actionIcon}><Feather name="trash-2" size={20} color="#d32f2f" /></TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}

                    {mostrar.length === 0 && (
                      <View style={styles.emptyContainer}><Text style={styles.emptyText}>No se encontraron categorías</Text></View>
                    )}
                  </View>
                </View>
              </View>

              {categoriasFiltradas.length > 0 && (
                <View style={styles.paginationContainer}>
                  <Paginacion
                    paginaActual={paginaActual}
                    totalPaginas={total}
                    cambiarPagina={setPaginaActual}
                  />
                </View>
              )}
            </View>
          ) : (
            /* ========== TARJETAS MOBILE ========== */
            <ScrollView
              style={styles.scrollContainer}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCategorias(); }} />}
              contentContainerStyle={styles.mobileContentContainer}
            >
              <View style={styles.cardsContainer}>
                {mostrar.length ? (
                  mostrar.map(item => (
                    <CategoriaCard
                      key={item.id}
                      item={item}
                      onVer={verDetalles}
                      onEditar={editarCategoria}
                      onEliminar={eliminarCategoria}
                    />
                  ))
                ) : (
                  <View style={styles.emptyContainer}><Text style={styles.emptyText}>No se encontraron categorías</Text></View>
                )}
              </View>
            </ScrollView>
          )}
        </View>

        {/* ───── footer ───── */}
        <View style={styles.footerContainer}><Footer /></View>
      </View>

      {/* ───── modales CRUD ───── */}
      <CrearCategoria visible={modalCrear}   onClose={() => setModalCrear(false)}   onCreate={handleCreate} />
      <EditarCategoria visible={modalEditar} onClose={() => setModalEditar(false)}  categoria={catSel} onUpdate={handleUpdate} />
      <DetalleCategoria visible={modalDetalle} onClose={() => setModalDetalle(false)} categoria={catSel} />

      {/* ───── confirmación ───── */}
      <ConfirmarModal
        visible={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={confirmarEliminacion}
        title="Eliminar categoría de insumos"
        message="¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer."
      />

      {/* ───── información / éxito / advertencia ───── */}
      <InfoModal
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title={infoTitle}
        message={infoMsg}
        type={infoType}   /* success | warning | error */
      />
    </View>
  );
};

/* ───────────────────────────────────── estilos ───────────────────────────────────── */
const styles = StyleSheet.create({
  /* general */
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  contentWrapper: { flex: 1, justifyContent: 'space-between' },
  contentContainer: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, color: '#424242' },

  /* header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#424242', marginRight: 12 },
  counter: { backgroundColor: '#EEEEEE', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  counterText: { fontWeight: 'bold', fontSize: 14, color: '#424242' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#424242', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  addButtonText: { marginLeft: 8, color: 'white', fontWeight: '500', fontSize: 14 },
  mobileTitleContainer: {
    flexDirection: 'column',
  },
  mobileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* tabla desktop */
  tableWrapper: { flex: 1, marginBottom: 16 },
  tableContainer: { flex: 1, marginBottom: 8 },
  table: { flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#424242', paddingVertical: 12 },
  headerCell: { justifyContent: 'center', paddingHorizontal: 8 },
  headerText: { fontWeight: 'bold', color: 'white', fontSize: 14 },
  tableBody: { flex: 1 },
  tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: 'white' },
  cell: { justifyContent: 'center', paddingHorizontal: 8 },
  nameColumn: { flex: 2 }, descColumn: { flex: 3 }, itemsColumn: { flex: 1, alignItems: 'center' }, actionsColumn: { flex: 2, alignItems: 'flex-end' },
  nameText: { fontWeight: '500', fontSize: 14, color: '#424242' },
  descText: { fontSize: 14, color: '#616161' },
  itemsBadge: { backgroundColor: '#E0E0E0', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 8, minWidth: 30, alignItems: 'center' },
  itemsText: { fontWeight: 'bold', fontSize: 14, color: '#424242' },
  actionsContainer: { flexDirection: 'row' },
  actionIcon: { marginHorizontal: 6 },

  /* mobile cards */
  scrollContainer: { flex: 1 },
  mobileContentContainer: { flexGrow: 1, paddingBottom: 16 },
  cardsContainer: { paddingBottom: 16 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0', elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardHeaderText: { flex: 1 },
  cardNombre: { fontSize: 16, fontWeight: '600', color: '#212121', marginBottom: 4 },
  cardDescripcion: { fontSize: 14, color: '#757575' },
  cardDetails: { marginBottom: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detailIcon: { marginRight: 8 },
  detailText: { fontSize: 14, color: '#616161' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  actionButton: { marginLeft: 12, padding: 8, borderRadius: 20, backgroundColor: '#f5f5f5' },

  /* varias */
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { color: '#757575', fontSize: 16 },
  paginationContainer: { paddingVertical: 16 },
  footerContainer: { paddingHorizontal: 16, paddingBottom: 16 },
});

export default CategoriaInsumosScreen;