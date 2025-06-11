import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { getUserDetails } from '../Apicall/Axios';
import Ionicons from 'react-native-vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import { SafeAreaView } from 'react-native-safe-area-context';


const RejectionLogs = ({ filters }) => {
    const [loading, setLoading] = useState(false);
    const [rejectionLogs, setRejectionLogs] = useState([]);
    const navigation = useNavigation();
    const [filteredLogs, setFilteredLogs] = useState([]);

    const fetchRejectionLogs = async () => {
        setLoading(true);
        try {
            const userDetails = await getUserDetails();
            if (!userDetails?.accessToken) throw new Error('Access token is missing.');

            const response = await axios.post(
                'https://tradep.clustersofttech.com/api/OrderApi/GetOrderRejectionLog',
                {},
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${userDetails.accessToken}`,
                    },
                }
            );
            console.log("getorder Rejection data", response.data);

            if (response.data?.status && Array.isArray(response.data.data)) {
                setRejectionLogs(response.data.data);
                setFilteredLogs(response.data.data); // Initialize filtered logs with all data
            } else {
                setRejectionLogs([]);
                setFilteredLogs([]);

            }
        } catch (error) {
            console.error('Error fetching rejection logs:', error);
            setRejectionLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRejectionLogs();
    }, []);

    // Apply filters whenever filters change
    useEffect(() => {
        if (rejectionLogs.length > 0) {
            let result = [...rejectionLogs];

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
        }
    }, [filters, rejectionLogs]);

    const formatDateTime = (dateTimeString) => {
        // Split the string into date and time parts
        const [datePart, timePart] = dateTimeString.split('T');

        // Split the date into components
        const [year, month, day] = datePart.split('-');

        // Reformat the date as DD-MM-YYYY
        const formattedDate = `${day}-${month}-${year}`;

        // Combine with the time part
        return `${formattedDate} ${timePart}`;
    };

    const renderLogItem = (log) => (
        <View key={log.id} style={styles.logItem}>
            <View style={styles.leftColumn}>
                <Text style={styles.label}>LOT: <Text style={{ color: '#03415B', fontSize: 13 }}>{log.lotQty}</Text></Text>
                <Text style={styles.label}>QTY: <Text style={{ color: '#03415B', fontSize: 13 }}>{log.qty}</Text></Text>
            </View>
            <View style={styles.centerColumn}>
                <Text style={styles.symbol}>{log.symbolName}</Text>
                <View style={[
                    styles.sideBadge,
                    log.orderSideName === 'Buy' ? styles.buyBadge : styles.sellBadge
                ]}>
                    <Text style={styles.sideText}>{log.orderSideName}</Text>
                </View>
                <Text style={styles.date}>{formatDateTime(log.orderDate)}</Text>
                <Text style={styles.comment}>{log.comment}</Text>
            </View>
            <View style={styles.rightColumn}>
                <Text style={styles.rateLabel}>Rate</Text>
                <Text style={styles.rateValue}>{log.orderRate}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.header}>Rejection Logs</Text>
                <TouchableOpacity style={styles.settingsIcon} onPress={() => navigation.openDrawer()}>
                    <Text style={styles.settingsText}>⚙</Text>
                </TouchableOpacity>
            </View>
            <ScrollView>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0000ff" />
                    </View>
                ) : filteredLogs.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>NOTHING TO SHOW</Text>
                        <TouchableOpacity>
                            <Text style={styles.refreshText}>↻</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        {filteredLogs.map((log) => renderLogItem(log))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
    },
    headerContainer: {
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
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
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
        // alignItems: 'center',
        backgroundColor: '#f6f9fc',
        borderRadius: 10,
        padding: 10,
        marginVertical: 5,
        marginHorizontal: 10,
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
        fontSize: 13,
        fontWeight: 'bold',
        color: '#03415B',
    },
    sideBadge: {
        paddingHorizontal: 25,
        paddingVertical: 2,
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
        fontSize: 12,
        textAlign: 'center',
    },

    date: {
        fontSize: 10,
        color: '#03415B',
        marginVertical: 2,
    },
    comment: {
        fontSize: 10,
        color: '#FF2D55',
        textAlign: 'center',
        width: 300
    },
    rateLabel: {
        fontSize: 10,
        color: '#888',
    },
    rateValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#03415B',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: 200,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginBottom: 10,
    },
    refreshText: {
        fontSize: 24,
        color: '#007AFF',
    },
});

export default RejectionLogs;