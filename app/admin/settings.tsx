import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Share, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/ScreenWrapper';
import BackButton from '../../components/BackButton';
import { wp, hp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Icon from '../../assets/icons';

export default function AdminSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // ——————————————————————————————————————————————————————————————————
  // 1. INIT: Load Maintenance Status from Logs
  // ——————————————————————————————————————————————————————————————————
  useEffect(() => {
    fetchMaintenanceStatus();
  }, []);

  const fetchMaintenanceStatus = async () => {
    try {
      // Find the most recent action that started with "MAINTENANCE_"
      const { data } = await supabase
        .from('log')
        .select('actiontype')
        .like('actiontype', 'MAINTENANCE_%') 
        .order('logid', { ascending: false }) // Newest first
        .limit(1)
        .single();
      
      // If the last thing we did was turn it ON, then it's ON.
      if (data && data.actiontype === 'MAINTENANCE_ON') {
        setMaintenanceMode(true);
      } else {
        setMaintenanceMode(false);
      }
    } catch (err) {
      // If no logs exist, assume OFF
      setMaintenanceMode(false);
    }
  };

  // ——————————————————————————————————————————————————————————————————
  // 2. ACTION: Toggle Maintenance Mode (Write to Log)
  // ——————————————————————————————————————————————————————————————————
  const toggleMaintenance = async (newValue: boolean) => {
    // 1. Update UI immediately
    setMaintenanceMode(newValue); 

    try {
        const { data: { user } } = await supabase.auth.getUser();
        const actionString = newValue ? 'MAINTENANCE_ON' : 'MAINTENANCE_OFF';

        // 2. Insert into existing LOG table (No new tables needed!)
        const { error } = await supabase
          .from('log')
          .insert({
             accountid: user?.id || null, 
             actiontype: actionString
          });

        if (error) throw error;

        // 3. Confirm success
        if (newValue) {
            Alert.alert("Maintenance Mode ON", "Users are now blocked from accessing the app.");
        } else {
            Alert.alert("Maintenance Mode OFF", "System is live. Users can log in.");
        }

    } catch (error) {
      Alert.alert("Error", "Failed to update maintenance mode.");
      setMaintenanceMode(!newValue); // Revert switch if failed
      console.log(error);
    }
  };

  // ——————————————————————————————————————————————————————————————————
  // 3. ACTION: Full System Backup
  // ——————————————————————————————————————————————————————————————————
  const TABLES_TO_BACKUP = [
    'account', 'chat', 'feedback', 'follower', 'friend', 'help_request',
    'helper_application', 'interest', 'log', 'mood', 'notifications',
    'post', 'reaction', 'reply', 'reported_content', 'streak', 'task',
    'task_report', 'user_interest'
  ];

  const handleBackup = async () => {
    setLoading(true);
    try {
      const backupData: any = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        tables: {} 
      };

      console.log("Starting backup...");
      
      const promises = TABLES_TO_BACKUP.map(async (tableName) => {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) return { name: tableName, data: [] };
        return { name: tableName, data: data };
      });

      const results = await Promise.all(promises);

      // Count users for verification
      let userCount = 0;
      results.forEach(result => {
        backupData.tables[result.name] = result.data;
        if (result.name === 'account') userCount = result.data.length;
      });

      const jsonString = JSON.stringify(backupData, null, 2);

      // Verify before sharing
      Alert.alert(
        "Backup Ready", 
        `Successfully exported ${userCount} users and ${TABLES_TO_BACKUP.length} tables.\n\nPress OK to save the file.`,
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Save File", 
                onPress: async () => {
                    await Share.share({
                        message: jsonString,
                        title: `Backup_${new Date().toISOString().split('T')[0]}.json`
                    });
                }
            }
        ]
      );

    } catch (error) {
      Alert.alert("Backup Failed", "An unexpected error occurred.");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  return (
    <ScreenWrapper bg="white">
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
            <BackButton router={router} />
            <Text style={styles.title}>Admin Settings</Text>
        </View>

        {/* SECTION 1: SYSTEM ACTIONS */}
        <Text style={styles.sectionTitle}>System Management</Text>
        
        {/* Backup Button */}
        <TouchableOpacity style={styles.settingCard} onPress={handleBackup} disabled={loading}>
            <View style={[styles.iconBox, { backgroundColor: '#E8F2FF' }]}>
                <Icon name="edit" size={22} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.settingText}>{loading ? "Backing up..." : "Full System Backup"}</Text>
                <Text style={styles.settingSubtext}>Export database to JSON file</Text>
            </View>
            <Icon name="arrowRight" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        {/* Maintenance Mode Toggle */}
        <View style={styles.settingCard}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF0F0' }]}>
                <Icon name="lock" size={22} color="#FF3B30" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.settingText}>Maintenance Mode</Text>
                <Text style={styles.settingSubtext}>
                    {maintenanceMode ? "Active (Users Blocked)" : "Inactive (System Live)"}
                </Text>
            </View>
            <Switch 
                value={maintenanceMode} 
                onValueChange={toggleMaintenance}
                trackColor={{ false: "#767577", true: "#FF3B30" }}
            />
        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={[styles.logoutBtn]} onPress={handleLogout}>
            <Icon name="logout" size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>App Version 1.0.5 (Admin Build)</Text>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: wp(5) },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, gap: 10 },
  title: { fontSize: hp(2.5), fontWeight: 'bold', color: theme.colors.text },
  
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#888', marginTop: 10, marginBottom: 10, textTransform: 'uppercase' },
  
  settingCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#f0f0f0', gap: 15
  },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingText: { fontSize: 16, fontWeight: '600', color: '#333' },
  settingSubtext: { fontSize: 12, color: '#999', marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 40, padding: 15, borderRadius: 16,
    backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FFE5E5', gap: 8
  },
  logoutText: { color: '#FF3B30', fontWeight: 'bold', fontSize: 16 },
  versionText: { textAlign: 'center', marginTop: 20, color: '#CCC', fontSize: 12 }
});