import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import HorarioBarbero from '../../components/HorarioBarbero';
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ───────────────────── localización ES ───────────────────── */
LocaleConfig.locales.es = {
  monthNames: [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ],
  monthNamesShort: [
    "Ene","Feb","Mar","Abr","May","Jun",
    "Jul","Ago","Sep","Oct","Nov","Dic",
  ],
  dayNames: [
    "Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado",
  ],
  dayNamesShort: ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

/* ───────────────────── constantes ───────────────────── */
const { width } = Dimensions.get("window");
const currentYear = new Date().getFullYear();
const months = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const years = Array.from({ length: 81 }, (_, i) => currentYear - i);

/* ╔══════════════════════════════════════════════════════╗
   ║                     COMPONENTE                       ║
   ╚══════════════════════════════════════════════════════╝ */
const EditarBarbero = ({ visible, onClose, barbero, onUpdate }) => {
  /* ───────── estados ───────── */
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerField, setPickerField] = useState("nacimiento");
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(currentYear);
  const [errors, setErrors] = useState({});
  const scrollRef = useRef(null);
  const [showHorarioModal, setShowHorarioModal] = useState(false);


  const [formData, setFormData] = useState({
    nombre: "",
    cedula: "",
    telefono: "",
    rolID: "",
    fechaNacimiento: null,
    fechaContratacion: null,
    email: "",
    avatar: null,
  });

  /* ───────── cargar roles ───────── */
  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const { data } = await axios.get("https://vianney-server.onrender.com/roles/workers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRoles(data.roles || []);
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "No se pudieron cargar los roles");
      } finally {
        setLoadingRoles(false);
      }
    })();
  }, [visible]);

  /* ───────── mapear barbero entrante ───────── */
  useEffect(() => {
    if (!visible || !barbero) return;
    setFormData({
      nombre: barbero.nombre || "",
      cedula: barbero.cedula || "",
      telefono: barbero.telefono || "",
      rolID: barbero.rolID || barbero.rol?.id || barbero.usuario?.rol?.id || "",
      fechaNacimiento: barbero.fechaNacimiento
        ? new Date(barbero.fechaNacimiento)
        : barbero.fecha_nacimiento
        ? new Date(barbero.fecha_nacimiento)
        : null,
      fechaContratacion: barbero.fechaContratacion
        ? new Date(barbero.fechaContratacion)
        : barbero.fecha_de_contratacion
        ? new Date(barbero.fecha_de_contratacion)
        : null,
      email: barbero.email || barbero.usuario?.email || "",
      avatar: barbero.avatar || null,
    });
    setErrors({});
  }, [visible, barbero]);

  /* ───────── helpers ───────── */
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((err) => ({ ...err, [field]: null }));
  };

  const toISODate = (d) => (d ? d.toISOString().split("T")[0] : "");
  const formatDate = (d) =>
    !d
      ? "dd/mm/aaaa"
      : d.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!res.canceled) handleChange("avatar", res.assets[0].uri);
  };

  /* ───────── validación ───────── */
  const validate = () => {
    const { nombre, cedula, telefono, rolID, fechaNacimiento, fechaContratacion, email } = formData;
    const newErr = {};
    if (!rolID) newErr.rolID = "Selecciona un rol";
    if (!nombre) newErr.nombre = "Nombre obligatorio";
    if (!cedula) newErr.cedula = "Campo obligatorio";
    else if (!/^\d+$/.test(cedula)) newErr.cedula = "Solo números";
    if (!telefono) newErr.telefono = "Campo obligatorio";
    if (!email) newErr.email = "Campo obligatorio";
    if (!fechaNacimiento) newErr.fechaNacimiento = "Requerido";
    if (!fechaContratacion) newErr.fechaContratacion = "Requerido";
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  /* ───────── submit ───────── */
  const handleSave = () => {
    if (!validate()) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    onUpdate({
      id: barbero.id,                               // ⭐ INCLUIMOS ID
      nombre: formData.nombre,
      cedula: formData.cedula,
      telefono: formData.telefono,
      rolID: formData.rolID,
      fechaNacimiento: formData.fechaNacimiento,    // objeto Date
      fechaContratacion: formData.fechaContratacion,
      email: formData.email,
      avatar: formData.avatar,
      rol: roles.find(r => r.id === formData.rolID)?.nombre || barbero.rol,
      estaVerificado: barbero.estaVerificado,
      usuarioID: barbero.usuarioID,
    });
    onClose();
  };

  /* ───────── calendario ───────── */
  const disabledDays = (d) => {
    const today = new Date();
    return (
      d > today ||
      (calYear === currentYear && calMonth > today.getMonth()) ||
      d.getFullYear() < currentYear - 80
    );
  };

  const disabledObj = () => {
    const obj = {};
    const start = new Date(calYear, calMonth, 1);
    const end = new Date(calYear, calMonth + 1, 0);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (disabledDays(d)) {
        obj[toISODate(new Date(d))] = { disabled: true, disableTouchEvent: true };
      }
    }
    return obj;
  };

  const onDaySelect = (day) => {
    const sel = new Date(day.year, day.month - 1, day.day);
    handleChange(
      pickerField === "nacimiento" ? "fechaNacimiento" : "fechaContratacion",
      sel
    );
    setShowPicker(false);
  };
  /* ───────── UI ───────── */
  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />

      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Editar barbero</Text>

            {/* rol */}
            {loadingRoles ? (
              <ActivityIndicator style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Rol <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.pickerContainer,
                    errors.rolID && styles.errorBorder,
                  ]}
                >
                  <Picker
                    selectedValue={formData.rolID}
                    onValueChange={(v) => handleChange("rolID", v)}
                    mode="dropdown"
                    style={styles.picker}
                  >
                    <Picker.Item label="Seleccione un rol" value="" />
                    {roles.map((r) => (
                      <Picker.Item key={r.id} label={r.nombre} value={r.id} />
                    ))}
                  </Picker>
                </View>
                {!!errors.rolID && (
                  <Text style={styles.errorText}>{errors.rolID}</Text>
                )}
              </View>
            )}

            {/* cedula y nombre */}
            <View style={styles.doubleRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>
                  Cédula <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.cedula && styles.errorBorder,
                  ]}
                  placeholder="123456789"
                  placeholderTextColor="#929292"
                  keyboardType="numeric"
                  value={formData.cedula}
                  onChangeText={(v) => handleChange("cedula", v)}
                />
                {!!errors.cedula && (
                  <Text style={styles.errorText}>{errors.cedula}</Text>
                )}
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Nombre <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.nombre && styles.errorBorder,
                  ]}
                  placeholder="Nombre completo"
                  placeholderTextColor="#929292"
                  value={formData.nombre}
                  onChangeText={(v) => handleChange("nombre", v)}
                />
                {!!errors.nombre && (
                  <Text style={styles.errorText}>{errors.nombre}</Text>
                )}
              </View>
            </View>

            {/* teléfono y email */}
            <View style={styles.doubleRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>
                  Teléfono <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.telefono && styles.errorBorder,
                  ]}
                  placeholder="3001234567"
                  placeholderTextColor="#929292"
                  keyboardType="phone-pad"
                  value={formData.telefono}
                  onChangeText={(v) => handleChange("telefono", v)}
                />
                {!!errors.telefono && (
                  <Text style={styles.errorText}>{errors.telefono}</Text>
                )}
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Email <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.email && styles.errorBorder,
                  ]}
                  placeholder="email@ejemplo.com"
                  placeholderTextColor="#929292"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(v) => handleChange("email", v)}
                />
                {!!errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>
            </View>

            {/* fechas */}
            <View style={styles.doubleRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>
                  Fecha nacimiento <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateInput,
                    errors.fechaNacimiento && styles.errorBorder,
                  ]}
                  onPress={() => {
                    setPickerField("nacimiento");
                    setShowPicker(true);
                  }}
                >
                  <Text
                    style={[
                      styles.dateText,
                      formData.fechaNacimiento && styles.dateTextSelected,
                    ]}
                  >
                    {formatDate(formData.fechaNacimiento)}
                  </Text>
                  <MaterialIcons name="calendar-today" size={20} />
                </TouchableOpacity>
                {!!errors.fechaNacimiento && (
                  <Text style={styles.errorText}>{errors.fechaNacimiento}</Text>
                )}
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Fecha contratación <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateInput,
                    errors.fechaContratacion && styles.errorBorder,
                  ]}
                  onPress={() => {
                    setPickerField("contratacion");
                    setShowPicker(true);
                  }}
                >
                  <Text
                    style={[
                      styles.dateText,
                      formData.fechaContratacion && styles.dateTextSelected,
                    ]}
                  >
                    {formatDate(formData.fechaContratacion)}
                  </Text>
                  <MaterialIcons name="calendar-today" size={20} />
                </TouchableOpacity>
                {!!errors.fechaContratacion && (
                  <Text style={styles.errorText}>
                    {errors.fechaContratacion}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Horario Laboral</Text>
                <TouchableOpacity
                  style={styles.horarioButton}
                  onPress={() => setShowHorarioModal(true)}
                >
                  <Text style={styles.horarioButtonText}>Editar Horario</Text>
                </TouchableOpacity>
            </View>

            {/* avatar */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Avatar (opcional)</Text>
              <TouchableOpacity
                style={styles.avatarSelector}
                onPress={pickImage}
              >
                {formData.avatar ? (
                  <Image
                    source={{ uri: formData.avatar }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialIcons
                      name="add-a-photo"
                      size={24}
                      color="#666"
                    />
                    <Text style={styles.avatarText}>Seleccionar imagen</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>


            {/* botones */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* ─── date‑picker ─── */}
      {showPicker && (
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerCard}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity
                onPress={() => {
                  if (calYear > currentYear - 80 || calMonth > 0) {
                    setCalMonth((m) => (m + 11) % 12);
                    if (calMonth === 0) setCalYear((y) => y - 1);
                  }
                }}
              >
                <MaterialIcons name="chevron-left" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.monthYearText}>
                {months[calMonth]} de {calYear}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (calYear < currentYear || calMonth < 11) {
                    setCalMonth((m) => (m + 1) % 12);
                    if (calMonth === 11) setCalYear((y) => y + 1);
                  }
                }}
              >
                <MaterialIcons name="chevron-right" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginVertical: 8 }}
            >
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[
                    styles.yearBox,
                    y === calYear && styles.yearBoxSelected,
                  ]}
                  onPress={() => setCalYear(y)}
                >
                  <Text
                    style={[
                      styles.yearText,
                      y === calYear && styles.yearTextSelected,
                    ]}
                  >
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Calendar
              key={`${calYear}-${calMonth}`}
              current={`${calYear}-${String(calMonth + 1).padStart(
                2,
                "0"
              )}-01`}
              hideExtraDays
              hideArrows
              disableMonthChange
              minDate={`${currentYear - 80}-01-01`}
              maxDate={new Date().toISOString().split("T")[0]}
              onDayPress={onDaySelect}
              markedDates={{
                ...disabledObj(),
                ...(formData[
                  pickerField === "nacimiento"
                    ? "fechaNacimiento"
                    : "fechaContratacion"
                ]
                  ? {
                      [toISODate(
                        formData[
                          pickerField === "nacimiento"
                            ? "fechaNacimiento"
                            : "fechaContratacion"
                        ]
                      )]: {
                        selected: true,
                        selectedColor: "#424242",
                        selectedTextColor: "#fff",
                      },
                    }
                  : {}),
              }}
              theme={{
                todayTextColor: "#424242",
                selectedDayBackgroundColor: "#424242",
              }}
              style={{ alignSelf: "center" }}
            />

            <View style={styles.datePickerActions}>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.datePickerBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      <HorarioBarbero 
        barberoId={barbero?.id} 
        visible={showHorarioModal} 
        onClose={() => {
          setShowHorarioModal(false);
          // Forzar actualización de datos después de cerrar el horario
          onUpdate(barbero);
        }} 
      />

    </Modal>
  );
};

/* ─── estilos ─── */
const styles = StyleSheet.create({
  horarioButton: {
  borderWidth: 2,
  borderColor: '#424242',
  borderRadius: 8,
  padding: 12,
  alignItems: 'center',
  backgroundColor: 'rgba(255,255,255,0.7)'
},
horarioButtonText: {
  fontSize: 16,
  fontWeight: '500',
  color: '#424242'
},
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalContent: {
    width: "92%",
    maxWidth: 520,
    maxHeight: "92%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 15,
    borderWidth: 3,
    borderColor: "black",
    overflow: "hidden",
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 18, color: "#333" },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#444", marginBottom: 6 },
  required: { color: "#d32f2f" },
  doubleRow: { flexDirection: "row", justifyContent: "space-between" },

  input: {
    borderWidth: 2,
    borderColor: "#424242",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 45,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: "#424242",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  picker: { height: 45, width: "100%" },

  dateInput: {
    borderWidth: 2,
    borderColor: "#424242",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 45,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  dateText: { color: "#999" },
  dateTextSelected: { color: "#333" },

  passwordContainer: { position: "relative" },
  passwordInput: {
    ...Platform.select({ ios: { paddingVertical: 12 }, default: {} }),
    borderWidth: 2,
    borderColor: "#424242",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 45,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingRight: 40,
  },
  toggleButton: { position: "absolute", right: 10, top: 10 },

  errorBorder: { borderColor: "#d32f2f" },
  errorText: { color: "#d32f2f", fontSize: 12, marginTop: 4 },

  avatarSelector: {
    borderWidth: 2,
    borderColor: "#424242",
    borderRadius: 8,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: { marginTop: 5, color: "#666" },

  buttonRow: { flexDirection: "row", marginTop: 22 },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  createButton: { backgroundColor: "#424242", marginRight: 10 },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#929292",
    marginLeft: 10,
  },
  buttonText: { color: "#fff", fontWeight: "500" },
  cancelButtonText: { color: "#000", fontWeight: "500" },

  datePickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerCard: {
    width: width * 0.9,
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthYearText: { fontSize: 18, fontWeight: "bold", color: "#333" },
  yearBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  yearBoxSelected: { backgroundColor: "#424242" },
  yearText: { color: "#333" },
  yearTextSelected: { color: "#fff", fontWeight: "600" },
  datePickerActions: { marginTop: 10, alignItems: "flex-end" },
  datePickerBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#424242",
    borderRadius: 10,
  },
  datePickerBtnText: { color: "#fff", fontWeight: "600" },
});

export default EditarBarbero;
