import React, { useState, useContext } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import {
  FontAwesome5,
  MaterialIcons,
  Feather,
  Ionicons,
  AntDesign,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { AuthContext } from "../contexts/AuthContext";

/* ─────────────────── MENÚ SEGÚN ROL ─────────────────────────── */
const ROLE_MENU = {
  Cliente: {
    topItems: [
      { label: "Galería", screen: "Galeria", icon: MaterialCommunityIcons, name: "view-gallery" },
      { label: "Agenda", screen: "Agenda", icon: MaterialIcons, name: "event" },
      { label: "Citas", screen: "Citas", icon: Ionicons, name: "calendar-outline" },
    ],
    sections: {},
  },
  Barbero: {
    topItems: [],
    sections: {
      Usuarios: [
        { label: "Clientes", screen: "Clientes", icon: Feather, name: "user" },
      ],
      // Compras: [
      //   // { label: "Insumos", screen: "Insumos", icon: MaterialCommunityIcons, name: "spray" },
      //   { label: "Movimientos", screen: "Movimientos", icon: FontAwesome5, name: "exchange-alt" },
      // ],
      Ventas: [
        { label: "Mi Galería", screen: "MiGaleria", icon: MaterialCommunityIcons, name: "view-gallery" },
        { label: "Agenda", screen: "Agenda", icon: MaterialIcons, name: "event" },
        { label: "Citas", screen: "Citas", icon: Ionicons, name: "calendar-outline" },
      ],
    },
  },
  Administrador: {
    topItems: [
      { label: "Dashboard", screen: "Dashboard", icon: MaterialCommunityIcons, name: "view-dashboard-outline" },
    ],
    sections: {
      Usuarios: [
        { label: "Clientes", screen: "Clientes", icon: Feather, name: "user" },
        { label: "Barberos", screen: "Barberos", icon: Ionicons, name: "cut-outline" },
        // { label: "Roles", screen: "Roles", icon: Ionicons, name: "key-outline" },
      ],
      // Compras: [
      //   { label: "Categoría de Insumos", screen: "CategoriaInsumos", icon: MaterialCommunityIcons, name: "database-arrow-left-outline" },
      //   { label: "Insumos", screen: "Insumos", icon: MaterialCommunityIcons, name: "spray" },
      //   { label: "Proveedores", screen: "Proveedores", icon: MaterialCommunityIcons, name: "toolbox-outline" },
      //   { label: "Compras", screen: "Compras", icon: AntDesign, name: "shoppingcart" },
      // ],
      Ventas: [
        // { label: "Movimientos", screen: "Movimientos", icon: FontAwesome5, name: "exchange-alt" },
        { label: "Mi Galería", screen: "MiGaleria", icon: MaterialCommunityIcons, name: "view-gallery" },
        { label: "Servicios", screen: "Servicios", icon: MaterialCommunityIcons, name: "toolbox-outline" },
        { label: "Agenda", screen: "Agenda", icon: MaterialIcons, name: "event" },
        { label: "Citas", screen: "Citas", icon: Ionicons, name: "calendar-outline" },
        { label: "Ventas", screen: "Ventas", icon: Ionicons, name: "cash-outline" },
      ],
    },
  },
};

/* ─────────────────── COMPONENTE DRAWER ──────────────────────── */
const CustomDrawer = (props) => {
  const { userRole, user, logout } = useContext(AuthContext);

  const roleKey = userRole || "Administrador";
  const config  = ROLE_MENU[roleKey];

  /* Estado para secciones colapsables */
  const [expanded, setExpanded] = useState({
    Usuarios: false,
    Compras: false,
    Ventas:  false,
  });
  const toggle = (sec) => setExpanded((p) => ({ ...p, [sec]: !p[sec] }));

  /* Renderiza un ítem normal */
const Item = ({ label, screen, icon: IconComp, name, indent = 0 }) => (
  <TouchableOpacity
    style={[styles.menuItem, indent && { paddingLeft: 20 + indent }]}
    onPress={() => {
      props.navigation.navigate(screen);
      if (props.navigation.closeDrawer) {
        props.navigation.closeDrawer();
      }
    }}
  >
    <IconComp name={name} size={indent ? 16 : 22} color="#fff" />
    <Text style={[styles.menuText, indent && { fontSize: 14, marginLeft: 10 }]}>{label}</Text>
  </TouchableOpacity>
);

  return (
    <View style={styles.container}>
      {/* ----------- Logo superior ------------ */}
      <View style={styles.logoContainer}>
        <Image source={require("../assets/images/newYorkBarber.jpeg")} style={styles.logo} />
        {/* Título agregado debajo del logo */}
        <Text style={styles.logoTitle}>New York Barber</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator
        contentContainerStyle={styles.scrollContainer}
      >
        <Text style={styles.sectionTitle}>Menú</Text>

        {config.topItems.map((item) => <Item key={item.label} {...item} />)}

        {Object.entries(config.sections).map(([section, items]) => (
          <View key={section}>
            <TouchableOpacity style={styles.expandableItem} onPress={() => toggle(section)}>
              <View style={styles.menuRow}>
                {section === "Usuarios" && <Feather name="users" size={24} color="#fff" />}
                {section === "Compras" && <AntDesign name="shoppingcart" size={24} color="#fff" />}
                {section === "Ventas"   && <MaterialCommunityIcons name="account-cash-outline" size={24} color="#fff" />}
                <Text style={styles.menuText}>{section}</Text>
              </View>
              <Feather name={expanded[section] ? "chevron-up" : "chevron-down"} size={20} color="#fff" />
            </TouchableOpacity>

            {expanded[section] && items.map((sub) => <Item key={sub.label} {...sub} indent={20} />)}
          </View>
        ))}
      </ScrollView>

      {/* ------------- Perfil abajo ------------- */}
      <View style={styles.profileSection}>
        <Text style={styles.profileTitle}>Perfil</Text>
        <View style={styles.userContainer}>
          {user?.imagen ? (
            <Image source={{ uri: user.imagen }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Feather name="user" size={24} color="#fff" />
            </View>
          )}

          <View style={styles.userInfoContainer}>
            <Text style={styles.userName}>
              {user?.nombre || user?.email?.split("@")[0] || "Usuario"}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email || "ejemplo@dominio.com"}
            </Text>
            <Text style={styles.userRole}>{roleKey}</Text>
          </View>
        </View>
      </View>

      {/* ------------- Logout ------------- */}
      <View style={styles.profileContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Feather name="log-out" size={18} color="black" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* ─────────────────── Estilos ────────────────────── */
const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: "#000" },
  scrollContainer:    { flexGrow: 1 },
  logoContainer:      { alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderColor: "#222" },
  logo:               { width: 120, height: 120, resizeMode: "contain" },
  sectionTitle:       { fontSize: 14, fontWeight: "bold", color: "#fff", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 },
  menuItem:           { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingLeft: 20 },
  menuText:           { marginLeft: 15, fontSize: 16, color: "#fff" },
  expandableItem:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 20 },
  menuRow:            { flexDirection: "row", alignItems: "center" },
  profileSection:     { padding: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#222" },
  profileTitle:       { fontSize: 14, fontWeight: "bold", color: "#fff", marginBottom: 10 },
  userContainer:      { flexDirection: "row", alignItems: "center" },
  avatar:             { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  avatarPlaceholder:  { width: 50, height: 50, borderRadius: 25, backgroundColor: "#333", justifyContent: "center", alignItems: "center", marginRight: 10 },
  userInfoContainer:  { flex: 1 },
  userName:           { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 4 },
  userEmail:          { color: "#aaa", fontSize: 14, marginBottom: 4 },
  userRole:           { color: "#aaa", fontSize: 12, fontStyle: "italic" },
  profileContainer:   { padding: 16, borderTopWidth: 1, borderColor: "#222" },
  logoutButton:       { flexDirection: "row", backgroundColor: "#D9D9D9", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  logoutText:         { color: "black", marginLeft: 8, fontSize: 16, fontWeight: "700" },
    logoTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center"
  },
});

export default CustomDrawer;
