import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  ActivityIndicator,
  Image,
  TouchableOpacity
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Footer from '../../components/Footer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';

const DashboardScreen = () => {
  const [dashboardData, setDashboardData] = useState({
    topHoras: [],
    topServicios: [],
    tiposDeUsuarios: [
      { name: 'Clientes', population: 0, color: '#3498db', legendFontColor: '#7F7F7F', legendFontSize: 15 },  // Azul
      { name: 'Barberos', population: 0, color: '#e74c3c', legendFontColor: '#7F7F7F', legendFontSize: 15 },  // Rojo
      { name: 'Admin', population: 0, color: '#044c68ff', legendFontColor: '#7F7F7F', legendFontSize: 15 }  // Verde
    ],
    totalUsuarios: 0,
    topBarberos: [],
    citasCompletadasTotales: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get('https://vianney-server.onrender.com/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Procesar tipos de usuarios para asegurar que tengamos los 3 tipos
      const tiposUsuarios = response.data.tiposDeUsuarios || [];
      const tiposProcesados = [
        { name: 'Clientes', population: 0, color: '#3498db', legendFontColor: '#7F7F7F', legendFontSize: 15 },
        { name: 'Barberos', population: 0, color: '#e74c3c', legendFontColor: '#7F7F7F', legendFontSize: 15 },
        { name: 'Admin', population: 0, color: '#044c68ff', legendFontColor: '#7F7F7F', legendFontSize: 15 }
      ];

      tiposUsuarios.forEach(item => {
        if (item.label.includes('Cliente') || item.label.includes('Paciente')) {
          tiposProcesados[0].population += item.value;
        } else if (item.label.includes('Barbero') || item.label.includes('Cosmetólogo')) {
          tiposProcesados[1].population += item.value;
        } else if (item.label.includes('Admin')) {
          tiposProcesados[2].population += item.value;
        }
      });

      setDashboardData({
        topHoras: response.data.topHoras || [],
        topServicios: response.data.topServicios || [],
        tiposDeUsuarios: tiposProcesados,
        totalUsuarios: response.data.totalUsuarios || 0,
        topBarberos: response.data.topBarberos || [],
        citasCompletadasTotales: response.data.citasCompletadasTotales || 0
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error al cargar los datos del dashboard');
      setDashboardData(prev => ({
        ...prev,
        topHoras: [],
        topServicios: [],
        tiposDeUsuarios: [
          { name: 'Clientes', population: 0, color: '#3498db', legendFontColor: '#7F7F7F', legendFontSize: 15 },
          { name: 'Barberos', population: 0, color: '#e74c3c', legendFontColor: '#7F7F7F', legendFontSize: 15 },
          { name: 'Administradores', population: 0, color: '#044c68ff', legendFontColor: '#7F7F7F', legendFontSize: 15 }
        ],
        totalUsuarios: 0,
        topBarberos: [],
        citasCompletadasTotales: 0
      }));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  useEffect(() => {
    const onChange = ({ window }) => {
      setDimensions(window);
    };
    Dimensions.addEventListener('change', onChange);
    return () => Dimensions.removeEventListener('change', onChange);
  }, []);

  const isMobile = dimensions.width < 768;
  const chartWidth = isMobile ? dimensions.width * 0.85 : dimensions.width * 0.4;

  const formatNumber = (value) => {
    return value.toLocaleString('es-CO');
  };

  // Función para acortar los nombres de los servicios
  const truncateServiceName = (name, maxLength = 15) => {
    if (!name) return '';
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    barPercentage: 0.6,
    propsForLabels: {
      fontSize: isMobile ? 10 : 12,
      fontWeight: 'bold'
    },
    fillShadowGradient: '#1a237e',
    fillShadowGradientOpacity: 1,
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#e0e0e0',
    },
    formatYLabel: (value) => formatNumber(value),
    formatTopBarValue: (value) => formatNumber(value),
    formatTooltipY: (value) => formatNumber(value),
    style: {
      borderRadius: 16,
      paddingRight: 40,
    },
    propsForVerticalLabels: {
      fontWeight: 'bold',
    },
    propsForHorizontalLabels: {
      fontWeight: 'bold',
    },
    barRadius: 6,
    yAxisLabel: '',
    yLabelsOffset: 10,
    xLabelsOffset: 10,
  };

  const pieChartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    propsForLabels: {
      fontSize: isMobile ? 10 : 12,
      fontWeight: 'bold'
    },
    style: {
      borderRadius: 16,
    },
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={40} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchDashboardData} style={styles.retryButton}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, isMobile && styles.titleMobile]}>Dashboard</Text>

        {/* Tarjetas de resumen mejoradas */}
        <View style={[styles.summaryContainer, isMobile && styles.summaryContainerMobile]}>
          <TouchableOpacity style={[styles.summaryCard, styles.summaryCardPrimary]}>
            <LinearGradient
              colors={['#e74c3c', '#c0392b']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.summaryContent}>
                <Icon name="event-available" size={24} color="#fff" />
                <Text style={styles.summaryTitle}>Citas completadas</Text>
                <Text style={styles.summaryValue}>{formatNumber(dashboardData.citasCompletadasTotales)}</Text>
                <Text style={styles.summarySubtitle}>Total histórico</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.summaryCard, styles.summaryCardSecondary]}>
            <LinearGradient
              colors={['#3498db', '#2980b9']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.summaryContent}>
                <Icon name="people" size={24} color="#fff" />
                <Text style={styles.summaryTitle}>Usuarios registrados</Text>
                <Text style={styles.summaryValue}>{formatNumber(dashboardData.totalUsuarios)}</Text>
                <Text style={styles.summarySubtitle}>Total verificados</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Gráficos en línea horizontal */}
        <View style={[styles.chartsRow, isMobile && styles.chartsRowMobile]}>
          {/* Horas con más citas */}
          <View style={[styles.chartContainer, isMobile && styles.chartContainerMobile]}>
            <View style={styles.chartHeader}>
              <Icon name="access-time" size={20} color="#e74c3c" />
              <Text style={styles.chartTitle}>Horas con más citas</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              style={styles.chartScrollContainer}
              contentContainerStyle={styles.chartScrollContent}
            >
              <BarChart
                data={{
                  labels: dashboardData.topHoras.map(item => item.label),
                  datasets: [{
                    data: dashboardData.topHoras.map(item => item.value),
                    color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
                    colors: dashboardData.topHoras.map((_, index) => 
                      (opacity = 1) => `rgba(231, 76, 60, ${0.7 + (index * 0.05)})`
                    )
                  }]
                }}
                width={Math.max(
                  isMobile ? dimensions.width * 0.9 : dimensions.width * 0.45,
                  dashboardData.topHoras.length * 60 + 100
                )}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                fromZero
                showValuesOnTopOfBars
                withCustomBarColorFromData
                flatColor
                yAxisLabel=""
                yAxisSuffix=""
              />
            </ScrollView>
          </View>

          {/* Servicios más solicitados - CORREGIDO */}
          <View style={[styles.chartContainer, isMobile && styles.chartContainerMobile]}>
            <View style={styles.chartHeader}>
              <Icon name="content-cut" size={20} color="#3498db" />
              <Text style={styles.chartTitle}>Servicios más solicitados</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              style={styles.chartScrollContainer}
              contentContainerStyle={styles.chartScrollContent}
            >
              <BarChart
                data={{
                  labels: dashboardData.topServicios.map(item => truncateServiceName(item.label)),
                  datasets: [{
                    data: dashboardData.topServicios.map(item => item.value),
                    color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                    colors: dashboardData.topServicios.map((_, index) => 
                      (opacity = 1) => `rgba(52, 152, 219, ${0.7 + (index * 0.05)})`
                    )
                  }]
                }}
                width={Math.max(
                  isMobile ? dimensions.width * 0.9 : dimensions.width * 0.45,
                  dashboardData.topServicios.length * 80 + 100 // Aumenté el ancho por barra para mejor visualización
                )}
                height={240} // Aumenté la altura para dar más espacio a las etiquetas
                chartConfig={{
                  ...chartConfig,
                  propsForLabels: {
                    fontSize: isMobile ? 9 : 11, // Reducí ligeramente el tamaño de fuente
                    fontWeight: 'bold'
                  },
                  propsForHorizontalLabels: {
                    fontSize: isMobile ? 9 : 11,
                    fontWeight: 'bold',
                    rotation: isMobile ? -45 : 0, // Rotación para móviles si es necesario
                  }
                }}
                style={styles.chart}
                fromZero
                showValuesOnTopOfBars
                withCustomBarColorFromData
                flatColor
                yAxisLabel=""
                yAxisSuffix=""
                verticalLabelRotation={isMobile ? -45 : 0} // Rotación de etiquetas para mejor visualización
              />
            </ScrollView>
          </View>
        </View>

        {/* Segunda línea de gráficos */}
        <View style={[styles.chartsRow, isMobile && styles.chartsRowMobile]}>
          {/* Tipos de usuarios */}
          <View style={[styles.chartContainer, isMobile && styles.chartContainerMobile]}>
            <View style={styles.chartHeader}>
              <Icon name="pie-chart" size={20} color="#044c68ff" />
              <Text style={styles.chartTitle}>Distribución de usuarios</Text>
              <Text style={styles.chartSubtitle}>Total: {formatNumber(dashboardData.totalUsuarios)}</Text>
            </View>
            <PieChart
              data={dashboardData.tiposDeUsuarios}
              width={isMobile ? dimensions.width * 0.9 : dimensions.width * 0.45}
              height={200}
              chartConfig={pieChartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              hasLegend
            />
          </View>

          {/* Top barberos */}
          <View style={[styles.chartContainer, isMobile && styles.chartContainerMobile]}>
            <View style={styles.chartHeader}>
              <Icon name="star" size={20} color="#e74c3c" />
              <Text style={styles.chartTitle}>Top barberos</Text>
              <Text style={styles.chartSubtitle}>Por citas atendidas</Text>
            </View>
            <ScrollView 
              style={styles.barberosScrollContainer}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.barberosContainer}>
                {dashboardData.topBarberos.map((barbero, index) => (
                  <TouchableOpacity key={barbero.id || index} style={styles.barberoItem}>
                    <View style={styles.barberoInfo}>
                      <View style={styles.barberoRank}>
                        <Text style={styles.barberoRankText}>{index + 1}</Text>
                      </View>
                      {barbero.avatar ? (
                        <Image source={{ uri: barbero.avatar }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                          <Text style={styles.avatarText}>{barbero.nombre ? barbero.nombre.charAt(0) : 'B'}</Text>
                        </View>
                      )}
                      <Text style={styles.barberoName}>
                        {barbero.nombre || `Barbero ${index + 1}`}
                      </Text>
                    </View>
                    <View style={styles.barberoStats}>
                      <Text style={styles.barberoCitas}>{barbero.citas || 0} citas</Text>
                      <Icon name="chevron-right" size={20} color="#9e9e9e" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  container: { 
    padding: 16, 
    paddingBottom: 80 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f5f5f5' 
  },
  loadingText: { 
    marginTop: 20, 
    color: '#e74c3c', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f5f5f5', 
    padding: 20 
  },
  errorText: { 
    color: '#e74c3c', 
    fontSize: 16, 
    textAlign: 'center', 
    marginTop: 10,
    fontWeight: 'bold'
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    color: '#424242', 
    textAlign: 'center',
    fontFamily: 'Roboto'
  },
  titleMobile: { 
    textAlign: 'center', 
    marginLeft: 8, 
    marginBottom: 16 
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  summaryContainerMobile: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16
  },
  summaryCard: {
    borderRadius: 12,
    width: '48%',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  summaryCardMobile: {
    width: '100%'
  },
  summaryCardPrimary: {
    backgroundColor: '#e74c3c'
  },
  summaryCardSecondary: {
    backgroundColor: '#3498db'
  },
  gradient: {
    padding: 20,
    borderRadius: 12
  },
  summaryContent: {
    alignItems: 'center'
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5
  },
  summaryValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5
  },
  summarySubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12
  },
  chartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  chartsRowMobile: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    maxHeight: 320, // Aumenté la altura máxima para el gráfico de servicios
  },
  chartContainerMobile: {
    width: '100%'
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginLeft: 8
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 'auto'
  },
  chartScrollContainer: {
    flex: 1,
  },
  chartScrollContent: {
    flexGrow: 1,
  },
  chart: {
    borderRadius: 12,
  },
  barberosScrollContainer: {
    maxHeight: 200, // Altura máxima para la lista de barberos
  },
  barberosContainer: {
    paddingRight: 5, // Espacio para el scrollbar
  },
  barberoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  barberoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  barberoRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  barberoRankText: {
    fontWeight: 'bold',
    color: '#424242'
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  avatarPlaceholder: {
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18
  },
  barberoName: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
    flex: 1
  },
  barberoStats: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  barberoCitas: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginRight: 5
  }
});

export default DashboardScreen;