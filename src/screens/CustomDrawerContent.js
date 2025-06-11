import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Modal,
} from 'react-native';
import {
    DrawerContentScrollView,
    DrawerItemList,
} from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserDetails } from '../Apicall/Axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChangePassword from './Drawerscreens/ChangePassword';

const CustomDrawerContent = (props) => {
    const [role, setRole] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [name, setName] = useState('');
    const [accountcode, setAccountCode] = useState('');

    useEffect(() => {
        const fetchRole = async () => {
            const userDetails = await getUserDetails();
            console.log("userDetails", userDetails);

            const userRole = userDetails?.userDetails?.role || null;
            const userName = userDetails?.userDetails?.name || 'User';
            const accountID = userDetails?.userDetails?.accountCode || 'User ID';

            setRole(userRole);
            setName(userName);
            setAccountCode(accountID);
            console.log("Role:", userRole);
        };
        fetchRole();
    }, []);

    // Filter drawer items based on role
    const filteredDrawerItems = props.state.routes.filter(route => {
        // Always show these screens
        if (route.name === "Change Password" || route.name === "Delete Account") {
            return true;
        }
        // Show "Add User" only if role is "Master"
        if (route.name === "Summary Report") {
            return role === "Master";
        }
        // Show other screens by default
        return true;
    });

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem("UserDetails");
            console.log("User details removed successfully.");

            props.navigation.navigate("Login");  // ✅ This ensures "Login" is loadeds

        } catch (error) {
            console.error("Error removing user details from AsyncStorage:", error);
        }
    };

    // Custom drawer item renderer
    const CustomDrawerItem = ({ label, icon, onPress }) => (
        <TouchableOpacity style={styles.customDrawerItem} onPress={onPress}>
            <View style={styles.drawerItemIcon}>{icon}</View>
            <Text style={styles.drawerItemLabel}>{label}</Text>
        </TouchableOpacity>
    );
    // Filter drawer items based on role without modifying state.routes
    // Filter drawer items based on role without modifying state.routes
    const renderDrawerItems = () => {
        // Only include "Summary Report" if role is "Master"
        const filteredRoutes = props.state.routes.filter((route) =>
            route.name === 'Summary Report' ? role === 'Master' : true
        );
        console.log("filterroute",filteredRoutes);
        
        return (
            <DrawerItemList
                {...props}
                state={{ ...props.state, routes: filteredRoutes }}
            />
        );
    };
    return (
        <SafeAreaView style={styles.container}>
            {/* App Logo */}
            <View style={styles.logoContainer}>
                <Image
                    source={require('../images/loginlogo.png')} // Replace with your logo path (bull and BUILDCON)
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            {/* User Info */}
            <View style={styles.profileContainer}>
                <View style={styles.avatar}>
                    <FontAwesome name="user-circle" size={40} color="black" />
                </View>
                <Text style={styles.username}>{name}</Text>
                <Text style={styles.userId}>{accountcode}</Text>
            </View>

            {/* Action Buttons (Switch, Add, Logout) */}
            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn}>
                    <View style={{ backgroundColor: '#03415A', padding: 3, borderRadius: 12 }}>
                        <Ionicons name="refresh-sharp" size={18} color="#fff" />
                    </View>
                    <Text style={styles.actionText}>Switch User</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                    <View style={{ backgroundColor: '#03415A', padding: 3, borderRadius: 12 }}>
                        <Ionicons name="add" size={18} color="#fff" />
                    </View>
                    <Text style={styles.actionText}>Add User</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleLogout}>
                    <View style={{ backgroundColor: 'red', padding: 3, borderRadius: 12 }}>
                        <MaterialIcons name="logout" size={16} color="#fff" />
                    </View>
                    <Text style={[styles.actionText]}>Log out</Text>
                </TouchableOpacity>
            </View>
            <DrawerContentScrollView {...props} style={styles.menuScroll} contentContainerStyle={{ paddingTop: 10 }}>
                {/* Menu Items */}
                {/* Add custom Change Password item */}
                <CustomDrawerItem
                    label="Change Password"
                    icon={
                        <View style={{ backgroundColor: '#BECDD3', padding: 8, borderRadius: 20, marginVertical: 10 }}>
                            <Ionicons name="eye-outline" size={16} color="#03415A" />
                        </View>
                    }
                    onPress={() => setShowPasswordModal(true)}
                />
                {/* Other drawer items */}
                {/* Filtered Drawer Items */}
                {renderDrawerItems()}
            </DrawerContentScrollView>

            {/* Change Password Modal */}
            <ChangePassword
                visible={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    logoContainer: {
        // backgroundColor: '#03415A',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        height: 90,
    },
    logo: {
        width: 120,
        height: 60,
    },
    profileContainer: {
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        // marginBottom: 8,
    },
    username: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#03415A',
    },
    userId: {
        fontSize: 14,
        color: '#777',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        // paddingVertical: 20,
    },
    actionBtn: {
        alignItems: 'center',
    },
    actionText: {
        fontSize: 10,
        marginTop: 2,
        color: '#03415A',
    },
    menuSection: {
        flex: 1,
        marginTop: 10,
    },
    menuScroll: {
        flex: 1,
        marginTop: 10,
    },
    customDrawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginVertical: 4,
        marginHorizontal: 8,
        borderRadius: 5,
    },
    drawerItemIcon: {
        marginRight: 10,
    },
    drawerItemLabel: {
        color: '#03415A',
        fontSize: 13,
        fontWeight: '500',
    },
});

export default CustomDrawerContent;