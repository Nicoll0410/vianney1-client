import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  FontAwesome,
  Feather,
  Ionicons,
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import Paginacion from '../../components/Paginacion';
import Buscador from '../../components/Buscador';
import CrearRol from './CrearRol';
import DetalleRol from './DetalleRol';
import EditarRol from './EditarRol';
import Footer from '../../components/Footer';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

/*──────────────────────────  Card Mobile ──────────────────────────*/
const RolCard = ({ item, onVer, onEditar, onEliminar }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      {item.avatar && (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      )}
      <View style={styles.cardHeaderText}>
        <Text style={styles.cardNombre}>{item.nombre}</Text>
        <Text style={styles.cardDescripcion}>{item.descripcion}</Text>
      </View>
    </View>

    <View style={styles.cardDetails}>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Asociados:</Text>
        <View style={styles.asociadosBadge}>
          <Text style={styles.asociadosText}>{item.usuariosAsociados}</Text>
        </View>
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

/*────────────────────────────  Screen ─────────────────────────────*/
const RolesScreen = () => {
  const [roles, setRoles] = useState([]);
  const [rolesFiltrados, setRolesFiltrados] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [rolesPorPagina] = useState(4);
  const [busqueda, setBusqueda] = useState('');

  const [loading, setLoading] = useState(false);
  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);

  /*───────── Helpers ─────────*/
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get('https://vianney-server.onrender.com/roles/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = data.roles.map(r => ({
        ...r,
        usuariosAsociados: r.usuariosAsociados ?? 0,
        permisos: r.permisos ?? [],
        avatar: r.avatar || 'https://via.placeholder.com/40', // Avatar por defecto si no tiene
      }));
      setRoles(list);
      setRolesFiltrados(list);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudieron cargar los roles');
    } finally {
      setLoading(false);
    }
  };

  /* cargar al abrir pantalla  + refresh cada vez que vuelve a foco */
  useFocusEffect(useCallback(() => { fetchRoles(); }, []));

  /* búsqueda */
  useEffect(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) {
      setRolesFiltrados(roles);
    } else {
      const filtros = roles.filter(
        r =>
          r.nombre.toLowerCase().includes(termino) ||
          (r.descripcion ?? '').toLowerCase().includes(termino),
      );
      setRolesFiltrados(filtros);
    }
    setPaginaActual(1);
  }, [busqueda, roles]);

  /*──────── Crear ────────*/
  const handleCreateRol = async nuevoRol => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.post(
        'https://vianney-server.onrender.com/roles',
        {
          nombre: nuevoRol.nombre,
          descripcion: nuevoRol.descripcion,
          avatar: nuevoRol.avatar,
          permisos: nuevoRol.permisosSeleccionados,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRoles(prev => [...prev, { ...data.rol, usuariosAsociados: 0 }]);
      setModalCrearVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.mensaje || 'No se pudo crear');
    }
  };

  /*──────── Update ────────*/
  const handleUpdateRol = async rolActualizado => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.put(
        `https://vianney-server.onrender.com/roles/${rolActualizado.id}`,
        {
          nombre: rolActualizado.nombre,
          descripcion: rolActualizado.descripcion,
          avatar: rolActualizado.avatar,
          permisos: rolActualizado.permisosSeleccionados,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRoles(prev =>
        prev.map(r => (r.id === rolActualizado.id ? { ...data.rolActualizado } : r)),
      );
      setModalEditarVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.mensaje || 'No se pudo actualizar');
    }
  };

  /*──────── Delete ────────*/
  const eliminarRol = async id => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`https://vianney-server.onrender.com/roles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.mensaje || 'No se pudo eliminar');
    }
  };

  /*──────── Detalle / Editar ────────*/
  const verRol = id => {
    const rol = roles.find(r => r.id === id);
    setRolSeleccionado(rol);
    setModalDetalleVisible(true);
  };
  const editarRol = id => {
    const rol = roles.find(r => r.id === id);
    setRolSeleccionado(rol);
    setModalEditarVisible(true);
  };

  /*──────── Paginación ────────*/
  const indiceInicial = (paginaActual - 1) * rolesPorPagina;
  const rolesMostrar = isMobile
    ? rolesFiltrados
    : rolesFiltrados.slice(indiceInicial, indiceInicial + rolesPorPagina);
  const totalPaginas = Math.ceil(rolesFiltrados.length / rolesPorPagina);
  const cambiarPagina = nueva => {
    if (nueva >= 1 && nueva <= totalPaginas) setPaginaActual(nueva);
  };

  /*──────── UI ────────*/
  return (
    <View style={styles.container}>
      {/* header list + botón crear */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Roles</Text>
          <View style={styles.counter}>
            <Text style={styles.counterText}>{rolesFiltrados.length}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalCrearVisible(true)}>
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.addButtonText}>Crear</Text>
        </TouchableOpacity>
      </View>

      <Buscador
        placeholder="Buscar roles por nombre o descripción"
        value={busqueda}
        onChangeText={setBusqueda}
      />

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : !isMobile ? (
        /*────────── TABLE DESKTOP ─────────*/
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={[styles.headerCell, styles.avatarColumn]}>
              <Text style={styles.headerText}>Avatar</Text>
            </View>
            <View style={[styles.headerCell, styles.nameColumn]}>
              <Text style={styles.headerText}>Nombre</Text>
            </View>
            <View style={[styles.headerCell, styles.descColumn]}>
              <Text style={styles.headerText}>Descripción</Text>
            </View>
            <View style={[styles.headerCell, styles.asociadosColumn]}>
              <Text style={styles.headerText}>Asociados</Text>
            </View>
            <View style={[styles.headerCell, styles.actionsColumn]}>
              <Text style={styles.headerText}>Acciones</Text>
            </View>
          </View>

          <FlatList
            data={rolesMostrar}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.avatarColumn]}>
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                </View>
                <View style={[styles.cell, styles.nameColumn]}>
                  <Text style={styles.nameText}>{item.nombre}</Text>
                </View>
                <View style={[styles.cell, styles.descColumn]}>
                  <Text style={styles.descText}>{item.descripcion}</Text>
                </View>
                <View style={[styles.cell, styles.asociadosColumn]}>
                  <View style={styles.asociadosBadge}>
                    <Text style={styles.asociadosText}>{item.usuariosAsociados}</Text>
                  </View>
                </View>
                <View style={[styles.cell, styles.actionsColumn]}>
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity onPress={() => verRol(item.id)} style={styles.actionIcon}>
                      <FontAwesome name="eye" size={20} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => editarRol(item.id)} style={styles.actionIcon}>
                      <Feather name="edit" size={20} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => eliminarRol(item.id)} style={styles.actionIcon}>
                      <Feather name="trash-2" size={20} color="#d32f2f" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        </View>
      ) : (
        /*────────── MOBILE CARDS ─────────*/
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.cardsContainer}>
            {rolesFiltrados.map(item => (
              <RolCard
                key={item.id}
                item={item}
                onVer={verRol}
                onEditar={editarRol}
                onEliminar={eliminarRol}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {!isMobile && totalPaginas > 1 && (
        <Paginacion
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          cambiarPagina={cambiarPagina}
        />
      )}

      {/*──────── Modales ────────*/}
      <CrearRol
        visible={modalCrearVisible}
        onClose={() => setModalCrearVisible(false)}
        onCreate={handleCreateRol}
      />
      <DetalleRol
        visible={modalDetalleVisible}
        onClose={() => setModalDetalleVisible(false)}
        rol={rolSeleccionado}
      />
      <EditarRol
        visible={modalEditarVisible}
        onClose={() => setModalEditarVisible(false)}
        rol={rolSeleccionado}
        onUpdate={handleUpdateRol}
      />

      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#424242',
    marginRight: 12,
  },
  counter: {
    backgroundColor: '#EEEEEE',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#424242',
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

  // Desktop Table Styles
  table: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#424242',
    paddingVertical: 12,
  },
  headerCell: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  avatarColumn: {
    flex: 1,
    alignItems: 'center',
  },
  nameColumn: {
    flex: 2,
    alignItems: 'flex-start',
  },
  descColumn: {
    flex: 3,
    alignItems: 'flex-start',
  },
  asociadosColumn: {
    flex: 1,
    alignItems: 'center',
  },
  actionsColumn: {
    flex: 2,
    alignItems: 'flex-end',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  nameText: {
    fontWeight: '500',
    fontSize: 14,
    color: '#424242',
  },
  descText: {
    fontSize: 14,
    color: '#616161',
  },
  asociadosBadge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 30,
    alignItems: 'center',
  },
  asociadosText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#424242',
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  actionIcon: {
    marginHorizontal: 6,
  },

  // Mobile Card Styles
  scrollContainer: {
    flex: 1,
  },
  cardsContainer: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: 'white',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  cardDescripcion: {
    fontSize: 14,
    color: '#757575',
  },
  cardDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#616161',
    marginRight: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
});

export default RolesScreen;