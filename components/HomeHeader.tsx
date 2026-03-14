import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Text } from './ThemedText';
import { useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function HomeHeader() {
  const { user } = useUser();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.userInfo}>
        <Image 
          source={{ uri: user?.imageUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }} 
          style={styles.profileImage} 
        />
        <View style={styles.textContainer}>
          <Text style={styles.welcomeText} weight="500">Welcome,</Text>
          <Text style={styles.userName} weight="700">{user?.firstName || 'User'}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
        <Ionicons name="notifications-outline" size={22} color={Colors.text} />
        <View style={styles.notificationBadge} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    width: '100%',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textContainer: {
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    color: Colors.text,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: Colors.background,
  }
});
