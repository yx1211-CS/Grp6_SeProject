import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ScreenWrapper from '../../components/ScreenWrapper';
import BackButton from '../../components/BackButton';
import { wp, hp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Icon from '../../assets/icons';

export default function Reports() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    
    // Fetch reports, join 'account' (reporter) and 'post' (the content)
    const { data, error } = await supabase
      .from('reported_content')
      .select(`
        *,
        reporter:reporterid ( username, email ),
        post:postid ( * )
      `)
      .eq('reportstatus', 'Pending') // Only show pending reports
      .order('reporttime', { ascending: false });

    if (error) {
      console.log("Error fetching reports:", error);
      Alert.alert("Error", "Could not fetch reports.");
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  // ACTION 1: Dismiss Report (Keep the post, ignore report)
  const handleDismiss = async (reportId: string) => {
    const { error } = await supabase
      .from('reported_content')
      .update({ reportstatus: 'Dismissed' })
      .eq('reportedcontentid', reportId);

    if (error) Alert.alert("Error", error.message);
    else fetchReports();
  };

  // ACTION 2: Delete Post (The nuclear option)
  const handleDeletePost = (reportId: string, postId: string) => {
    Alert.alert("Delete Post", "This will permanently remove the content.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          // 1. Delete the post
          const { error: deleteError } = await supabase
            .from('post')
            .delete()
            .eq('postid', postId); 

          if (deleteError) {
            Alert.alert("Error", deleteError.message);
            return;
          }

          // 2. Mark report as Resolved
          await supabase
            .from('reported_content')
            .update({ reportstatus: 'Resolved' })
            .eq('reportedcontentid', reportId);

          fetchReports();
      }}
    ]);
  };

  // ACTION 3: Ban Author (Ban the person who WROTE the post)
  const handleBanUser = (reportId: string, authorId: string) => {
    if (!authorId) {
        Alert.alert("Error", "Could not find the post author's ID.");
        return;
    }

    Alert.alert("Ban User", "This will permanently ban the author of this post.", [
      { text: "Cancel", style: "cancel" },
      { text: "Ban Author", style: "destructive", onPress: async () => {
          // 1. Ban the user in 'account' table
          const { error: banError } = await supabase
            .from('account')
            .update({ accountstatus: 'Banned' })
            .eq('accountid', authorId);

          if (banError) {
            Alert.alert("Error", banError.message);
            return;
          }

          // 2. Mark report as Resolved
          await supabase
            .from('reported_content')
            .update({ reportstatus: 'Resolved' })
            .eq('reportedcontentid', reportId);

          Alert.alert("Success", "User has been banned.");
          fetchReports();
      }}
    ]);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString();
  };

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <View style={styles.header}>
            <BackButton router={router} />
            <Text style={styles.title}>Reported Content</Text>
        </View>

        {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
        ) : (
            <FlatList 
            data={reports}
            keyExtractor={item => item.reportedcontentid.toString()}
            ListEmptyComponent={<Text style={styles.emptyText}>No pending reports! Good job.</Text>}
            contentContainerStyle={{ paddingBottom: 50 }}
            renderItem={({ item }) => {
                const post = item.post;
                const reporter = item.reporter;
                
                // ——— UPDATED COLUMN NAMES HERE ———
                const postContent = post?.postcontent || "No content available";
                const authorId = post?.userid; 
                // ————————————————————————————————

                return (
                <View style={styles.card}>
                    {/* Header: Who reported it */}
                    <View style={styles.cardHeader}>
                        <View style={styles.reporterInfo}>
                            <Icon name="user" size={16} color="#666" />
                            <Text style={styles.reporterText}>
                                Reported by <Text style={{fontWeight:'bold'}}>{reporter?.username || "Unknown"}</Text>
                            </Text>
                        </View>
                        <Text style={styles.dateText}>{formatDate(item.reporttime)}</Text>
                    </View>

                    {/* Reason */}
                    <View style={styles.reasonBadge}>
                        <Text style={styles.reasonText}>Reason: {item.reportreason}</Text>
                    </View>
                    
                    {/* The Post Content */}
                    <View style={styles.contentBox}>
                        <Text style={styles.contentLabel}>Post Content:</Text>
                        {post ? (
                            <Text style={styles.contentText}>"{postContent}"</Text>
                        ) : (
                            <Text style={[styles.contentText, { color: 'red', fontStyle: 'italic' }]}>
                                (Post has already been deleted)
                            </Text>
                        )}
                    </View>

                    {/* Actions */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity 
                            style={styles.btnDismiss} 
                            onPress={() => handleDismiss(item.reportedcontentid)}
                        >
                            <Text style={styles.btnTextDismiss}>Dismiss</Text>
                        </TouchableOpacity>

                        {post && (
                            <>
                                <TouchableOpacity 
                                    style={styles.btnDelete}
                                    onPress={() => handleDeletePost(item.reportedcontentid, item.postid)}
                                >
                                    <Text style={styles.btnTextWhite}>Remove Post</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.btnBan}
                                    onPress={() => handleBanUser(item.reportedcontentid, authorId)}
                                >
                                    <Text style={styles.btnTextWhite}>Ban Author</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
                );
            }}
            />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: wp(5) },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  title: { fontSize: hp(2.5), fontWeight: 'bold', color: theme.colors.text },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  
  card: { 
    backgroundColor: '#fff', 
    borderWidth: 1, borderColor: '#eee', borderRadius: 16, 
    padding: 15, marginBottom: 20, 
    shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  reporterInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reporterText: { fontSize: 12, color: '#555' },
  dateText: { fontSize: 10, color: '#999' },

  reasonBadge: { 
    alignSelf: 'flex-start', backgroundColor: '#FFF0F0', 
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 12
  },
  reasonText: { color: '#FF3B30', fontSize: 12, fontWeight: 'bold' },

  contentBox: { backgroundColor: '#F9F9F9', padding: 12, borderRadius: 8, marginBottom: 15 },
  contentLabel: { fontSize: 10, color: '#999', marginBottom: 4, textTransform: 'uppercase' },
  contentText: { fontSize: 14, color: '#333', fontStyle: 'italic', lineHeight: 20 },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  btnDismiss: { paddingVertical: 8, paddingHorizontal: 12 },
  btnTextDismiss: { color: '#888', fontWeight: '600', fontSize: 12 },
  
  btnDelete: { backgroundColor: '#FF9500', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnBan: { backgroundColor: '#FF3B30', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnTextWhite: { color: 'white', fontWeight: 'bold', fontSize: 12 },
});