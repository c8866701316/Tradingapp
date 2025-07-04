import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getUserDetails } from '../../Apicall/Axios';
import { UserContext } from '../UserContext';
import ConnectSignalR from '../../Websocket/ConnectSignalR';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';

function SummaryReport() {
  const meData = React.useContext(UserContext);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [subscribedReportData, setSubscribereportData] = useState([]);
  const [clientTotals, setClientTotals] = useState([]);
  const [priceChanges, setPriceChanges] = useState({});
  const [highLowPriceChanges, setHighLowPriceChanges] = useState({});
  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
  const prevDataRef = useRef({});

  useEffect(() => {
    fetchSummaryReport();
  }, []);

  const fetchSummaryReport = async () => {
    try {
      const userDetails = await getUserDetails();
      if (!userDetails?.accessToken) throw new Error('Access token is missing.');
      setLoading(true);
      const payload = {
        fromDate: null,
        toDate: null,
        segment: "",
        symbol: "",
        valan: "",
        masterId: null,
        subBrokerId: null,
        clientId: null,
        SMasterId: null
      };

      const response = await fetch('https://tradep.clustersofttech.com/api/OrderApi/GetSummaryReportInDetails', {
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
      console.log('Summary Report:', data);
      setReportData(data);

      // Create pricesLookup from subscribedReportData
      const pricesLookup = subscribedReportData.reduce((acc, item) => {
        acc[item.s] = {
          bidPrice: parseFloat(item.bp) || 0,
          askPrice: parseFloat(item.ap) || 0,
        };

        return acc;
      }, {});
      console.log("pricesLookup", pricesLookup);

      // Calculate totals by clientId
      const totals = calculateClientTotals(data.data || [], pricesLookup);
      console.log("totals", totals);
      setClientTotals(totals);
    } catch (err) {
      console.error('Error fetching summary report:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateClientTotals = (data, pricesLookup) => {
    const groupedData = {};

    data.forEach((item) => {
      const { clientId, symbol, orderSide, remainingQty, limitPrice } = item;

      // Use the passed pricesLookup to get latest prices
      const latestPrice = pricesLookup[symbol] || {};
      const priceToUse = orderSide === 1 ? (latestPrice.bidPrice || 0) : (latestPrice.askPrice || 0);

      if (!groupedData[clientId]) {
        groupedData[clientId] = {
          clientId,
          clientName: item.clientName,
          valan: item.valan,
          totalPrice: 0,
          qty: 0,
          grossMTM: 0,
          clientBrok: 0,
          billAmt: 0,
          brokerBrok: 0,
          selfBrok: 0,
          selfMTM: 0,
          limitPrice: 0,
          orderSide,
          symbol: '',
        };
      }

      groupedData[clientId].qty += item.qty || 0;
      groupedData[clientId].clientBrok += item.clientBrok || 0;
      groupedData[clientId].brokerBrok += item.brokerBrok || 0;
      groupedData[clientId].selfBrok += item.selfBrok || 0;

      if (remainingQty > 0) {
        let calculatedMTM;
        if (orderSide === 1) {
          calculatedMTM = (limitPrice > priceToUse ? -1 : 1) * (limitPrice * remainingQty - priceToUse * remainingQty);
        } else {
          calculatedMTM = (limitPrice < priceToUse ? 1 : -1) * (limitPrice * remainingQty - priceToUse * remainingQty);
        }
        groupedData[clientId].grossMTM += calculatedMTM;
      } else {
        const apiGrossMTM = item.grossMTM || 0;
        groupedData[clientId].grossMTM += apiGrossMTM;
      }
      groupedData[clientId].billAmt = groupedData[clientId].grossMTM + groupedData[clientId].clientBrok;
      groupedData[clientId].selfMTM = groupedData[clientId].billAmt + groupedData[clientId].brokerBrok;

      if (groupedData[clientId].symbol && symbol && !groupedData[clientId].symbol.includes(symbol)) {
        groupedData[clientId].symbol += `, ${symbol}`;
      } else if (symbol) {
        groupedData[clientId].symbol = symbol;
      }

      if (orderSide === 1) {
        groupedData[clientId].totalPrice += item.totalNetPrice || 0;
      } else if (orderSide === -1) {
        groupedData[clientId].totalPrice -= item.totalNetPrice || 0;
      }
    });
    return Object.values(groupedData);
  };

  useEffect(() => {
    if (reportData?.data?.length > 0 && subscribedReportData?.length > 0) {
      const pricesLookup = subscribedReportData.reduce((acc, item) => {
        acc[item.s] = {
          bidPrice: parseFloat(item.bp) || 0,
          askPrice: parseFloat(item.ap) || 0,
        };
        return acc;
      }, {});
      const totals = calculateClientTotals(reportData.data, pricesLookup);
      setClientTotals(totals);
    }
  }, [subscribedReportData, reportData]);

  // subscribe / unsubscribe method 
  const handleNewData = (newData) => {
    setSubscribereportData((prevData) => {
      const updatedData = Array.isArray(prevData) ? [...prevData] : [];
      const newPriceChanges = { ...priceChanges };
      const newHighLowPriceChanges = { ...highLowPriceChanges };
      const existingIndex = updatedData.findIndex(
        (item) => item.es === newData.es
      );
      if (existingIndex !== -1) {
        const prevItem = updatedData[existingIndex];

        // Parse prices
        const prevBidPrice = parseFloat(prevItem?.bp) || 0;
        const newBidPrice = parseFloat(newData?.bp) || 0;
        const prevAskPrice = parseFloat(prevItem?.ap) || 0;
        const newAskPrice = parseFloat(newData?.ap) || 0;
        const prevLowPrice = parseFloat(prevItem?.lp) || 0;
        const newLowPrice = parseFloat(newData?.lp) || 0;
        const prevHighPrice = parseFloat(prevItem?.hp) || 0;
        const newHighPrice = parseFloat(newData?.hp) || 0;


        // 🔹 Set Bid Price Color (Green if Increased, Red if Decreased)
        newPriceChanges[newData.s] = {
          ...newPriceChanges[newData.s],
          bidPriceColor: newBidPrice > prevBidPrice ? "green" : "red",
        };

        // 🔹 Set Ask Price Color (Green if Increased, Red if Decreased)
        newPriceChanges[newData.s] = {
          ...newPriceChanges[newData.s],
          askPriceColor: newAskPrice > prevAskPrice ? "green" : "red",
        };

        // 🔹 Set High Price Color (Green if Increased, Red if Decreased)
        newHighLowPriceChanges[newData.s] = {
          ...newHighLowPriceChanges[newData.s],
          highPriceColor: newHighPrice > prevHighPrice ? "green" : "red",
        };

        // 🔹 Set Low Price Color (Green if Increased, Red if Decreased)
        newHighLowPriceChanges[newData.s] = {
          ...newHighLowPriceChanges[newData.s],
          lowPriceColor: newLowPrice < prevLowPrice ? "red" : "green",
        };

        updatedData[existingIndex] = newData;
      } else {
        updatedData.push(newData);
      }
      prevDataRef.current[newData.s] = newData;
      // Update state for color changes
      setHighLowPriceChanges(newHighLowPriceChanges);
      setPriceChanges((prev) => ({ ...prev, [newData.s]: newPriceChanges[newData.s] }));
      return updatedData;
    });
  };

  useEffect(() => {
    const connection = async () => {
      try {
        if (ConnectSignalR.state !== "Connected") {
          await ConnectSignalR.start();
        }
        if (watchlistSymbols.length > 0) {

          setTimeout(async () => {
            console.log("reportData OnSubscribe called from timeout", watchlistSymbols);
            await ConnectSignalR.invoke("OnSubscribe", watchlistSymbols);

          }, 2000);
        }
      } catch (error) {
        console.error("Error in SignalR subscription:", error);
      }
    };

    connection();
    ConnectSignalR.on('OnSubscribeFinished', (msg) => {
      console.log('reportData SubScribe', msg);
    });
    ConnectSignalR.on('OnUnsubscribeFinished', (msg) => {
      console.log('reportData UnSubScribe', msg);

    });

    ConnectSignalR.on("ReceiveSubscribedScriptUpdate", handleNewData);
    return () => ConnectSignalR.off("ReceiveSubscribedScriptUpdate", handleNewData);

  }, [watchlistSymbols]);

  useEffect(() => {
    const handleSubscribeFinished = (msg) => {
      console.log("reportData OnSubscribeFinished", msg);
    };
    const handleUnsubscribeFinished = (msg) => {
      console.log("reportData OnUnsubscribeFinished", msg);

    };

    ConnectSignalR.on("OnSubscribeFinished", handleSubscribeFinished);
    ConnectSignalR.on("OnUnsubscribeFinished", handleUnsubscribeFinished);
    ConnectSignalR.on("SubscribedScriptUpdate", handleNewData);
    return () => {
      ConnectSignalR.off("OnSubscribeFinished", handleSubscribeFinished);
      ConnectSignalR.off("OnUnsubscribeFinished", handleUnsubscribeFinished);
      ConnectSignalR.off("SubscribedScriptUpdate", handleNewData);
    };
  }, []);

  useEffect(() => {
    // Use meData to set up the watchlist
    const watchlistData = meData?.watchList || {};
    console.log("watchlistData reportData", watchlistData);

    const normalizedWatchlist = Object.entries(watchlistData).map(([key, items]) => {
      const [id, category] = key.split(':');
      return {
        category,
        items
      };
    });
    console.log("normalizedWatchlist reportData", normalizedWatchlist);

    if (normalizedWatchlist.length > 0) {
      const mcxData = normalizedWatchlist.find(item => item.category === 'MCX');
      const nseData = normalizedWatchlist.find(item => item.category === 'NSE');
      const combinedScripts = normalizedWatchlist.flatMap(item => item.items);
      setWatchlistSymbols(combinedScripts);
    }
  }, [meData]);



  return (
    <>
      <SafeAreaView style={styles.container}>

        <View style={{ backgroundColor: '#03415A' }}>
          {/* Trades Header */}
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={{ padding: 5 }}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.headerText}>Summary Report</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#03415A" style={{ marginTop: 20 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {clientTotals?.length > 0 ? (
              clientTotals.map((client) => (
                <View key={client.clientId} style={styles.reportContainer}>

                  {/* Row 1 */}
                  <View style={styles.row1}>
                    <View>
                      <Text style={styles.label}>Client:</Text>
                      <Text style={styles.value}>{client.clientName}</Text>
                    </View>
                    <View>
                      {/* <Text style={[styles.label, { fontSize: 10 }]}>Net Position:</Text> */}
                      <View style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                      }}>
                        <TouchableOpacity onPress={() => navigation.navigate('PdfReport', { clientId: client.clientId })}>
                          <FontAwesome name="file-pdf-o" size={30} color="#7e71d8" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View>
                      <Text style={styles.label}>Valan:</Text>
                      <Text style={styles.value}>{client.valan}</Text>
                    </View>

                  </View>

                  {/* Row 2 */}
                  <View style={styles.row}>
                    <View>
                      <Text style={styles.label}>GrossMTM:</Text>
                      <Text style={styles.value}>{client.grossMTM}</Text>
                    </View>
                    <View>
                      <Text style={styles.label}>BillAmt:</Text>
                      <Text style={styles.value}>{Number(client.billAmt).toFixed(2)}</Text>
                    </View>
                    <View>
                      <Text style={styles.label}>SelfMTM:</Text>
                      <Text style={styles.value}>{Number(client.selfMTM).toFixed(2)}</Text>
                    </View>
                  </View>
                  <View style={styles.row}>
                    <View>
                      <Text style={styles.label}>Client Brok:</Text>
                      <Text style={styles.value}>{Number(client.clientBrok).toFixed(2)}</Text>
                    </View>
                    <View>
                      <Text style={styles.label}>Broker Brok:</Text>
                      <Text style={styles.value}>{Number(client.brokerBrok).toFixed(2)}</Text>
                    </View>
                    <View>
                      <Text style={styles.label}>Self Brok:</Text>
                      <Text style={styles.value}>{Number(client.selfBrok).toFixed(2)}</Text>
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
      </SafeAreaView>
    </>
  )
};

export default SummaryReport;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#03415A',
    paddingHorizontal: 15,
    height: 60,
  },
  headerText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  content: {
    padding: 16,

  },
  reportContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 5,
    // padding:16,
    marginBottom: 16,
  },
  row1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  label: {
    // width: '25%',
    fontWeight: 'bold',
    color: '#0333',
    fontSize: 12,
    textAlign: 'center',
  },
  value: {
    // width: '25%',
    fontSize: 12,
    color: '#03415A',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
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