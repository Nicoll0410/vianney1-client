import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import {
  MaterialIcons,
  FontAwesome,
  Feather,
  Ionicons,
} from '@expo/vector-icons';
import Paginacion from '../../components/Paginacion';
import Buscador from '../../components/Buscador';
import CrearInsumo from './CrearInsumo';
import DetalleInsumo from './DetalleInsumo';
import EditarInsumo from './EditarInsumo';
import Footer from '../../components/Footer';
import ConfirmarModal from '../../components/ConfirmarModal';
import InfoModal from '../../components/InfoModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width } = Dimensions.get('window');
const isMobile = width < 768;
const INSUMOS_POR_PAGINA = 4;

const InsumosScreen = ({ navigation }) => {
  /* ------------------------ Estados ------------------------ */
  const [insumos, setInsumos] = useState([]);
  const [insumosFiltrados, setInsumosFiltrados] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState([]);

  /* ---- Modales confirmación / info ---- */
  const [confirmarModalVisible, setConfirmarModalVisible] = useState(false);
  const [confirmarAction, setConfirmarAction] = useState(null);
  const [confirmarTitle, setConfirmarTitle] = useState('');
  const [confirmarMsg, setConfirmarMsg] = useState('');

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState('');
  const [infoModalMsg, setInfoModalMsg] = useState('');

  /* ---------------------- Peticiones API ---------------------- */
  const fetchCategorias = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(
        'https://vianney-server.onrender.com/categorias-insumos',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const normalizadas = (data.categorias || []).map((c) => ({
        id: c.id ?? c.idCategoria ?? c.id_categoria ?? null,
        nombre: c.nombre ?? c.nombreCategoria ?? c.nombre_categoria ?? 'Sin nombre',
      }));
      setCategorias(normalizadas);
    } catch (e) {
      console.error('Error al obtener categorías:', e);
      Alert.alert('Error', 'No se pudieron cargar las categorías');
    }
  }, []);

  const fetchInsumos = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(
        'https://vianney-server.onrender.com/insumos/all',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const lista = (data.insumos || []).map((i) => ({
        ...i,
        categoria: i.categorias_insumo || i.categoria || i.categorium || null,
      }));

      setInsumos(lista);
      setInsumosFiltrados(lista);
      setPaginaActual(1);
    } catch (error) {
      console.error('Error al obtener insumos:', error);
      Alert.alert('Error', 'No se pudieron cargar los insumos');
    } finally {
      setLoading(false);
    }
  }, []);

/* ---------------------- Ciclos de vida ---------------------- */
useFocusEffect(
  useCallback(() => {
    fetchInsumos();
    fetchCategorias();
  }, [fetchInsumos, fetchCategorias])
);

  // Solo para depuración
  useEffect(() => {
    if (insumos.length);
    if (categorias.length);
  }, [insumos, categorias]);

  /* Reaplicamos filtro cada que cambie búsqueda o insumos */
  useEffect(() => {
    const term = busqueda.trim().toLowerCase();
    setInsumosFiltrados(
      term === ''
        ? insumos
        : insumos.filter(
            (i) =>
              i.nombre.toLowerCase().includes(term) ||
              i.descripcion.toLowerCase().includes(term)
          )
    );
    setPaginaActual(1);
  }, [busqueda, insumos]);

  /* ---------------------- Utilidades ---------------------- */
  const getCategoriaNombre = (item) => {
    if (item.categoria?.nombre) return item.categoria.nombre;
    if (item.categoriaNombre) return item.categoriaNombre;
    
    const possibleId = item.categoriaID ?? item.categoriaId ?? item.idCategoria ?? item.categoria_id ?? null;
    const encontrada = categorias.find((c) => c.id === possibleId);
    return encontrada ? encontrada.nombre : 'Sin categoría';
  };

  const indiceInicial = (paginaActual - 1) * INSUMOS_POR_PAGINA;
  const insumosMostrar = isMobile
    ? insumosFiltrados
    : insumosFiltrados.slice(
        indiceInicial,
        indiceInicial + INSUMOS_POR_PAGINA
      );
  const totalPaginas = Math.ceil(
    insumosFiltrados.length / INSUMOS_POR_PAGINA
  );

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina > 0 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  /* -------------------- Handlers CRUD -------------------- */
  const controlInsumos = () => {
    if (!insumos.length) {
      Alert.alert('Advertencia', 'No hay insumos para controlar');
      return;
    }
    navigation.navigate('ControlInsumos');
  };

  const crearInsumo = () => setModalVisible(true);
  const handleSearchChange = setBusqueda;

  const handleCreateInsumo = async (newInsumo) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.post(
        'https://vianney-server.onrender.com/insumos',
        newInsumo,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInsumos((prev) => [...prev, data.insumo]);
      setInsumosFiltrados((prev) => [...prev, data.insumo]);
      setModalVisible(false);
      setPaginaActual(1);

      setInfoModalTitle('🎉 ¡Insumo creado!');
      setInfoModalMsg('El insumo se registró exitosamente.');
      setInfoModalVisible(true);
    } catch (error) {
      console.error('Error al crear insumo:', error);
      Alert.alert(
        'Error',
        error.response?.data?.mensaje || 'Error al crear insumo'
      );
    }
  };

  const verInsumo = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(
        `https://vianney-server.onrender.com/insumos/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInsumoSeleccionado(data.insumo);
      setModalDetalleVisible(true);
    } catch (error) {
      console.error('Error al obtener detalles del insumo:', error);
      Alert.alert('Error', 'No se pudo cargar la información del insumo');
    }
  };

  const editarInsumo = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(
        `https://vianney-server.onrender.com/insumos/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInsumoSeleccionado(data.insumo);
      setModalEditarVisible(true);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el insumo para editar');
    }
  };

  const handleUpdateInsumo = async (updatedInsumo) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.put(
        `https://vianney-server.onrender.com/insumos/${updatedInsumo.id}`,
        updatedInsumo,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInsumos((prev) =>
        prev.map((i) => (i.id === data.insumo.id ? data.insumo : i))
      );
      setInsumosFiltrados((prev) =>
        prev.map((i) => (i.id === data.insumo.id ? data.insumo : i))
      );
      setModalEditarVisible(false);

      setInfoModalTitle('✅ ¡Actualizado!');
      setInfoModalMsg('Insumo actualizado correctamente.');
      setInfoModalVisible(true);
    } catch {
      Alert.alert('Error', 'Error al actualizar insumo');
    }
  };

  const solicitarEliminacion = (item) => {
    setConfirmarAction(() => () => eliminarInsumo(item.id));
    if (item.cantidad > 0) {
      setConfirmarTitle('⚠️ ¿Estas seguro de eliminar?');
      setConfirmarMsg(`Este insumo tiene ${item.cantidad} en stock`);
    } else {
      setConfirmarTitle('Eliminar Insumos');
      setConfirmarMsg(
        '¿Estás seguro de que deseas eliminar este insumo? Esta acción no se puede deshacer.'
      );
    }
    setConfirmarModalVisible(true);
  };

  const eliminarInsumo = async (id) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`https://vianney-server.onrender.com/insumos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInsumos((prev) => prev.filter((i) => i.id !== id));
      setInsumosFiltrados((prev) => prev.filter((i) => i.id !== id));

      if (
        (paginaActual - 1) * INSUMOS_POR_PAGINA >=
        insumosFiltrados.length - 1
      ) {
        setPaginaActual((prev) => Math.max(prev - 1, 1));
      }

      setInfoModalTitle('🗑️ Eliminado');
      setInfoModalMsg('Insumo eliminado correctamente.');
      setInfoModalVisible(true);
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el insumo');
    } finally {
      setLoading(false);
      setConfirmarModalVisible(false);
    }
  };

  /* -------------------- Render items -------------------- */
  const renderMobileItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{item.nombre}</Text>
          <Text style={styles.cardSubtitle}>{getCategoriaNombre(item)}</Text>
        </View>
        <View style={styles.unidadContainer}>
          <Text style={styles.textoUnidad}>{item.unidadMedida}</Text>
        </View>
      </View>
      <Text style={styles.cardDescription}>{item.descripcion}</Text>
      <View style={styles.cardInfoRow}>
        <Text style={styles.cardLabel}>Cantidad:</Text>
        <View style={styles.cantidadContainer}>
          <Text style={styles.textoCantidad}>{item.cantidad}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => verInsumo(item.id)}
          style={styles.actionButton}
        >
          <FontAwesome name="eye" size={20} color="#424242" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => editarInsumo(item.id)}
          style={styles.actionButton}
        >
          <Feather name="edit" size={20} color="#424242" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => solicitarEliminacion(item)}
          style={styles.actionButton}
        >
          <Feather name="trash-2" size={20} color="#d32f2f" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDesktopItem = ({ item }) => (
    <View style={styles.fila}>
      <View style={[styles.celda, styles.columnaNombre]}>
        <Text style={styles.textoNombre}>{item.nombre}</Text>
      </View>
      <View style={[styles.celda, styles.columnaDescripcion]}>
        <Text style={styles.textoDescripcion}>{item.descripcion}</Text>
      </View>
      <View style={[styles.celda, styles.columnaCategoria]}>
        <Text style={styles.textoCategoria}>{getCategoriaNombre(item)}</Text>
      </View>
      <View style={[styles.celda, styles.columnaUnidad]}>
        <View style={styles.unidadContainer}>
          <Text style={styles.textoUnidad}>{item.unidadMedida}</Text>
        </View>
      </View>
      <View style={[styles.celda, styles.columnaCantidad]}>
        <View style={styles.cantidadContainer}>
          <Text style={styles.textoCantidad}>{item.cantidad}</Text>
        </View>
      </View>
      <View style={[styles.celda, styles.columnaAcciones]}>
        <View style={styles.contenedorAcciones}>
          <TouchableOpacity
            onPress={() => verInsumo(item.id)}
            style={styles.actionIcon}
          >
            <FontAwesome name="eye" size={20} color="#424242" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => editarInsumo(item.id)}
            style={styles.actionIcon}
          >
            <Feather name="edit" size={20} color="#424242" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => solicitarEliminacion(item)}
            style={styles.actionIcon}
          >
            <Feather name="trash-2" size={20} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  /* ======================= Render ======================= */
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.tituloContainer}>
            <Text style={styles.titulo}>Insumos</Text>
            <View style={styles.contadorContainer}>
              <Text style={styles.contadorTexto}>
                {insumosFiltrados.length}
              </Text>
            </View>
          </View>
          <View style={styles.botonesHeader}>
            <TouchableOpacity
              style={[styles.botonHeader, styles.botonControl]}
              onPress={controlInsumos}
              disabled={!insumos.length}
            >
              <MaterialIcons name="inventory" size={20} color="white" />
              <Text style={styles.textoBoton}>Control</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.botonHeader}
              onPress={crearInsumo}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text style={styles.textoBoton}>Crear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Buscador */}
        <Buscador
          placeholder="Buscar insumos por nombre o descripción"
          value={busqueda}
          onChangeText={handleSearchChange}
        />

        {/* Listado */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Cargando insumos...</Text>
          </View>
        ) : insumosMostrar.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No se encontraron insumos</Text>
          </View>
        ) : isMobile ? (
          <FlatList
            data={insumosMostrar}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMobileItem}
            contentContainerStyle={styles.listContainer}
            style={styles.mobileList}
          />
        ) : (
          <View style={styles.tabla}>
            <View style={styles.filaEncabezado}>
              {[
                'Nombre',
                'Descripción',
                'Categoría',
                'Unidad',
                'Cantidad',
                'Acciones',
              ].map((h, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.celdaEncabezado,
                    idx === 0 && styles.columnaNombre,
                    idx === 1 && styles.columnaDescripcion,
                    idx === 2 && styles.columnaCategoria,
                    idx === 3 && styles.columnaUnidad,
                    idx === 4 && styles.columnaCantidad,
                    idx === 5 && styles.columnaAcciones,
                  ]}
                >
                  <Text style={styles.encabezado}>{h}</Text>
                </View>
              ))}
            </View>
            <FlatList
              data={insumosMostrar}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderDesktopItem}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Paginación */}
        {!isMobile &&
          !loading &&
          insumosFiltrados.length > INSUMOS_POR_PAGINA && (
            <View style={styles.paginacionContainer}>
              <Paginacion
                paginaActual={paginaActual}
                totalPaginas={totalPaginas}
                cambiarPagina={cambiarPagina}
              />
            </View>
          )}
      </View>

      <Footer />

      {/* Modales CRUD */}
      <CrearInsumo
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={handleCreateInsumo}
        categoriasExistentes={categorias}
      />
      <DetalleInsumo
        visible={modalDetalleVisible}
        onClose={() => setModalDetalleVisible(false)}
        insumo={insumoSeleccionado}
      />
      <EditarInsumo
        visible={modalEditarVisible}
        onClose={() => setModalEditarVisible(false)}
        insumo={insumoSeleccionado}
        onUpdate={handleUpdateInsumo}
        categoriasExistentes={categorias}
      />

      {/* Confirmar / Info */}
      <ConfirmarModal
        visible={confirmarModalVisible}
        title={confirmarTitle}
        message={confirmarMsg}
        onConfirm={() => confirmarAction && confirmarAction()}
        onCancel={() => setConfirmarModalVisible(false)}
      />
      <InfoModal
        visible={infoModalVisible}
        title={infoModalTitle}
        message={infoModalMsg}
        onClose={() => setInfoModalVisible(false)}
      />
    </View>
  );
};

/* ======================= Estilos ======================= */
const styles = StyleSheet.create({
  /* contenedores */
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 16, paddingBottom: 40 },
  /* header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tituloContainer: { flexDirection: 'row', alignItems: 'center' },
  titulo: { fontSize: 22, fontWeight: 'bold', marginRight: 10 },
  contadorContainer: {
    backgroundColor: '#D9D9D9',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contadorTexto: { fontWeight: 'bold', fontSize: 14 },
  botonesHeader: { flexDirection: 'row', alignItems: 'center' },
  botonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#424242',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#424242',
  },
  botonControl: { backgroundColor: '#424242' },
  textoBoton: {
    marginLeft: 8,
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  /* list & estados vacíos */
  listContainer: { paddingBottom: 16 },
  mobileList: { flex: 1, marginBottom: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#666' },
  /* card */
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#666' },
  cardDescription: { fontSize: 14, color: '#555', marginBottom: 12 },
  cardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: { fontSize: 14, color: '#424242' },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },
  actionButton: { marginLeft: 16 },
  unidadContainer: {
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoUnidad: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  cantidadContainer: {
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCantidad: { fontWeight: 'bold', color: '#000', fontSize: 12 },
  /* tabla */
  tabla: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
    flex: 1,
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
  encabezado: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
  },
  fila: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  celda: { justifyContent: 'center', paddingHorizontal: 8 },
  columnaNombre: { flex: 2, alignItems: 'flex-start' },
  columnaDescripcion: { flex: 3, alignItems: 'flex-start' },
  columnaCategoria: { flex: 2, alignItems: 'center' },
  columnaUnidad: { flex: 1, alignItems: 'center' },
  columnaCantidad: { flex: 1, alignItems: 'center' },
  columnaAcciones: { flex: 1.5, alignItems: 'flex-end', paddingRight: 16 },
  textoNombre: { fontWeight: '500' },
  textoDescripcion: { color: '#666' },
  textoCategoria: { color: '#555', fontWeight: '500' },
  contenedorAcciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: { padding: 6 },
  /* paginación */
  paginacionContainer: { marginBottom: 10 },
});

export default InsumosScreen;