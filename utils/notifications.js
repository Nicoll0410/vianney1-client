import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import axios from "axios";

const BASE_URL = "https://vianney-server.onrender.com";

// Configurar notificaciones push
export const configurePushNotifications = async () => {
  try {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  } catch (error) {
    console.error("Error configurando notificaciones:", error);
  }
};

// Reproducir sonido de notificación
export const playNotificationSound = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/sound/notification.mp3")
    );
    
    await sound.playAsync();
    setTimeout(() => sound.unloadAsync(), 3000);
  } catch (error) {
    console.error("Error reproduciendo sonido:", error);
  }
};

// Registrar token push en el backend
export const registerPushToken = async (userId, tokenAuth) => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      
      if (newStatus !== 'granted') {
        throw new Error('Permiso para notificaciones denegado');
      }
    }

    const expoToken = (await Notifications.getExpoPushTokenAsync()).data;

    await axios.post(
      `${BASE_URL}/notifications/save-token`,
      { token: expoToken },
      { 
        headers: { 
          Authorization: `Bearer ${tokenAuth}`, 
          'Content-Type': 'application/json' 
        } 
      }
    );

    return expoToken;
  } catch (error) {
    console.error("Error registrando token push:", error);
    throw error;
  }
};

// Obtener notificaciones del usuario
export const fetchUserNotifications = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/notifications`, {
      headers: { 
        Authorization: `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      }
    });
    
    return response.data;
  } catch (error) {
    console.error("Error obteniendo notificaciones:", error);
    throw error;
  }
};