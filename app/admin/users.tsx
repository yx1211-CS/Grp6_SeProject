import { 
  View, 
  Text, 
  ScrollView, // <--- Added this missing import
  FlatList, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  Modal, 
  Pressable 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/ScreenWrapper';
import BackButton from '../../components/BackButton';
import { wp, hp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Icon from '../../assets/icons';

// Define the available roles in your system
const ROLES = ['User', 'Counselor', 'Moderator', 'Admin'];

export default function ManageUsers() {
  const router = useRouter();
  
  // State for data and UI
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); 

  // State for Role Editor Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users whenever the tab or the main list changes
  useEffect(() => {
    if (activeTab === 'All') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(u => u.role === activeTab));
    }
  }, [activeTab, users]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('account') 
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  // 1. OPEN EDITOR
  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setEditModalVisible(true);
  };

  // 2. SAVE NEW ROLE
  const handleUpdateRole = async (newRole: string) => {
    if (!selectedUser) return;

    Alert.alert("Confirm Change", `Change role to ${newRole}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: async () => {
          setLoading(true);
          const { error } = await supabase
            .from('account')
            .update({ role: newRole })
            .eq('accountid', selectedUser.accountid);

          if (error) {
            Alert.alert("Error", error.message);
          } else {
            Alert.alert("Success", "User role updated.");
            setEditModalVisible(false);
            fetchUsers(); // Refresh list
          }
          setLoading(false);
      }}
    ]);
  };

  // 3. BAN / UNBAN LOGIC
  const handleToggleStatus = (user: any) => {
    const isBanned = user.accountstatus === 'Banned';
    const newStatus = isBanned ? 'Active' : 'Banned';
    const actionName = isBanned ? "Unban" : "Ban";

    Alert.alert(`Confirm ${actionName}`, `Are you sure you want to ${actionName.toLowerCase()} this user?`, [
      { text: "Cancel", style: "cancel" },
      { 
        text: actionName, 
        style: isBanned ? "default" : "destructive",
        onPress: async () => {
            const { error } = await supabase
              .from('account')
              .update({ accountstatus: newStatus })
              .eq('accountid', user.accountid);

            if (error) Alert.alert("Error", error.message);
            else fetchUsers(); 
        } 
      }
    ]);
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
            <BackButton router={router} />
            <Text style={styles.title}>Manage Users</Text>
        </View>

        {/* ———— ROLE TABS ———— */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
                style={[styles.tab, activeTab === 'All' && styles.activeTab]} 
                onPress={() => setActiveTab('All')}
            >
              <Text style={[styles.tabText, activeTab === 'All' && styles.activeTabText]}>All</Text>
            </TouchableOpacity>

            {ROLES.map(role => (
              <TouchableOpacity 
                key={role} 
                style={[styles.tab, activeTab === role && styles.activeTab]} 
                onPress={() => setActiveTab(role)}
              >
                <Text style={[styles.tabText, activeTab === role && styles.activeTabText]}>{role}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* User List */}
        <FlatList 
          data={filteredUsers}
          keyExtractor={(item: any) => item.accountid?.toString() || Math.random().toString()}
          contentContainerStyle={{ paddingBottom: 50 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No users found in this category.</Text>}
          renderItem={({ item }) => {
            const isBanned = item.accountstatus === 'Banned';
            
            return (
              <View style={[styles.userCard, isBanned && styles.bannedCard]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>{item.username || "Unknown"}</Text>
                    
                    {/* Role Badge (Clickable to Edit) */}
                    <TouchableOpacity onPress={() => openEditModal(item)} style={styles.roleBadge}>
                        <Text style={styles.roleText}>{item.role || "User"}</Text>
                        <Icon name="edit" size={12} color="white" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.userEmail}>{item.email}</Text>
                  
                  {/* Status Indicator */}
                  <Text style={[styles.statusText, { color: isBanned ? '#FF3B30' : '#34C759' }]}>
                    ● {item.accountstatus || "Active"}
                  </Text>
                </View>
                
                {/* Ban/Unban Button */}
                <TouchableOpacity 
                  onPress={() => handleToggleStatus(item)}
                  style={[styles.actionButton, { borderColor: isBanned ? '#34C759' : '#FF3B30' }]}
                >
                  <Text style={{ color: isBanned ? '#34C759' : '#FF3B30', fontWeight: 'bold', fontSize: 12 }}>
                    {isBanned ? "Unban" : "Ban"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />

        {/* ———— ROLE EDITOR MODAL ———— */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={editModalVisible}
            onRequestClose={() => setEditModalVisible(false)}
        >
            <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Edit Role</Text>
                    <Text style={styles.modalSubtitle}>Select new role for {selectedUser?.username}</Text>

                    {ROLES.map(role => (
                        <TouchableOpacity 
                            key={role}
                            style={[
                                styles.roleOption, 
                                selectedUser?.role === role && styles.roleOptionSelected
                            ]}
                            onPress={() => handleUpdateRole(role)}
                        >
                            <Text style={[
                                styles.roleOptionText,
                                selectedUser?.role === role && { color: theme.colors.primary, fontWeight: 'bold' }
                            ]}>{role}</Text>
                            
                            {selectedUser?.role === role && <Icon name="check" size={20} color={theme.colors.primary} />}
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>

      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: wp(5) },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  title: { fontSize: hp(2.5), fontWeight: 'bold', color: theme.colors.text },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  
  // Tabs
  tabContainer: { height: 50, marginBottom: 10 },
  tab: { 
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, 
    backgroundColor: '#f0f0f0', marginRight: 10, height: 35, justifyContent: 'center'
  },
  activeTab: { backgroundColor: theme.colors.primary },
  tabText: { color: '#666', fontWeight: '600' },
  activeTabText: { color: 'white' },

  // User Card
  userCard: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#eee', elevation: 1
  },
  bannedCard: { backgroundColor: '#FFF5F5', borderColor: '#FFD6D6' },
  
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  userName: { fontSize: hp(2), fontWeight: '600', color: theme.colors.text, marginRight: 8 },
  roleBadge: { 
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 
  },
  roleText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  
  userEmail: { fontSize: hp(1.6), color: '#888', marginBottom: 5 },
  statusText: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  actionButton: {
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center'
  },

  // Modal Styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25,
    padding: 25, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  roleOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'
  },
  roleOptionSelected: { backgroundColor: '#F5F9FF', marginHorizontal: -10, paddingHorizontal: 10, borderRadius: 8, borderBottomWidth: 0 },
  roleOptionText: { fontSize: 16, color: '#333' },
  cancelButton: { marginTop: 20, alignItems: 'center', padding: 15 },
  cancelText: { color: '#FF3B30', fontWeight: '600', fontSize: 16 }
});