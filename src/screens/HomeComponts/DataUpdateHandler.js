import React, { useEffect, useState, useCallback } from "react";
import ConnectSignalR from "../../Websocket/ConnectSignalR";


const DataUpdateHandler = ({ selectedTabs, setData, selectedItem, setSelectedItem }) => {
  const [ignore, setIgnore] = useState(false);

  const debouncedHandleNewData = useCallback(
    (newData) => {
      if (!newData?.s || !selectedTabs) {
        console.log("Invalid data or selectedTabs:", { newData, selectedTabs });
        return;
      }

      const watchlistPrefix = newData.s.split(":")[0];
      if (watchlistPrefix !== selectedTabs) {
        console.log(`Ignoring update for ${newData.s}, current watchlist: ${selectedTabs}`);
        return;
      }
      console.log(`Processing update for ${newData.s}`);
      setData((prevData) => {
        const existingIndex = prevData.findIndex((item) => item.es === newData.es);
        if (existingIndex === -1) {
          return [
            ...prevData,
            {
              ...newData,
              bidPriceColor: "black",
              askPriceColor: "black",
              highPriceColor: "black",
              lowPriceColor: "black",
            },
          ];
        }
        const prevItem = prevData[existingIndex];
        const newBidPrice = parseFloat(newData?.bp) || 0;
        const prevBidPrice = parseFloat(prevItem?.bp) || 0;
        const newAskPrice = parseFloat(newData?.ap) || 0;
        const prevAskPrice = parseFloat(prevItem?.ap) || 0;
        const prevLowPrice = parseFloat(prevItem?.lp) || 0;
        const newLowPrice = parseFloat(newData?.lp) || 0;
        const prevHighPrice = parseFloat(prevItem?.hp) || 0;
        const newHighPrice = parseFloat(newData?.hp) || 0;

        newData.bidPriceColor =
          newBidPrice > prevBidPrice ? "green" : newBidPrice < prevBidPrice ? "red" : prevItem.bidPriceColor;
        newData.askPriceColor =
          newAskPrice > prevAskPrice ? "green" : newAskPrice < prevAskPrice ? "red" : prevItem.askPriceColor;
        newData.highPriceColor =
          newHighPrice > prevHighPrice ? "green" : newHighPrice < prevHighPrice ? "red" : prevItem.highPriceColor;
        newData.lowPriceColor =
          newLowPrice < prevLowPrice ? "red" : newLowPrice > prevLowPrice ? "green" : prevItem.lowPriceColor;

        const updatedData = [...prevData];
        updatedData[existingIndex] = newData;

        return updatedData;
      });
      if (selectedItem?.es === newData.es) {
        setSelectedItem(newData);
      }
    },
    [selectedItem, selectedTabs]
  );

  useEffect(() => {
    ConnectSignalR.on("ReceiveSubscribedScriptUpdateList", (newData) => {
      if (!selectedTabs) return;
      const filteredData = newData.filter((item) => item.s && item.s.split(":")[0] === selectedTabs);
      console.log(`Received initial data for ${selectedTabs}:`, filteredData);
      setData(filteredData);
      setIgnore(false);
    });
    ConnectSignalR.on("ReceiveSubscribedScriptUpdate", debouncedHandleNewData);

    return () => {
      ConnectSignalR.off("ReceiveSubscribedScriptUpdateList");
      ConnectSignalR.off("ReceiveSubscribedScriptUpdate");
    };
  }, [selectedTabs, debouncedHandleNewData]);

  return null;
};

export default DataUpdateHandler;