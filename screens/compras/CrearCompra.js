import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  FlatList,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import InfoModal from '../../components/InfoModal';

LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  monthNamesShort: [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ],
  dayNames: [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

const { width, height } = Dimensions.get('window');

const CrearCompra = ({ visible, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    metodoPago: 'Efectivo',
    proveedor: '',
    fecha: null,
    insumos: []
  });
  const [proveedores, setProveedores] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [pasoActual, setPasoActual] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    proveedor: '',
    fecha: '',
    insumos: []
  });
  const [modalInfo, setModalInfo] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title, message, type = 'info') => {
    setModalInfo({
      visible: true,
      title,
      message,
      type
    });
  };
  const closeModal = () => {
    setModalInfo(prev => ({...prev, visible: false}));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        const [provRes, insRes] = await Promise.all([
          axios.get('https://vianney-server.onrender.com/proveedores/all', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('https://vianney-server.onrender.com/insumos/all', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setProveedores(provRes.data.proveedores || []);
        setInsumos(insRes.data.insumos || []);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        showAlert('¡Error! 😟', 'No se pudieron cargar los datos necesarios', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchData();
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setFormData({
      metodoPago: 'Efectivo',
      proveedor: '',
      fecha: null,
      insumos: []
    });
    setErrors({
      proveedor: '',
      fecha: '',
      insumos: []
    });
    setPasoActual(1);
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({...prev, [name]: value}));
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: ''}));
    }
  };

  const validateStep1 = () => {
    const newErrors = {
      proveedor: !formData.proveedor ? 'Seleccione un proveedor' : '',
      fecha: !formData.fecha ? 'Seleccione una fecha válida' : ''
    };
    setErrors(prev => ({...prev, ...newErrors}));
    return !newErrors.proveedor && !newErrors.fecha;
  };

  const validateInsumo = (insumo) => {
    const insumoErrors = {};
    if (!insumo.insumo) insumoErrors.insumo = 'Seleccione un insumo';
    if (!insumo.cantidad || isNaN(insumo.cantidad) || insumo.cantidad <= 0) insumoErrors.cantidad = 'Cantidad inválida';
    if (!insumo.precioUnitario || isNaN(insumo.precioUnitario) || insumo.precioUnitario <= 0) insumoErrors.precioUnitario = 'Precio inválido';
    return insumoErrors;
  };

  const validateStep2 = () => {
    if (formData.insumos.length === 0) {
      setErrors(prev => ({...prev, insumos: [{ general: 'Debe agregar al menos un insumo' }]}));
      return false;
    }
    const insumosErrors = formData.insumos.map(validateInsumo);
    const hasErrors = insumosErrors.some(e => Object.keys(e).length > 0);
    if (hasErrors) setErrors(prev => ({...prev, insumos: insumosErrors}));
    return !hasErrors;
  };

  const handleDayPress = (day) => {
    const selectedDate = new Date(day.year, day.month - 1, day.day);
    handleChange('fecha', selectedDate);
    setShowDatePicker(false);
  };

  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const changeMonth = (increment) => {
    let newMonth = selectedMonth + increment;
    let newYear = selectedYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 8);

    const nuevoMesLimite = new Date(newYear, newMonth, 1);
    if (
      nuevoMesLimite >= new Date(fechaLimite.getFullYear(), fechaLimite.getMonth(), 1) &&
      nuevoMesLimite <= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    ) {
      setSelectedMonth(newMonth);
      setSelectedYear(newYear);
    }
  };

  const getDisabledDates = () => {
    const disabledDates = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fechaMinima = new Date(today);
    fechaMinima.setDate(today.getDate() - 8);

    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0);
    const tempDate = new Date(startDate);

    while (tempDate <= endDate) {
      if (tempDate > today || tempDate < fechaMinima) {
        disabledDates[formatDateString(tempDate)] = {
          disabled: true,
          disableTouchEvent: true
        };
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    return disabledDates;
  };

  const formatDate = (date) => {
    if (!date) return 'dd/mm/aaaa';
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const agregarInsumo = () => {
    const nuevoInsumo = {
      id: Date.now().toString(),
      insumo: '',
      cantidad: '',
      precioUnitario: ''
    };
    setFormData(prev => ({...prev, insumos: [...prev.insumos, nuevoInsumo]}));
    setErrors(prev => ({...prev, insumos: [...prev.insumos, {}]}));
  };

  const eliminarInsumo = (id) => {
    const index = formData.insumos.findIndex(i => i.id === id);
    setFormData(prev => ({...prev, insumos: prev.insumos.filter(insumo => insumo.id !== id)}));
    const newErrors = [...errors.insumos];
    newErrors.splice(index, 1);
    setErrors(prev => ({...prev, insumos: newErrors}));
  };

  const actualizarInsumo = (id, campo, valor) => {
    const nuevosInsumos = formData.insumos.map(insumo =>
      insumo.id === id ? {...insumo, [campo]: valor} : insumo
    );
    setFormData(prev => ({...prev, insumos: nuevosInsumos}));

    if (campo === 'cantidad' || campo === 'precioUnitario') {
      const index = formData.insumos.findIndex(i => i.id === id);
      if (index >= 0 && index < errors.insumos.length) {
        const newErrors = [...errors.insumos];
        newErrors[index] = validateInsumo(nuevosInsumos[index]);
        setErrors(prev => ({...prev, insumos: newErrors}));
      }
    }
  };

  const calcularTotal = () => {
    return formData.insumos.reduce((total, insumo) => {
      const cantidad = parseFloat(insumo.cantidad) || 0;
      const precio = parseFloat(insumo.precioUnitario) || 0;
      return total + cantidad * precio;
    }, 0);
  };

  const handleSubmit = () => {
    if (pasoActual === 1) {
      if (validateStep1()) {
        setPasoActual(2);
      }
    } else {
      if (validateStep2()) {
        handleCreateCompra();
      }
    }
  };

  const handleCreateCompra = async () => {  // 1️⃣ Código completo corregido
    try {
      setLoading(true);
      if (!formData.fecha || !(formData.fecha instanceof Date)) {
        throw new Error('Seleccione una fecha válida');
      }
      if (!formData.proveedor) {
        throw new Error('Seleccione un proveedor');
      }
      if (formData.insumos.length === 0) {
        throw new Error('Debes agregar al menos un insumo');
      }
      const insumosErrors = formData.insumos.map(validateInsumo);
      const hasErrors = insumosErrors.some(e => Object.keys(e).length > 0);
      if (hasErrors) {
        setErrors(prev => ({...prev, insumos: insumosErrors}));
        throw new Error('Corrige los errores en los insumos');
      }

      const token = await AsyncStorage.getItem('token');
const compraData = {
  fecha: formData.fecha.toISOString().split('T')[0],
  metodo_pago: formData.metodoPago,        // ✅ sin typo
  proveedorID: formData.proveedor,
  insumos: formData.insumos.map(i => ({
    id: i.insumo,
    cantidad: Number(i.cantidad),
    precio_unitario: Number(i.precioUnitario)
  }))
};


      const response = await axios.post('https://vianney-server.onrender.com/compras', compraData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (onCreate && typeof onCreate === 'function') {
        onCreate(response.data.compra);
      }

      showAlert(
        '¡Compra registrada! 🎉',
        `La compra y el stock de insumos se actualizaron correctamente\n\n💰 Total: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(calcularTotal())}`,
        'success'
      );

      resetForm();
      onClose();

    } catch (error) {
      console.error('Error al crear compra:', error);
      showAlert(
        '¡Error! 😟',
        error.response?.data?.mensaje || error.message || 'Error al crear compra. Verifica los datos e intenta nuevamente.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={() => {
          onClose();
          resetForm();
        }}
      >
        <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#424242" />
                </View>
              )}

              <View style={styles.header}>
                <Text style={styles.title}>
                  {pasoActual === 1 ? 'Crear nueva compra ✏️' : 'Añadir insumos a la compra 🛒'}
                </Text>
                <Text style={styles.subtitle}>
                  {pasoActual === 1 
                    ? 'Por favor, proporciona la información de la nueva compra' 
                    : 'Por favor, adjunta los insumos que fueron adquiridos en la compra'}
                </Text>
              </View>

              {pasoActual === 1 ? (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Método de pago</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={formData.metodoPago}
                        onValueChange={(value) => handleChange('metodoPago', value)}
                        style={styles.picker}
                        dropdownIconColor="#424242"
                      >
                        <Picker.Item label="Efectivo" value="Efectivo" />
                        <Picker.Item label="Transferencia" value="Transferencia" />
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.separador} />

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Proveedor <Text style={styles.required}>*</Text></Text>
                    <View style={[styles.pickerContainer, errors.proveedor ? styles.inputError : null]}>
                      <Picker
                        selectedValue={formData.proveedor}
                        onValueChange={(value) => handleChange('proveedor', value)}
                        style={styles.picker}
                        dropdownIconColor="#424242"
                      >
                        <Picker.Item label="Seleccione un proveedor" value="" />
                        {proveedores.map(prov => (
                          <Picker.Item key={prov.id} label={prov.nombre} value={prov.id} />
                        ))}
                      </Picker>
                    </View>
                    {errors.proveedor ? (
                      <Text style={styles.errorText}>{errors.proveedor}</Text>
                    ) : null}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Fecha <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity
                      style={[styles.dateInput, errors.fecha ? styles.inputError : null]}
                      onPress={() => { setShowDatePicker(true); const today = new Date(); setSelectedMonth(today.getMonth()); setSelectedYear(today.getFullYear()); }}
                    >
                      <Text style={[styles.dateText, formData.fecha && styles.dateTextSelected]}>
                        {formatDate(formData.fecha)}
                      </Text>
                      <MaterialIcons name="calendar-today" size={20} color="#666" />
                    </TouchableOpacity>
                    {errors.fecha ? (
                      <Text style={styles.errorText}>{errors.fecha}</Text>
                    ) : null}
                  </View>

                  {showDatePicker && (
                    <View style={styles.customDatePickerContainer}>
                      <View style={styles.customDatePicker}>
                        <View style={styles.datePickerHeader}>
                          <TouchableOpacity
                            onPress={() => changeMonth(-1)}
                            disabled={
                              new Date(selectedYear, selectedMonth, 1) <=
                              new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 8)
                            }
                          >
                            <MaterialIcons
                              name="chevron-left"
                              size={24}
                              color={
                                new Date(selectedYear, selectedMonth, 1) <=
                                new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 8)
                                  ? '#ccc'
                                  : '#333'
                              }
                            />
                          </TouchableOpacity>

                          <View style={styles.monthYearSelector}>
                            <Text style={styles.monthYearText}>
                              {LocaleConfig.locales['es'].monthNames[selectedMonth]} de {selectedYear}
                            </Text>
                          </View>

                          <TouchableOpacity
                            onPress={() => changeMonth(1)}
                            disabled={
                              new Date(selectedYear, selectedMonth, 1) >=
                              new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
                            }
                          >
                            <MaterialIcons
                              name="chevron-right"
                              size={24}
                              color={
                                new Date(selectedYear, selectedMonth, 1) >=
                                new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
                                  ? '#ccc'
                                  : '#333'
                              }
                            />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.calendarContainer}>
                          <Calendar
                            key={`${selectedYear}-${selectedMonth}`}
                            current={`${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-01`}
                            onDayPress={handleDayPress}
                            monthFormat={'MMMM yyyy'}
                            hideArrows
                            hideExtraDays
                            disableMonthChange
                            markedDates={{
                              ...getDisabledDates(),
                              [formData.fecha ? formatDateString(formData.fecha) : '']: {
                                selected: true,
                                selectedColor: '#424242',
                                selectedTextColor: '#fff'
                              },
                              [new Date().toISOString().split('T')[0]]: {
                                marked: true,
                                dotColor: '#424242'
                              }
                            }}
                            theme={{
                              calendarBackground: 'transparent',
                              textSectionTitleColor: '#666',
                              dayTextColor: '#333',
                              todayTextColor: '#424242',
                              selectedDayTextColor: '#fff',
                              selectedDayBackgroundColor: '#424242',
                              arrowColor: '#424242',
                              monthTextColor: '#333',
                              textDayFontWeight: '400',
                              textMonthFontWeight: 'bold',
                              textDayHeaderFontWeight: '500',
                              textDayFontSize: 12,
                              textMonthFontSize: 14,
                              textDayHeaderFontSize: 12,
                              'stylesheet.calendar.header': {
                                week: {
                                  marginTop: 5,
                                  flexDirection: 'row',
                                  justifyContent: 'space-between'
                                }
                              },
                              disabledDayTextColor: '#d9d9d9'
                            }}
                            style={styles.calendar}
                            disableAllTouchEventsForDisabledDays
                          />
                        </View>

                        <View style={styles.datePickerActions}>
                          <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => { handleChange('fecha', new Date()); setShowDatePicker(false); }}
                          >
                            <Text style={styles.datePickerButtonText}>Hoy</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowDatePicker(false)}
                          >
                            <Text style={styles.closeButtonText}>Cerrar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <>
                  {errors.insumos.some(e => e.general) && (
                    <Text style={[styles.errorText, {marginBottom:15}]}>
                      {errors.insumos.find(e => e.general)?.general}
                    </Text>
                  )}

                  <TouchableOpacity
                    style={styles.botonAgregarInsumo}
                    onPress={agregarInsumo}
                  >
                    <MaterialIcons name="add" size={24} color="#424242" />
                    <Text style={styles.textoBotonAgregar}>Agregar insumo</Text>
                  </TouchableOpacity>

                  <FlatList
                    data={formData.insumos}
                    keyExtractor={item => item.id}
                    renderItem={({ item, index }) => (
                      <View style={styles.insumoContainer}>
                        <Text style={styles.subtituloInsumo}>Insumo {index + 1}</Text>

                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Insumo <Text style={styles.required}>*</Text></Text>
                          <View style={[styles.pickerContainer, errors.insumos[index]?.insumo ? styles.inputError : null]}>
                            <Picker
                              selectedValue={item.insumo}
                              onValueChange={value => actualizarInsumo(item.id, 'insumo', value)}
                              style={styles.picker}
                              dropdownIconColor="#424242"
                            >
                              <Picker.Item label="Seleccione un insumo" value="" />
                              {insumos.map(ins => (
                                <Picker.Item key={ins.id} label={ins.nombre} value={ins.id} />
                              ))}
                            </Picker>
                          </View>
                          {errors.insumos[index]?.insumo && <Text style={styles.errorText}>{errors.insumos[index].insumo}</Text>}
                        </View>

                        <View style={styles.doubleRow}>
                          <View style={[styles.formGroup, {flex:1, marginRight:10}]}>
                            <Text style={styles.label}>Cantidad <Text style={styles.required}>*</Text></Text>
                            <TextInput
                              style={[styles.input, errors.insumos[index]?.cantidad ? styles.inputError : null]}
                              placeholder="Ej: 5"
                              placeholderTextColor="#929292"
                              keyboardType="numeric"
                              value={item.cantidad}
                              onChangeText={text => actualizarInsumo(item.id, 'cantidad', text.replace(/[^0-9]/g, ''))}
                            />
                            {errors.insumos[index]?.cantidad && <Text style={styles.errorText}>{errors.insumos[index].cantidad}</Text>}
                          </View>

                          <View style={[styles.formGroup, {flex:1}]}>
                            <Text style={styles.label}>Precio unitario (COP) <Text style={styles.required}>*</Text></Text>
                            <TextInput
                              style={[styles.input, errors.insumos[index]?.precioUnitario ? styles.inputError : null]}
                              placeholder="Ej: 25000"
                              placeholderTextColor="#929292"
                              keyboardType="numeric"
                              value={item.precioUnitario}
                              onChangeText={text => actualizarInsumo(item.id, 'precioUnitario', text.replace(/[^0-9]/g, ''))}
                            />
                            {errors.insumos[index]?.precioUnitario && <Text style={styles.errorText}>{errors.insumos[index].precioUnitario}</Text>}
                          </View>
                        </View>

                        <View style={styles.doubleRow}>
                          <View style={[styles.formGroup, {flex:1}]}>
                            <Text style={styles.label}>Subtotal</Text>
                            <Text style={styles.subtotal}>
                              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(
                                (parseFloat(item.cantidad) || 0) * (parseFloat(item.precioUnitario) || 0)
                              )}
                            </Text>
                          </View>
                          <TouchableOpacity style={styles.botonEliminarInsumo} onPress={() => eliminarInsumo(item.id)}>
                            <Feather name="trash-2" size={20} color="#424242" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  />

                  <View style={styles.totalContainer}>
                    <Text style={styles.labelTotal}>Total de la compra:</Text>
                    <Text style={styles.valorTotal}>
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(calcularTotal())}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.buttonContainer}>
                {pasoActual === 2 && (
                  <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => setPasoActual(1)}>
                    <Text style={styles.secondaryButtonText}>← Volver</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSubmit} disabled={loading}>
                  <Text style={styles.buttonText}>{pasoActual === 1 ? 'Siguiente →' : 'Enviar'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => { resetForm(); onClose(); }} disabled={loading}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <InfoModal
        visible={modalInfo.visible}
        onClose={closeModal}
        title={modalInfo.title}
        message={modalInfo.message}
        type={modalInfo.type}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'black',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  scrollContent: {
    padding: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
  },
  required: {
    color: '#d32f2f',
  },
  header: {
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 5,
  },
  formGroup: {
    marginBottom: 15,
  },
  doubleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 2,
    borderColor: '#424242',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    height: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#424242',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  picker: {
    height: 45,
    width: '100%',
  },
  dateInput: {
    borderWidth: 2,
    borderColor: '#424242',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 15,
    color: '#999',
  },
  dateTextSelected: {
    color: '#333',
  },
  separador: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  botonAgregarInsumo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 2,
    borderColor: '#424242',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  textoBotonAgregar: {
    marginLeft: 8,
    color: '#424242',
    fontWeight: '500',
  },
  insumoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#424242',
  },
  subtituloInsumo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  subtotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  botonEliminarInsumo: {
    padding: 8,
    alignSelf: 'flex-end',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#424242',
  },
  labelTotal: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  valorTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#424242',
    marginRight: 10,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#929292',
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#929292',
    marginLeft: 10,
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 15,
    color: 'white',
  },
  secondaryButtonText: {
    fontWeight: '500',
    fontSize: 15,
    color: 'black',
  },
  cancelButtonText: {
    fontWeight: '500',
    fontSize: 15,
    color: 'black',
  },
  customDatePickerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  customDatePicker: {
    width: width * 0.85,
    maxWidth: 350,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthYearSelector: {
    flex: 1,
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarContainer: {
    height: 300,
    overflow: 'hidden',
  },
  calendar: {
    marginBottom: 10,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  datePickerButton: {
    padding: 10,
    borderRadius: 5,
  },
  datePickerButtonText: {
    color: '#424242',
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#424242',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CrearCompra;
