import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator, ScrollView, Alert, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getUserDetails } from '../../Apicall/Axios';
import { TouchableOpacity } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFetchBlob from 'rn-fetch-blob';
import { PermissionsAndroid, Platform } from 'react-native';
import RNPrint from 'react-native-print';
import { SafeAreaView } from 'react-native-safe-area-context';

function PdfReportscreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { clientId } = route.params;
    const [loading, setLoading] = useState(false);
    const [positionData, setPositionData] = useState(null);
    const [error, setError] = useState(null);
    const toastAnim = useRef(new Animated.Value(-100)).current; // hidden above screen
    const [toastMessage, setToastMessage] = useState('');


    useEffect(() => {
        fetchPositionData();
    }, []);


    const fetchPositionData = async () => {
        try {
            const userDetails = await getUserDetails();
            if (!userDetails?.accessToken) throw new Error('Access token is missing.');
            setLoading(true);
            const payload = {
                clientId: clientId,
                segment: "",
                exSymbol: "",
                authorityId: null,
                subBrokerId: null,
                exDate: null,
                isOutstanding: "0",
                isDayNetWise: "1",
                isClientScriptSelfWise: "1",
                SMasterId: null
            };

            const response = await fetch('https://tradep.clustersofttech.com/api/OrderApi/GetPosition', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userDetails.accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Position Data:', data);
            setPositionData(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching position data:', err);
        } finally {
            setLoading(false);
        }
    };

    // pdf download 
    const requestStoragePermission = async () => {
        try {
            if (Platform.OS === 'android') {
                const sdkInt = Platform.Version;

                if (sdkInt < 30) {
                    const granted = await PermissionsAndroid.requestMultiple([
                        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                    ]);
                    return (
                        granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED &&
                        granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED
                    );
                }
                // On Android 11+ (API 30), assume permission is granted for app-scoped storage
                return true;
            }
            return true; // iOS
        } catch (err) {
            console.warn(err);
            return false;
        }
    };

    const generatePDF = () => {
        const html = `
          <html>
            <head>
              <style>
                @page {
                  size: A4;
                  margin: 20mm;
                }
                body {
                  font-family: Arial, sans-serif;
                  font-size: 12px;
                  margin: 0;
                  padding: 0;
                }
                .container {
                  padding: 20px;
                }
                h1 {
                  text-align: center;
                  color: #03415A;
                  margin-bottom: 10px;
                }
                .header {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 20px;
                  font-weight: bold;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 10px;
                }
                th, td {
                  border: 1px solid #000;
                  padding: 8px;
                  text-align: center;
                }
                th {
                  background-color: #f0f0f0;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Net Position Report</h1>
                <div class="header">
                  <div>Client: ${positionData.data[0].clientName}</div>
                  <div>Date: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}</div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Segment</th>
                      <th>Symbol</th>
                      <th>TBQ (Lot)</th>
                      <th>BAP</th>
                      <th>TSQ (Lot)</th>
                      <th>SAP</th>
                      <th>Net Qty (Lot)</th>
                      <th>LTP</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${positionData.data.map(item => `
                      <tr>
                        <td>${item.segmentName}</td>
                        <td>${item.symbolName}</td>
                        <td>${item.tbq}</td>
                        <td>${item.bap}</td>
                        <td>${item.tsq}</td>
                        <td>${item.sap}</td>
                        <td>${item.netQty}</td>
                        <td>${item.ltp}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </body>
          </html>
        `;

        return html;
    };

    const handlewSavepdf = async () => {
        try {
            const hasPermission = await requestStoragePermission();
            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Storage permission is required to save PDF files');
                return;
            }

            if (!positionData || !positionData.data || positionData.data.length === 0) {
                Alert.alert('No Data', 'No data available to generate PDF');
                return;
            }
            const html = generatePDF(); // Get the HTML
            const fileName = `NetPosition_${clientId}_${new Date().toISOString().split('T')[0]} `;
            const options = {
                html,
                fileName,
                base64: true, // important: output base64 so we can re-save it
            };

            const pdf = await RNHTMLtoPDF.convert(options);
            const dirs = RNFetchBlob.fs.dirs;
            const path = `${dirs.DownloadDir}/${fileName}.pdf`;

            // Save with notification using Android DownloadManager
            RNFetchBlob.fs.writeFile(path, pdf.base64, 'base64').then(() => {
                RNFetchBlob.android.addCompleteDownload({
                    title: `${fileName}.pdf`,
                    description: 'PDF File downloaded by the app',
                    mime: 'application/pdf',
                    path,
                    showNotification: true,
                    notification: true,
                });

                showToast('✅ PDF saved Successfully');

            });
        } catch (error) {
            console.error('Error generating PDF:', error);
            showToast('❌ Error generating PDF', error);
        }
    }

    const handlePrint = async () => {
        try {
            const html = generatePDF(); // Reuse the same HTML
            await RNPrint.print({ html });
        } catch (err) {
            console.error(err);
            showToast('❌ Print failed');
        }
    };

    const showToast = (message) => {
        setToastMessage(message);

        Animated.sequence([
            Animated.timing(toastAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.delay(2000),
            Animated.timing(toastAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ backgroundColor: '#03415A' }}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={{ padding: 5 }}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Summary Report</Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 10 }}>
                <Pressable style={{ marginRight: 10, backgroundColor: '#6c5dd3', padding: 10, borderRadius: 10 }} onPress={handlewSavepdf}>
                    <Text style={{ color: '#fff' }}>Export</Text>
                </Pressable>
                <Pressable style={{ marginRight: 10, backgroundColor: '#6c5dd3', padding: 10, borderRadius: 10 }} onPress={handlePrint}>
                    <Text style={{ color: '#fff' }}>Print</Text>
                </Pressable>
            </View>

            <View style={styles.netposition}>
                <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', color: 'black' }}>Net Position</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 5 }}>
                    <Text style={{ textAlign: 'center', fontSize: 13, color: 'black' }}>
                        {positionData && positionData.data && positionData.data.length > 0
                            ? positionData.data[0].clientName
                            : "Loading client..."}</Text>
                    <Text style={{ textAlign: 'center', fontSize: 13, color: 'black' }}>{new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}</Text>
                </View>
            </View>


            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#03415A" style={{ marginTop: 20 }} />
                ) : error ? (
                    <Text style={styles.errorText}>Error: {error}</Text>
                ) : (
                    <ScrollView style={{ marginTop: 10 }}>
                        {positionData && positionData.data && positionData.data.length > 0 ? (
                            positionData.data.map((item, index) => (
                                <View key={index} style={styles.card}>
                                    {/* Top Row */}
                                    <View style={styles.topRow}>
                                        <Text style={styles.leftLabel}>SEGMENT: <Text style={styles.leftValue}>{item.segmentName}</Text></Text>
                                        <Text style={styles.rightLabel}>CLIENT: <Text style={styles.rightValue}>{item.clientName}</Text></Text>
                                    </View>
                                    <Text style={styles.topLabel}>SYMBOL :<Text style={styles.topValue}>{item.symbolName}</Text></Text>

                                    {/* Middle Rows */}
                                    <View style={styles.middleRow}>
                                        {/* First Row */}
                                        <View style={styles.rowContainer}>
                                            <Text style={styles.leftText}>TBQ: <Text style={styles.bold}>{item.tbq}({item.tbLot})</Text></Text>
                                            <Text style={styles.centerText}>BAP: <Text style={styles.bold}>{item.bap}</Text></Text>
                                            <Text style={styles.rightText}>TSQ: <Text style={styles.bold}>{item.tsq}({item.tsLot})</Text></Text>
                                        </View>

                                        {/* Second Row */}
                                        <View style={styles.rowContainer}>
                                            <Text style={styles.leftText}>SAP: <Text style={styles.bold}>{item.sap}</Text></Text>
                                            <Text style={styles.centerText}>NET QTY: <Text style={styles.bold}>{item.netQty} ({item.netLot})</Text></Text>
                                            <Text style={styles.rightText}>LTP: <Text style={[styles.bold]}>{item.ltp}</Text></Text>
                                        </View>
                                    </View>

                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>NOTHING TO SHOW</Text>
                                <TouchableOpacity>
                                    <Text style={styles.refreshText}>↻</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>

            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: '#4CAF50',
                    padding: 15,
                    transform: [{ translateY: toastAnim }],
                    zIndex: 999,
                }}
            >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                    {toastMessage}
                </Text>
            </Animated.View>


        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#03415A',
        paddingHorizontal: 15,
        height: 60,
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    netposition: {
        borderWidth: 1,
        borderColor: 'black',
        // padding: 15,
        margin: 10,
    },
    content: {
        flex: 1,
        paddingHorizontal: 10,
    },

    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
    },
    card: {
        backgroundColor: '#f4f8fb',
        borderRadius: 12,
        padding: 10,
        marginBottom: 12,
        marginHorizontal: 5
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between', // This pushes items to opposite ends
        alignItems: 'center', // Vertically centers items
        marginBottom: 4,
        width: '100%', // Ensure full width
    },

    leftLabel: {
        color: '#888',
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'left', // Align text to left
    },

    leftValue: {
        color: '#03415A',
        fontSize: 11,
        fontWeight: 'bold',
    },

    rightLabel: {
        color: '#888',
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'right', // Align text to right
    },

    rightValue: {
        color: '#03415A',
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'right',
    },

    topLabel: {
        flex: 1,
        color: '#888',
        fontSize: 10,
        fontWeight: '600',
        // textAlign: 'center',
    },

    topValue: {
        // flex: 1,
        color: '#03415A',
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    middleRow: {
        marginBottom: 4,
        // backgroundColor: 'pink',
        width: '100%',
    },

    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4, // Add spacing between rows if needed
    },

    leftText: {
        fontSize: 10,
        color: '#888',
        fontWeight: '600',
        textAlign: 'left',
        flex: 1, // Takes 1/3 of space but aligns left
    },

    centerText: {
        fontSize: 10,
        color: '#888',
        fontWeight: '600',
        textAlign: 'center',
        flex: 1, // Takes 1/3 of space and centers
    },

    rightText: {
        fontSize: 10,
        color: '#888',
        fontWeight: '600',
        textAlign: 'right',
        flex: 1, // Takes 1/3 of space but aligns right
    },
    bold: {
        fontSize: 11,
        color: '#03415A',
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

export default PdfReportscreen;