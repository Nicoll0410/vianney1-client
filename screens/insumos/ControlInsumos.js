import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Paginacion from '../../components/Paginacion';
import Buscador from '../../components/Buscador';
import Footer from '../../components/Footer';
import InfoModal from '../../components/InfoModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const isMobile = Dimensions.get('window').width < 768;
const INSUMOS_POR_PAGINA = 4;

const ControlInsumos = () => {
  const [insumos, setInsumos] = useState([]);
  const [insumosFiltrados, setInsumosFiltrados] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [cantidadReducir, setCantidadReducir] = useState({});
  const [loading, setLoading] = useState(false);

  /* InfoModal */
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  /* ============ Cargar insumos ============ */
  const cargarInsumos = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get('https://vianney-server.onrender.com/insumos/all', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const lista = (data.insumos || []).map((i) => ({
        ...i,
        categoria: i.categorias_insumo || i.CategoriaProducto || null,
      }));
      setInsumos(lista);
      setInsumosFiltrados(lista);
    } catch (e) {
      console.error(e);
      setInfoTitle('❌ Error');
      setInfoMsg('No se pudieron cargar los insumos');
      setInfoVisible(true);
    } finally {
      setLoading(false);
    }
  }, []);

  /* Primera carga */
  useEffect(() => {
    cargarInsumos();
  }, [cargarInsumos]);

  /* Refresco automático al volver a la pantalla */
  useFocusEffect(
    useCallback(() => {
      cargarInsumos();
    }, [cargarInsumos])
  );

  /* ============ Filtro ============ */
  useEffect(() => {
    const term = busqueda.trim().toLowerCase();
    const filtrados =
      term === ''
        ? insumos
        : insumos.filter(
            (i) =>
              i.nombre.toLowerCase().includes(term) ||
              i.descripcion.toLowerCase().includes(term) ||
              (i.categoria?.nombre &&
                i.categoria.nombre.toLowerCase().includes(term))
          );
    setInsumosFiltrados(filtrados);
    setPaginaActual(1);
  }, [busqueda, insumos]);

  /* ============ Paginación ============ */
  const indiceInicial = (paginaActual - 1) * INSUMOS_POR_PAGINA;
  const insumosMostrar = insumosFiltrados.slice(
    indiceInicial,
    indiceInicial + INSUMOS_POR_PAGINA
  );
  const totalPaginas = Math.ceil(insumosFiltrados.length / INSUMOS_POR_PAGINA);

  /* ============ Reducción ============ */
  const handleCantidadChange = (id, v) => {
    setCantidadReducir((p) => ({
      ...p,
      [id]: Math.max(0, parseInt(v) || 0),
    }));
  };

const reducirInsumo = async (id) => {
  const cantidadSolicitada = cantidadReducir[id] || 0;
  const item = insumos.find((i) => i.id === id);

  if (!item) return;
  if (cantidadSolicitada <= 0) {
    setInfoTitle('⚠️ Atención');
    setInfoMsg('La cantidad a reducir debe ser mayor a cero');
    setInfoVisible(true);
    return;
  }
  if (cantidadSolicitada > item.cantidad) {
    setInfoTitle('⚠️ No disponible');
    setInfoMsg(`🚫 Solo hay ${item.cantidad} unidades. No puedes reducir ${cantidadSolicitada}.`);
    setInfoVisible(true);
    return;
  }

  try {
    setLoading(true);
    const token = await AsyncStorage.getItem('token');
    
    // Modifica la llamada axios así:
    const { data } = await axios({
      method: 'patch',
      url: `https://vianney-server.onrender.com/insumos/${id}/reducir`,
      data: { cantidad: cantidadSolicitada },
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });


    await cargarInsumos();
    setCantidadReducir((p) => ({ ...p, [id]: 0 }));
    setInfoTitle('✅ ¡Éxito!');
    setInfoMsg('La cantidad se redujo correctamente 🎉');
    setInfoVisible(true);
  } catch (e) {
    console.error('Error al reducir:', e);
    setInfoTitle('❌ Error');
    setInfoMsg(e.response?.data?.message || 'Hubo un problema al reducir el insumo 😢');
    setInfoVisible(true);
  } finally {
    setLoading(false);
  }
};

  /* ============ Render Item Móvil / Desktop ============ */
  const renderMobileItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{item.nombre}</Text>
          <Text style={styles.cardSubtitle}>
            {item.categoria?.nombre || 'Sin categoría'}
          </Text>
        </View>
        <View style={styles.unidadContainer}>
          <Text style={styles.textoUnidad}>{item.unidadMedida}</Text>
        </View>
      </View>

      <Text style={styles.cardDescription}>{item.descripcion}</Text>

      <View style={styles.cardInfoRow}>
        <Text style={styles.cardLabel}>Disponible:</Text>
        <View style={styles.cantidadContainer}>
          <Text style={styles.textoCantidad}>{item.cantidad}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TextInput
          style={styles.inputCantidad}
          keyboardType="numeric"
          placeholder="0"
          value={
            cantidadReducir[item.id] ? cantidadReducir[item.id].toString() : ''
          }
          onChangeText={(t) => handleCantidadChange(item.id, t)}
        />
        <TouchableOpacity
          onPress={() => reducirInsumo(item.id)}
          style={[
            styles.botonReducir,
            (item.cantidad <= 0 || loading) && styles.botonDisabled,
          ]}
          disabled={item.cantidad <= 0 || loading}
        >
          <MaterialIcons name="remove" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDesktopItem = ({ item }) => (
    <View style={styles.fila}>
      {[item.nombre, item.descripcion, item.categoria?.nombre || 'Sin categoría']
        .map((txt, idx) => (
          <View
            key={idx}
            style={[
              styles.celda,
              idx === 0 && styles.columnaNombre,
              idx === 1 && styles.columnaDescripcion,
              idx === 2 && styles.columnaCategoria,
            ]}
          >
            <Text
              style={
                idx === 0
                  ? styles.textoNombre
                  : idx === 1
                  ? styles.textoDescripcion
                  : styles.textoCategoria
              }
            >
              {txt}
            </Text>
          </View>
        ))}
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
          <TextInput
            style={styles.inputCantidad}
            keyboardType="numeric"
            placeholder="0"
            value={
              cantidadReducir[item.id]
                ? cantidadReducir[item.id].toString()
                : ''
            }
            onChangeText={(t) => handleCantidadChange(item.id, t)}
          />
          <TouchableOpacity
            onPress={() => reducirInsumo(item.id)}
            style={[
              styles.botonReducir,
              (item.cantidad <= 0 || loading) && styles.botonDisabled,
            ]}
            disabled={item.cantidad <= 0 || loading}
          >
            <MaterialIcons name="remove" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  /* ============ Render principal ============ */
  return (
    <View style={styles.mainContainer}>
      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.tituloContainer}>
                <Text style={styles.titulo}>Control de insumos</Text>
                <View style={styles.contadorContainer}>
                  <Text style={styles.contadorTexto}>
                    {insumosFiltrados.length}
                  </Text>
                </View>
              </View>
            </View>

            <Buscador
              placeholder="Buscar insumos por nombre, descripción o categoría"
              value={busqueda}
              onChangeText={setBusqueda}
            />

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#424242" />
                <Text style={styles.loadingText}>Cargando insumos...</Text>
              </View>
            ) : insumosMostrar.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No se encontraron insumos</Text>
              </View>
            ) : isMobile ? (
              <FlatList
                data={insumosMostrar}
                keyExtractor={(i) => i.id.toString()}
                renderItem={renderMobileItem}
                contentContainerStyle={styles.mobileListContainer}
                style={styles.mobileFlatList}
              />
            ) : (
              <View style={styles.tableWrapper}>
                <View style={styles.tableContainer}>
                  <View style={styles.tabla}>
                    <View style={styles.filaEncabezado}>
                      {[
                        'Nombre',
                        'Descripción',
                        'Categoría',
                        'Unidad',
                        'Cantidad',
                        'Reducir',
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
                      keyExtractor={(i) => i.id.toString()}
                      renderItem={renderDesktopItem}
                      scrollEnabled={false}
                    />
                  </View>
                </View>
              </View>
            )}

            {insumosFiltrados.length > INSUMOS_POR_PAGINA && (
              <View style={styles.paginationContainer}>
                <Paginacion
                  paginaActual={paginaActual}
                  totalPaginas={totalPaginas}
                  cambiarPagina={setPaginaActual}
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Footer />
        </View>
      </View>

      <InfoModal
        visible={infoVisible}
        title={infoTitle}
        message={infoMsg}
        onClose={() => setInfoVisible(false)}
      />
    </View>
  );
};

/* ============ Estilos ============ */
const styles = StyleSheet.create({
  /* Layout principal */
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 0,
  },
  footerContainer: {
    paddingHorizontal: 25,
    paddingBottom: 25,
    paddingTop: 4,
  },
  paginationContainer: {
    paddingVertical: 16,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tituloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 10,
  },
  contadorContainer: {
    backgroundColor: '#D9D9D9',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contadorTexto: {
    fontWeight: 'bold',
    fontSize: 14,
  },

  /* Loading */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    color: '#424242',
  },

  /* Tabla desktop */
  tableWrapper: {
    flex: 1,
  },
  tableContainer: {
    flex: 1,
  },
  tabla: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
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
    color: 'white',
  },
  fila: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: 'white',
  },
  celda: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  columnaNombre: {
    flex: 2,
  },
  columnaDescripcion: {
    flex: 3,
  },
  columnaCategoria: {
    flex: 2,
    alignItems: 'center',
  },
  columnaUnidad: {
    flex: 1,
    alignItems: 'center',
  },
  columnaCantidad: {
    flex: 1,
    alignItems: 'center',
  },
  columnaAcciones: {
    flex: 1.5,
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  textoNombre: {
    fontWeight: '500',
  },
  textoDescripcion: {
    color: '#666',
  },
  textoCategoria: {
    color: '#555',
    fontWeight: '500',
  },
  contenedorAcciones: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Card móvil */
  mobileFlatList: {
    flex: 1,
  },
  mobileListContainer: {
    paddingBottom: 20,
  },
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
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  cardDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  cardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: '#424242',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },
  inputCantidad: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  botonReducir: {
    backgroundColor: '#424242',
    borderRadius: 20,
    padding: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonDisabled: {
    backgroundColor: '#cccccc',
  },
  unidadContainer: {
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoUnidad: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cantidadContainer: {
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCantidad: {
    fontWeight: 'bold',
    fontSize: 14,
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ControlInsumos;