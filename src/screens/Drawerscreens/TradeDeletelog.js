import React, { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { getUserDetails } from '../../Apicall/Axios';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

function TradeDeletelog({ filters }) {

    const navigation = useNavigation();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filteredLogs, setFilteredLogs] = useState([]);

    // Prepare date range for API call if filters are applied
    let fromDate = new Date().toISOString();
    let toDate = new Date().toISOString();

    if (filters.fromDate && filters.toDate) {
        fromDate = moment(filters.fromDate, 'DD-MM-YYYY').format('YYYY-MM-DD');
        toDate = moment(filters.toDate, 'DD-MM-YYYY').format('YYYY-MM-DD');
    }


    const fetchTradeLogs = async (filterParams = {}) => {
        setLoading(true);
        const currentDate = new Date().toISOString();

        const payload = {
            SMasterId: null,
            clientId: null,
            fromDate: fromDate,
            masterId: null,
            segment: filters.market || "",
            subBrokerId: null,
            symbol: "",
            toDate: toDate
        };

        try {
            const userDetails = await getUserDetails();
            if (!userDetails?.accessToken) throw new Error('Access token is missing.');
            const response = await fetch('https://tradep.clustersofttech.com/api/OrderApi/GetTradeLogs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userDetails.accessToken}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json(); // ✅ FIXED HERE
            console.log('Trade Logs:', result);

            if (result.status && result.data) {
                setLogs(result.data);
                setFilteredLogs(result.data);
            } else {
                console.warn('Trade logs not found or error in response');
                setLogs([]);
                setFilteredLogs([]);
            }
        } catch (error) {
            console.error('Error fetching trade logs:', error);
        }
        finally {
            setLoading(false); // Stop loading
        }
    };


    // Apply filters when they change
    useEffect(() => {
        fetchTradeLogs();
    }, [filters]);

    // Local filtering (if you want to do client-side filtering instead of API filtering)
    const applyLocalFilters = () => {
        let result = [...logs];

        // Filter by market
        if (filters.market) {
            result = result.filter(log =>
                log.symbolName.includes(filters.market)
            );
        }

        // Filter by date range
        if (filters.fromDate && filters.toDate) {
            const from = moment(filters.fromDate, 'DD-MM-YYYY');
            const to = moment(filters.toDate, 'DD-MM-YYYY');

            result = result.filter(log => {
                const logDate = moment(log.orderDate.split('T')[0], 'YYYY-MM-DD');
                return logDate.isBetween(from, to, null, '[]'); // inclusive
            });
        }

        setFilteredLogs(result);
    };

    return (
        <>
            <SafeAreaView style={styles.container}>
                <View style={{ backgroundColor: '#03415A' }}>

                    {/* Trades Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </TouchableOpacity>

                        <Text style={styles.headerText}>Trade Edit / Delete Logs</Text>
                        <TouchableOpacity style={styles.settingsIcon} onPress={() => navigation.openDrawer()}>
                            <Text style={styles.settingsText}>⚙</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* List */}
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#03415B" />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={{ padding: 10 }}>
                        {filteredLogs.length === 0 ? (
                            <View style={{ alignItems: 'center', marginTop: 50 }}>
                                <Text style={{ fontSize: 16, color: '#888' }}>No data found</Text>
                            </View>
                        ) : (
                            filteredLogs.map((item, index) => (
                                <View key={item.orderId + index} style={styles.logItem}>
                                    <View style={styles.leftColumn}>
                                        <Text style={{ fontSize: 12, color: item.act === 'DEL' ? 'red' : item.act === 'UPD' ? 'blue' : '#555', fontWeight: 'bold' }}>{item.act}</Text>
                                        <Text style={styles.label}>LOT: <Text style={{ color: '#03415B', fontSize: 15 }}>{item.lotQty}</Text></Text>
                                        <Text style={styles.label}>QTY: <Text style={{ color: '#03415B', fontSize: 15 }}>{item.qty}</Text></Text>
                                    </View>
                                    <View style={styles.centerColumn}>
                                        <Text style={styles.symbol}>{item.symbolName}</Text>
                                        <View style={[
                                            styles.sideBadge,
                                            item.orderSideName === 'Buy' ? styles.buyBadge : styles.sellBadge
                                        ]}>
                                            <Text style={styles.sideText}>{item.orderSideName}</Text>
                                        </View>
                                        <Text style={styles.date}>{item.orderDate}</Text>
                                    </View>
                                    <View style={styles.rightColumn}>
                                        <Text style={styles.rateLabel}>Rate</Text>
                                        <Text style={styles.rateValue}>{item.orderPrice}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                )}

            </SafeAreaView>


        </>
    )
}

export default TradeDeletelog
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    forexModeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        height: 40,
        paddingHorizontal: 10,
    },
    forexModeText: {
        fontSize: 11,
        color: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        // justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#03415A',
        paddingHorizontal: 10,
        height: 50,
    },
    backButton: {
        padding: 5,

    },
    backIcon: {
        color: '#ffffff',
        fontSize: 24,
        marginRight: 10,
    },

    headerText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    settingsIcon: {
        padding: 5,
        flex: 1,
        alignItems: 'flex-end'
    },
    settingsText: {
        color: '#ffffff',
        fontSize: 18,
    },
    logItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f6f9fc',
        borderRadius: 10,
        padding: 15,
        marginVertical: 5,
        // marginHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    leftColumn: {
        flex: 1,
        alignItems: 'flex-start',
    },
    centerColumn: {
        flex: 2,
        alignItems: 'center',
    },
    rightColumn: {
        flex: 1,
        alignItems: 'flex-end',
    },
    label: {
        fontSize: 10,
        color: '#555',
    },
    symbol: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#03415B',
    },
    sideBadge: {
        paddingHorizontal: 20,
        paddingVertical: 4,
        borderRadius: 8,
        marginVertical: 4,
        alignSelf: 'center',
    },
    buyBadge: {
        backgroundColor: '#007AFF', // Blue for Buy
    },
    sellBadge: {
        backgroundColor: '#FF2D55', // Red for Sell
    },
    sideText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },

    date: {
        fontSize: 10,
        color: '#666',
        marginVertical: 2,
    },
    comment: {
        fontSize: 12,
        color: '#FF2D55',
        textAlign: 'center',
        width: 200
    },
    rateLabel: {
        fontSize: 11,
        color: '#888',
    },
    rateValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#03415B',
    },
})