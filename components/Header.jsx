import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { hp } from '../helpers/common';
import Icon from '../assets/icons'; 
import BackButton from './BackButton'; 

const Header = ({ title, showBackButton = false, marginBottom = 10 }) => {
  const router = useRouter();

  return (
    <View style={[styles.container, { marginBottom: marginBottom }]}>
      {showBackButton && (
        <View style={styles.backButton}>
          <BackButton router={router} />
        </View>
      )}
      <Text style={styles.title}>{title || ""}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    gap: 10,
  },
  title: {
    fontSize: hp(2.7),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  backButton: {
    position: 'absolute',
    left: 0,
  }
});

export default Header;