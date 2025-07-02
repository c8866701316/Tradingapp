import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/Ionicons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { UserContext } from './UserContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../Apicall/Axios';


const BASE_URL = "https://tradep.clustersofttech.com/api";
const Selectmarketscreen = ({ navigation, route }) => {

    const meData = React.useContext(UserContext);
    console.log("meData from context:", meData);
    const [loading, setLoading] = useState(true);

    const segments = meData?.watchList || {};
    console.log("segmnet", segments);
    const segmentList = Object.keys(segments).map(key => {
        const [id, exchange] = key.split(':');
        return {
            id,
            text: exchange,
        };
    });
    console.log("segmentList", segmentList);

    // useEffect(() => {
    //     setLoading(false);
    //     setTimeout(() => {
    //         segments();
    //     }, 1000)
    //     // Once segments are processed, stop loading
    // }, []);

    useEffect(() => {
        console.log("meData in useEffect:", meData);
        console.log("watchList in useEffect:", meData?.watchList);
        setLoading(false);
    }, [meData]);

    const handleMarketSelect = async (item) => {
        // Split the ID to get components
        const parts = item.id.split(':');
        const option1 = parts[0]; // First part is always the ID
        const displayName = item.text; // Use exchange name or fallback to item.text
        console.log("Selected market:", displayName);
        const payload = {
            key: "BD564038-75E1-4967-B3C5-D28C659CB902",
            option1: option1,
            option3: "Group"
        };
        console.log("payload option:", payload);
        try {
            const response = await api.get('/Master/FillDropdown', {
                params: payload
            });
            const json = response.data;
            if (json?.status && Array.isArray(json.data)) {
                navigation.navigate("Marketscript", {
                    title: displayName, // This will be shown in the MarketScript screen
                    scripts: json.data,
                    option1: option1,
                });
            }
        } catch (error) {
            console.error("API Error:", error);
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <View style={{ backgroundColor: '#03415A', height: 50, flexDirection: "row" }}>
                <Pressable onPress={() => navigation.goBack()} style={{ left: 15, alignSelf: "center",padding:8 }}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </Pressable>
                <Text style={styles.header}>Select Market</Text>
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#03415A" />
                </View>
            ) : segmentList.length === 0 ? (
                <View style={styles.loader}>
                    <Text style={{ color: '#03415A', textAlign: 'center', fontSize: 16 }}>No markets found.</Text>
                </View>
            ) : (
                <ScrollView>
                    {segmentList.map((item, index) => (
                        <Pressable key={item.id || index} onPress={() => handleMarketSelect(item)}>
                            <View style={styles.card}>
                                <Text style={styles.date}>{item.text}</Text>
                                <MaterialIcons name="arrow-forward" size={24} color="#03415A" />
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>

            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#f4f4f4',
        // padding: 16,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        padding: 10,
        paddingHorizontal: 25,
        // textAlign:'center'
        // marginBottom: 10,
        // backgroundColor:'#03415A',
    },
    loader: {

        flex: 1,
        justifyContent: 'center'
    },

    card: {
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderRadius: 10,
        marginVertical: 10,
        marginHorizontal: 10,
        // elevation: 2,
    },
    date: {
        fontSize: 14,
        color: '#03415A',
    },
    info: {
        fontSize: 14,
        color: '#03415A',
        fontWeight: 'bold',
    },
    amountNegative: {
        fontSize: 14,
        color: 'red',
        fontWeight: 'bold',
    },
    amountPositive: {
        fontSize: 14,
        color: 'green',
        fontWeight: 'bold',
    },
});

export default Selectmarketscreen;