import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WIN_HEIGHT, WIN_WIDTH } from '../constant/constant'; // Adjust the path if necessary

const WatchListItem = memo(({ item, priceChanges, highLowPriceChanges }) => {

  
  const askPriceColor = priceChanges[item?.s]?.askPriceColor;
  const bidPriceColor = priceChanges[item?.s]?.bidPriceColor;
  const highPriceColor = highLowPriceChanges[item?.s]?.highPriceColor;
  return (  
    <View style={styles.container}>
      <View style={[styles.itemContainer, { backgroundColor: highPriceColor || '#F2F2F2' }]}>
        <View style={styles.leftColumn}>
          <View style={styles.row}>
            <Text style={styles.itemName}>{item?.es}</Text>
            <Text style={styles.itemDetails}>{`(${item?.ed})`}</Text>
          </View>
          <Text style={styles.change}>{`${item?.ch} (${item?.chp}%)`}</Text>
          <Text style={styles.time}>{'15:33:37'}</Text>
        </View>
        <View style={styles.middleColumn}>
          <View style={styles.row}>
            <Text style={styles.label}>{'LTP: '}</Text>
            <Text style={styles.ltp}>{`${item?.ltp}`}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{'S: '}</Text>
            <Text style={[styles.price, { color:  bidPriceColor }]}>{`${item?.bp}`}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{'L: '}</Text>
            <Text style={styles.price}>{`${item?.lp}`}</Text>
          </View>
        </View>
        <View style={styles.rightColumn}>
          <View style={styles.row}>
            <Text style={styles.label}>{'Qty: '}</Text>
            <Text style={styles.qty}>{`0.00`}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{'B: '}</Text>
            <Text style={[styles.price, { color: askPriceColor }]}>{`${item?.ap}`}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{'H: '}</Text>
            <Text style={styles.price}>{`${item?.hp}`}</Text>
          </View>
        </View>
      </View>
      <View style={styles.separator} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: (WIN_WIDTH * 98) / 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    height: (WIN_HEIGHT * 9) / 100,
    marginTop: 1,
    width: (WIN_WIDTH * 98) / 100,
    paddingVertical: (WIN_HEIGHT * 0.5) / 100,
  },
  leftColumn: {
    flexDirection: 'column',
    width: (WIN_WIDTH * 40) / 100,
    marginLeft: (WIN_WIDTH * 3) / 100,
  },
  middleColumn: {
    flexDirection: 'column',
    marginLeft: (WIN_WIDTH * 1) / 100,
    width: (WIN_WIDTH * 28) / 100,
  },
  rightColumn: {
    flexDirection: 'column',
    marginLeft: (WIN_WIDTH * 1) / 100,
    width: (WIN_WIDTH * 27.5) / 100,
  },
  row: {
    flexDirection: 'row',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemDetails: {
    fontSize: 13,
    fontWeight: '600',
  },
  change: {
    marginTop: (WIN_HEIGHT * 1) / 100,
    fontSize: 14,
  },
  time: {
    fontSize: 13,
    marginTop: (WIN_HEIGHT * 1.2) / 100,
  },
  label: {
    fontSize: 13,
    alignSelf: 'center',
  },
  ltp: {
    fontWeight: '700',
    fontSize: 14,
  },
  price: {
    fontWeight: '700',
    fontSize: 15,
    padding: 2,
  },
  qty: {
    fontWeight: '700',
    fontSize: 13,
  },
  separator: {
    borderWidth: 0.5,
    width: (WIN_WIDTH * 98) / 100,
    marginVertical: (WIN_HEIGHT * 1) / 100,
  },
});

export default WatchListItem;
