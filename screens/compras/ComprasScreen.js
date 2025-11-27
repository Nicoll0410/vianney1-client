// screens/compras/ComprasScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, Feather, Ionicons, AntDesign } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import Paginacion  from "../../components/Paginacion";
import Buscador    from "../../components/Buscador";
import DetalleCompra from "./DetalleCompra";
import CrearCompra   from "./CrearCompra";
import Footer       from "../../components/Footer";
import ConfirmarModal from "../../components/ConfirmarModal";
import InfoModal      from "../../components/InfoModal";

const { width } = Dimensions.get("window");
const isMobile           = width < 768;
const comprasPorPagina   = 4;

/* --------------------------------------------------------------- */
const ComprasScreen = () => {
  const [compras, setCompras]                     = useState([]);
  const [comprasFiltradas, setComprasFiltradas]   = useState([]);
  const [paginaActual, setPaginaActual]           = useState(1);
  const [busqueda, setBusqueda]                   = useState("");
  const [loading, setLoading]                     = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada]   = useState(null);
  const [modalCrearVisible, setModalCrearVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [compraAAnular, setCompraAAnular]         = useState(null);
  const [infoModal, setInfoModal]                 = useState({
    visible: false,
    title: "",
    message: "",
    isSuccess: false,
  });

  /* ------------------------ Helpers ----------------------------- */
  const formatearFecha   = (iso) => { if (!iso) return "—"; const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };
  const formatearMoneda  = (v)  => `$ ${Number(v).toLocaleString("es-CO")}`;
  const showInfoModal    = (title, message, isSuccess) => setInfoModal({ visible: true, title, message, isSuccess });

  /* ------------------------ Fetch compras ----------------------- */
  const fetchCompras = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.get("https://vianney-server.onrender.com/compras/all-with-search", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const parsed = (data.compras || []).map((c) => ({
        id: c.id,
        fecha: c.fecha.split("T")[0],
        metodo: c.metodo_pago,
        proveedor: c.proveedor?.nombre || "Proveedor N/D",
        total: Number(c.costo),
        estado: c.estaAnulado ? "anulado" : "confirmado",
      }));

      setCompras(parsed);
      setComprasFiltradas(parsed);
    } catch (e) {
      console.error(e);
      showInfoModal("Error 🚨", "No se pudieron cargar las compras", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchCompras(); }, [fetchCompras]));

  /* ------------------- Búsqueda local --------------------------- */
  useEffect(() => {
    if (!busqueda.trim()) {
      setComprasFiltradas(compras);
    } else {
      const q = busqueda.toLowerCase();
      setComprasFiltradas(
        compras.filter(
          (c) =>
            c.proveedor.toLowerCase().includes(q) ||
            c.metodo.toLowerCase().includes(q)   ||
            c.fecha.includes(busqueda)
        )
      );
    }
    setPaginaActual(1);
  }, [busqueda, compras]);

  /* ------------------- Abrir DETALLE ---------------------------- */
  const abrirDetalle = async (compra) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.get(`https://vianney-server.onrender.com/compras/${compra.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompraSeleccionada(data);
      setModalDetalleVisible(true);
    } catch (e) {
      console.error(e);
      showInfoModal("Error 🚨", "No se pudo cargar el detalle", false);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------- Crear nueva compra ---------------------- */
  const handleCreateCompra = (nuevaCompra) => {
    /* El onCreate viene desde CrearCompra y ya lanza sus propios modales;
       aquí sólo refrescamos la lista */
    fetchCompras();
  };

  /* ------------------- Anular compra --------------------------- */
  const confirmarAnulacion = async () => {
    if (!compraAAnular) return;
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      await axios.patch(`https://vianney-server.onrender.com/compras/${compraAAnular}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfirmModalVisible(false);
      fetchCompras();
      showInfoModal("Éxito ✅", "Compra anulada correctamente", true);
    } catch (e) {
      console.error(e);
      showInfoModal("Error 🚨", e.response?.data?.mensaje || "No se pudo anular la compra", false);
    } finally {
      setLoading(false);
      setCompraAAnular(null);
    }
  };

  /* ------------------- Paginación ------------------------------ */
  const indiceInicial   = (paginaActual - 1) * comprasPorPagina;
  const comprasMostrar  = isMobile
    ? comprasFiltradas
    : comprasFiltradas.slice(indiceInicial, indiceInicial + comprasPorPagina);
  const totalPaginas    = Math.ceil(comprasFiltradas.length / comprasPorPagina);
  const cambiarPagina   = (p) => { if (p >= 1 && p <= totalPaginas) setPaginaActual(p); };

  /* ------------------- Render item mobile ---------------------- */
  const renderMobileItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{item.proveedor}</Text>
          <Text style={styles.cardSubtitle}>{formatearFecha(item.fecha)}</Text>
        </View>
        <View style={[
          styles.badge,
          item.estado === "confirmado" ? styles.badgeOk : styles.badgeErr,
        ]}>
          {item.estado === "confirmado" ? (
            <>
              <AntDesign name="check" size={16} color="#2e7d32" />
              <Text style={[styles.badgeTxt, styles.ok]}>Confirmado</Text>
            </>
          ) : (
            <>
              <AntDesign name="close" size={16} color="#d32f2f" />
              <Text style={[styles.badgeTxt, styles.err]}>Anulado</Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.cardInfoRow}>
        <Text style={styles.cardLabel}>Método:</Text>
        <Text style={styles.cardValue}>{item.metodo}</Text>
      </View>
      <View style={styles.cardInfoRow}>
        <Text style={styles.cardLabel}>Total:</Text>
        <Text style={[styles.cardValue, styles.totalTxt]}>
          {formatearMoneda(item.total)}
        </Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => abrirDetalle(item)}>
          <FontAwesome name="eye" size={20} color="#424242" />
        </TouchableOpacity>
        {item.estado === "confirmado" && (
          <TouchableOpacity
            style={{ marginLeft: 16 }}
            onPress={() => {
              setCompraAAnular(item.id);
              setConfirmModalVisible(true);
            }}
          >
            <Feather name="trash-2" size={20} color="#d32f2f" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  /* ------------------- Render item desktop --------------------- */
  const renderDesktopItem = ({ item }) => (
    <View style={styles.row}>
      <View style={[styles.cell, styles.colFecha]}>
        <Text style={styles.bold}>{formatearFecha(item.fecha)}</Text>
      </View>
      <View style={[styles.cell, styles.colMetodo]}>
        <Text style={styles.bold}>{item.metodo}</Text>
      </View>
      <View style={[styles.cell, styles.colProveedor]}>
        <Text style={styles.bold}>{item.proveedor}</Text>
      </View>
      <View style={[styles.cell, styles.colTotal]}>
        <View style={styles.totalBox}>
          <Text style={styles.bold}>{formatearMoneda(item.total)}</Text>
        </View>
      </View>
      <View style={[styles.cell, styles.colEstado]}>
        <View style={[
          styles.badge,
          item.estado === "confirmado" ? styles.badgeOk : styles.badgeErr,
        ]}>
          {item.estado === "confirmado" ? (
            <>
              <AntDesign name="check" size={16} color="#2e7d32" />
              <Text style={[styles.badgeTxt, styles.ok]}>Confirmado</Text>
            </>
          ) : (
            <>
              <AntDesign name="close" size={16} color="#d32f2f" />
              <Text style={[styles.badgeTxt, styles.err]}>Anulado</Text>
            </>
          )}
        </View>
      </View>
      <View style={[styles.cell, styles.colAcciones]}>
        <View style={styles.accionesFila}>
          <TouchableOpacity onPress={() => abrirDetalle(item)}>
            <FontAwesome name="eye" size={20} color="#000" />
          </TouchableOpacity>
          {item.estado === "confirmado" && (
            <TouchableOpacity
              style={{ marginLeft: 8 }}
              onPress={() => {
                setCompraAAnular(item.id);
                setConfirmModalVisible(true);
              }}
            >
              <Feather name="trash-2" size={20} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  /* ------------------- JSX principal --------------------------- */
  return (
    <View style={styles.main}>
      <View style={styles.content}>
        {/* Header & Buscar */}
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>🛒 Compras</Text>
            <View style={styles.counter}>
              <Text style={styles.counterTxt}>{comprasFiltradas.length}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.btnAdd} onPress={() => setModalCrearVisible(true)}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.btnAddTxt}>Crear</Text>
          </TouchableOpacity>
        </View>

        <Buscador
          placeholder="Buscar compras por proveedor, método o fecha"
          value={busqueda}
          onChangeText={setBusqueda}
        />

        {/* Tabla o lista */}
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#424242" /></View>
        ) : comprasMostrar.length === 0 ? (
          <View style={styles.center}><Text style={{ color: "#666" }}>📭 No se encontraron compras</Text></View>
        ) : isMobile ? (
          <FlatList
            data={comprasMostrar}
            keyExtractor={(i) => i.id}
            renderItem={renderMobileItem}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        ) : (
          <>
            <View style={styles.tableWrap}>
              <View style={styles.tableHeader}>
                <View style={[styles.th, styles.colFecha]}><Text style={styles.thTxt}>📅 Fecha</Text></View>
                <View style={[styles.th, styles.colMetodo]}><Text style={styles.thTxt}>💳 Método</Text></View>
                <View style={[styles.th, styles.colProveedor]}><Text style={styles.thTxt}>🏢 Proveedor</Text></View>
                <View style={[styles.th, styles.colTotal]}><Text style={styles.thTxt}>💰 Total</Text></View>
                <View style={[styles.th, styles.colEstado]}><Text style={styles.thTxt}>🔄 Estado</Text></View>
                <View style={[styles.th, styles.colAcciones]}><Text style={styles.thTxt}>⚙️ Acciones</Text></View>
              </View>

              <FlatList
                data={comprasMostrar}
                keyExtractor={(i) => i.id}
                renderItem={renderDesktopItem}
                scrollEnabled={false}
              />
            </View>

            {comprasFiltradas.length > comprasPorPagina && (
              <Paginacion
                paginaActual={paginaActual}
                totalPaginas={totalPaginas}
                cambiarPagina={cambiarPagina}
              />
            )}
          </>
        )}

        {/* Modales */}
        <DetalleCompra
          visible={modalDetalleVisible}
          onClose={() => setModalDetalleVisible(false)}
          compra={compraSeleccionada}
        />
        <CrearCompra
          visible={modalCrearVisible}
          onClose={() => setModalCrearVisible(false)}
          onCreate={handleCreateCompra}
        />
        <ConfirmarModal
          visible={confirmModalVisible}
          title="⚠️ ¿Seguro que deseas anular esta compra?"
          message="Si anulas esta compra los insumos asociados a esta reducirán sus unidades y no podrás revertir esta acción."
          confirmLabel="Anular"
          onConfirm={confirmarAnulacion}
          onCancel={() => setConfirmModalVisible(false)}
        />
        <InfoModal
          visible={infoModal.visible}
          title={infoModal.title}
          message={infoModal.message}
          isSuccess={infoModal.isSuccess}
          onClose={() => setInfoModal({ ...infoModal, visible: false })}
        />
      </View>
      <Footer />
    </View>
  );
};

/* ----------------------- Estilos ------------------------------- */
const styles = StyleSheet.create({
  /* (los mismos estilos que ya tenías, sin cambios) */
  /* ---  solo quité el color '#000' del borderBottom en .row para evitar línea gruesa --- */
  main: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16, alignItems: "center" },
  titleWrap: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginRight: 10 },
  counter: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#D9D9D9", alignItems: "center", justifyContent: "center" },
  counterTxt: { fontWeight: "bold" },
  btnAdd: { flexDirection: "row", alignItems: "center", backgroundColor: "#424242", borderRadius: 15, paddingVertical: 8, paddingHorizontal: 12 },
  btnAddTxt: { color: "#fff", marginLeft: 6, fontWeight: "500" },
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee", borderRadius: 10, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  cardSubtitle: { fontSize: 14, color: "#666" },
  cardInfoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  cardLabel: { color: "#424242" },
  cardValue: { fontWeight: "500" },
  totalTxt: { color: "#2e7d32", fontWeight: "bold" },
  cardActions: { flexDirection: "row", justifyContent: "flex-end", borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 12 },
  tableWrap: { borderWidth: 1, borderColor: "#ddd", borderRadius: 4, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: "#424242" },
  th: { justifyContent: "center", alignItems: "center", paddingVertical: 12 },
  thTxt: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  colFecha: { flex: 1.5 },
  colMetodo: { flex: 1.5 },
  colProveedor: { flex: 2 },
  colTotal: { flex: 1.5 },
  colEstado: { flex: 1.5, alignItems: "center" },
  colAcciones: { flex: 1.3, alignItems: "flex-end", paddingRight: 12 },
  row: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  cell: { justifyContent: "center", paddingHorizontal: 8 },
  bold: { fontWeight: "bold", textAlign: "center" },
  totalBox: { alignSelf: "center", paddingVertical: 4, paddingHorizontal: 6, backgroundColor: "#D9D9D9", borderRadius: 4 },
  badge: { flexDirection: "row", alignItems: "center", alignSelf: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeOk: { backgroundColor: "#e8f5e9" },
  badgeErr: { backgroundColor: "#ffebee" },
  badgeTxt: { marginLeft: 4, fontSize: 12, fontWeight: "bold" },
  ok: { color: "#2e7d32" },
  err: { color: "#d32f2f" },
  accionesFila: { flexDirection: "row", alignItems: "center" },
});

export default ComprasScreen;
