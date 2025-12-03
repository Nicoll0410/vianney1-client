import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import Footer from '../../components/Footer';
import InfoModal from '../../components/InfoModal';

const MiPerfilScreen = () => {
  const { user, userRole, barberData } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Datos del barbero
  const [barberoID, setBarberoID] = useState(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  
  // Redes sociales
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  
  // Modal de info
  const [infoVisible, setInfoVisible] = useState(false);
  const [infoTitle, setInfoTitle] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [infoType, setInfoType] = useState('info');

  useEffect(() => {
    cargarDatosBarbero();
  }, []);

  const showInfo = (title, message, type = 'info') => {
    setInfoTitle(title);
    setInfoMsg(message);
    setInfoType(type);
    setInfoVisible(true);
  };

  const cargarDatosBarbero = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      let barberoID;
      if (userRole === 'Barbero' && barberData?.id) {
        barberoID = barberData.id;
        console.log('✅ Barbero ID desde barberData:', barberoID);
      } else if (userRole === 'Administrador') {
        const emailUsuario = user?.email;
        
        if (!emailUsuario) {
          showInfo('Error', 'No se pudo obtener el email del usuario', 'error');
          return;
        }

        console.log('📧 Buscando barbero por email:', emailUsuario);

        const { data: respuestaBarberos } = await axios.get(
          'https://vianney-server.onrender.com/barberos',
          { 
            headers: { Authorization: `Bearer ${token}` },
            params: { all: true }
          }
        );
        
        const barberosArray = Array.isArray(respuestaBarberos) ? respuestaBarberos : 
                             (respuestaBarberos.barberos || respuestaBarberos.data || []);
        
        const miBarbero = barberosArray.find(b => 
          b.usuario?.email?.toLowerCase() === emailUsuario.toLowerCase()
        );
        
        if (!miBarbero) {
          showInfo('Error', 'No se encontró registro de barbero', 'error');
          return;
        }
        
        barberoID = miBarbero.id;
        console.log('✅ Barbero encontrado:', miBarbero.nombre);
      }

      if (!barberoID) {
        showInfo('Error', 'No se pudo identificar al barbero', 'error');
        return;
      }

      console.log('📡 Cargando datos del barbero ID:', barberoID);

      // ✅ CORRECCIÓN: Usar /barberos/by-id/:id en lugar de /barberos/:id
      const { data } = await axios.get(
        `https://vianney-server.onrender.com/barberos/by-id/${barberoID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // El endpoint devuelve { barbero: {...} }
      const barbero = data.barbero || data;

      console.log('✅ Datos cargados correctamente');
      console.log('📱 Redes sociales actuales:', {
        instagram: barbero.instagram || 'No configurado',
        facebook: barbero.facebook || 'No configurado',
        tiktok: barbero.tiktok || 'No configurado'
      });

      setBarberoID(barbero.id);
      setNombre(barbero.nombre || '');
      setTelefono(barbero.telefono || '');
      setEmail(barbero.usuario?.email || user?.email || '');
      
      // Cargar redes sociales
      setInstagram(barbero.instagram || '');
      setFacebook(barbero.facebook || '');
      setTiktok(barbero.tiktok || '');

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      if (error.response?.status === 401) {
        showInfo('Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.', 'error');
      } else if (error.response?.status === 404) {
        showInfo('Error', 'No se encontró el barbero. Verifica tu cuenta.', 'error');
      } else {
        showInfo('Error', 'No se pudieron cargar los datos', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const guardarRedesSociales = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');

      console.log('💾 Guardando redes sociales...');
      console.log('🆔 Barbero ID:', barberoID);
      console.log('📱 Datos a enviar:', {
        instagram: instagram || null,
        facebook: facebook || null,
        tiktok: tiktok || null
      });

      const response = await axios.patch(
        `https://vianney-server.onrender.com/barberos/${barberoID}`,
        {
          instagram: instagram || null,
          facebook: facebook || null,
          tiktok: tiktok || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Respuesta del servidor:', response.data);
      showInfo('¡Éxito!', 'Redes sociales actualizadas correctamente', 'success');
      
    } catch (error) {
      console.error('❌ Error guardando:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      if (error.response?.status === 401) {
        showInfo('Sesión expirada', 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.', 'error');
      } else if (error.response?.status === 404) {
        showInfo('Error', 'No se encontró el endpoint. Verifica la URL: /barberos/' + barberoID, 'error');
      } else {
        showInfo('Error', error.response?.data?.mensaje || 'No se pudieron guardar los cambios', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const limpiarRedSocial = (red) => {
    switch(red) {
      case 'instagram':
        setInstagram('');
        break;
      case 'facebook':
        setFacebook('');
        break;
      case 'tiktok':
        setTiktok('');
        break;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#424242" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="person-circle" size={60} color="#D4AF37" />
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <Text style={styles.headerSubtitle}>{nombre}</Text>
        </View>

        {/* Información básica (solo lectura) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Básica</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{nombre}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{telefono}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>
        </View>

        {/* Redes Sociales (editable) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Redes Sociales</Text>
          <Text style={styles.sectionDescription}>
            Estas aparecerán en tu perfil público de la galería
          </Text>

          {/* Instagram */}
          <View style={styles.socialInputContainer}>
            <View style={styles.socialHeader}>
              <FontAwesome name="instagram" size={24} color="#E4405F" />
              <Text style={styles.socialLabel}>Instagram</Text>
              {instagram && (
                <TouchableOpacity
                  onPress={() => limpiarRedSocial('instagram')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.socialInput}
              placeholder="https://instagram.com/tu_usuario"
              value={instagram}
              onChangeText={setInstagram}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Facebook */}
          <View style={styles.socialInputContainer}>
            <View style={styles.socialHeader}>
              <FontAwesome name="facebook" size={24} color="#1877F2" />
              <Text style={styles.socialLabel}>Facebook</Text>
              {facebook && (
                <TouchableOpacity
                  onPress={() => limpiarRedSocial('facebook')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.socialInput}
              placeholder="https://facebook.com/tu_pagina"
              value={facebook}
              onChangeText={setFacebook}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* TikTok */}
          <View style={styles.socialInputContainer}>
            <View style={styles.socialHeader}>
              <FontAwesome name="music" size={24} color="#000" />
              <Text style={styles.socialLabel}>TikTok</Text>
              {tiktok && (
                <TouchableOpacity
                  onPress={() => limpiarRedSocial('tiktok')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.socialInput}
              placeholder="https://tiktok.com/@tu_usuario"
              value={tiktok}
              onChangeText={setTiktok}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Botón guardar */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={guardarRedesSociales}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Vista previa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vista Previa</Text>
          <Text style={styles.sectionDescription}>
            Así verán los clientes tus redes sociales
          </Text>

          <View style={styles.previewCard}>
            <Text style={styles.previewNombre}>{nombre}</Text>
            <Text style={styles.previewTelefono}>📞 {telefono}</Text>
            
            {(instagram || facebook || tiktok) ? (
              <View style={styles.previewRedes}>
                {instagram && <FontAwesome name="instagram" size={20} color="#E4405F" />}
                {facebook && <FontAwesome name="facebook" size={20} color="#1877F2" />}
                {tiktok && <FontAwesome name="music" size={20} color="#000" />}
              </View>
            ) : (
              <Text style={styles.previewSinRedes}>
                No has agregado redes sociales
              </Text>
            )}
          </View>
        </View>

        <Footer />
      </ScrollView>

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
    backgroundColor: '#f5f5f5'
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
    backgroundColor: '#1a1a1a',
    padding: 30,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#D4AF37',
    marginTop: 4
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  infoContent: {
    marginLeft: 16,
    flex: 1
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 16,
    color: '#212121',
    fontWeight: '500'
  },
  socialInputContainer: {
    marginBottom: 20
  },
  socialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  socialLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 12,
    flex: 1
  },
  clearButton: {
    padding: 4
  },
  socialInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa'
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#424242',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  saveButtonDisabled: {
    backgroundColor: '#999'
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  },
  previewCard: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed'
  },
  previewNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8
  },
  previewTelefono: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  previewRedes: {
    flexDirection: 'row',
    gap: 12
  },
  previewSinRedes: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic'
  }
});

export default MiPerfilScreen;