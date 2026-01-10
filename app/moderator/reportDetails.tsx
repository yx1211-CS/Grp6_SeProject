import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { supabase } from '../../lib/supabase';

export default function ReportDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { postId, content, accusedName, isHidden, reportCount } = params;
  
  const isPostHidden = isHidden === 'true';

  const [loading, setLoading] = useState(false);
  const [reportList, setReportList] = useState([]); 
  const [fetchingList, setFetchingList] = useState(true);

  // 1. Fetch Report List
  useEffect(() => {
    const fetchReportDetails = async () => {
      const { data, error } = await supabase
        .from('reported_content')
        .select(`
            *,
            reporter:reporterid (
                username,
                email
            )
        `)
        .eq('postid', postId)
        .eq('reportstatus', 'Pending') 
        .order('reporttime', { ascending: false });

      if (error) {
        console.log("Error fetching details:", error);
      } else {
        setReportList(data || []);
      }
      setFetchingList(false);
    };

    fetchReportDetails();
  }, [postId]);

  // 2. Logic: HIDE Post (Moderator Action)
  const handleHideContent = async () => {
    Alert.alert("Confirm Hide", "Are you sure you want to hide this post? It will no longer be visible to users, but remains in the database for Admins.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Hide Post", 
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          
          // A. Update reports to 'Resolved_Hidden'
          const { error: reportError } = await supabase
            .from('reported_content')
            .update({ reportstatus: 'Resolved_Hidden' }) 
            .eq('postid', postId) 
            .eq('reportstatus', 'Pending');

          // B. Soft Delete (Hide) the post
          const { error: postError } = await supabase
            .from('post')
            .update({ ishidden: true }) 
            .eq('postid', postId);
          
          setLoading(false);

          if (!reportError && !postError) {
            Alert.alert("Success", "Post hidden successfully.");
            router.back(); 
          } else {
            Alert.alert("Error", "Operation failed");
          }
        }
      }
    ]);
  };

  // 3. Logic: Ignore Reports
  const handleIgnore = async () => {
    setLoading(true);
    
    const { error } = await supabase
        .from('reported_content')
        .update({ reportstatus: 'Resolved_Ignored' })
        .eq('postid', postId)
        .eq('reportstatus', 'Pending');
    
    setLoading(false);

    if (!error) {
       router.back();
    } else {
        Alert.alert("Error", error.message);
    }
  };

  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Details</Text>
        <View style={{width: 40}} /> 
      </View>

      <ScrollView contentContainerStyle={{padding: wp(4), paddingBottom: 100}}>
        
        {/* Banner */}
        {isPostHidden && (
            <View style={styles.warningBanner}>
                <Text style={styles.warningText}>🚫 Post is Hidden (Review by Admin pending)</Text>
            </View>
        )}

        {/* Overview */}
        <Text style={styles.sectionTitle}>📋 Overview</Text>
        <View style={styles.infoBox}>
            <View style={styles.row}>
                <Text style={styles.label}>Post Author:</Text>
                <Text style={[styles.value, {color: theme.colors.primary}]}>@{accusedName}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
                <Text style={styles.label}>Total Reports:</Text>
                <Text style={[styles.value, { color: 'red' }]}>{reportList.length}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
                <Text style={styles.label}>Status:</Text>
                <Text style={[styles.value, { color: isPostHidden ? 'red' : 'green' }]}>
                    {isPostHidden ? "Hidden" : "Visible"}
                </Text>
            </View>
        </View>

        {/* Report History Table */}
        <Text style={styles.sectionTitle}>📝 Report History</Text>
        <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
                <Text style={[styles.th, {flex: 1.2}]}>Reporter</Text>
                <Text style={[styles.th, {flex: 1.5}]}>Reason</Text>
                <Text style={[styles.th, {flex: 1, textAlign:'right'}]}>Date</Text>
            </View>

            {fetchingList ? (
                <ActivityIndicator size="small" color={theme.colors.primary} style={{margin: 20}} />
            ) : (
                reportList.map((item, index) => (
                    <View key={index} style={[styles.tableRow, index === reportList.length - 1 && {borderBottomWidth: 0}]}>
                        <Text style={[styles.td, {flex: 1.2, fontWeight: '600'}]}>
                            @{item.reporter?.username || "Unknown"}
                        </Text>
                        <Text style={[styles.td, {flex: 1.5, color: '#E65100'}]}>
                            {item.reportreason}
                        </Text>
                        <Text style={[styles.td, {flex: 1, textAlign:'right', color:'gray', fontSize: 11}]}>
                            {new Date(item.reporttime).toLocaleDateString()}
                        </Text>
                    </View>
                ))
            )}
        </View>

        {/* Content */}
        <Text style={styles.sectionTitle}>📄 Post Content</Text>
        <View style={styles.contentBox}>
            <View style={styles.contentInner}>
                {content ? (
                    <Text style={styles.contentText}>"{content}"</Text>
                ) : (
                    <View style={styles.notFoundContainer}>
                        <Text style={styles.notFoundText}>⚠️ Content not found</Text>
                        <Text style={styles.notFoundSubText}>(The post might be deleted or hidden)</Text>
                    </View>
                )}
            </View>
        </View>

      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
            style={[styles.btn, styles.btnIgnore]} 
            onPress={handleIgnore}
            disabled={loading}
        >
            <Text style={styles.btnTextIgnore}>Ignore All</Text>
        </TouchableOpacity>

        {/* Button Style Renamed to btnHide */}
        <TouchableOpacity 
            style={[styles.btn, styles.btnHide]} 
            onPress={handleHideContent}
            disabled={loading}
        >
            <Text style={styles.btnTextHide}>{isPostHidden ? "Already Hidden" : "Hide Post"}</Text>
        </TouchableOpacity>
      </View>

    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: wp(4), marginBottom: 20 },
  headerTitle: { fontSize: hp(2.5), fontWeight: theme.fonts.bold, color: theme.colors.text },
  backButton: { padding: 5 },
  backText: { fontSize: hp(2), color: theme.colors.primary },
  
  warningBanner: { backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#FFB74D' },
  warningText: { color: '#E65100', fontWeight: 'bold' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text, marginBottom: 10, marginTop: 10 },
  
  infoBox: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  label: { fontSize: 14, color: 'gray' },
  value: { fontSize: 14, color: theme.colors.text, fontWeight: '600' },

  tableContainer: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#eee', overflow: 'hidden', marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F5F5F5', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  th: { fontSize: 13, fontWeight: 'bold', color: '#555' },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
  td: { fontSize: 13, color: '#333' },

  contentBox: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#ddd', overflow: 'hidden' },
  contentInner: { padding: 15, minHeight: 100 },
  contentText: { fontSize: 16, color: '#333', lineHeight: 24, fontStyle: 'italic' },
  
  notFoundContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 10 },
  notFoundText: { fontSize: 16, color: 'red', fontWeight: 'bold' },
  notFoundSubText: { fontSize: 12, color: 'gray' },

  footer: { position: 'absolute', bottom: 30, left: 0, right: 0, flexDirection: 'row', paddingHorizontal: wp(4), gap: 15 },
  btn: { flex: 1, paddingVertical: 15, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  btnIgnore: { backgroundColor: '#f0f0f0' },
  
  // Renamed styles to match "Hide" logic
  btnHide: { backgroundColor: '#ff4d4d' }, // Still red, as it's a restrictive action
  
  btnTextIgnore: { color: '#555', fontWeight: 'bold', fontSize: 16 },
  btnTextHide: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});