import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from './UserContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const FilterDrawerContent = ({ onApplyFilters, initialFilters = {} }) => {

  const meData = React.useContext(UserContext);
  const navigation = useNavigation();

  const [selectedMarket, setSelectedMarket] = useState(initialFilters.market || '');
  const [fromDate, setFromDate] = useState(initialFilters.fromDate || '');
  const [toDate, setToDate] = useState(initialFilters.toDate || '');
  const [marketModalVisible, setMarketModalVisible] = useState(false);
  const [marketList, setMarketList] = useState(['NSE', 'MCX']);
  const [searchMarket, setSearchMarket] = useState('');
  const [isReset, setIsReset] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [isFromDate, setIsFromDate] = useState(true); // true = from, false = to

  const handleReset = () => {
    setSelectedMarket('');
    setFromDate(null);
    setToDate(null);
    setIsReset(true);
    if (onApplyFilters) {
      onApplyFilters({ market: '', fromDate: '', toDate: '' });
    }
  };

  const handleApply = () => {
    const appliedFilters = {
      market: selectedMarket,
      fromDate,
      toDate
    };
    // Check if onApplyFilters exists before calling it
    if (onApplyFilters) {
      onApplyFilters(appliedFilters);
    }
    // navigation.dispatch(DrawerActions.closeDrawer());
    setIsReset(false); // Just update the UI state
  };

  // Add a useEffect to initialize the marketList from meData when the component mounts
  useEffect(() => {
    try {
      console.log('Initializing market list from meData');
      if (meData && meData.watchList) {
        const marketNames = Object.keys(meData.watchList).map(key => key.split(':')[1]);
        if (marketNames && marketNames.length > 0) {
          setMarketList(marketNames);
          console.log('Market list initialized from meData:', marketNames);

          // If no market is selected, select the first one
          if (!selectedMarket && initialFilters.market === undefined) {
            setSelectedMarket(marketNames[0]);
            console.log('Setting default market type:', marketNames[0]);
          }
        }
      } else {
        console.log('meData or watchList is null, using default market list');
      }
    } catch (error) {
      console.error('Error initializing market list:', error);
    }
  }, [meData]);

  // date picker show
  const onDateSelect = (day) => {
    const formattedDate = moment(day.dateString).format('DD-MM-YYYY');
    if (isFromDate) {
      setFromDate(formattedDate);
    } else {
      setToDate(formattedDate);
    }
    setCalendarVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Filter</Text>
      </View>

      {/* Calendar Modal */}
      <Modal visible={calendarVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.calendarBox}>
            <Calendar
              onDayPress={onDateSelect}
              markedDates={{
                [moment(isFromDate ? fromDate : toDate, 'DD-MM-YYYY').format('YYYY-MM-DD')]: {
                  selected: true,
                  selectedColor: '#03415A',
                },
              }}
              theme={{
                selectedDayTextColor: '#fff',
                arrowColor: '#03415A',
                textSectionTitleColor: '#03415A',
              }}
            />
            <TouchableOpacity onPress={() => setCalendarVisible(false)} style={styles.closeCalendarBtn}>
              <Text style={styles.closeCalendarText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Market Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Market Type</Text>
          <TouchableOpacity style={styles.selectInput} onPress={() => {
            try {
              // Safely access meData and watchList with proper null checks
              if (meData && meData.watchList) {
                const marketNames = Object.keys(meData.watchList).map(key => key.split(':')[1]);
                if (marketNames && marketNames.length > 0) {
                  setMarketList(marketNames);
                  console.log('Market list set from meData:', marketNames);
                } else {
                  // Fallback if no market names found
                  setMarketList(['NSE', 'MCX']);
                  console.log('Using default market list: NSE, MCX (no markets in meData)');
                }
              } else {
                // Fallback if meData or watchList is null/undefined
                setMarketList(['NSE', 'MCX']);
                console.log('Using default market list: NSE, MCX (meData or watchList is null)');
              }
              // Open the modal after setting the market list
              setMarketModalVisible(true);
            } catch (error) {
              console.error('Error setting market list:', error);
              // Fallback in case of any error
              setMarketList(['NSE', 'MCX']);
              setMarketModalVisible(true);
            }
          }} >
            <Text style={selectedMarket ? styles.selectText : styles.placeholderText}>
              {selectedMarket || 'Select Market Type'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="black" />
          </TouchableOpacity>
        </View>

        {/* From Date */}
        <View style={styles.section}>
          <Text style={styles.label}>From Date</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => {
              setIsFromDate(true);
              setCalendarVisible(true);
            }}
          >
            <Text style={fromDate ? styles.selectText : styles.placeholderText}>
              {fromDate || 'Select From Date'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* To Date */}
        <View style={styles.section}>
          <Text style={styles.label}>To Date</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => {
              setIsFromDate(false);
              setCalendarVisible(true);
            }}
          >
            <Text style={toDate ? styles.selectText : styles.placeholderText}>
              {toDate || 'Select To Date'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.resetButton,
            isReset && { backgroundColor: '#03415A' },
          ]}
          onPress={handleReset}
        >
          <Text
            style={[
              styles.resetButtonText,
              isReset && { color: '#fff' },
            ]}
          >
            Reset
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.applyButton,
            isReset && { backgroundColor: 'transparent' },
          ]}
          onPress={handleApply}
        >
          <Text
            style={[
              styles.applyButtonText,
              isReset && { color: '#03415A' },
            ]}
          >
            Apply
          </Text>
        </TouchableOpacity>
      </View>

      {/* market model */}
      <Modal
        visible={marketModalVisible}
        transparent
        animationType="slide" // <-- slide from bottom
        onRequestClose={() => setMarketModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <Text style={styles.modalTitle}>Select Market Type</Text>

            {/* Search Box */}
            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color="#aaa" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Market Type"
                value={searchMarket}
                onChangeText={(text) => setSearchMarket(text)}

              />
            </View>

            {/* List of Markets */}
            <ScrollView>
              {marketList && marketList.length > 0 ? (
                marketList
                  .filter((item) =>
                    item && typeof item === 'string' &&
                    item.toLowerCase().includes((searchMarket || '').toLowerCase())
                  )
                  .map((market, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.marketItem}
                      onPress={() => {
                        setSelectedMarket(market);
                        setMarketModalVisible(false); // close modal
                        setSearchMarket(''); // clear search
                      }}
                    >
                      <Text style={styles.marketText}>{market}</Text>
                    </TouchableOpacity>
                  ))
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No market types available</Text>
                </View>
              )}
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => {
                setMarketModalVisible(false);
                setSearchMarket(''); // Clear search when closing
              }}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default FilterDrawerContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomColor: '#1E556E',
    borderBottomWidth: 1,
    backgroundColor: '#03415A',
    borderTopLeftRadius: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 10,
  },
  section: {
    marginBottom: 10,
  },
  label: {
    color: '#03415A',
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectInput: {
    backgroundColor: '#BECDD3',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    color: '#03415A',
    fontSize: 16,
    textAlign: 'center',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginTop: 5,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#03415A',
  },

  placeholderText: {
    color: '#03415A',
    fontSize: 15,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  resetButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  applyButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#03415A',
    alignItems: 'center',
    marginLeft: 10,
  },
  resetButtonText: {
    color: '#03415A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
  },
  closeCalendarBtn: {
    marginTop: 10,
    alignItems: 'center',
  },
  closeCalendarText: {
    color: '#03415A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#03415A',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#03415A',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
  },
  marketItem: {
    paddingVertical: 12,
  },
  marketText: {
    fontSize: 16,
    color: '#03415A',
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  closeModalButton: {
    backgroundColor: '#03415A',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
