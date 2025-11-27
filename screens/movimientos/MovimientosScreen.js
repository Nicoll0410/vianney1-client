/* ───────────────────────────────────────────────────────────
   Historial de Movimientos
   Pantalla: MovimientosScreen.js
   ─────────────────────────────────────────────────────────── */
import React, { useState, useEffect, useCallback, useContext } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* Componentes propios */
import Paginacion from "../../components/Paginacion";
import Buscador from "../../components/Buscador";
import Footer from "../../components/Footer";
import { AuthContext } from "../../contexts/AuthContext";

/* ───────── CONFIG ───────── */
const { width } = Dimensions.get("window");
const isMobile = width < 768;

/*  Soluciona localhost en emulador Android  */
const API_BASE = Platform.select({
  android : "https://vianney-server.onrender.com",
  ios     : "https://vianney-server.onrender.com",
  default : "https://vianney-server.onrender.com",
});

/* ───────── CARD (modo móvil) ───────── */
const MovimientoCard = ({ item }) => (
  <View style={styles.card}>
    <Text style={styles.cardNombre}>
      {item.insumo?.nombre || "Insumo no disponible"}
    </Text>

    <View style={styles.cardDetails}>
      {/* Unidades */}
      <View style={styles.detailRow}>
        <MaterialIcons name="format-list-numbered" size={16} color="#757575" />
        <Text style={styles.detailText}>
          Unidades: {Math.abs(item.cantidad)}
        </Text>
      </View>

      {/* Fecha */}
      <View style={styles.detailRow}>
        <MaterialIcons name="date-range" size={16} color="#757575" />
        <Text style={styles.detailText}>
          {new Date(item.createdAt).toLocaleDateString()} –{" "}
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
      </View>

      {/* Descripción */}
      {item.insumo?.descripcion && (
        <View style={styles.detailRow}>
          <MaterialIcons name="description" size={16} color="#757575" />
          <Text style={styles.detailText}>{item.insumo.descripcion}</Text>
        </View>
      )}
    </View>
  </View>
);

/* ───────── PANTALLA PRINCIPAL ───────── */
const MovimientosScreen = () => {
  const { token: ctxToken } = useContext(AuthContext);

  /* State */
  const [movimientos, setMovimientos] = useState([]);
  const [filtrados, setFiltrados]     = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [busqueda, setBusqueda]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);

  const MOVS_POR_PAGINA = isMobile ? 4 : 10;

  /* ───────── API ───────── */
  const fetchMovimientos = async () => {
    try {
      setLoading(true);

      /* Token: primero del contexto, si no desde storage */
      const authToken =
        ctxToken || (await AsyncStorage.getItem("token")) || null;

      const { data } = await axios.get(`${API_BASE}/movimientos`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params : { search: busqueda.trim() },
      });

      const lista = data.movimientos ?? [];
      setMovimientos(lista);
      setFiltrados(lista);
    } catch (err) {
      console.error("Error al obtener movimientos:", err?.response?.data || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ───────── HANDLERS ───────── */
  const onRefresh = () => {
    setRefreshing(true);
    fetchMovimientos();
  };

  /* ───────── EFFECTS ───────── */
  useEffect(() => {
    fetchMovimientos();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMovimientos();
    }, [busqueda])
  );

  /* Filtro local cada vez que se escribe en el buscador -------- */
  useEffect(() => {
    if (busqueda.trim() === "") {
      setFiltrados(movimientos);
    } else {
      const term = busqueda.toLowerCase();
      const list = movimientos.filter(
        (m) =>
          (m.insumo?.nombre ?? "").toLowerCase().includes(term) ||
          (m.insumo?.descripcion ?? "").toLowerCase().includes(term)
      );
      setFiltrados(list);
    }
    setPaginaActual(1);
  }, [busqueda, movimientos]);

  /* ───────── PAGINACIÓN (solo desktop) ───────── */
  const indiceInicial = (paginaActual - 1) * MOVS_POR_PAGINA;
  const mostrar = isMobile
    ? filtrados
    : filtrados.slice(indiceInicial, indiceInicial + MOVS_POR_PAGINA);
  const totalPaginas = Math.ceil(filtrados.length / MOVS_POR_PAGINA);

  const cambiarPagina = (nueva) => {
    if (nueva > 0 && nueva <= totalPaginas) setPaginaActual(nueva);
  };

  /* ───────── RENDER ───────── */
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Movimientos</Text>
        <View style={styles.counter}>
          <Text style={styles.counterText}>{filtrados.length}</Text>
        </View>
      </View>

      {/* Buscador */}
      <Buscador
        placeholder="Buscar por insumo o descripción"
        value={busqueda}
        onChangeText={setBusqueda}
      />

      {/* Tabla (desktop) o Cards (mobile) */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#424242" />
          <Text style={styles.loadingText}>Cargando movimientos...</Text>
        </View>
      ) : !isMobile ? (
        /* ───── Desktop Table ───── */
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <View style={[styles.headerCell, styles.insumoColumn]}>
              <Text style={styles.headerText}>Insumo</Text>
            </View>
            <View style={[styles.headerCell, styles.descripcionColumn]}>
              <Text style={styles.headerText}>Descripción</Text>
            </View>
            <View style={[styles.headerCell, styles.unidadesColumn]}>
              <Text style={styles.headerText}>Unidades</Text>
            </View>
            <View style={[styles.headerCell, styles.fechaColumn]}>
              <Text style={styles.headerText}>Fecha</Text>
            </View>
          </View>

          <FlatList
            data={mostrar}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.insumoColumn]}>
                  <Text style={styles.textoNombre}>
                    {item.insumo?.nombre || "-"}
                  </Text>
                </View>
                <View style={[styles.cell, styles.descripcionColumn]}>
                  <Text style={styles.textoDescripcion} numberOfLines={2}>
                    {item.insumo?.descripcion || "Sin descripción"}
                  </Text>
                </View>
                <View style={[styles.cell, styles.unidadesColumn]}>
                  <Text style={styles.textoCantidad}>
                    {Math.abs(item.cantidad)}
                  </Text>
                </View>
                <View style={[styles.cell, styles.fechaColumn]}>
                  <Text style={styles.textoFecha}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.textoHora}>
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </View>
      ) : (
        /* ───── Mobile Cards ───── */
        <FlatList
          data={mostrar}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MovimientoCard item={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={<View style={{ height: 20 }} />}
        />
      )}

      {/* Paginación desktop */}
      {!isMobile && !loading && filtrados.length > 0 && (
        <Paginacion
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          cambiarPagina={cambiarPagina}
        />
      )}

      <Footer />
    </View>
  );
};

/* ───────────────────────────────────────────────────────────
   Styles
   ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: isMobile ? 16 : 20,
    backgroundColor: "#fff",
  },
  /* Loading */
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#616161" },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: isMobile ? 16 : 20,
  },
  title: {
    fontSize: isMobile ? 22 : 24,
    fontWeight: "bold",
    color: "#424242",
    marginRight: 12,
  },
  counter: {
    backgroundColor: "#EEEEEE",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  counterText: { fontWeight: "bold", fontSize: 14, color: "#424242" },

  /* Desktop table */
  tableContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#424242",
    paddingVertical: 12,
  },
  headerCell: { justifyContent: "center", paddingHorizontal: 8 },
  headerText: { fontWeight: "bold", color: "white", fontSize: 14 },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  cell: { justifyContent: "center", paddingHorizontal: 8 },

  insumoColumn: { flex: 2 },
  descripcionColumn: { flex: 3 },
  unidadesColumn: { flex: 1, alignItems: "center" },
  fechaColumn: { flex: 2, alignItems: "center" },

  textoNombre: { fontWeight: "500", fontSize: 14, color: "#424242" },
  textoDescripcion: { fontSize: 14, color: "#616161" },
  textoCantidad: { fontWeight: "bold", fontSize: 14, color: "#424242" },
  textoFecha: { fontSize: 14, color: "#424242" },
  textoHora: { fontSize: 12, color: "#757575", marginTop: 4 },

  /* Mobile cards */
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 2,
  },
  cardNombre: { fontSize: 16, fontWeight: "600", color: "#212121" },
  cardDetails: { marginTop: 8 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  detailText: { fontSize: 14, color: "#616161", marginLeft: 8, flex: 1 },
});

export default MovimientosScreen;
