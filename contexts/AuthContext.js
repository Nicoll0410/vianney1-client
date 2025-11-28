import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from "react";
import { Platform, Alert, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";
import io from "socket.io-client";

const BASE_URL = "https://vianney-server.onrender.com";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isLoading: true,
    isLoggedIn: false,
    token: null,
    user: null,
    userRole: null,
    clientData: null,
    barberData: null,
    notifications: [],
    unreadCount: 0,
    lastNotification: null,
  });

  const socketRef = useRef(null);
  const notificationSoundRef = useRef(null);

  // Cargar sonido de notificación
  const loadNotificationSound = useCallback(async () => {
    try {
      if (notificationSoundRef.current) {
        await notificationSoundRef.current.unloadAsync();
      }
      
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sound/notification.mp3")
      );
      notificationSoundRef.current = sound;
    } catch (error) {
      console.error("Error cargando sonido:", error);
    }
  }, []);

  // Reproducir sonido de notificación
  const playNotificationSound = useCallback(async () => {
    try {
      if (notificationSoundRef.current) {
        await notificationSoundRef.current.replayAsync();
      } else {
        await loadNotificationSound();
        if (notificationSoundRef.current) {
          await notificationSoundRef.current.replayAsync();
        }
      }
    } catch (error) {
      console.error("Error reproduciendo sonido:", error);
    }
  }, [loadNotificationSound]);

  // Configurar notificaciones push
  const setupNotifications = useCallback(async () => {
    try {
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
    } catch (error) {
      console.error("Error configurando notificaciones:", error);
    }
  }, []);

  const normalizeRole = (rawRole) => {
    if (!rawRole) return null;
    return rawRole === "Paciente" ? "Cliente" : rawRole;
  };

  const checkTokenValidity = useCallback(async (token) => {
    try {
      const decoded = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000);

      if (decoded.exp && decoded.exp > now) {
        return { valid: true, decoded };
      }
      return { valid: false };
    } catch (err) {
      console.warn("Token inválido:", err);
      return { valid: false };
    }
  }, []);

  // ✅ FUNCIÓN CORREGIDA - Busca por email en lugar de userId
  const loadUserData = useCallback(async (user, userRole, token) => {
    try {
      if (userRole === "Cliente") {
        // Para clientes, buscar por email
        const email = user?.email;
        if (!email) {
          console.error('❌ No se pudo obtener email del usuario');
          return {};
        }

        const { data: respuestaClientes } = await axios.get(
          `${BASE_URL}/clientes`,
          { 
            headers: { Authorization: `Bearer ${token}` },
            params: { all: true }
          }
        );
        
        const clientesArray = Array.isArray(respuestaClientes) ? respuestaClientes : 
                             (respuestaClientes.clientes || respuestaClientes.data || []);
        
        const miCliente = clientesArray.find(c => 
          c.usuario?.email?.toLowerCase() === email.toLowerCase()
        );
        
        if (miCliente) {
          console.log('✅ Cliente encontrado:', miCliente.nombre);
          return { clientData: miCliente };
        }
      } else if (userRole === "Barbero" || userRole === "Administrador") {
        // Para barberos y admins, buscar por email
        const email = user?.email;
        if (!email) {
          console.error('❌ No se pudo obtener email del usuario');
          return {};
        }

        const { data: respuestaBarberos } = await axios.get(
          `${BASE_URL}/barberos`,
          { 
            headers: { Authorization: `Bearer ${token}` },
            params: { all: true }
          }
        );
        
        const barberosArray = Array.isArray(respuestaBarberos) ? respuestaBarberos : 
                             (respuestaBarberos.barberos || respuestaBarberos.data || []);
        
        const miBarbero = barberosArray.find(b => 
          b.usuario?.email?.toLowerCase() === email.toLowerCase()
        );
        
        if (miBarbero) {
          console.log('✅ Barbero encontrado:', miBarbero.nombre);
          return { barberData: miBarbero };
        }
      }
      return {};
    } catch (error) {
      console.error("Error cargando datos adicionales:", error);
      return {};
    }
  }, []);

  // Obtener notificaciones
  const fetchNotifications = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return [];

      const response = await axios.get(`${BASE_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (response.data?.success) {
        const notificationsData = response.data.data?.notifications || [];
        const unreadCount = response.data.data?.unreadCount || 0;

        setAuthState(prev => ({
          ...prev,
          notifications: notificationsData,
          unreadCount: unreadCount,
        }));

        // Solo actualizar badge en mobile
        if (Platform.OS !== 'web') {
          await Notifications.setBadgeCountAsync(unreadCount);
        }

        return notificationsData;
      }
      
      return [];
    } catch (error) {
      console.error("Error obteniendo notificaciones:", error);
      return [];
    }
  }, []);

  // Marcar como leídas
  const markNotificationsAsRead = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      await axios.post(
        `${BASE_URL}/notifications/mark-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setAuthState(prev => ({
        ...prev,
        unreadCount: 0,
        notifications: prev.notifications.map(n => ({ ...n, leido: true })),
      }));

      if (Platform.OS !== 'web') {
        await Notifications.setBadgeCountAsync(0);
      }
    } catch (error) {
      console.error("Error marcando notificaciones como leídas:", error);
    }
  }, []);

  // Registrar token push
  const registerPushToken = useCallback(async (userId, token) => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        return;
      }

      const pushToken = (await Notifications.getExpoPushTokenAsync()).data;

      await axios.post(
        `${BASE_URL}/notifications/save-token`,
        {
          token: pushToken,
          dispositivo: Platform.OS,
          sistemaOperativo: Platform.Version,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return pushToken;
    } catch (error) {
      console.error("Error registrando token push:", error);
      return null;
    }
  }, []);

  // Configurar Socket.io de manera robusta
  const setupSocket = useCallback(async () => {
    try {
      
      // Cerrar socket existente
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      if (!authState.isLoggedIn || !authState.token || !authState.user) {
        return;
      }
      socketRef.current = io(BASE_URL, {
        transports: ['websocket', 'polling'],
        auth: {
          token: authState.token
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Eventos del socket
      socketRef.current.on("connect", () => {
        const userId = authState.user.userId || authState.user.id;
        socketRef.current.emit("unir_usuario", userId);
      });

      socketRef.current.on("usuario_unido", (data) => {
      });

      socketRef.current.on("disconnect", (reason) => {
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("❌ Error de conexión:", error.message);
      });

      socketRef.current.on("actualizar_badge", async (data) => {
        const currentUserId = authState.user?.userId || authState.user?.id;
        
        if (data.usuarioID && data.usuarioID !== currentUserId) {
          return;
        }
        
        await fetchNotifications();
        await playNotificationSound();
        
        setAuthState(prev => ({
          ...prev,
          lastNotification: new Date()
        }));
      });

      socketRef.current.on("nueva_notificacion", async (data) => {
        const currentUserId = authState.user.userId || authState.user.id;
        if (data.usuarioID === currentUserId) {
          
          await playNotificationSound();
          
          setAuthState(prev => {
            const exists = prev.notifications.some(n => n.id === data.id);
            if (exists) {
              return prev;
            }

            const newUnreadCount = prev.unreadCount + 1;
            
            if (Platform.OS !== 'web') {
              Notifications.setBadgeCountAsync(newUnreadCount).catch(console.error);
            }

            return {
              ...prev,
              notifications: [data, ...prev.notifications],
              unreadCount: newUnreadCount,
              lastNotification: data
            };
          });

          Alert.alert(
            data.titulo,
            data.cuerpo,
            [
              {
                text: 'Ver',
                onPress: () => {
                  // Navegar si es necesario
                }
              },
              { text: 'OK' }
            ],
            { cancelable: true }
          );
        }
      });

    } catch (error) {
    }
  }, [authState.isLoggedIn, authState.token, authState.user, playNotificationSound, fetchNotifications]);


  // Inicializar autenticación
  const initializeAuth = useCallback(async () => {
    try {
      const savedToken = await AsyncStorage.getItem("token");
      if (!savedToken) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const { valid, decoded } = await checkTokenValidity(savedToken);
      if (!valid) {
        await AsyncStorage.removeItem("token");
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const userRole = normalizeRole(decoded?.rol?.nombre);
      // ✅ CAMBIO: Pasar el objeto decoded completo en lugar de decoded.userId
      const additionalData = await loadUserData(decoded, userRole, savedToken);

      const newState = {
        isLoading: false,
        isLoggedIn: true,
        token: savedToken,
        user: decoded,
        userRole,
        ...additionalData,
        notifications: [],
        unreadCount: 0,
        lastNotification: null,
      };

      setAuthState(newState);

      await setupNotifications();
      await loadNotificationSound();
      await fetchNotifications();

      if (decoded.userId) {
        await registerPushToken(decoded.userId, savedToken);
      }

    } catch (err) {
      console.error("Error inicializando auth:", err);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [checkTokenValidity, loadUserData, setupNotifications, loadNotificationSound, fetchNotifications, registerPushToken]);

  // Efectos principales
  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (authState.isLoggedIn) {
      const interval = setInterval(() => {
        fetchNotifications();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [authState.isLoggedIn, fetchNotifications]);

  useEffect(() => {
    if (socketRef.current && authState.user) {
      const userId = authState.user.userId || authState.user.id;
      
      socketRef.current.emit("unir_usuario", userId);
      
      socketRef.current.on("usuario_unido", (data) => {
      });

      socketRef.current.on("join", (room) => {
      });

      socketRef.current.on("leave", (room) => {
      });
    }
  }, [socketRef.current, authState.user]);

  useEffect(() => {
    setupSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [setupSocket]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        setupSocket();
        fetchNotifications();
      }
    });

    return () => subscription.remove();
  }, [setupSocket, fetchNotifications]);

  // Login
  const login = async (token, additionalData = {}) => {
    try {
      const { decoded } = await checkTokenValidity(token);
      if (!decoded) throw new Error("Token inválido");

      await AsyncStorage.setItem("token", token);
      const userRole = normalizeRole(decoded?.rol?.nombre);
      // ✅ CAMBIO: Pasar el objeto decoded completo
      const userData = await loadUserData(decoded, userRole, token);

      const newState = {
        isLoading: false,
        isLoggedIn: true,
        token,
        user: decoded,
        userRole,
        ...userData,
        ...additionalData,
        notifications: [],
        unreadCount: 0,
        lastNotification: null,
      };

      setAuthState(newState);

      await setupNotifications();
      await loadNotificationSound();
      await fetchNotifications();

      if (decoded.userId) {
        await registerPushToken(decoded.userId, token);
      }

      return true;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      await AsyncStorage.removeItem("token");
      setAuthState({
        isLoading: false,
        isLoggedIn: false,
        token: null,
        user: null,
        userRole: null,
        clientData: null,
        barberData: null,
        notifications: [],
        unreadCount: 0,
        lastNotification: null,
      });
      
      if (Platform.OS !== 'web') {
        await Notifications.setBadgeCountAsync(0);
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Verify account
  const verifyAccount = async (email, code) => {
    try {
      const response = await axios.post(`${BASE_URL}/auth/verify-account`, {
        email,
        codigo: code,
      });

      if (response.data.token) {
        await login(response.data.token, {
          clientData: response.data.cliente || null,
          barberData: response.data.barbero || null,
        });

        return {
          success: true,
          message: "Cuenta verificada exitosamente",
          rol: normalizeRole(response.data.rol),
        };
      }

      return {
        success: false,
        message: "No se recibió token",
      };
    } catch (error) {
      console.error("Error en verifyAccount:", error);
      return {
        success: false,
        message: error.response?.data?.mensaje || "Error al verificar la cuenta",
      };
    }
  };

  // Resend verification code
  const resendVerificationCode = async (email) => {
    try {
      const response = await axios.post(`${BASE_URL}/auth/resend-verification`, {
        email,
      });
      return response.data;
    } catch (error) {
      console.error("Error en resendVerificationCode:", error);
      throw new Error(error.response?.data?.mensaje || "Error al reenviar el código");
    }
  };

  const value = {
    ...authState,
    login,
    logout,
    verifyAccount,
    resendVerificationCode,
    fetchNotifications,
    markNotificationsAsRead,
    playNotificationSound,
    socket: socketRef.current,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};