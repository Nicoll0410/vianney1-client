import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, ScrollView, Alert } from 'react-native';
import { MaterialIcons, FontAwesome, Feather, Ionicons } from '@expo/vector-icons';
import Paginacion from '../../components/Paginacion';
import Buscador from '../../components/Buscador';
import CrearServicio from './CrearServicio';
import DetalleServicio from './DetalleServicio';
import EditarServicio from './EditarServicio';
import Footer from '../../components/Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ConfirmarModal from '../../components/ConfirmarModal';
import InfoModal from '../../components/InfoModal';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const ServiciosScreen = () => {
  const [servicios, setServicios] = useState([]);
  const [serviciosFiltrados, setServiciosFiltrados] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [serviciosPorPagina] = useState(4);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [insumosDisponibles, setInsumosDisponibles] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalMessage, setInfoModalMessage] = useState('');

  const fetchServicios = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const serviciosResponse = await axios.get('https://vianney-server.onrender.com/servicios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const insumosResponse = await axios.get('https://vianney-server.onrender.com/insumos/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setServicios(serviciosResponse.data.servicios || []);
      setServiciosFiltrados(serviciosResponse.data.servicios || []);
      setInsumosDisponibles(insumosResponse.data.insumos || []);
    } catch (error) {
      console.error('Error al obtener datos:', error);
      showInfoModal('Error ❌', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const showInfoModal = (title, message) => {
    setInfoModalMessage({ title, message });
    setInfoModalVisible(true);
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchServicios();
    }, [])
  );

  useEffect(() => {
    if (busqueda.trim() === '') {
      setServiciosFiltrados(servicios);
    } else {
      const termino = busqueda.toLowerCase();
      const filtrados = servicios.filter(s =>
        s.nombre.toLowerCase().includes(termino) ||
        s.descripcion.toLowerCase().includes(termino)
      );
      setServiciosFiltrados(filtrados);
    }
    setPaginaActual(1);
  }, [busqueda, servicios]);

  const indiceInicial = (paginaActual - 1) * serviciosPorPagina;
  const serviciosMostrar = isMobile ? serviciosFiltrados : serviciosFiltrados.slice(indiceInicial, indiceInicial + serviciosPorPagina);
  const totalPaginas = Math.ceil(serviciosFiltrados.length / serviciosPorPagina);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina > 0 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const crearServicio = () => setModalVisible(true);

  const handleSearchChange = (texto) => setBusqueda(texto);

  const handleCreateService = async (newService) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post('https://vianney-server.onrender.com/servicios', newService, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setServicios([...servicios, response.data.servicio]);
      setServiciosFiltrados([...serviciosFiltrados, response.data.servicio]);
      setModalVisible(false);
      showInfoModal('Éxito ✅', 'Servicio creado exitosamente 🎉');
    } catch (error) {
      console.error('Error al crear servicio:', error);
      showInfoModal('Error ❌', error.response?.data?.mensaje || 'Error al crear servicio');
    }
  };

  const verServicio = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`https://vianney-server.onrender.com/servicios/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServicioSeleccionado({
        ...response.data.servicio,
        serviciosPorInsumo: response.data.serviciosPorInsumo
      });
      setModalDetalleVisible(true);
    } catch (error) {
      console.error('Error al obtener detalles del servicio:', error);
      showInfoModal('Error ❌', 'No se pudo cargar la información del servicio');
    }
  };

  const editarServicio = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`https://vianney-server.onrender.com/servicios/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServicioSeleccionado({
        ...response.data.servicio,
        insumos: response.data.serviciosPorInsumo.map(item => ({
          id: item.insumoID,
          nombre: item.insumo?.nombre || 'Insumo no encontrado',
          cantidad: item.unidades.toString(),
          categoria: item.insumo?.categoriaProducto?.nombre || 'Sin categoría'
        }))
      });
      setModalEditarVisible(true);
    } catch (error) {
      console.error('Error al cargar servicio para editar:', error);
      showInfoModal('Error ❌', 'No se pudo cargar el servicio para editar');
    }
  };

  const handleUpdateService = async (updatedService) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `https://vianney-server.onrender.com/servicios/${updatedService.id}`,
        updatedService,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const nuevosServicios = servicios.map(s => 
        s.id === updatedService.id ? response.data.servicioActualizado : s
      );
      
      setServicios(nuevosServicios);
      setServiciosFiltrados(nuevosServicios);
      setModalEditarVisible(false);
      showInfoModal('Éxito ✅', 'Servicio actualizado exitosamente ✨');
    } catch (error) {
      console.error('Error al actualizar servicio:', error);
      showInfoModal('Error ❌', error.response?.data?.mensaje || 'Error al actualizar servicio');
    }
  };

  const handleDeleteConfirmation = (id) => {
    setItemToDelete(id);
    setShowConfirmModal(true);
  };

  const handleDeleteService = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`https://vianney-server.onrender.com/servicios/${itemToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const nuevosServicios = servicios.filter(s => s.id !== itemToDelete);
      setServicios(nuevosServicios);
      setServiciosFiltrados(nuevosServicios);
      setShowConfirmModal(false);
      showInfoModal('Éxito ✅', 'Servicio eliminado exitosamente 🗑️');
    } catch (error) {
      console.error('Error al eliminar servicio:', error);
      showInfoModal('Error ❌', error.response?.data?.mensaje || 'Error al eliminar servicio');
    }
  };

  const renderMobileItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{item.nombre}</Text>
          <Text style={styles.cardSubtitle}>{item.duracionMaximaConvertido}</Text>
        </View>
        <View style={styles.precioContainer}>
          <Text style={styles.textoPrecio}>$ {item.precio}</Text>
        </View>
      </View>
     
      <Text style={styles.cardDescription}>{item.descripcion}</Text>
     
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => verServicio(item.id)} style={styles.actionButton}>
          <FontAwesome name="eye" size={20} color="#424242" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => editarServicio(item.id)} style={styles.actionButton}>
          <Feather name="edit" size={20} color="#424242" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteConfirmation(item.id)} style={styles.actionButton}>
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
      <View style={[styles.celda, styles.columnaDuracion]}>
        <View style={styles.duracionContainer}>
          <Text style={styles.textoDuracion}>{item.duracionMaximaConvertido}</Text>
        </View>
      </View>
      <View style={[styles.celda, styles.columnaPrecio]}>
        <View style={styles.precioContainer}>
          <Text style={styles.textoPrecio}>$ {item.precio}</Text>
        </View>
      </View>
      <View style={[styles.celda, styles.columnaAcciones]}>
        <View style={styles.contenedorAcciones}>
          <TouchableOpacity onPress={() => verServicio(item.id)} style={styles.botonAccion}>
            <FontAwesome name="eye" size={20} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => editarServicio(item.id)} style={styles.botonAccion}>
            <Feather name="edit" size={20} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteConfirmation(item.id)} style={styles.botonAccion}>
            <Feather name="trash-2" size={20} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.tituloContainer}>
            <Text style={styles.titulo}>Servicios</Text>
            <View style={styles.contadorContainer}>
              <Text style={styles.contadorTexto}>{serviciosFiltrados.length}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.botonHeader}
            onPress={crearServicio}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.textoBoton}>Crear</Text>
          </TouchableOpacity>
        </View>

        <Buscador
          placeholder="Buscar servicios (corte, barba, tratamiento...)"
          value={busqueda}
          onChangeText={handleSearchChange}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Cargando servicios...</Text>
          </View>
        ) : serviciosMostrar.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No se encontraron servicios</Text>
          </View>
        ) : isMobile ? (
          <FlatList
            data={serviciosMostrar}
            keyExtractor={(item) => item.id}
            renderItem={renderMobileItem}
            contentContainerStyle={styles.listContainer}
            style={styles.mobileList}
          />
        ) : (
          <View style={styles.tabla}>
            <View style={styles.filaEncabezado}>
              <View style={[styles.celdaEncabezado, styles.columnaNombre]}><Text style={styles.encabezado}>Nombre</Text></View>
              <View style={[styles.celdaEncabezado, styles.columnaDescripcion]}><Text style={styles.encabezado}>Descripción</Text></View>
              <View style={[styles.celdaEncabezado, styles.columnaDuracion]}><Text style={styles.encabezado}>Duración</Text></View>
              <View style={[styles.celdaEncabezado, styles.columnaPrecio]}><Text style={styles.encabezado}>Precio</Text></View>
              <View style={[styles.celdaEncabezado, styles.columnaAcciones]}><Text style={styles.encabezado}>Acciones</Text></View>
            </View>
            <FlatList
              data={serviciosMostrar}
              keyExtractor={(item) => item.id}
              renderItem={renderDesktopItem}
              scrollEnabled={false}
            />
          </View>
        )}

        {!isMobile && (
          <Paginacion
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            cambiarPagina={cambiarPagina}
          />
        )}

        <CrearServicio
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onCreate={handleCreateService}
          insumosDisponibles={insumosDisponibles}
        />

        <DetalleServicio
          visible={modalDetalleVisible}
          onClose={() => setModalDetalleVisible(false)}
          servicio={servicioSeleccionado}
        />

        <EditarServicio
          visible={modalEditarVisible}
          onClose={() => setModalEditarVisible(false)}
          servicio={servicioSeleccionado}
          onUpdate={handleUpdateService}
          insumosDisponibles={insumosDisponibles}
        />

        <ConfirmarModal
          visible={showConfirmModal}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={handleDeleteService}
          title="Confirmar eliminación ⚠️"
          message="¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer."
        />

        <InfoModal
          visible={infoModalVisible}
          onClose={() => setInfoModalVisible(false)}
          title={infoModalMessage.title}
          message={infoModalMessage.message}
        />
      </View>
     
      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 0, // Eliminamos el padding inferior para que el footer quede pegado
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileList: {
    flex: 1,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  textoBoton: {
    marginLeft: 8,
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },
  actionButton: {
    marginLeft: 16,
  },
  precioContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  textoPrecio: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14,
  },
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
    borderBottomColor: 'black',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  celda: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  columnaNombre: {
    flex: 2,
    alignItems: 'flex-start',
  },
  columnaDescripcion: {
    flex: 3,
    alignItems: 'flex-start',
  },
  columnaDuracion: {
    flex: 1.5,
    alignItems: 'center',
  },
  columnaPrecio: {
    flex: 2,
    alignItems: 'center',
  },
  columnaAcciones: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  textoNombre: {
    fontWeight: '500',
  },
  textoDescripcion: {
    color: '#666',
  },
  duracionContainer: {
    backgroundColor: '#D9D9D9',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  textoDuracion: {
    textAlign: 'center',
    fontSize: 14,
  },
  contenedorAcciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  botonAccion: {
    marginHorizontal: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ServiciosScreen;