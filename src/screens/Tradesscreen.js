import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { getUserDetails, login, Me } from '../Apicall/Axios';
import { UserContext } from './UserContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSound } from '../contexts/SoundContext';
// import Ionicons from 'react-native-vector-icons/Ionicons';
const Tradesscreen = ({ route, filters }) => {

  const meData = React.useContext(UserContext);
  // console.log("medata in trade screen ", meData);

  const navigation = useNavigation();
  const { playNotificationSound, isSoundEnabled } = useSound();
  const [tradeData, setTradeData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [orderType, setOrderType] = useState('market');
  const [selectedTab, setSelectedTab] = useState('Executed');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabsLoading, setTabsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isModifyModalVisible, setIsModifyModalVisible] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [message, setMessage] = useState('');
  const [showMessagePopup, setShowMessagePopup] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notification, setNotification] = useState({
    message: '',
    type: '', // 'success' or 'error'
    visible: false,
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [modifiedValues, setModifiedValues] = useState({
    lot: '',
    quantity: '',
    price: ''
  });

  const payload = {
    clientId: null,
    segment: "",
    exSymbol: "",
    orderSides: 0,
    orderType: 0,
    authorityId: null,
    subBrokerId: null,
    dateFrom: new Date().toISOString(),
    dateTo: new Date().toISOString(),
  };

  useEffect(() => {
    fetchTradeBook();
  }, [selectedTab]);

  // Refresh when filters change
  useEffect(() => {
    fetchTradeBook();
  }, [filters]);

  // Get filtered options from meData or use default options if not available
  const [filteredOptions, setFilteredOptions] = useState([
    { id: "4", text: "Executed" },
    { id: "2", text: "Pending" }
  ]);

  // Update filteredOptions when meData changes
  useEffect(() => {
    setTabsLoading(true);

    if (meData?.dropdown?.orderBookOption) {
      const options = meData.dropdown.orderBookOption.filter(
        (option) => option.id === "2" || option.id === "4"
      );

      if (options && options.length > 0) {
        setFilteredOptions(options);
        console.log("Updated filteredOptions from meData:", options);

        // Set the default selected tab to the first option if it exists
        if (options[0] && options[0].text) {
          setSelectedTab(options[0].text);
        }
      }
    }

    setTabsLoading(false);
  }, [meData]);

  console.log("Current filteredOptions:", filteredOptions);

  const fetchTradeBook = async (filterParams = {}) => {
    try {
      setLoading(true);
      const userDetails = await getUserDetails();
      if (!userDetails?.accessToken) {
        throw new Error('Access token is missing.');
      }
      // Format dates for API (adjust format as needed)
      const formatDateForAPI = (dateString) => {
        if (!dateString) return null;
        const [day, month, year] = dateString.split('-');
        return `${month}-${day}-${year}`;
      };
      // Determine the type based on selectedTab
      let type = "0,4"; // Default to Executed

      if (selectedTab === 'Pending') {
        type = "0,2";
      } else if (selectedTab === 'Executed') {
        type = "0,4";
      } else {
        // If selectedTab doesn't match expected values, determine based on option id
        const selectedOption = filteredOptions.find(option => option.text === selectedTab);
        if (selectedOption) {
          type = selectedOption.id === "2" ? "0,2" : "0,4";
        }
      }

      console.log("Selected tab:", selectedTab, "Using type:", type);

      const updatedPayload = {
        ...payload,
        type: type,
        SMasterId: null,
        ...(filters?.market && { market: filters.market }),
        ...(filterParams.fromDate && { from_date: formatDateForAPI(filterParams.fromDate) }),
        ...(filterParams.toDate && { to_date: formatDateForAPI(filterParams.toDate) }),
      };

      const response = await fetch(
        'https://tradep.clustersofttech.com/api/OrderApi/GetTradeBook',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userDetails.accessToken}`,
          },
          body: JSON.stringify(updatedPayload),
        }
      );

      const result = await response.json();
      console.log("result tradebook", result);
      setTradeData(result.data);

      if (filters?.market) {
        const filtered = result.data.filter(item =>
          item.market === filters.market // Adjust this based on your actual data structure
        );
        setFilteredData(filtered);
      } else {
        setFilteredData(result.data);
      }
      if (!result?.data) {
        setError('No data received from the server.');
        setLoading(false);
        return;
      }

      setData(result.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Removed unused isPriceSame function

  const handleDeleteLimit = (item) => {
    setSelectedTrade(item);
    setIsDeleteModalVisible(true);
  };

  const handleModifyTrade = (item) => {
    setSelectedTrade(item);
    setModifiedValues({
      lot: item.lotQty?.toString() || '1.00',
      quantity: item.qty?.toString() || '',
      price: item.limitPrice?.toString() || ''
    });
    setIsModifyModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    const orderId = selectedTrade?.orderId;  // Get the orderId from the selected trade
    if (!orderId) {
      console.error('Order ID is missing');
      return;
    }

    try {
      const userDetails = await getUserDetails();
      if (!userDetails?.accessToken) {
        throw new Error('Access token is missing');
      }

      // Construct the URL with the orderId as a query parameter
      const url = `https://tradep.clustersofttech.com/api/OrderApi/CancelOrder?orderId=${orderId}`;

      const response = await fetch(url, {
        method: 'GET',  // Keep the GET method
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userDetails.accessToken}`,
        },
      });


      console.log('Response Status:', response.status);
      const responseText = await response.text();
      console.log('Response Body:', responseText);

      // Try parsing the response as JSON
      try {
        const result = JSON.parse(responseText);
        if (result.status) {
          const updatedData = data.filter(item => item.orderId !== orderId);
          setData(updatedData);
          setIsDeleteModalVisible(false);
        } else {
          console.error('Failed to delete trade:', result.message);
        }

      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
      }

    } catch (error) {
      console.error('Error deleting trade:', error);
    }
  };

  const handleModifySubmit = async () => {
    const orderId = selectedTrade?.orderId;
    if (!orderId) {
      console.error('Order ID is missing');
      return;
    }
    try {
      const userDetails = await getUserDetails();
      if (!userDetails?.accessToken) {
        throw new Error('Access token is missing');
      }
      const modifyPayload = {
        orderId: selectedTrade.orderId,
        qty: modifiedValues.quantity,
        lotQty: parseFloat(modifiedValues.lot),
        limitPrice: parseFloat(modifiedValues.price),
        symbol: selectedTrade.symbol,  // Assuming symbol is part of selectedTrade
        SMasterId: null
      };

      console.log('Modify Payload:', modifyPayload);

      const response = await fetch('https://tradep.clustersofttech.com/api/OrderApi/EditOrderPriceQty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userDetails.accessToken}`,
        },
        body: JSON.stringify(modifyPayload),
      });

      const responseText = await response.text();
      console.log('Modify API Raw Response:', responseText);

      const result = JSON.parse(responseText);
      console.log('Modify Response JSON:', result);

      if (result.status) {
        const updatedData = data.map(item =>
          item.orderId === selectedTrade.orderId
            ? {
              ...item,
              limitPrice: modifiedValues.price,
              remainingQty: modifiedValues.quantity,
              lotQty: modifiedValues.lot
            }
            : item
        );
        setData(updatedData);
        setIsModifyModalVisible(false);

        setMessage(result.message || 'Order modified successfully');
        setShowMessagePopup(true);
      } else {
        console.error('Modify failed:', result.message);
        setMessage(result.message || 'Failed to modify order');
        setShowMessagePopup(true);
      }
    } catch (error) {
      console.error('Modify error:', error.message);
      setMessage('Something went wrong while modifying the order.');
      setShowMessagePopup(true);
    }
  };


  const handleCancelDelete = () => {
    setIsDeleteModalVisible(false);
  };

  const handleCancelModify = () => {
    setIsModifyModalVisible(false);
  };

  const LOT_TO_QTY_RATIO = 100.00; // 1 lot = 100 qty (adjust this based on your requirements)
  const handleExit = (item) => {
    setSelectedOrder(item);
    setShowModal(true);
  };

  const placeOrder = async (orderData) => {
    try {
      const userDetails = await getUserDetails();
      if (!userDetails?.accessToken) {
        throw new Error('Access token is missing');
      }

      const response = await fetch(
        'https://tradep.clustersofttech.com/api/OrderApi/AddOrder',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userDetails.accessToken}`,
          },
          body: JSON.stringify(orderData),
        }
      );

      const result = await response.json();
      console.log('Order API response:', result);
      return result;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  };

  const handleSellNow = async (order) => {
    try {
      const orderPayload = {
        orderType: orderType === 'limit' ? 1 : 2, // Assuming 2 is for limit orders
        limitPrice: parseFloat(order.limitPrice) || 0,
        qty: parseFloat(order.remainingQty) || 0,
        lotQty: parseFloat(order.lotQty) || 0,
        orderSide: "2", // "2" typically represents Sell
        symbol: order.symbol,
        isMarketPrice: false,
        isFrom: 1,
        clientId: null,
        orderId: order.orderId
      };

      const result = await placeOrder(orderPayload);
      console.log('Sell order successful:', result);
      showNotification(result.message);
      setShowModal(false);
      fetchTradeBook();
    } catch (error) {
      showNotification(`Error: ${error.message}`, 'error');
      console.error('Failed to place sell order:', error);
    }
  };

  const handleBuyNow = async (order) => {
    try {
      const orderPayload = {
        orderType: orderType === 'limit' ? 1 : 2,// Assuming 2 is for limit orders
        limitPrice: parseFloat(order.limitPrice) || 0,
        qty: parseFloat(order.remainingQty) || 0,
        lotQty: parseFloat(order.lotQty) || 0,
        orderSide: "1", // "1" typically represents Buy
        symbol: order.symbol,
        isMarketPrice: false,
        isFrom: 1,
        clientId: null,
        orderId: order.orderId
      };

      const result = await placeOrder(orderPayload);
      console.log('Buy order successful:', result);
      showNotification(result.message);
      setShowModal(false);
      // Optionally refresh your trade book
      fetchTradeBook();
    } catch (error) {
      showNotification(`Error: ${error.message}`, 'error');
      console.error('Failed to place buy order:', error);
    }
  };

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


  useEffect(() => {
    if (filters?.market) {
      const marketFiltered = data.filter(item =>
        item.symbol?.includes(filters.market) ||
        item.market === filters.market
      );
      setFilteredData(marketFiltered);
    } else {
      setFilteredData(data);
    }
  }, [data, filters]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ backgroundColor: '#03415A' }}>
        {/* Trades Header */}
        <View style={styles.header}>
          {/* <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity> */}

          <Text style={styles.headerText}>Trades</Text>

          <TouchableOpacity
            style={styles.settingsIcon}
            onPress={() => navigation.openDrawer()}
          >
            <Text style={styles.settingsText}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {tabsLoading ? (
          // Show loading indicator while tabs are loading
          <View style={styles.tabsLoadingContainer}>
            <ActivityIndicator size="small" color="#03415A" />
            <Text style={styles.tabsLoadingText}>Loading tabs...</Text>
          </View>
        ) : filteredOptions && filteredOptions.length > 0 ? (
          // Render tabs based on filtered options from meData
          filteredOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.tab, selectedTab === option.text && styles.activeTab]}
              onPress={() => setSelectedTab(option.text)}>
              <Text
                style={[styles.tabText, selectedTab === option.text && styles.activeTabText]}>
                {option.text}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          // Fallback tabs if filteredOptions is not available
          <>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'Executed' && styles.activeTab]}
              onPress={() => setSelectedTab('Executed')}>
              <Text
                style={[styles.tabText, selectedTab === 'Executed' && styles.activeTabText]}>
                Executed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'Pending' && styles.activeTab]}
              onPress={() => setSelectedTab('Pending')}>
              <Text
                style={[styles.tabText, selectedTab === 'Pending' && styles.activeTabText]}>
                Pending
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>


      {/* Table Content */}
      <ScrollView>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#03415A" />
          </View>
        ) : filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>NOTHING TO SHOW</Text>
            <TouchableOpacity onPress={fetchTradeBook}>
              <Text style={styles.refreshText}>↻</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredData.map((item, index) => {
            const showExitButton = selectedTab === 'Executed' &&
              item.qty !== undefined &&
              item.remainingQty !== undefined &&
              item.qty === item.remainingQty;

            return (
              <View key={`${item.orderId}_${index}`} style={styles.card}>
                {showExitButton && (
                  <TouchableOpacity
                    style={styles.exitButton}
                    onPress={() => handleExit(item)}
                  >
                    <Ionicons name="exit-outline" size={20} color="white" />
                  </TouchableOpacity>
                )}
                {/* Top Row */}
                <View style={styles.topRow}>

                  <Text style={styles.lotText}>LOT: {item.lotQty ?? '-'}</Text>

                  <View style={styles.symbolBlock}>
                    <Text style={styles.symbolText}>
                      {(item.symbol?.split(':')[1]?.split(' ')[0]) ?? '-'}

                      {/* Display market if available */}
                      {item.market && (
                        <Text style={styles.marketIndicator}> ({item.market})</Text>
                      )}
                    </Text>
                  </View>


                  <Text style={styles.priceText}>{item.totalNetPrice ?? '-'}</Text>
                </View>

                {/* Bottom Row */}
                <View style={styles.bottomRow}>
                  <Text style={styles.dateTimeText}>
                    {item.orderDate?.slice(0, 10).split('-').reverse().join('-')}{' '}
                    {item.orderDate?.slice(11, 19)}
                  </Text>

                  <View
                    style={[
                      styles.marketTag,
                      {
                        backgroundColor:
                          item.orderSideName === 'Sell' ? 'red' :
                            item.orderSideName === 'Buy' ? '#2196f3' :
                              'gray', // fallback color
                      },
                    ]}
                  >
                    <Text style={styles.marketText}>
                      {item.orderTypeName}  {item.orderSideName}
                    </Text>
                  </View>

                  <Text style={styles.qtyText}>QTY: {item.remainingQty ?? '-'}</Text>
                </View>
                {/* Only show Modify Trade and Delete Limit in Pending */}
                {selectedTab === 'Pending' && (
                  <View style={styles.pendingButtonsContainer}>
                    <TouchableOpacity style={styles.modifysButton} onPress={() => handleModifyTrade(item)}>
                      <Text style={styles.buttonText}>Modify Trade</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteLimit(item)}>
                      <Text style={styles.buttonText}>Delete Limit</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

            );
          })
        )}
      </ScrollView>


      {/* Modal for Delete Confirmation in pending*/}
      <Modal
        transparent={true}
        visible={isDeleteModalVisible}
        animationType="fade"
        onRequestClose={handleCancelDelete}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 20, textAlign: "left", left: -50 }}>Are you sure ?</Text>
            <Text style={styles.modalText}> You Want To Delete This Trade</Text>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={handleCancelDelete}>
                <Text style={{ color: 'black', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleConfirmDelete}>
                <Text style={{ color: 'red', fontSize: 16 }}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* Modal for Modify Confirmation in pending */}
      <Modal
        transparent={true}
        visible={isModifyModalVisible}
        animationType="slide"
        onRequestClose={handleCancelModify}>
        <View style={styles.modifyModalOverlay}>
          <View style={styles.modifyModalContent}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8, marginHorizontal: 30 }}>
              <Text style={styles.modifyModalTitle}>Modify Trade</Text>
              <TouchableOpacity onPress={() => setIsModifyModalVisible(false)}>
                <Text style={{ fontSize: 17, color: "white", top: 15 }}>✖</Text>
              </TouchableOpacity>
            </View>

            <View style={{
              backgroundColor: 'white',
              padding: 10,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
            }}>
              {/* First row: Lot on left, Qty on right */}
              <View style={styles.firstRowContainer}>
                <View style={styles.modifyInputContainer}>
                  <Text style={styles.modifyLabel}>Lot</Text>
                  <TextInput
                    style={styles.modifyInput}
                    value={modifiedValues.lot}
                    onChangeText={(text) => setModifiedValues({ ...modifiedValues, lot: text })}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.modifyInputContainer}>
                  <Text style={styles.modifyLabel}>Qty</Text>
                  <TextInput
                    style={styles.modifyInput}
                    value={modifiedValues.quantity}
                    onChangeText={(text) => setModifiedValues({ ...modifiedValues, quantity: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Second row: Price centered */}
              <View style={styles.centerRow}>
                <View style={styles.modifyInputContainer}>
                  <Text style={styles.modifyLabel}>Price</Text>
                  <TextInput
                    style={styles.modifyInput}
                    value={modifiedValues.price}
                    onChangeText={(text) => setModifiedValues({ ...modifiedValues, price: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Third row: Submit button centered */}
              <View style={styles.centerRow}>
                <View style={styles.modifyButtonsContainer}>

                  <TouchableOpacity
                    style={[styles.modifyButton, styles.submitModifyButton]}
                    onPress={handleModifySubmit}>
                    <Text style={styles.modifyButtonText}>Modify Trade</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>


      {/* Modal for Exit Confirmation in Executed  */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.headerTitle}>{selectedOrder?.symbol?.split(':')[1]?.split(' ')[0] ?? '-'}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Text style={styles.headerClose}>✖</Text>
                </TouchableOpacity>
              </View>

              {/* Center Price Section */}
              {/* <View style={styles.priceSection}>
                <Text style={styles.mainPrice}> "NO"</Text>
                <Text style={styles.changePercentage}>%</Text>
              </View> */}

              {/* Max Position and Order Qty Labels */}
              <View style={styles.labelRow}>
                <Text style={styles.labelText}>LOT  :</Text>
                <Text style={styles.labelText}>QTY :</Text>
              </View>

              {/* Max Position and Order Qty Inputs */}
              <View style={styles.inputRow}>

                <TextInput
                  style={styles.inputBox}
                  placeholder="Lot"
                  keyboardType="numeric"
                  value={selectedOrder?.lotQty?.toString() ?? ''}
                  onChangeText={(text) => {
                    const lotValue = parseFloat(text) || 0;
                    setSelectedOrder({
                      ...selectedOrder,
                      lotQty: text,
                      remainingQty: (lotValue * LOT_TO_QTY_RATIO).toFixed(2)
                    });
                  }}
                  editable={true} />
                <TextInput
                  style={styles.inputBox}
                  placeholder="Qty"
                  keyboardType="numeric"
                  value={selectedOrder?.remainingQty?.toString() ?? ''}
                  onChangeText={(text) => {

                    const qtyValue = parseFloat(text) || 0;
                    setSelectedOrder({
                      ...selectedOrder,
                      remainingQty: text,
                      lotQty: (qtyValue / LOT_TO_QTY_RATIO).toFixed(2)
                    });
                  }}
                  editable={true} />
              </View>
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
              {/* Limit Price Input */}
              <View style={styles.priceInputContainer}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Enter Price"
                  keyboardType="numeric"
                  value={selectedOrder?.limitPrice?.toString() ?? ''}
                  onChangeText={(text) => setSelectedOrder({ ...selectedOrder, limitPrice: text })}
                  editable={false} />
              </View>
              {/* Buy / Sell Buttons */}
              <View style={styles.buySellRow}>
                {/* Sell Button - Disabled if orderSideName is "sell" */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: selectedOrder?.orderSideName?.toLowerCase() === 'sell' ? '#ffcccc' : 'red',
                      opacity: selectedOrder?.orderSideName?.toLowerCase() === 'sell' ? 0.6 : 1
                    }
                  ]}
                  onPress={() => handleSellNow(selectedOrder)}
                  disabled={selectedOrder?.orderSideName?.toLowerCase() === 'sell'}>
                  <Text style={styles.buttonText}>Sell Now @</Text>
                </TouchableOpacity>

                {/* Buy Button - Disabled if orderSideName is "buy" */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: selectedOrder?.orderSideName?.toLowerCase() === 'buy' ? '#ccffcc' : 'green',
                      opacity: selectedOrder?.orderSideName?.toLowerCase() === 'buy' ? 0.6 : 1
                    }
                  ]}
                  onPress={() => handleBuyNow(selectedOrder)}
                  disabled={selectedOrder?.orderSideName?.toLowerCase() === 'buy'}>
                  <Text style={styles.buttonText}>Buy Now @</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  marketIndicator: {
    fontSize: 12,
    color: '#666',
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
    // justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#03415A',
    paddingHorizontal: 10,
    height: 50,
  },
  backButton: {
    padding: 5,
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
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tab: {
    padding: 8,
    height: 35,
    marginHorizontal: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  activeTab: {
    backgroundColor: '#03415A',
  },
  tabText: {
    color: '#0d3b66',
    fontSize: 12,
    textAlign: 'center',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  noDataText: {
    fontSize: 16,
    color: '#0d3b66',
  },
  refreshText: {
    fontSize: 24,
    color: '#0d3b66',
    marginTop: 5,
  },
  center: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#d3d3d3',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',


  },
  headerCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    // height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  headersText: {
    fontWeight: 'bold',
    fontSize: 12,
    paddingHorizontal: 4,
    width: 80, // Fixed width for each column
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 15,
    alignItems: 'center',
    flexWrap: 'wrap',

  },
  checkboxCell: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsLoadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    width: '100%',
  },
  tabsLoadingText: {
    marginLeft: 10,
    color: '#03415A',
    fontSize: 14,
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
  card: {
    backgroundColor: '#f6f9fc',
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exitButton: {
    position: 'absolute',
    top: 5,
    left: 8,
    backgroundColor: '#E53935',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    zIndex: 10,
  },
  exitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  lotText: {
    fontSize: 12,
    color: '#8c8c8c',
    fontWeight: '600',
    top: 20
  },

  symbolBlock: {
    alignItems: 'center',
    left: 10,

  },

  symbolText: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#03415A',
  },

  dateText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },

  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#03415A',
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  dateTimeText: {
    fontSize: 11,
    color: '#444',
    top: 5
  },

  marketTag: {
    backgroundColor: '#007bff',
    borderRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
    right: 20
  },

  marketText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  qtyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8c8c8c',
  },
  pendingButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modifysButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#03415A',
    borderRadius: 8,
  },
  deleteButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f67a4b',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: 330,
    backgroundColor: "white",
    borderRadius: 15,
    overflow: "hidden"
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    left: -10,
    top: 10
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    top: 10
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modifyModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modifyModalContent: {
    backgroundColor: '#03415A',
    // padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  modifyModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
    textAlign: 'center',
    color: 'white'
  },
  firstRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  centerRow: {
    alignItems: 'center',
    marginBottom: 15,
  },
  modifyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    backgroundColor: '#BECDD3',
    paddingHorizontal: 5,
    borderRadius: 10
  },
  modifyLabel: {
    width: 50,
    fontSize: 16,
    textAlign: 'center',
    color: '#03415A'

  },
  modifyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  modifyButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  modifyButton: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
    minWidth: 300,
  },
  cancelModifyButton: {
    backgroundColor: '#f44336',
  },
  submitModifyButton: {
    backgroundColor: '#03415A',
  },
  modifyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: '#03415B',
    padding: 10
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: 'white'
  },
  headerClose: {
    fontSize: 18,
    color: 'white'
  },
  priceSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10
  },
  mainPrice: {
    fontSize: 25,
    fontWeight: "bold",
    color: '#03415B'
  },
  changePercentage: {
    fontSize: 12,
    color: "red",
    marginLeft: 5
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 5
  },
  labelText: {
    fontSize: 10,
    color: '#03415B',
    fontWeight: "bold"
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10
  },
  inputBox: {
    width: "45%",
    borderRadius: 8,
    backgroundColor: '#CDD9DE',
    fontSize: 12,
    paddingHorizontal: 10,
    color: '#03415B'
  },

  selectionContainer: {
    margin: 10,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'center'
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
  priceInputContainer: {
    alignItems: "center",
    marginVertical: 10
  },
  priceInput: {
    width: '90%',
    borderRadius: 8,
    backgroundColor: '#CDD9DE',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#03415B',
    textAlign: 'center',
    paddingVertical: 6
  },
  buySellRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: 'bold',

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

export default Tradesscreen;
