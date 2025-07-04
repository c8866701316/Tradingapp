import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, ActivityIndicator, Alert, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import moment from 'moment';
import { api, getUserDetails } from '../Apicall/Axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSound } from '../contexts/SoundContext';

const MarketScriptScreen = ({ route, navigation }) => {
    const BASE_URL = "https://tradep.clustersofttech.com/api";
    const { playNotificationSound, isSoundEnabled } = useSound();
    const { title, scripts, option1 } = route.params;
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [expiryDate, setExpiryDate] = useState('');
    const [addedScripts, setAddedScripts] = useState([]);
    const [filteredScripts, setFilteredScripts] = useState(scripts);

    // Notification state
    const [notification, setNotification] = useState({
        message: '',
        type: '', // 'success' or 'error'
        visible: false,
    });
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Show notification function
    const showNotification = (message, type) => {
        setNotification({
            message,
            type,
            visible: true,
        });

        // Play notification sound if enabled
        if (isSoundEnabled) {
            playNotificationSound();
        }
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Auto hide after 3 seconds
        setTimeout(() => {
            hideNotification();
        }, 3000);
    };

    // Hide notification function
    const hideNotification = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setNotification(prev => ({ ...prev, visible: false }));
        });
    };

    useEffect(() => {
        const results = scripts.filter(item =>
            item.text.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredScripts(results);
    }, [search, scripts]);

    useEffect(() => {
        const fetchDropdownData = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/Master/FillDropdown', {
                    params: {
                        key: 'EE419087-6BF9-4975-B98B-0511381D9601',
                        option1: title
                    }
                });
                console.log('Select market Data:', response.data);
                if (response.data?.status && response.data.data?.length > 0) {
                    const rawDate = response.data.data[0].text; // e.g. "24-04-2025"
                    const formattedDate = moment(rawDate, "DD-MM-YYYY").format("YYYY-MM-DD");
                    setExpiryDate(formattedDate);
                }
            } catch (error) {
                console.error('Error Select market data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDropdownData();
    }, [title]);

    const handleAddScript = async (item) => {
        const payload = {
            expiryDate: '',
            isRemove: false,
            scriptName: item.text,
            watchlistId: option1,
        };
        console.log("payload market:", payload);
        try {
            const userDetails = await getUserDetails();
            if (!userDetails?.accessToken) {
                throw new Error('Access token is missing.');
            }
            const response = await fetch(`${BASE_URL}/StockApi/AddRemoveScriptToWatchlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userDetails.accessToken}`,
                },
                body: JSON.stringify(payload),
            });
            const json = await response.json();
            console.log("json", json);

            if (json?.status) {
                // Show success notification
                showNotification(json.message || "Script added successfully", "success");
                // Remove the added item from the filteredScripts
                setFilteredScripts(prev =>
                    prev.filter(script => script.id !== item.id)
                );
            } else {
                showNotification(json.message || "Failed to add script", "error");
            }

        } catch (error) {
            console.error("Error adding script:", error);
            showNotification("Failed to add script. Please try again.", "error");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.navigate('Selectmarket')}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </Pressable>
                <Text style={styles.headerText}>{title} - Select Script</Text>
            </View>

            <TextInput
                placeholder="Search Script"
                placeholderTextColor="#999"
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
            />

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#03415A" />
                </View>
            ) : (
                <FlatList
                    data={filteredScripts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View>
                                <Text style={styles.scriptText}>{item.text}</Text>
                                <Text style={styles.expiryText}>Expiry: {expiryDate || 'Loading...'}</Text>
                            </View>
                            <Pressable
                                style={styles.plusbtn}
                                onPress={() => handleAddScript(item)}
                                disabled={addedScripts.includes(item.text)}
                            >
                                <Entypo
                                    name="circle-with-plus"
                                    size={22}
                                    color={addedScripts.includes(item.text) ? "gray" : "green"}
                                />
                            </Pressable>

                        </View>
                    )}
                />
            )}

            {/* Notification */}
            {notification.visible && (
                <Animated.View
                    style={[
                        styles.notification,
                        {
                            backgroundColor: notification.type === 'success' ? '#4CAF50' : '#F44336',
                            opacity: fadeAnim,
                            transform: [{
                                translateY: fadeAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-20, 0],
                                }),
                            }],
                        },
                    ]}
                >
                    <Text style={styles.notificationText}>
                        {notification.type === 'success' ? '✅ ' : '❌ '}
                        {notification.message}
                    </Text>
                </Animated.View>
            )}

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        backgroundColor: "#03415A",
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
    },
    headerText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
        marginLeft: 10,
    },
    searchInput: {
        backgroundColor: "#fff",
        margin: 10,
        borderRadius: 8,
        paddingHorizontal: 15,
        height: 40,
        fontSize: 14,
    },
    card: {
        backgroundColor: "#fff",
        marginHorizontal: 10,
        marginVertical: 5,
        padding: 15,
        borderRadius: 8,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    scriptText: {
        fontWeight: "bold",
        color: "#03415A",
        fontSize: 14,
    },
    expiryText: {
        marginTop: 2,
        color: "#555",
        fontSize: 12,
    },
    plusbtn: {
        padding: 10
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notification: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        padding: 10,
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    notificationText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    }
});

export default MarketScriptScreen;
