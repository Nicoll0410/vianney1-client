import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { AuthContext } from "../../contexts/AuthContext";

const { width, height } = Dimensions.get("window");
const isDesktop = width >= 1024;
const isMobile = width < 768;

const BASE_URL =
  Platform.OS === "android" ? "https://vianney-server.onrender.com" : "https://vianney-server.onrender.com";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email || !password) {
      setLoginError("Por favor, ingresa correo y contraseña.");
      return;
    }

    setIsLoading(true);
    setLoginError("");

    try {
      // Intenta primero el login estándar
      const { data } = await axios.post(`${BASE_URL}/auth/login`, {
        email,
        password,
      });

      if (data.success && data.token) {
        const loginSuccess = await login(data.token);
        if (!loginSuccess) {
          setLoginError("Error al iniciar sesión");
        }
        return;
      }

      // Si el rol no está autorizado, intenta como cliente
      if (data.reason === "UNAUTHORIZED_ROLE") {
        const resClient = await axios.post(`${BASE_URL}/auth/login-client`, {
          email,
          password,
        });

        if (resClient.data.token) {
          const loginSuccess = await login(resClient.data.token, {
            clientData: resClient.data.cliente,
          });

          if (!loginSuccess) {
            setLoginError("Error al iniciar sesión");
          }
        } else {
          setLoginError("Credenciales incorrectas");
        }
        return;
      }

      // Manejo de otros errores
      switch (data.reason) {
        case "USER_NOT_FOUND":
          setLoginError("Usuario no registrado.");
          break;
        case "INVALID_PASSWORD":
          setLoginError("Contraseña incorrecta.");
          break;
        case "NOT_VERIFIED":
          setLoginError("Tu cuenta no ha sido verificada. Revisa tu correo.");
          break;
        default:
          setLoginError("Error desconocido. Intenta nuevamente.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(
        error.response?.data?.message || "Error al conectar con el servidor"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const togglePassword = () => setShowPassword(!showPassword);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>Accede a tu cuenta</Text>
        <Text style={styles.subtitle}>
          Inicia sesión para gestionar tus citas y servicios
        </Text>

        <Text style={styles.inputLabel}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="nombre@dominio.com"
          placeholderTextColor="#808280"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Contraseña *</Text>
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="●●●●●●●●"
            placeholderTextColor="#808280"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={togglePassword}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={24}
              color="#808280"
            />
          </TouchableOpacity>
        </View>

        {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Iniciar sesión</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={() => navigation.navigate("ForgotPassword")}
        >
          <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.registerText}>
            ¿No tienes cuenta?{" "}
            <Text style={styles.registerLink}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading Modal */}
      <Modal transparent visible={isLoading} animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Iniciando sesión...</Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#ffffffff",
  },
  formContainer: {
    width: isDesktop ? 400 : "90%",
    maxWidth: 400,
    alignSelf: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginVertical: 10,
  },
  title: {
    fontSize: isDesktop ? 24 : 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: isDesktop ? 14 : 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: "#444",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 16,
    backgroundColor: "#fff",
    fontSize: 15,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 15,
    paddingRight: 45,
  },
  eyeIcon: {
    position: "absolute",
    right: 0,
    height: "100%",
    width: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    height: 50,
    backgroundColor: "#424242",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotPasswordButton: {
    marginTop: 16,
    alignItems: "center",
  },
  forgotPassword: {
    fontSize: 14,
    color: "#424242",
    textDecorationLine: "underline",
  },
  registerButton: {
    marginTop: 8,
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
    color: "#666",
  },
  registerLink: {
    color: "#424242",
    textDecorationLine: "underline",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 13,
    textAlign: "center",
    marginVertical: 8,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  loadingBox: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
    maxWidth: 300,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#333",
  },
});

export default LoginForm;