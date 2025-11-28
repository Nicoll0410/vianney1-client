import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import Footer from '../../components/Footer';
import ConfirmarModal from '../../components/ConfirmarModal';
import InfoModal from '../../components/InfoModal';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const GestionGaleriaScreen = () => {
  const { user, userRole, barberData } = useContext(AuthContext);
  
  // 🔍 DEBUG - Ver qué hay en user
  useEffect(() => {
    console.log('📊 DEBUG - Datos del usuario:');
    console.log('user completo:', user);
    console.log('user.userId:', user?.userId);
    console.log('user.id:', user?.id);
    console.log('userRole:', userRole);
    console.log('barberData:', barberData);
  }, [user, userRole, barberData]);
  
  const [contenidos, setContenidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Modal de subir contenido
  const [modalSubirVisible, setModalSubirVisible] = useState(false);
  const [nuevaImagen, setNuevaImagen] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [destacado, setDestacado] = useState(false);
  
  // Modal de confirmación
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState(null);
  
  // Modal de info
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [infoType, setInfoType] = useState('info');

  useEffect(() => {
    solicitarPermisos();
    fetchContenidos();
  }, []);

  const solicitarPermisos = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos requeridos',
          'Necesitamos permisos para acceder a tus fotos'
        );
      }
    }
  };

  const showInfo = (title, message, type = 'info') => {
    setInfoTitle(title);
    setInfoMsg(message);
    setInfoType(type);
    setInfoVisible(true);
  };

  const fetchContenidos = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      // Obtener el barberoID
      let barberoID;
      if (userRole === 'Barbero' && barberData?.id) {
        barberoID = barberData.id;
        console.log('✅ Barbero - usando barberData.id:', barberoID);
      } else if (userRole === 'Administrador') {
        // Para admin, obtener su propio ID de barbero
        // Intentar múltiples formas de obtener el userId
        const userId = user?.userId || user?.id || user?.usuarioId || user?.sub;
        
        console.log('🔍 Intentando obtener userId para Admin:');
        console.log('user.userId:', user?.userId);
        console.log('user.id:', user?.id);
        console.log('user.usuarioId:', user?.usuarioId);
        console.log('user.sub:', user?.sub);
        console.log('userId final:', userId);
        
        if (!userId) {
          console.error('❌ No se pudo obtener userId del objeto user:', user);
          showInfo('Error', 'No se pudo obtener el ID de usuario. Por favor, cierra sesión e inicia sesión nuevamente.', 'error');
          return;
        }

        console.log('🔄 Buscando barbero con userId:', userId);
        
        // ✅ CAMBIO: Agregar el token en el header Authorization
        const { data: respuestaBarbero } = await axios.get(
          `https://vianney-server.onrender.com/barberos/usuario/${userId}`,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,  // ← Agregar token
              'Content-Type': 'application/json'
            } 
          }
        );
        
        console.log('✅ Barbero encontrado:', respuestaBarbero);
        barberoID = respuestaBarbero.id;
      }

      if (!barberoID) {
        showInfo('Error', 'No se pudo identificar al barbero', 'error');
        return;
      }

      console.log('📸 Cargando galería para barberoID:', barberoID);

      const { data } = await axios.get(
        `https://vianney-server.onrender.com/galeria/barbero/${barberoID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        console.log('✅ Galería cargada:', data.data.length, 'items');
        setContenidos(data.data);
      }
    } catch (error) {
      console.error('❌ Error cargando contenidos:', error);
      console.error('Error response:', error.response?.data);
      showInfo('Error', error.response?.data?.mensaje || 'No se pudo cargar el contenido', 'error');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarImagen = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true
      });

      if (!result.canceled) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setNuevaImagen(base64Image);
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      showInfo('Error', 'Error al seleccionar la imagen', 'error');
    }
  };

  const subirContenido = async () => {
    if (!nuevaImagen) {
      showInfo('Advertencia', 'Debes seleccionar una imagen', 'warning');
      return;
    }

    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('token');
      
      // Obtener el barberoID
      let barberoID;
      if (userRole === 'Barbero' && barberData?.id) {
        barberoID = barberData.id;
        console.log('✅ Barbero - usando barberData.id:', barberoID);
      } else if (userRole === 'Administrador') {
        // El user puede tener userId, id, usuarioId o sub
        const userId = user?.userId || user?.id || user?.usuarioId || user?.sub;
        
        console.log('🔍 Subiendo contenido - userId:', userId);
        
        if (!userId) {
          console.error('❌ No se pudo obtener userId:', user);
          showInfo('Error', 'No se pudo obtener el ID de usuario', 'error');
          return;
        }

        // ✅ CAMBIO: Agregar el token en el header Authorization
        const { data: respuestaBarbero } = await axios.get(
          `https://vianney-server.onrender.com/barberos/usuario/${userId}`,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,  // ← Agregar token
              'Content-Type': 'application/json'
            } 
          }
        );
        barberoID = respuestaBarbero.id;
      }

      if (!barberoID) {
        showInfo('Error', 'No se pudo identificar al barbero', 'error');
        return;
      }

      console.log('📤 Subiendo contenido para barberoID:', barberoID);

      await axios.post(
        'https://vianney-server.onrender.com/galeria',
        {
          barberoID,
          tipo: 'imagen',
          contenido: nuevaImagen,
          descripcion: descripcion || null,
          instagram: instagram || null,
          facebook: facebook || null,
          tiktok: tiktok || null,
          destacado: destacado
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Limpiar formulario
      setNuevaImagen(null);
      setDescripcion('');
      setInstagram('');
      setFacebook('');
      setTiktok('');
      setDestacado(false);
      setModalSubirVisible(false);

      await fetchContenidos();
      showInfo('¡Éxito!', 'Contenido subido correctamente', 'success');
    } catch (error) {
      console.error('❌ Error subiendo contenido:', error);
      console.error('Error response:', error.response?.data);
      showInfo('Error', error.response?.data?.mensaje || 'No se pudo subir el contenido', 'error');
    } finally {
      setUploading(false);
    }
  };

  const toggleDestacado = async (id, destacadoActual) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(
        `https://vianney-server.onrender.com/galeria/${id}/destacado`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchContenidos();
      showInfo(
        'Actualizado',
        `Contenido ${!destacadoActual ? 'marcado' : 'desmarcado'} como destacado`,
        'success'
      );
    } catch (error) {
      console.error('Error actualizando destacado:', error);
      showInfo('Error', 'No se pudo actualizar', 'error');
    }
  };

  const eliminarContenido = (id) => {
    setIdAEliminar(id);
    setConfirmVisible(true);
  };

  const confirmarEliminacion = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(
        `https://vianney-server.onrender.com/galeria/${idAEliminar}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConfirmVisible(false);
      setIdAEliminar(null);
      await fetchContenidos();
      showInfo('Eliminado', 'Contenido eliminado correctamente', 'success');
    } catch (error) {
      console.error('Error eliminando:', error);
      showInfo('Error', 'No se pudo eliminar el contenido', 'error');
    }
  };

  const renderContenido = (item, index) => {
    const contenidoValido = item.contenido &&
                           typeof item.contenido === 'string' &&
                           item.contenido.length > 500;

    return (
      <View key={index} style={styles.contenidoCard}>
        <View style={styles.imagenContainer}>
          {contenidoValido ? (
            <Image
              source={{ uri: item.contenido }}
              style={styles.imagen}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagenPlaceholder}>
              <Ionicons name="image-outline" size={40} color="#999" />
            </View>
          )}
          
          {item.destacado && (
            <View style={styles.destacadoBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
            </View>
          )}
        </View>

        {item.descripcion && (
          <Text style={styles.descripcionCard} numberOfLines={2}>
            {item.descripcion}
          </Text>
        )}

        <View style={styles.redesContainer}>
          {item.instagram && (
            <View style={styles.redIcon}>
              <FontAwesome name="instagram" size={16} color="#E4405F" />
            </View>
          )}
          {item.facebook && (
            <View style={styles.redIcon}>
              <FontAwesome name="facebook" size={16} color="#1877F2" />
            </View>
          )}
          {item.tiktok && (
            <View style={styles.redIcon}>
              <FontAwesome name="music" size={16} color="#000" />
            </View>
          )}
        </View>

        <View style={styles.accionesCard}>
          <TouchableOpacity
            onPress={() => toggleDestacado(item.id, item.destacado)}
            style={styles.accionButton}
          >
            <Ionicons
              name={item.destacado ? "star" : "star-outline"}
              size={20}
              color="#FFD700"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => eliminarContenido(item.id)}
            style={styles.accionButton}
          >
            <Ionicons name="trash-outline" size={20} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#424242" />
        <Text style={styles.loadingText}>Cargando galería...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Mi Galería</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalSubirVisible(true)}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Subir Contenido</Text>
          </TouchableOpacity>
        </View>

        {contenidos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>
              Aún no has subido contenido
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setModalSubirVisible(true)}
            >
              <Text style={styles.emptyButtonText}>Subir primera foto</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {contenidos.map(renderContenido)}
          </View>
        )}

        <Footer />
      </ScrollView>

      {/* Modal para subir contenido */}
      <Modal
        visible={modalSubirVisible}
        animationType="slide"
        onRequestClose={() => setModalSubirVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Subir Contenido</Text>
            <TouchableOpacity
              onPress={() => setModalSubirVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#424242" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Selector de imagen */}
            <TouchableOpacity
              style={styles.imagenSelector}
              onPress={seleccionarImagen}
            >
              {nuevaImagen ? (
                <Image
                  source={{ uri: nuevaImagen }}
                  style={styles.imagenPreview}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagenSelectorPlaceholder}>
                  <Ionicons name="camera" size={50} color="#999" />
                  <Text style={styles.imagenSelectorText}>
                    Toca para seleccionar imagen
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Descripción */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Descripción (opcional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Ejemplo: Degradado clásico con barba perfilada"
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Redes sociales */}
            <Text style={styles.sectionTitle}>Redes Sociales (opcionales)</Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <FontAwesome name="instagram" size={20} color="#E4405F" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="URL de Instagram"
                value={instagram}
                onChangeText={setInstagram}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <FontAwesome name="facebook" size={20} color="#1877F2" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="URL de Facebook"
                value={facebook}
                onChangeText={setFacebook}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <FontAwesome name="music" size={20} color="#000" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="URL de TikTok"
                value={tiktok}
                onChangeText={setTiktok}
                autoCapitalize="none"
              />
            </View>

            {/* Destacado */}
            <TouchableOpacity
              style={styles.destacadoToggle}
              onPress={() => setDestacado(!destacado)}
            >
              <Ionicons
                name={destacado ? "star" : "star-outline"}
                size={24}
                color="#FFD700"
              />
              <Text style={styles.destacadoText}>
                {destacado ? 'Marcado como destacado' : 'Marcar como destacado'}
              </Text>
            </TouchableOpacity>

            {/* Botones */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalSubirVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={subirContenido}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.uploadButtonText}>Subir</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <ConfirmarModal
        visible={confirmVisible}
        onCancel={() => {
          setConfirmVisible(false);
          setIdAEliminar(null);
        }}
        onConfirm={confirmarEliminacion}
        title="Eliminar contenido"
        message="¿Estás seguro de eliminar este contenido?"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121'
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#424242',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20
  },
  addButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8
  },
  contenidoCard: {
    width: isMobile ? '50%' : '25%',
    padding: 8
  },
  imagenContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8
  },
  imagen: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5'
  },
  imagenPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  destacadoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4
  },
  descripcionCard: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8
  },
  redesContainer: {
    flexDirection: 'row',
    marginBottom: 8
  },
  redIcon: {
    marginRight: 8
  },
  accionesCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8
  },
  accionButton: {
    padding: 8
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    marginBottom: 20
  },
  emptyButton: {
    backgroundColor: '#424242',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121'
  },
  closeButton: {
    padding: 8
  },
  modalContent: {
    flex: 1,
    padding: 16
  },
  imagenSelector: {
    marginBottom: 20
  },
  imagenPreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#f5f5f5'
  },
  imagenSelectorPlaceholder: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed'
  },
  imagenSelectorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999'
  },
  inputContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14
  },
  inputIcon: {
    marginRight: 12
  },
  textArea: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
    marginTop: 8
  },
  destacadoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF8DC',
    borderRadius: 8,
    marginBottom: 20
  },
  destacadoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#212121',
    fontWeight: '600'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666'
  },
  uploadButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#424242',
    alignItems: 'center'
  },
  uploadButtonDisabled: {
    backgroundColor: '#999'
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  }
});

export default GestionGaleriaScreen;