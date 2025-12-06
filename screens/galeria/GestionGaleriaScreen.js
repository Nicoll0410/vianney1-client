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
import { Video } from 'expo-av';
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
  
  const [contenidos, setContenidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // ✅ NUEVO: Progreso de subida
  
  // Modal de subir contenido
  const [modalSubirVisible, setModalSubirVisible] = useState(false);
  const [tipoContenido, setTipoContenido] = useState('imagen');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null); // ✅ URI del archivo
  const [descripcion, setDescripcion] = useState('');
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
          'Necesitamos permisos para acceder a tus fotos y videos'
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
      } else if (userRole === 'Administrador') {
        const email = user?.email;
        
        if (!email) {
          showInfo('Error', 'No se pudo obtener el email del usuario', 'error');
          return;
        }

        const { data: respuestaBarberos } = await axios.get(
          'https://vianney-server.onrender.com/barberos',
          { 
            headers: { Authorization: `Bearer ${token}` },
            params: { all: true }
          }
        );
        
        let barberosArray = [];
        
        if (Array.isArray(respuestaBarberos)) {
          barberosArray = respuestaBarberos;
        } else if (respuestaBarberos.barberos) {
          barberosArray = respuestaBarberos.barberos;
        } else if (respuestaBarberos.data) {
          barberosArray = respuestaBarberos.data.barberos || respuestaBarberos.data;
        }
        
        const miBarbero = barberosArray.find(b => 
          b.usuario?.email?.toLowerCase() === email.toLowerCase()
        );
        
        if (!miBarbero) {
          showInfo('Error', 'No se encontró registro de barbero para este usuario', 'error');
          return;
        }
        
        barberoID = miBarbero.id;
      }

      if (!barberoID) {
        showInfo('Error', 'No se pudo identificar al barbero', 'error');
        return;
      }

      const { data } = await axios.get(
        `https://vianney-server.onrender.com/galeria/barbero/${barberoID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setContenidos(data.data);
      }
    } catch (error) {
      console.error('❌ Error cargando contenidos:', error);
      showInfo('Error', error.response?.data?.mensaje || 'No se pudo cargar el contenido', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVO: Seleccionar archivo (imagen o video) SIN convertir a base64
  const seleccionarArchivo = async () => {
    try {
      const esImagen = tipoContenido === 'imagen';
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: esImagen 
          ? ImagePicker.MediaTypeOptions.Images 
          : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: esImagen ? [4, 3] : undefined,
        quality: esImagen ? 0.8 : 1,
        videoMaxDuration: esImagen ? undefined : 120, // Máximo 2 minutos
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        
        // Verificar tamaño del archivo
        if (asset.fileSize) {
          const sizeInMB = asset.fileSize / (1024 * 1024);
          const maxSize = esImagen ? 10 : 100; // 10MB imágenes, 100MB videos
          
          if (sizeInMB > maxSize) {
            showInfo(
              'Archivo muy grande', 
              `El ${esImagen ? 'imagen' : 'video'} no puede superar los ${maxSize}MB. Tu archivo: ${sizeInMB.toFixed(2)}MB`,
              'warning'
            );
            return;
          }
          
          console.log(`📊 Tamaño del archivo: ${sizeInMB.toFixed(2)}MB`);
        }

        // ✅ Guardar solo la URI (NO convertir a base64)
        setArchivoSeleccionado({
          uri: asset.uri,
          type: esImagen ? 'image/jpeg' : 'video/mp4',
          name: `${esImagen ? 'image' : 'video'}_${Date.now()}.${esImagen ? 'jpg' : 'mp4'}`
        });
      }
    } catch (error) {
      console.error('Error seleccionando archivo:', error);
      showInfo('Error', 'Error al seleccionar el archivo', 'error');
    }
  };

  // ✅ NUEVO: Subir archivo con FormData (sin base64)
  const subirContenido = async () => {
    if (!archivoSeleccionado) {
      showInfo('Advertencia', 'Debes seleccionar una imagen o video', 'warning');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      
      const token = await AsyncStorage.getItem('token');
      
      // Obtener el barberoID
      let barberoID;
      if (userRole === 'Barbero' && barberData?.id) {
        barberoID = barberData.id;
      } else if (userRole === 'Administrador') {
        const email = user?.email;
        
        if (!email) {
          showInfo('Error', 'No se pudo obtener el email del usuario', 'error');
          return;
        }

        const { data: respuestaBarberos } = await axios.get(
          'https://vianney-server.onrender.com/barberos',
          { 
            headers: { Authorization: `Bearer ${token}` },
            params: { all: true }
          }
        );
        
        let barberosArray = [];
        
        if (Array.isArray(respuestaBarberos)) {
          barberosArray = respuestaBarberos;
        } else if (respuestaBarberos.barberos) {
          barberosArray = respuestaBarberos.barberos;
        } else if (respuestaBarberos.data) {
          barberosArray = respuestaBarberos.data.barberos || respuestaBarberos.data;
        }
        
        const miBarbero = barberosArray.find(b => 
          b.usuario?.email?.toLowerCase() === email.toLowerCase()
        );
        
        if (!miBarbero) {
          showInfo('Error', 'No se encontró registro de barbero', 'error');
          return;
        }
        
        barberoID = miBarbero.id;
      }

      if (!barberoID) {
        showInfo('Error', 'No se pudo identificar al barbero', 'error');
        return;
      }

      // ✅ Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', {
        uri: archivoSeleccionado.uri,
        type: archivoSeleccionado.type,
        name: archivoSeleccionado.name
      });
      formData.append('barberoID', barberoID);
      formData.append('tipo', tipoContenido);
      formData.append('descripcion', descripcion || '');
      formData.append('destacado', destacado);
      formData.append('orden', '0');

      console.log('📤 Subiendo archivo...');

      // ✅ Seleccionar endpoint según el tipo
      const endpoint = tipoContenido === 'imagen' 
        ? 'https://vianney-server.onrender.com/galeria/upload/image'
        : 'https://vianney-server.onrender.com/galeria/upload/video';

      // ✅ Subir con progreso
      await axios.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
          console.log(`📊 Progreso: ${percentCompleted}%`);
        }
      });

      // Limpiar formulario
      setArchivoSeleccionado(null);
      setDescripcion('');
      setDestacado(false);
      setTipoContenido('imagen');
      setModalSubirVisible(false);
      setUploadProgress(0);

      await fetchContenidos();
      showInfo('¡Éxito!', 'Contenido subido correctamente', 'success');
    } catch (error) {
      console.error('❌ Error subiendo contenido:', error);
      showInfo('Error', error.response?.data?.mensaje || 'No se pudo subir el contenido', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
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
                           item.contenido.length > 10; // ✅ URL de Cloudinary (no base64)

    return (
      <View key={index} style={styles.contenidoCard}>
        <View style={styles.imagenContainer}>
          {contenidoValido ? (
            item.tipo === 'video' ? (
              <Video
                source={{ uri: item.contenido }}
                style={styles.imagen}
                useNativeControls
                resizeMode="cover"
                isLooping={false}
              />
            ) : (
              <Image
                source={{ uri: item.contenido }}
                style={styles.imagen}
                resizeMode="cover"
              />
            )
          ) : (
            <View style={styles.imagenPlaceholder}>
              <Ionicons 
                name={item.tipo === 'video' ? "videocam-outline" : "image-outline"} 
                size={40} 
                color="#999" 
              />
            </View>
          )}
          
          {item.destacado && (
            <View style={styles.destacadoBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
            </View>
          )}
          
          <View style={[
            styles.tipoBadge,
            item.tipo === 'video' && styles.tipoBadgeVideo
          ]}>
            <Ionicons 
              name={item.tipo === 'video' ? "videocam" : "image"} 
              size={12} 
              color="#fff" 
            />
          </View>
        </View>

        {item.descripcion && (
          <Text style={styles.descripcionCard} numberOfLines={2}>
            {item.descripcion}
          </Text>
        )}

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
              <Text style={styles.emptyButtonText}>Subir contenido</Text>
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
              onPress={() => {
                setModalSubirVisible(false);
                setArchivoSeleccionado(null);
                setDescripcion('');
                setDestacado(false);
                setTipoContenido('imagen');
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#424242" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Selector de tipo */}
            <View style={styles.tipoSelector}>
              <TouchableOpacity
                style={[
                  styles.tipoButton,
                  tipoContenido === 'imagen' && styles.tipoButtonActive
                ]}
                onPress={() => {
                  setTipoContenido('imagen');
                  setArchivoSeleccionado(null);
                }}
              >
                <Ionicons 
                  name="image" 
                  size={24} 
                  color={tipoContenido === 'imagen' ? '#fff' : '#424242'} 
                />
                <Text style={[
                  styles.tipoButtonText,
                  tipoContenido === 'imagen' && styles.tipoButtonTextActive
                ]}>
                  Imagen
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tipoButton,
                  tipoContenido === 'video' && styles.tipoButtonActive
                ]}
                onPress={() => {
                  setTipoContenido('video');
                  setArchivoSeleccionado(null);
                }}
              >
                <Ionicons 
                  name="videocam" 
                  size={24} 
                  color={tipoContenido === 'video' ? '#fff' : '#424242'} 
                />
                <Text style={[
                  styles.tipoButtonText,
                  tipoContenido === 'video' && styles.tipoButtonTextActive
                ]}>
                  Video
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selector de archivo */}
            <TouchableOpacity
              style={styles.imagenSelector}
              onPress={seleccionarArchivo}
            >
              {archivoSeleccionado ? (
                tipoContenido === 'imagen' ? (
                  <Image
                    source={{ uri: archivoSeleccionado.uri }}
                    style={styles.imagenPreview}
                    resizeMode="cover"
                  />
                ) : (
                  <Video
                    source={{ uri: archivoSeleccionado.uri }}
                    style={styles.imagenPreview}
                    useNativeControls
                    resizeMode="cover"
                  />
                )
              ) : (
                <View style={styles.imagenSelectorPlaceholder}>
                  <Ionicons 
                    name={tipoContenido === 'imagen' ? "camera" : "videocam"} 
                    size={50} 
                    color="#999" 
                  />
                  <Text style={styles.imagenSelectorText}>
                    Toca para seleccionar {tipoContenido === 'imagen' ? 'imagen' : 'video'}
                  </Text>
                  {tipoContenido === 'video' && (
                    <Text style={styles.videoLimitText}>
                      Máximo 2 minutos • 100MB
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>

            {/* ✅ NUEVO: Barra de progreso */}
            {uploading && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                </View>
                <Text style={styles.progressText}>{uploadProgress}%</Text>
              </View>
            )}

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
                onPress={() => {
                  setModalSubirVisible(false);
                  setArchivoSeleccionado(null);
                  setDescripcion('');
                  setDestacado(false);
                  setTipoContenido('imagen');
                }}
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
  tipoBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(66,66,66,0.8)',
    borderRadius: 12,
    padding: 4,
    paddingHorizontal: 8
  },
  tipoBadgeVideo: {
    backgroundColor: 'rgba(211,47,47,0.8)'
  },
  descripcionCard: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8
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
  tipoSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12
  },
  tipoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff'
  },
  tipoButtonActive: {
    borderColor: '#424242',
    backgroundColor: '#424242'
  },
  tipoButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#424242'
  },
  tipoButtonTextActive: {
    color: '#fff'
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
  videoLimitText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic'
  },
  // ✅ NUEVO: Barra de progreso
  progressContainer: {
    marginBottom: 20,
    alignItems: 'center'
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4
  },
  progressText: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '600'
  },
  inputContainer: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top'
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