/* ───────────────────────────────────────────────────────────
   screens/barberos/CrearBarbero.js
   ─────────────────────────────────────────────────────────── */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ─── localización ES ─── */
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

/* ─── helpers constantes ─── */
const { width } = Dimensions.get("window");
const currentYear = new Date().getFullYear();
const months = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const years = Array.from({ length: 81 }, (_, i) => currentYear - i);

/* ╔════════════════════════════════╗
   ║          Componente           ║
   ╚════════════════════════════════╝ */
const CrearBarbero = ({ visible, onClose, onCreate }) => {
  /* ───────── estado ───────── */
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(currentYear);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    cedula: "",
    telefono: "",
    rolID: "",
    fechaNacimiento: null,
    fechaContratacion: null,
    email: "",
    password: "",
    confirmPassword: "",
    avatar: null,
  });

  const [pickerField, setPickerField] = useState("nacimiento");
  const scrollRef = useRef(null);

  /* ─── cargar roles ─── */
  useEffect(() => {
    if (!visible) return;

    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const { data } = await axios.get(
          "https://vianney-server.onrender.com/roles/workers",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRoles(data.roles || []);
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "No se pudieron cargar los roles");
      } finally {
        setLoadingRoles(false);
      }
    })();
  }, [visible]);

  /* ─── helpers ─── */
  const resetForm = () => {
    setFormData({
      nombre: "",
      cedula: "",
      telefono: "",
      rolID: "",
      fechaNacimiento: null,
      fechaContratacion: null,
      email: "",
      password: "",
      confirmPassword: "",
      avatar: null,
    });
    setErrors({});
    setCalendarMonth(new Date().getMonth());
    setCalendarYear(currentYear);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((err) => ({ ...err, [field]: null }));
  };

  const formatDate = (d) =>
    !d
      ? "dd/mm/aaaa"
      : d.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

  const toISODate = (d) => (d ? d.toISOString().split("T")[0] : "");

  const formatDateString = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  /* ─── imagen ─── */
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!res.canceled) handleChange("avatar", res.assets[0].uri);
  };

  /* ─── validación / envío ─── */
  const isEmail = (mail) =>
    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(mail);

  const validate = () => {
    const {
      nombre,
      cedula,
      telefono,
      rolID,
      fechaNacimiento,
      fechaContratacion,
      email,
      password,
      confirmPassword,
    } = formData;

    const newErrors = {};

    if (!rolID) newErrors.rolID = "Selecciona un rol";
    if (!nombre) newErrors.nombre = "Nombre obligatorio";
    if (!cedula) newErrors.cedula = "Campo obligatorio";
    else if (!/^\d+$/.test(cedula))
      newErrors.cedula = "Solo números permitidos";
    if (!telefono) newErrors.telefono = "Campo obligatorio";
    else if (!/^\d{7,}$/.test(telefono))
      newErrors.telefono = "Teléfono inválido";
    if (!fechaNacimiento) newErrors.fechaNacimiento = "Requerido";
    if (!fechaContratacion) newErrors.fechaContratacion = "Requerido";
    if (!email) newErrors.email = "Campo obligatorio";
    else if (!isEmail(email)) newErrors.email = "Email inválido";
    if (!password) newErrors.password = "Campo obligatorio";
    else if (password.length < 6)
      newErrors.password = "Mínimo 6 caracteres";
    if (!confirmPassword) newErrors.confirmPassword = "Campo obligatorio";
    else if (confirmPassword !== password)
      newErrors.confirmPassword = "No coincide";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    onCreate({
      ...formData,
      fechaNacimiento: toISODate(formData.fechaNacimiento),
      fechaContratacion: toISODate(formData.fechaContratacion),
    });
    setShowSuccess(true);
    resetForm();
  };

  /* ─── calendario ─── */
  const disabledDays = (d) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (
      d > today ||
      (calendarYear === currentYear && calendarMonth > today.getMonth()) ||
      d.getFullYear() < currentYear - 80
    );
  };

  const disabledObj = () => {
    const obj = {};
    const start = new Date(calendarYear, calendarMonth, 1);
    const end = new Date(calendarYear, calendarMonth + 1, 0);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (disabledDays(new Date(d))) {
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
    setShowDatePicker(false);
  };

  const changeMonth = (increment) => {
    const today = new Date();
    let newMonth = calendarMonth + increment;
    let newYear = calendarYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    
    // Validación para fecha de contratación (15 años atrás)
    const minYear = pickerField === "contratacion" ? currentYear - 15 : currentYear - 80;
    
    if (newYear <= currentYear && newYear >= minYear) {
      if (newYear === currentYear && newMonth > today.getMonth()) {
        setCalendarMonth(today.getMonth());
      } else {
        setCalendarMonth(newMonth);
      }
      setCalendarYear(newYear);
    }
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
            <Text style={styles.title}>Crear nuevo barbero</Text>

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
                    style={styles.picker}
                    mode="dropdown"
                  >
                    <Picker.Item label="Seleccione un rol" value="" />
                    {roles.map((r) => (
                      <Picker.Item
                        key={r.id}
                        label={r.nombre}
                        value={r.id}
                      />
                    ))}
                  </Picker>
                </View>
                {!!errors.rolID && (
                  <Text style={styles.errorText}>{errors.rolID}</Text>
                )}
              </View>
            )}

            {/* cédula y nombre */}
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
                  placeholder="barbero@email.com"
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
                    setShowDatePicker(true);
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
                    setShowDatePicker(true);
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

            {/* contraseñas */}
            <View style={styles.doubleRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>
                  Contraseña <Text style={styles.required}>*</Text>
                </Text>
                <View>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        errors.password && styles.errorBorder,
                      ]}
                      placeholder="••••••••"
                      placeholderTextColor="#929292"
                      secureTextEntry={!showPassword}
                      value={formData.password}
                      onChangeText={(v) => handleChange("password", v)}
                    />
                    <TouchableOpacity
                      style={styles.toggleButton}
                      onPress={() => setShowPassword((p) => !p)}
                    >
                      <MaterialIcons
                        name={showPassword ? "visibility-off" : "visibility"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                  {!!errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  Confirmar <Text style={styles.required}>*</Text>
                </Text>
                <View>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        errors.confirmPassword && styles.errorBorder,
                      ]}
                      placeholder="••••••••"
                      placeholderTextColor="#929292"
                      secureTextEntry={!showConfirmPassword}
                      value={formData.confirmPassword}
                      onChangeText={(v) =>
                        handleChange("confirmPassword", v)
                      }
                    />
                    <TouchableOpacity
                      style={styles.toggleButton}
                      onPress={() => setShowConfirmPassword((p) => !p)}
                    >
                      <MaterialIcons
                        name={
                          showConfirmPassword ? "visibility-off" : "visibility"
                        }
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                  {!!errors.confirmPassword && (
                    <Text style={styles.errorText}>
                      {errors.confirmPassword}
                    </Text>
                  )}
                </View>
              </View>
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
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>Aceptar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  onClose();
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* ─── date‑picker modal ─── */}
      {showDatePicker && (
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerCard}>
            {/* header mes / año */}
            <View style={styles.datePickerHeader}>
              <TouchableOpacity
                onPress={() => changeMonth(-1)}
                disabled={
                  pickerField === "contratacion" 
                    ? calendarYear === currentYear - 15 && calendarMonth === 0
                    : calendarYear === currentYear - 80 && calendarMonth === 0
                }
              >
                <MaterialIcons 
                  name="chevron-left" 
                  size={24} 
                  color={
                    pickerField === "contratacion" 
                      ? calendarYear === currentYear - 15 && calendarMonth === 0 ? "#ccc" : "#333"
                      : calendarYear === currentYear - 80 && calendarMonth === 0 ? "#ccc" : "#333"
                  } 
                />
              </TouchableOpacity>
              
              <View style={styles.monthYearSelector}>
                <Text style={styles.monthYearText}>
                  {months[calendarMonth]} de {calendarYear}
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={() => changeMonth(1)}
                disabled={
                  pickerField === "contratacion" 
                    ? calendarYear === currentYear && calendarMonth === new Date().getMonth()
                    : calendarYear === currentYear && calendarMonth === new Date().getMonth()
                }
              >
                <MaterialIcons 
                  name="chevron-right" 
                  size={24} 
                  color={
                    calendarYear === currentYear && calendarMonth === new Date().getMonth() 
                      ? "#ccc" 
                      : "#333"
                  } 
                />
              </TouchableOpacity>
            </View>
            
            {/* Selector de años con scroll horizontal */}
            <View style={styles.yearsScrollContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles.yearsContainer}
              >
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearBox,
                      year === calendarYear && styles.yearBoxSelected,
                    ]}
                    onPress={() => {
                      const today = new Date();
                      if (year === currentYear && calendarMonth > today.getMonth()) {
                        setCalendarMonth(today.getMonth());
                      }
                      setCalendarYear(year);
                    }}
                  >
                    <Text
                      style={[
                        styles.yearText,
                        year === calendarYear && styles.yearTextSelected,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* calendario */}
            <Calendar
              key={`${calendarYear}-${calendarMonth}`}
              current={`${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-01`}
              minDate={pickerField === "contratacion" ? `${currentYear - 15}-01-01` : `${currentYear - 80}-01-01`}
              maxDate={new Date().toISOString().split("T")[0]}
              onDayPress={onDaySelect}
              hideExtraDays
              hideArrows
              disableMonthChange
              markedDates={{
                ...disabledObj(),
                ...(formData[pickerField === "nacimiento" ? "fechaNacimiento" : "fechaContratacion"]
                  ? {
                      [toISODate(
                        formData[pickerField === "nacimiento" ? "fechaNacimiento" : "fechaContratacion"]
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
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal de éxito */}
      <Modal
        visible={showSuccess}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccess(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successModalIcon}>
              <MaterialIcons name="check-circle" size={60} color="#4CAF50" />
            </View>
            <Text style={styles.successModalTitle}>¡Barbero creado exitosamente!</Text>
            <Text style={styles.successModalText}>
              El barbero ha sido registrado correctamente en el sistema.
            </Text>
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={() => {
                setShowSuccess(false);
                onClose();
              }}
            >
              <Text style={styles.successModalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

/* ─── estilos ─── */
const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalContent: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "92%",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 15,
    borderWidth: 3,
    borderColor: "black",
    overflow: "hidden",
  },
  scrollContent: { padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 15, color: "#333" },
  formGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "500", color: "#444", marginBottom: 8 },
  required: { color: "red" },
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
  errorBorder: { borderColor: "#d32f2f" },
  errorText: { color: "#d32f2f", fontSize: 12, marginTop: 4 },

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

  buttonRow: { flexDirection: "row", marginTop: 20 },
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
  yearsScrollContainer: {
    height: 50,
    marginVertical: 10,
  },
  yearsContainer: {
    paddingHorizontal: 10,
    alignItems: "center",
  },
  monthYearSelector: {
    flex: 1,
    alignItems: "center",
  },

  // Estilos para el modal de éxito
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  successModalIcon: {
    marginBottom: 20,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#424242',
    textAlign: 'center',
  },
  successModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  successModalButton: {
    backgroundColor: '#424242',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  successModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CrearBarbero;