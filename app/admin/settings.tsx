import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  Alert, 
  TextInput, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/ScreenWrapper';
import BackButton from '../../components/BackButton';
import { wp, hp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Icon from '../../assets/icons';

// 🟢 LEGACY IMPORT FIX (For Backup)
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';

export default function Settings() {
  const router = useRouter();
  const [broadcasting, setBroadcasting] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Settings State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [admins, setAdmins] = useState<any[]>([]);

  useEffect(() => {
    fetchSettings();
    fetchAdmins(); 
  }, []);

  // ——————————————————————————————————————————————————————————
  // 🟢 1. FETCH SETTINGS (Using Notification Hack)
  // ——————————————————————————————————————————————————————————
  const fetchSettings = async () => {
    try {
        // We check if a notification with title 'MAINTENANCE_ON' exists.
        // If it exists, it means Maintenance Mode is ON.
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('title', 'MAINTENANCE_ON')
            .maybeSingle();

        if (data) setMaintenanceMode(true);
        else setMaintenanceMode(false);

    } catch (err) {
        console.log("Settings fetch error:", err);
    }
  };

  const fetchAdmins = async () => {
    const { data } = await supabase
        .from('account')
        .select('username, email') 
        .eq('role', 'Admin'); 
    
    if (data) setAdmins(data);
  };

  const createLog = async (actionType: string, description: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase.from('log').insert({
            accountid: user.id,
            actiontype: `${actionType}: ${description}`
        });
    }
  };

  // ——————————————————————————————————————————————————————————
  // 🟢 2. TOGGLE MAINTENANCE (Using Notification Hack)
  // ——————————————————————————————————————————————————————————
  const toggleMaintenance = async (currentValue: boolean) => {
    const newValue = !currentValue;
    setMaintenanceMode(newValue); // Update UI immediately

    if (newValue === true) {
        // TURN ON: Create the ghost notification flag
        await supabase
            .from('notifications')
            .insert({ 
                title: 'MAINTENANCE_ON', 
                data: 'System is under maintenance',
                senderid: null, 
                receiverid: null 
            });
    } else {
        // TURN OFF: Delete the ghost notification flag
        await supabase
            .from('notifications')
            .delete()
            .eq('title', 'MAINTENANCE_ON');
    }

    await createLog("CONFIG_CHANGE", `Toggled Maintenance Mode to ${newValue ? 'ON' : 'OFF'}`);
  };

  const handleBroadcast = async () => {
    if (!announcement.trim()) {
        Alert.alert("Error", "Please enter a message to broadcast.");
        return;
    }
    Alert.alert("Confirm Broadcast", "Send to ALL users?", [
        { text: "Cancel", style: "cancel" },
        { 
            text: "Send", 
            onPress: async () => {
                setBroadcasting(true);
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    const { data: allUsers } = await supabase.from('account').select('accountid');
                    if (!allUsers) throw new Error("No users found");

                    const notificationsPayload = allUsers.map(targetUser => ({
                        senderid: null,
                        receiverid: targetUser.accountid,
                        title: announcement, 
                        data: null,          
                    }));

                    const { error } = await supabase.from('notifications').insert(notificationsPayload);
                    if (error) throw error;

                    Alert.alert("Success", `Sent to ${allUsers.length} users.`);
                    setAnnouncement(""); 
                    await createLog("BROADCAST", `Sent announcement: "${announcement}"`);
                } catch (err: any) {
                    Alert.alert("Error", err.message);
                } finally {
                    setBroadcasting(false);
                }
            }
        }
    ]);
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
        // 1. Fetch Real Data
        const { data: users } = await supabase.from('account').select('*');
        const { data: logs } = await supabase.from('log').select('*');
        const { data: reports } = await supabase.from('reported_content').select('*');
        // We skip system_settings here since the table doesn't exist anymore

        const backupData = {
            metadata: { timestamp: new Date().toISOString(), exported_by: "Admin" },
            users, logs, reports
        };

        // 2. Create Real File
        const fileName = `LinkUp_Backup_${new Date().toISOString().split('T')[0]}.json`;
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupData, null, 2));

        // 3. Prepare Email
        const isMailAvailable = await MailComposer.isAvailableAsync();
        const adminEmails = admins.map(a => a.email).filter(e => e && e.includes('@')); 

        if (adminEmails.length > 0 && isMailAvailable) {
            await MailComposer.composeAsync({
                recipients: adminEmails, 
                subject: `System Backup - ${new Date().toLocaleDateString()}`,
                body: `Attached is the latest system backup file.\n\nSystem generated.`,
                attachments: [fileUri],
            });
            await createLog("SYSTEM_BACKUP", `Emailed backup to ${adminEmails.length} admins`);
        } else {
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
                await createLog("SYSTEM_BACKUP", "Exported manual system backup (Share)");
            } else {
                Alert.alert("Error", "No email app or sharing available.");
            }
        }

    } catch (error: any) {
        Alert.alert("Backup Failed", error.message);
        console.log("Backup Error: ", error);
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
            
            <View style={styles.header}>
                <BackButton router={router} />
                <Text style={styles.title}>System Settings</Text>
            </View>

            {/* System Control */}
            <Text style={styles.sectionHeader}>System Control</Text>
            <View style={styles.card}>
                <View style={styles.settingRow}>
                    <View style={{flex: 1}}>
                        <Text style={styles.settingLabel}>Maintenance Mode</Text>
                        <Text style={styles.settingDesc}>Block all non-admin access temporarily.</Text>
                    </View>
                    <Switch 
                        trackColor={{ false: "#e0e0e0", true: "#FF3B30" }}
                        thumbColor={"#fff"}
                        onValueChange={() => toggleMaintenance(maintenanceMode)}
                        value={maintenanceMode}
                    />
                </View>
            </View>

            {/* Broadcast */}
            <Text style={styles.sectionHeader}>Broadcast Notification</Text>
            <View style={styles.card}>
                <Text style={styles.settingDesc}>Send a system notification to ALL users.</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="Type your message here..."
                    value={announcement}
                    onChangeText={setAnnouncement}
                    multiline
                />
                <TouchableOpacity 
                    style={[styles.saveBtn, broadcasting && { backgroundColor: '#ccc' }]} 
                    onPress={handleBroadcast}
                    disabled={broadcasting}
                >
                    {broadcasting ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Send to All Users</Text>}
                </TouchableOpacity>
            </View>

            {/* Recipients List */}
            <Text style={styles.sectionHeader}>Data Management</Text>
            <View style={styles.card}>
                
                <Text style={styles.settingLabel}>Backup Recipients (Admins)</Text>
                <Text style={styles.settingDesc}>These users will receive the backup file.</Text>
                
                <View style={styles.adminListContainer}>
                    {admins.map((admin, index) => (
                        <View key={index} style={styles.adminChip}>
                            <View style={styles.adminAvatar}>
                                <Text style={styles.adminInitials}>
                                    {admin.username ? admin.username[0].toUpperCase() : "A"}
                                </Text>
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={styles.adminName}>{admin.username || "Admin"}</Text>
                                <Text style={styles.adminEmail}>{admin.email}</Text>
                            </View>
                            <Icon name="arrowLeft" size={16} color={theme.colors.primary} />
                        </View>
                    ))}
                    {admins.length === 0 && (
                        <Text style={{color: '#999', fontStyle: 'italic', marginTop: 5}}>No admins found.</Text>
                    )}
                </View>

                <View style={styles.divider} />

                {/* Backup Button */}
                <TouchableOpacity style={styles.actionRow} onPress={handleBackup} disabled={loading}>
                    <View style={styles.iconBox}>
                        {loading ? (
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                        ) : (
                            <Icon name="arrowDown" size={20} color={theme.colors.primary} />
                        )}
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.settingLabel}>Backup System Data</Text>
                        <Text style={styles.settingDesc}>
                           Send .json file to all admins listed above.
                        </Text>
                    </View>
                    <Icon name="arrowRight" size={20} color="#ccc" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>LinkUp Admin v1.3.2 (Hack)</Text>

        </ScrollView>
        </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: wp(5), paddingVertical: hp(2), paddingBottom: 50 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  title: { fontSize: hp(2.5), fontWeight: 'bold', color: theme.colors.text },
  sectionHeader: { fontSize: hp(1.8), fontWeight: 'bold', color: '#888', marginBottom: 10, marginTop: 10, textTransform: 'uppercase' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#eee', marginBottom: 10 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  settingLabel: { fontSize: hp(2), fontWeight: '600', color: theme.colors.text },
  settingDesc: { fontSize: hp(1.6), color: '#999', marginTop: 2 },
  input: { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#eee', height: 80, textAlignVertical: 'top', marginTop: 10, marginBottom: 10 },
  saveBtn: { backgroundColor: theme.colors.primary, padding: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 5 },
  iconBox: { width: 40, height: 40, backgroundColor: '#E8F2FF', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoutBtn: { marginTop: 30, backgroundColor: '#FFF0F0', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FFD6D6' },
  logoutText: { color: '#FF3B30', fontWeight: 'bold', fontSize: hp(2) },
  versionText: { textAlign: 'center', color: '#ccc', marginTop: 20, fontSize: 12 },
  
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 15 },
  adminListContainer: { marginTop: 10, gap: 8 },
  adminChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  adminAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  adminInitials: { fontWeight: 'bold', color: '#666', fontSize: 12 },
  adminName: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  adminEmail: { fontSize: 11, color: '#888' }
});