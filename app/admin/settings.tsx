import { View, Text, Switch, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import BackButton from '../../components/BackButton';
import { wp, hp } from '../../helpers/common';
import { theme } from '../../constants/theme';

export default function AdminSettings() {
  const router = useRouter();
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const toggleMaintenance = () => {
    // In real app, you would save this to Supabase here
    setMaintenanceMode(!maintenanceMode);
    
    if (!maintenanceMode) {
        Alert.alert("System Warning", "Maintenance Mode enabled. Regular users cannot log in.");
    }
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <View style={styles.header}>
            <BackButton router={router} />
            <Text style={styles.title}>System Settings</Text>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionHeader}>General</Text>
            
            <View style={styles.row}>
                <View>
                    <Text style={styles.label}>Maintenance Mode</Text>
                    <Text style={styles.subLabel}>Disable access for non-admins</Text>
                </View>
                <Switch 
                    value={maintenanceMode}
                    onValueChange={toggleMaintenance}
                    trackColor={{ false: "#767577", true: theme.colors.primary }}
                />
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionHeader}>Data Management</Text>
            <TouchableOpacity style={styles.button} onPress={() => Alert.alert("Backup", "Backup started...")}>
                <Text style={styles.buttonText}>Trigger Manual Backup</Text>
            </TouchableOpacity>
        </View>

      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: wp(5) },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 10 },
  title: { fontSize: hp(2.5), fontWeight: 'bold', color: theme.colors.text },
  section: { marginBottom: 30 },
  sectionHeader: { fontSize: hp(2), fontWeight: '600', color: theme.colors.primary, marginBottom: 15, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12 },
  label: { fontSize: 16, fontWeight: '500', color: '#333' },
  subLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  button: { backgroundColor: '#333', padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' }
});