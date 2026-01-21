import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import Header from '../../components/Header';
import ScreenWrapper from '../../components/ScreenWrapper';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../helpers/common';
import { supabase } from '../../lib/supabase';






const Profile = () => {
    const {user, setAuth} = useAuth();
    console.log('当前 User 数据:', user);
    const router = useRouter();
    const onLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if(error){
            Alert.alert('Sign out', "Error signing out!")
        }
    }

  const handleLogout = async () => {
    Alert.alert('Confirm',"Are you sure you want to log out?",
      [
        {
          text: 'Cancel',
          onPress: () => console.log("Cancel Pressed"),
          style: 'cancel'
        },
        { 
          text: 'Logout', 
          onPress: ()=> onLogout(),
          style: 'destructive' 
        }
      ])
  }

  return(
    <ScreenWrapper bg="white">
      <UserHeader user={user} router={router} handleLogout={handleLogout} />
    </ScreenWrapper>
  )
}

const UserHeader = ({user, router, handleLogout})  => {

  return (
      <View style={{flex: 1, backgroundColor: 'white', paddingHorizontal: wp(4)}}>
        
        <Header title="Profile" showBackButton={true} marginBottom={30} />
        
        {/* 登出按钮 (绝对定位在右上角) */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" color={theme.colors.rose} />
        </TouchableOpacity>

        {/* 用户信息区域 */}
        <View style={styles.container}>
            <View style={{ gap: 15 }}>
                {/* 头像与编辑按钮 */}
                <View style={styles.avatarContainer}>
                    <Avatar 
                        uri={user?.profileImage || user?.profileimage} 
                        size={hp(12)} 
                        rounded={theme.radius.xxl * 1.4} 
                    />
                    <Pressable style={styles.editIcon} onPress={() => router.push('editProfile')}>
                        <Icon name="edit" strokeWidth={2.5} size={20} />
                    </Pressable>
                </View>

                {/* username and address */}
                <View style={{ alignItems: 'center', gap: 4 }}>
                    <Text style={styles.userName}>{user && user.username}</Text>
                    <Text style={styles.infoText}>{user && user.address || "New York, NYC"}</Text>
                </View>

                {/* email、phone、Bio */}
                <View style={{ gap: 10 }}>
                    {/* email*/}
                    <View style={styles.info}>
                        <Icon name="mail" size={20} color={theme.colors.textLight} />
                        <Text style={styles.infoText}>
                          {user && user.email}
                        </Text>
                    </View>

                    {/* phone(if have) */}
                    { 
                      (user?.phoneNumber || user?.phonenumber) && (
                        <View style={styles.info}>
                            <Icon name="call" size={20} color={theme.colors.textLight} />
                            <Text style={styles.infoText}>
                              {user?.phoneNumber || user?.phonenumber}
                            </Text>
                        </View>
                      )
                    }

                    {/* Bio (如果有才显示) */}
                    { user && user.bio && (
                         <Text style={styles.infoText}>{user.bio}</Text>
                    )}
                </View>

            </View>
        </View>

      </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginHorizontal: wp(4),
    marginBottom: 20
  },
  logoutButton: {
    position: 'absolute',
    right: 0,
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: '#fee2e2' // 示例背景色，视频中可能直接用的透明
  },
  avatarContainer: {
    height: hp(12),
    width: hp(12),
    alignSelf: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: -12,
    padding: 7,
    borderRadius: 50,
    backgroundColor: 'white',
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7
  },
  userName: {
    fontSize: hp(3),
    fontWeight: '500',
    color: theme.colors.textDark
  },
  infoText: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: theme.colors.textLight
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  }
});

export default Profile;