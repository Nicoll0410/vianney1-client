import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Modal,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Footer from '../../components/Footer';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const GaleriaScreen = ({ navigation }) => {
  const [galeriaPorBarbero, setGaleriaPorBarbero] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(null);
  const [contenidosSeleccionados, setContenidosSeleccionados] = useState([]);

  useEffect(() => {
    fetchGaleriaDestacada();
  }, []);

  const fetchGaleriaDestacada = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(
        'https://vianney-server.onrender.com/galeria/destacados',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (data.success) {
        setGaleriaPorBarbero(data.data);
      }
    } catch (error) {
      console.error('Error cargando galería:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirGaleriaCompleta = async (barberoId, barbero) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get(
        `https://vianney-server.onrender.com/galeria/barbero/${barberoId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (data.success) {
        setBarberoSeleccionado(barbero);
        setContenidosSeleccionados(data.data);
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error cargando galería completa:', error);
    }
  };

  const abrirRedSocial = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const renderBarberoCard = (item, index) => {
    const { barbero, contenidoDestacado } = item;
    
    // Validar si el avatar es válido
    const avatarValido = barbero.avatar && 
                        typeof barbero.avatar === 'string' && 
                        barbero.avatar.length > 500 &&
                        barbero.avatar.startsWith('data:image/');

    // Validar si el contenido es válido
    const contenidoValido = contenidoDestacado?.contenido &&
                           typeof contenidoDestacado.contenido === 'string' &&
                           contenidoDestacado.contenido.length > 500;

    return (
      <View key={index} style={styles.barberoCard}>
        <View style={styles.cardInner}>
          {/* Header con foto del barbero */}
          <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
              {avatarValido ? (
                <Image
                  source={{ uri: barbero.avatar }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={30} color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.barberoInfo}>
              <Text style={styles.barberoNombre} numberOfLines={1}>
                {barbero.nombre}
              </Text>
              {barbero.telefono && (
                <View style={styles.telefonoContainer}>
                  <Ionicons name="call" size={12} color="#D4AF37" />
                  <Text style={styles.telefonoText}>{barbero.telefono}</Text>
                </View>
              )}
              {/* Redes sociales del barbero */}
              {(barbero.instagram || barbero.facebook || barbero.tiktok) && (
                <View style={styles.redesBarberoContainer}>
                  {barbero.instagram && (
                    <TouchableOpacity
                      onPress={() => abrirRedSocial(barbero.instagram)}
                      style={styles.redBarberoButton}
                    >
                      <FontAwesome name="instagram" size={16} color="#E4405F" />
                    </TouchableOpacity>
                  )}
                  {barbero.facebook && (
                    <TouchableOpacity
                      onPress={() => abrirRedSocial(barbero.facebook)}
                      style={styles.redBarberoButton}
                    >
                      <FontAwesome name="facebook" size={16} color="#1877F2" />
                    </TouchableOpacity>
                  )}
                  {barbero.tiktok && (
                    <TouchableOpacity
                      onPress={() => abrirRedSocial(barbero.tiktok)}
                      style={styles.redBarberoButton}
                    >
                      <FontAwesome name="music" size={16} color="#000" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Trabajo destacado compacto */}
          {contenidoValido ? (
            <View style={styles.trabajoContainerCompact}>
              {contenidoDestacado.tipo === 'imagen' ? (
                <Image
                  source={{ uri: contenidoDestacado.contenido }}
                  style={styles.trabajoImagenCompact}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.videoPlaceholderCompact}>
                  <Ionicons name="play-circle" size={40} color="#fff" />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.sinContenidoCompact}>
              <Ionicons name="images-outline" size={30} color="#ccc" />
              <Text style={styles.sinContenidoTextCompact}>Sin contenido</Text>
            </View>
          )}

          {/* Descripción compacta */}
          {contenidoDestacado?.descripcion && (
            <Text style={styles.descripcionCompact} numberOfLines={2}>
              {contenidoDestacado.descripcion}
            </Text>
          )}

          {/* Botón ver más compacto */}
          <TouchableOpacity
            style={styles.verMasButtonCompact}
            onPress={() => abrirGaleriaCompleta(barbero.id, barbero)}
          >
            <Ionicons name="images-outline" size={14} color="#fff" />
            <Text style={styles.verMasTextCompact}>Ver más</Text>
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerContainer}>
          <View style={styles.headerGradient}>
            <View style={styles.headerContent}>
              <Ionicons name="cut-outline" size={40} color="#D4AF37" />
              <Text style={styles.headerTitle}>
                Conoce el trabajo de nuestros barberos
              </Text>
              <Text style={styles.headerSubtitle}>
                Explora los mejores cortes y estilos
              </Text>
            </View>
          </View>
        </View>

        {galeriaPorBarbero.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>
              No hay contenido destacado disponible
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {galeriaPorBarbero.map(renderBarberoCard)}
          </View>
        )}

        <Footer />
      </ScrollView>

      {/* Modal de galería completa */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <Text style={styles.modalTitle}>
                Trabajos de {barberoSeleccionado?.nombre}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#424242" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {contenidosSeleccionados.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="images-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>
                  Este barbero aún no ha subido trabajos
                </Text>
              </View>
            ) : (
              <View style={styles.galeriaGrid}>
                {contenidosSeleccionados.map((contenido, index) => {
                  const contenidoValido = contenido.contenido &&
                                         typeof contenido.contenido === 'string' &&
                                         contenido.contenido.length > 500;

                  return (
                    <View key={index} style={styles.galeriaItem}>
                      {contenidoValido && contenido.tipo === 'imagen' ? (
                        <Image
                          source={{ uri: contenido.contenido }}
                          style={styles.galeriaImagen}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.videoPlaceholderSmall}>
                          <Ionicons name="play-circle" size={40} color="#fff" />
                        </View>
                      )}
                      {contenido.descripcion && (
                        <Text style={styles.galeriaDescripcion}>
                          {contenido.descripcion}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
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
  headerContainer: {
    overflow: 'hidden'
  },
  headerGradient: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 40,
    paddingHorizontal: 20,
    position: 'relative'
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 1
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D4AF37',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8
  },
  barberoCard: {
    width: isMobile ? '50%' : '33.33%',
    padding: 8
  },
  cardInner: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    height: '100%'
  },
  cardHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 12
  },
  avatarContainer: {
    marginBottom: 8
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#D4AF37'
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#424242',
    justifyContent: 'center',
    alignItems: 'center'
  },
  barberoInfo: {
    alignItems: 'center',
    width: '100%'
  },
  barberoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center'
  },
  telefonoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4
  },
  telefonoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  redesBarberoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8
  },
  redBarberoButton: {
    padding: 4
  },
  trabajoContainerCompact: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8
  },
  trabajoImagenCompact: {
    width: '100%',
    height: 140,
    backgroundColor: '#f5f5f5'
  },
  videoPlaceholderCompact: {
    width: '100%',
    height: 140,
    backgroundColor: '#424242',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sinContenidoCompact: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 8
  },
  sinContenidoTextCompact: {
    color: '#999',
    marginTop: 4,
    fontSize: 11
  },
  descripcionCompact: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center'
  },
  redesSocialesCompact: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0'
  },
  redSocialButtonCompact: {
    marginHorizontal: 6,
    padding: 4
  },
  verMasButtonCompact: {
    flexDirection: 'row',
    backgroundColor: '#424242',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  verMasTextCompact: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4
  },
  // Estilos antiguos removidos (contacto, trabajo normal, etc)
  contactoContainer: {
    marginBottom: 16
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center'
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
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff'
  },
  modalHeaderLeft: {
    flex: 1
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
    flex: 1
  },
  galeriaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8
  },
  galeriaItem: {
    width: isMobile ? '50%' : '33.33%',
    padding: 8
  },
  galeriaImagen: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f5f5f5'
  },
  videoPlaceholderSmall: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#424242',
    justifyContent: 'center',
    alignItems: 'center'
  },
  galeriaDescripcion: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  }
});

export default GaleriaScreen;