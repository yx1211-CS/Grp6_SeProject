import { 
  View, 
  Text, 
  ScrollView, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  Modal, 
  Pressable,
  TextInput 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/ScreenWrapper';
import BackButton from '../../components/BackButton';
import { wp, hp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Icon from '../../assets/icons';

const ROLES = ['User', 'Counselor', 'Moderator', 'Admin'];

export default function Users() {
  const router = useRouter();
  
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState('');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;
    // 1. Filter by Tab
    if (activeTab !== 'All') {
      result = result.filter(u => u.role === activeTab);
    }
    // 2. Filter by Search
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u => 
        (u.username && u.username.toLowerCase().includes(query)) || 
        (u.email && u.email.toLowerCase().includes(query))
      );
    }
    setFilteredUsers(result);
  }, [activeTab, users, searchQuery]);

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

  const createLog = async (actionType: string, description: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        console.log(`[ADMIN ACTION] ${actionType}: ${description}`);
        await supabase.from('log').insert({
            accountid: user.id,
            actiontype: `${actionType}: ${description}`
        });
    } catch (error) {
        console.log("Failed to create log:", error);
    }
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setEditModalVisible(true);
  };

  const handleUpdateRole = async (newRole: string) => {
    if (!selectedUser) return;
    setLoading(true);
    const { error } = await supabase
      .from('account')
      .update({ role: newRole })
      .eq('accountid', selectedUser.accountid);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      await createLog("ROLE_UPDATE", `Changed ${selectedUser.username} to ${newRole}`);
      Alert.alert("Success", "User role updated.");
      setEditModalVisible(false);
      fetchUsers(); 
    }
    setLoading(false);
  };

  const handleToggleStatus = (user: any) => {
    const isBanned = user.accountstatus === 'Banned';
    const newStatus = isBanned ? 'Active' : 'Banned';
    const actionName = isBanned ? "Unban" : "Ban";

    Alert.alert(`Confirm ${actionName}`, `Are you sure?`, [
      { text: "Cancel", style: "cancel" },
      { text: actionName, style: isBanned ? "default" : "destructive",
        onPress: async () => {
            const { error } = await supabase
              .from('account')
              .update({ accountstatus: newStatus })
              .eq('accountid', user.accountid);

            if (error) Alert.alert("Error", error.message);
            else {
                await createLog("USER_STATUS", `${actionName}ned user ${user.username}`);
                fetchUsers(); 
            }
        } 
      }
    ]);
  };

  // ——————————————————————————————————————————————————————————————————
  // 🟢 OPTION 1: SOFT DELETE
  // ——————————————————————————————————————————————————————————————————
  const handleDeleteAccount = (user: any) => {
    // If already deleted, don't do anything
    if (user.accountstatus === 'Deleted') {
        Alert.alert("Info", "This user is already deleted.");
        return;
    }

    Alert.alert(
        "DELETE ACCOUNT", 
        `Are you sure you want to delete ${user.username}? \n\nThis will mark the account as 'Deleted'. This action cannot be easily undone.`, 
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive",
                onPress: async () => {
                    setLoading(true);
                    
                    // We UPDATE the status instead of deleting the row
                    const { error } = await supabase
                        .from('account')
                        .update({ 
                            accountstatus: 'Deleted',
                            // Optional: You can scramble their email if you want to free it up
                            // email: `${user.accountid}@deleted.com` 
                        })
                        .eq('accountid', user.accountid);

                    if (error) {
                        Alert.alert("Error", error.message);
                    } else {
                        await createLog("ACCOUNT_DELETED", `Soft deleted user: ${user.username}`);
                        Alert.alert("Success", "User account marked as deleted.");
                        fetchUsers();
                    }
                    setLoading(false);
                } 
            }
        ]
    );
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        
        <View style={styles.header}>
            <BackButton router={router} />
            <Text style={styles.title}>Manage Users</Text>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchBarContainer}>
            <Icon name="search" size={20} color={theme.colors.textLight} />
            <TextInput
                placeholder="Search name or email..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor={'#999'}
            />
        </View>

        {/* TABS */}
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

        {/* USER LIST */}
        <FlatList 
          data={filteredUsers}
          keyExtractor={(item: any) => item.accountid?.toString()}
          contentContainerStyle={{ paddingBottom: 50 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
          renderItem={({ item }) => {
            const isBanned = item.accountstatus === 'Banned';
            const isDeleted = item.accountstatus === 'Deleted';

            return (
              <View style={[
                  styles.userCard, 
                  isBanned && styles.bannedCard,
                  isDeleted && styles.deletedCard // Make deleted users look grey
              ]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.userName, isDeleted && {textDecorationLine: 'line-through', color: '#999'}]}>
                        {item.username || "Unknown"}
                    </Text>
                    
                    {!isDeleted && (
                        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.roleBadge}>
                            <Text style={styles.roleText}>{item.role || "User"}</Text>
                            <Icon name="edit" size={12} color="white" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.userEmail}>{item.email}</Text>
                  
                  {/* Status Indicator */}
                  <Text style={[
                      styles.statusText, 
                      { color: isBanned ? '#FF3B30' : isDeleted ? '#999' : '#34C759' }
                  ]}>
                    ● {item.accountstatus || "Active"}
                  </Text>
                </View>

                {/* SIDE-BY-SIDE BUTTONS */}
                {!isDeleted && (
                    <View style={styles.buttonRow}>
                        <TouchableOpacity 
                            onPress={() => handleToggleStatus(item)}
                            style={[styles.btnAction, { borderColor: isBanned ? '#34C759' : '#FF3B30' }]}
                        >
                            <Text style={[styles.btnText, { color: isBanned ? '#34C759' : '#FF3B30' }]}>
                                {isBanned ? "Unban" : "Ban"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            onPress={() => handleDeleteAccount(item)}
                            style={[styles.btnAction, styles.btnDelete]}
                        >
                            <Text style={[styles.btnText, { color: '#FF3B30' }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
                
                {isDeleted && (
                    <Text style={{fontSize: 12, color: '#999', fontStyle: 'italic'}}>Deleted</Text>
                )}

              </View>
            );
          }}
        />

        {/* ROLE MODAL */}
        <Modal animationType="slide" transparent={true} visible={editModalVisible}>
            <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Edit Role</Text>
                    {ROLES.map(role => (
                        <TouchableOpacity key={role} style={[styles.roleOption, selectedUser?.role === role && styles.roleOptionSelected]} onPress={() => handleUpdateRole(role)}>
                            <Text style={[styles.roleOptionText, selectedUser?.role === role && { color: theme.colors.primary, fontWeight: 'bold' }]}>{role}</Text>
                            {selectedUser?.role === role && <Icon name="arrowLeft" size={20} color={theme.colors.primary} />}
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
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F3F3', paddingHorizontal: 15, borderRadius: 12, height: 50, marginBottom: 15, borderWidth: 1, borderColor: '#E8E8E8' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: theme.colors.text },
  tabContainer: { height: 50, marginBottom: 10 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 10, height: 35, justifyContent: 'center' },
  activeTab: { backgroundColor: theme.colors.primary },
  tabText: { color: '#666', fontWeight: '600' },
  activeTabText: { color: 'white' },
  
  userCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  bannedCard: { backgroundColor: '#FFF5F5', borderColor: '#FFD6D6' },
  deletedCard: { backgroundColor: '#F0F0F0', borderColor: '#E0E0E0' }, // Grey style for deleted users

  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  userName: { fontSize: hp(2), fontWeight: '600', color: theme.colors.text, marginRight: 8 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  userEmail: { fontSize: hp(1.6), color: '#888', marginBottom: 5 },
  statusText: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  
  buttonRow: { flexDirection: 'row', gap: 8 },
  btnAction: { 
    paddingVertical: 6, 
    paddingHorizontal: 10, 
    borderRadius: 8, 
    borderWidth: 1, 
    minWidth: 60, 
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnDelete: { borderColor: '#FF3B30', backgroundColor: '#FFF0F0' },
  btnText: { fontWeight: 'bold', fontSize: 11 },

  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  roleOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  roleOptionSelected: { backgroundColor: '#F5F9FF', marginHorizontal: -10, paddingHorizontal: 10, borderRadius: 8, borderBottomWidth: 0 },
  roleOptionText: { fontSize: 16, color: '#333' },
  cancelButton: { marginTop: 20, alignItems: 'center', padding: 15 },
  cancelText: { color: '#FF3B30', fontWeight: '600', fontSize: 16 }
});