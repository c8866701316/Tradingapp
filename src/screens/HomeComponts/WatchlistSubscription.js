import React, { useEffect, useRef } from "react";
import ConnectSignalR from "../../Websocket/ConnectSignalR";

const WatchlistSubscription = ({ currentScripts }) => {
    const prevScriptsRef = useRef([]);

    useEffect(() => {
        const connection = async () => {
            if (!currentScripts || currentScripts.length === 0) {
                if (prevScriptsRef.current.length > 0) {
                    try {
                        await ConnectSignalR.invoke("OnUnsubscribeNew", prevScriptsRef.current);
                        console.log("Unsubscribed from previous scripts:", prevScriptsRef.current);
                        prevScriptsRef.current = [];
                    } catch (error) {
                        console.error("Error unsubscribing previous scripts:", error);
                    }
                }
                return;
            }
            try {
                if (prevScriptsRef.current.length > 0) {
                    await ConnectSignalR.invoke("OnUnsubscribeNew", prevScriptsRef.current);
                    console.log("Unsubscribed from previous scripts:", prevScriptsRef.current);
                }
                await ConnectSignalR.invoke("OnSubscribeNew", currentScripts);
                console.log("Subscribed to new scripts:", currentScripts);
                prevScriptsRef.current = currentScripts;
            } catch (error) {
                console.error("Error in SignalR subscription:", error);
            }
        };
        connection();
    }, [currentScripts]);

    return null;
};

export default WatchlistSubscription;