import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ✅ Agregamos prop "dark" para cambiar el tema
const Footer = ({ dark = false }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={[
      styles.container, 
      isMobile && styles.mobileContainer,
      dark && styles.darkContainer // ✅ Aplicar tema oscuro si dark=true
    ]}>
      <View style={styles.content}>
        <Text style={[styles.text, dark && styles.darkText]}>© 2025.</Text>

        <View style={[styles.authors, isMobile && styles.authorsMobile]}>
          <TouchableOpacity style={styles.authorLink}>
            <Ionicons name="person" size={14} color={dark ? "#D4AF37" : "#6c757d"} />
            <Text style={[styles.text, styles.highlight, dark && styles.darkHighlight]}>
              {' '}Nicoll Andrea Giraldo Franco.
            </Text>
          </TouchableOpacity>

          {!isMobile && <Text style={[styles.text, dark && styles.darkText]}> | </Text>}

          <TouchableOpacity style={styles.authorLink}>
            <Ionicons name="person" size={14} color={dark ? "#D4AF37" : "#6c757d"} />
            <Text style={[styles.text, styles.highlight, dark && styles.darkHighlight]}>
              {' '}Luis Miguel Chica Ruíz.
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  // ✅ TEMA OSCURO
  darkContainer: {
    backgroundColor: '#000',
    borderTopColor: '#D4AF37',
  },
  mobileContainer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    flexWrap: 'wrap',
  },
  authors: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  authorsMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginLeft: 4,
    marginTop: 2,
  },
  authorLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  text: {
    fontSize: 13,
    color: '#6c757d',
  },
  // ✅ TEXTO BLANCO EN TEMA OSCURO
  darkText: {
    color: '#fff',
  },
  highlight: {
    color: '#424242',
    fontWeight: '500',
  },
  // ✅ HIGHLIGHT DORADO EN TEMA OSCURO
  darkHighlight: {
    color: '#D4AF37',
  },
});

export default Footer;