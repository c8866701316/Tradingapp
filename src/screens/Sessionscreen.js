import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Animated } from 'react-native';
import { getUserDetails } from '../Apicall/Axios';
import ConnectSignalR from '../Websocket/ConnectSignalR';
import { UserContext } from './UserContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSound } from '../contexts/SoundContext';


const Sessionscreen = () => {

  const meData = React.useContext(UserContext);
    // console.log("medata in Session screen ", meData);
  const { playNotificationSound, isSoundEnabled } = useSound();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [closePrice, setClosePrice] = useState('');
  const [orderType, setOrderType] = useState('market'); // 'market' or 'limit'
  const [priceChanges, setPriceChanges] = useState({});
  const [highLowPriceChanges, setHighLowPriceChanges] = useState({});
  const prevDataRef = useRef({});
  const [positionData, setPositionData] = useState([]);
  const [tradeSide, setTradeSide] = useState(1); // 1 for buy, -1 for sell
  const [notification, setNotification] = useState({
    message: '',
    type: '', // 'success' or 'error'
    visible: false,
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLoading(true);
    const fetchPosition = async () => {
      try {
        const userDetails = await getUserDetails();
        if (!userDetails?.accessToken) {
          throw new Error('Access token is missing.');
        }
        const response = await fetch('https://tradep.clustersofttech.com/api/OrderApi/GetPosition', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userDetails.accessToken}`,
          },
          body: JSON.stringify({
            SMasterId: null,
            authorityId: null,
            clientId: null,
            exDate: null,
            exSymbol: "",
            isClientScriptSelfWise: "1",
            isDayNetWise: "1",
            isOutstanding: "0",
            segment: "",
            subBrokerId: null
          }),
        });

        const data = await response.json();
        console.log("session pop-up data", data);

        console.log("Get Position Response:", JSON.stringify(data, null, 2));

        // setPositionData(data.data || []);
        setPositions(data.data || []);

      } catch (error) {
        console.error("Error fetching position:", error);
      }
      finally {
        setLoading(false);
      }
    };

    fetchPosition();
  }, []);


  const handleClosePosition = (item) => {
    const isSellPosition = item.netQty < 0 || item.netLot < 0;
    const reversedNetQty = Math.abs(item.netQty); // Convert to positive
    const reversedNetLot = Math.abs(item.netLot); // Convert to positive
    const side = isSellPosition ? 1 : -1; // If sell position, close with buy (1); if buy, close with sell (-1)

    setSelectedPosition({
      ...item,
      netQty: reversedNetQty, // Pass positive value
      netLot: reversedNetLot, // Pass positive value
    });
    setTradeSide(side); // Set buy (1) or sell (-1)
    setClosePrice(item.ltp.toString()); // Set default close price to LTP
    setShowCloseModal(true);
  };

  const confirmClosePosition = async () => {
    if (!selectedPosition) return;

    try {
      setLoading(true);
      const userDetails = await getUserDetails();
      if (!userDetails?.accessToken) {
        throw new Error('Access token is missing.');
      }

      // Determine if this is a short position (negative netQty)
      const isShortPosition = selectedPosition.netQty < 0;

      // Prepare the order data
      const orderData = {
        OrderType: orderType === 'limit' ? 1 : 2, // 1 = Limit, 2 = Market
        LotQty: Math.abs(selectedPosition.netLot),
        Qty: Math.abs(selectedPosition.netQty),
        price: parseFloat(closePrice) || selectedPosition.ltp,
        low: selectedPosition.lp,
        high: selectedPosition.hp,
        symbolName: selectedPosition.symbolName,
        symbol: selectedPosition.symbol,
        clientName: selectedPosition.clientName,
        clientId: selectedPosition.clientId,
        isFrom: 1 // Assuming this is a constant value
      };

      console.log('Closing position with:', orderData);

      // Make the API call
      const response = await fetch('https://tradep.clustersofttech.com/api/OrderApi/ClosePosition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userDetails.accessToken}`,
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok) {
        showNotification(result.message);
        console.log('Position closed successfully:', result);
        // Refresh positions after successful close
        const fetchPosition = async () => {
          try {
            const response = await fetch('https://tradep.clustersofttech.com/api/OrderApi/GetPosition', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userDetails.accessToken}`,
              },
              body: JSON.stringify({
                SMasterId: null,
                authorityId: null,
                clientId: null,
                exDate: null,
                exSymbol: "",
                isClientScriptSelfWise: "1",
                isDayNetWise: "1",
                isOutstanding: "0",
                segment: "",
                subBrokerId: null
              }),
            });
            const data = await response.json();
            setPositions(data.data || []);
          } catch (error) {
            console.error("Error refreshing positions:", error);
          }
        };

        await fetchPosition();
        setPositions(prevPositions =>
          prevPositions.filter(pos => pos.symbol !== selectedPosition.symbol)
        );

        // Show success message
        // alert('Position closed successfully!');
      } else {
        throw new Error(result.message || 'Failed to close position');
      }
    } catch (error) {
      console.error("Error closing position:", error);
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
      setShowCloseModal(false);
    }
  };
  // subscribe / unsubscribe method 
  const handleNewData = (newData) => {
    // console.log("Received new data:", newData);
    // console.log(Array.isArray(newData), "new data in array ");

    setPositionData((prevData) => {
      const updatedData = [...prevData];
      // console.log("Updated Data:", updatedData);
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
        if (positions.length > 0) {
          setTimeout(async () => {
            console.log("positions OnSubscribe called from timeout");
            await ConnectSignalR.invoke("OnSubscribe", positions);

          }, 2000);
        }
      } catch (error) {
        console.error("Error in SignalR subscription:", error);
      }
    };

    connection();
    ConnectSignalR.on('OnSubscribeFinished', (msg) => {
      console.log('positions SubScribe', msg);
    });
    ConnectSignalR.on('OnUnsubscribeFinished', (msg) => {
      console.log('positions UnSubScribe', msg);
      // setPositionData((prevData) => [...prevData, msg]);
    });

    ConnectSignalR.on("ReceiveSubscribedScriptUpdate", handleNewData);
    return () => ConnectSignalR.off("ReceiveSubscribedScriptUpdate", handleNewData);

  }, [positions]);    

  useEffect(() => {
    const handleSubscribeFinished = (msg) => {
      console.log("positions OnSubscribeFinished", msg);
    };
    const handleUnsubscribeFinished = (msg) => {
      console.log("positions OnUnsubscribeFinished", msg);
      // setPositionData([]);
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
    console.log("watchlistData position", watchlistData);

    const normalizedWatchlist = Object.entries(watchlistData).map(([key, items]) => {
      const [id, category] = key.split(':');
      return {
        category,
        items
      };
    });
    console.log("normalizedWatchlist position", normalizedWatchlist);

    // setPositions(normalizedWatchlist);

    if (normalizedWatchlist.length > 0) {
      const mcxData = normalizedWatchlist.find(item => item.category === 'MCX');
      const nseData = normalizedWatchlist.find(item => item.category === 'NSE');
      const combinedScripts = [
        ...(mcxData?.items || []),
        ...(nseData?.items || [])
      ];

      setPositions(combinedScripts);
    }

  }, [meData]);


  const matchedItems = positionData.filter((posData) => {
    return positions.some((pos) => pos.symbol === posData.s);
  });

  matchedItems.forEach((item, index) => {
    // console.log(`${index}:`, item);
  });

  const mergedPositions = positions.map((item) => {
    const matched = matchedItems.find((m) => m.s === item.symbol);
    // console.log("mached",matched);

    // console.log("ltp",matched?.ltp);
    const latPriceSet =
      matched?.ltp == 0
        ? matched?.op == 0
          ? matched?.pcp
          : matched?.op + matched?.ch
        : matched?.ltp;

    // console.log("latPriceSet",latPriceSet);

    const total = matched
      ? item?.tsq * item?.sap + item.netQty * latPriceSet - item?.tbq * item?.bap
      : 0;
    return {
      ...item,
      ...matched,
      ltp: matched?.ltp ?? item.ltp, // fallback to original if no match      
      mtm: total,
    };
  });
  const totalMtm = mergedPositions.reduce((acc, item) => acc + (item.mtm || 0), 0);


  // message show on top side

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
  const hideNotification = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    });
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Position Watchlist</Text>
        {/* <Text style={styles.betHistory}>⏳ Bet History</Text> */}
      </View>

      {/* Exposure Section */}
      <View style={styles.exposureContainer}>
        <Text style={styles.exposureText}> Fatak Balance</Text>
        <Text style={styles.exposureValue}>1000000</Text>
      </View>

      {/* PNL Section */}
      <View style={styles.pnlContainer}>
        <Text style={styles.pnlText}>P/L</Text>
        <Text style={[styles.pnlValue, { color: totalMtm >= 0 ? "green" : "white" }]}>{totalMtm.toFixed(2)}</Text>
      </View>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#03415A" />
          <Text style={{ marginTop: 10, color: '#03415A', textAlign: 'center' }}>
            Loading positions...
          </Text>
        </View>
      ) : positions.length === 0 ? (
        <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>NOTHING TO SHOW</Text>
                    <TouchableOpacity>
                        <Text style={styles.refreshText}>↻</Text>
                    </TouchableOpacity>
                </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 10 }}>
          {mergedPositions.map((item, index) => (
            <View key={index} style={styles.card}>

              {/* Top Row */}
              <View style={styles.topRow}>
                <Text style={styles.leftLabel}>SEGMENT: <Text style={styles.leftValue}>{item.segmentName}</Text></Text>
                <Text style={styles.rightLabel}>CLIENT: <Text style={styles.rightValue}>{item.clientName}</Text></Text>
              </View>
              {/* <View style={styles.topRow}> */}

              <Text style={styles.topLabel}>SYMBOL :<Text style={styles.topValue}>{item.symbolName}</Text></Text>
              {/* </View> */}

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

              {/* Bottom Row */}
              <View style={styles.bottomRow}>
                <Text style={{ textAlign: 'center', fontSize: 10, color: '#888', fontWeight: '600', }}>
                  MTM:
                  <Text style={[styles.bold, {
                    fontSize: 13,
                    color: item.mtm < 0 ? "red" : "black"
                  }]}>
                    {item.mtm.toFixed(2)}
                  </Text>
                </Text>
                {(item.netQty !== 0 ) && (
                  <TouchableOpacity style={styles.closesButton} onPress={() => handleClosePosition(item)}>
                    <Text style={styles.closeText}>✖</Text>
                  </TouchableOpacity>
                )}

              </View>
            </View>

          ))}


          <Modal
            animationType="slide"
            transparent={true}
            visible={showCloseModal}
            onRequestClose={() => setShowCloseModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={styles.modalTitle}>Close Position</Text>
                  <TouchableOpacity onPress={() => setShowCloseModal(false)}>
                    <Text style={{ fontSize: 20, color: "#03415A" }}>✖</Text>
                  </TouchableOpacity>
                </View>

                {/* Client and Script Info */}
                <View style={styles.infoContainer}>
                  <View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Client Name: <Text style={styles.infoValue}>{selectedPosition?.clientName || 'N/A'}</Text></Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Script Name:<Text style={styles.infoValue}>{selectedPosition?.symbolName || 'N/A'}</Text></Text>

                    </View>
                  </View>

                  <View style={styles.rightColumn}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>High:<Text style={styles.infoValue}>{selectedPosition?.hp || 'N/A'}</Text></Text>

                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Low:<Text style={styles.infoValue}>{selectedPosition?.lp || 'N/A'}</Text></Text>

                    </View>
                  </View>
                </View>

                {/* Market/Limit Selection */}
                <View style={styles.selectionContainer}>
                  <View style={styles.radioContainer}>
                    <TouchableOpacity
                      style={styles.radioButton}
                      onPress={() => setOrderType('market')}
                    >
                      <View style={styles.radioOuter}>
                        {orderType === 'market' && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.radioLabel}>Market</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.radioButton}
                      onPress={() => setOrderType('limit')}
                    >
                      <View style={styles.radioOuter}>
                        {orderType === 'limit' && <View style={styles.radioInner} />}
                      </View>
                      <Text style={styles.radioLabel}>Limit</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Lot and Qty */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Lot</Text>
                    <TextInput
                      style={styles.inputField}
                      keyboardType="numeric"
                      value={selectedPosition?.netLot?.toString() || '0'}
                    // editable={false}

                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Qty</Text>
                    <TextInput
                      style={styles.inputField}
                      keyboardType="numeric"
                      value={selectedPosition?.netQty?.toString() || '0'}
                    // editable={false}

                    />
                  </View>
                </View>

                {/* Price */}
                <View style={{ marginBottom: 15 }}>
                  <Text style={styles.inputLabel}>Price</Text>
                  <TextInput
                    style={styles.priceInput}
                    keyboardType="numeric"
                    value={closePrice}
                    onChangeText={setClosePrice}
                    editable={orderType === 'limit'} // Only editable for limit orders
                  />
                  {/* <Text style={styles.priceInWords}>{numberToWords(closePrice)}</Text> */}

                </View>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={confirmClosePosition}
                >
                  <Text style={styles.closeButtonText}>Close Position</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </ScrollView>
      )}

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
          <Text style={styles.notificationText}>{notification.message}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDEDED',
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
  header: {
    backgroundColor: '#03415A',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  betHistory: {
    color: 'white',
    fontSize: 14,
  },
  exposureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#03415A',
  },
  exposureText: {
    color: 'white',
    fontSize: 16,
  },
  exposureValue: {
    color: 'white',
    fontSize: 16,
  },
  pnlContainer: {
    backgroundColor: 'red',
    padding: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pnlText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 5
  },
  pnlValue: {
    color: 'white',
    fontSize: 16,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#f4f8fb',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    marginHorizontal: 5,
    elevation: 2,
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
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // This pushes items to opposite ends
    alignItems: 'center', // Vertically centers items
    marginBottom: 4,
    width: '100%',
  },
  closesButton: {
    backgroundColor: '#FF0000',
    borderRadius: 5,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#03415A',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rightColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    color: '#555',
    fontSize: 11,
  },
  infoValue: {
    color: '#03415A',
    fontSize: 13,
    fontWeight: 'bold',
  },

  selectionContainer: {
    marginBottom: 10,
  },
  radioContainer: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioOuter: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#03415A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#03415A',
  },
  radioLabel: {
    color: '#03415A',
    fontSize: 13,
  },
  inputGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  inputContainer: {
    width: '48%',
  },
  inputLabel: {
    color: '#555',
    fontSize: 13,
    marginBottom: 5,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 5,
    backgroundColor: '#f5f5f5',
    color: '#03415A',
  },

  priceInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 5,
    backgroundColor: '#f5f5f5',
    color: '#03415A',
    // marginBottom: 5,
  },
  priceInWords: {
    color: '#555',
    fontSize: 12,
    fontStyle: 'italic',
  },
  closeButton: {
    backgroundColor: '#ff5252',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  notification: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 5,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  notificationText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',

  },
});

export default Sessionscreen;