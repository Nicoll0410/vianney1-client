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

  const loadUserData = useCallback(async (userId, userRole, token) => {
    try {
      if (userRole === "Cliente") {
        const { data } = await axios.get(
          `${BASE_URL}/clientes/usuario/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return { clientData: data };
      } else if (userRole === "Barbero") {
        const { data } = await axios.get(
          `${BASE_URL}/barberos/usuario/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        return { barberData: data };
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

  // Configurar Socket.io
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

      // En el useEffect del socket, agregar esto:
// 🔥 REEMPLAZAR el listener de actualizar_badge con este código MEJORADO:
socketRef.current.on("actualizar_badge", async (data) => {
  
  const currentUserId = authState.user?.userId || authState.user?.id;
  
  // Si el evento es específico para un usuario, verificar que sea el correcto
  if (data.usuarioID && data.usuarioID !== currentUserId) {
    return;
  }
  
  
  // Forzar actualización INMEDIATA
  await fetchNotifications();
  
  // Reproducir sonido de notificación
  await playNotificationSound();
  
  // Forzar re-render de componentes
  setAuthState(prev => ({
    ...prev,
    lastNotification: new Date() // Forzar update
  }));
});

      // 🎯 HANDLER PRINCIPAL - NOTIFICACIONES EN TIEMPO REAL
      socketRef.current.on("nueva_notificacion", async (data) => {
       
        // ✅ Verificar si la notificación es para este usuario
        const currentUserId = authState.user.userId || authState.user.id;
        if (data.usuarioID === currentUserId) {
          
          // 1. Reproducir sonido inmediatamente
          await playNotificationSound();
          
          // 2. Actualizar estado en tiempo real
          setAuthState(prev => {
            // Evitar duplicados
            const exists = prev.notifications.some(n => n.id === data.id);
            if (exists) {
              return prev;
            }

            const newUnreadCount = prev.unreadCount + 1;
            
            // Actualizar badge (solo en mobile)
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

          // 3. Mostrar alerta
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
        } else {
        }
      });

    } catch (error) {
    }
  }, [authState.isLoggedIn, authState.token, authState.user, playNotificationSound]);


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
      const additionalData = await loadUserData(decoded.userId, userRole, savedToken);

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
  // Agregar este useEffect para actualización automática:
useEffect(() => {
  if (authState.isLoggedIn) {
    // Actualizar cada 5 segundos
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }
}, [authState.isLoggedIn, fetchNotifications]);

  // Agregar este useEffect adicional para debuggear las salas
useEffect(() => {
  if (socketRef.current && authState.user) {
    const userId = authState.user.userId || authState.user.id;
    
    // Unir al usuario a su sala personal
    socketRef.current.emit("unir_usuario", userId);
    
    // Verificar estado de la conexión
    socketRef.current.on("usuario_unido", (data) => {
    });

    // Debuggear eventos de sala
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
      const userData = await loadUserData(decoded.userId, userRole, token);

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