import * as SignalR from '@microsoft/signalr';
import * as signalRMsgPack from "@microsoft/signalr-protocol-msgpack";
import "react-native-url-polyfill/auto";
import {  getUserDetails } from '../Apicall/Axios';
import Config from 'react-native-config';
import { Alert } from 'react-native';


// const token = saveToken;
// console.log("token",token);

    // accessTokenFactory: () => token,
    // accessTokenFactory: async () => {
    //   const token = await getToken();
    //   if (!token) {
    //     console.error("Failed to retrieve token. Connection may fail.");
    //   }
    //   return token || "";
    // },

    // const staticToken = "eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IkVBQUQ4Q0UwLUQxRUEtNEM0RS05MUQxLTVDRjkyNzM5NkEyMCIsIm5hbWUiOiJQYXJ0aCIsImp0aSI6ImVmMTlhNTJmLWMwZDEtNDg0Ni1iZWJlLTNmY2JiMzU4Y2QwMCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkNsaWVudCIsInJlZklkIjoiZmUxYjc5MmQtNGE2OS00ZjNlLTkyZjUtZTliNDIyYmI1NTEzIiwiaXNSZXNldFBhc3N3b3JkIjoiRmFsc2UiLCJleHAiOjE3Mzc4MDE1NDksImlzcyI6IkFsZ29TY3JpcHQuSW4iLCJhdWQiOiJBbGdvU2NyaXB0LkluIn0.8aelzs0i7pGhB3JC1ycx9KMeDll44jByYjnAINXytFk"
    // const staticToken = "eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IkVBQUQ4Q0UwLUQxRUEtNEM0RS05MUQxLTVDRjkyNzM5NkEyMCIsIm5hbWUiOiJQYXJ0aCIsImp0aSI6ImVmMTlhNTJmLWMwZDEtNDg0Ni1iZWJlLTNmY2JiMzU4Y2QwMCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkNsaWVudCIsInJlZklkIjoiZmUxYjc5MmQtNGE2OS00ZjNlLTkyZjUtZTliNDIyYmI1NTEzIiwiaXNSZXNldFBhc3N3b3JkIjoiRmFsc2UiLCJleHAiOjE3Mzc4MDE1NDksImlzcyI6IkFsZ29TY3JpcHQuSW4iLCJhdWQiOiJBbGdvU2NyaXB0LkluIn0.8aelzs0i7pGhB3JC1ycx9KMeDll44jByYjnAINXytFk"

  const ConnectSignalR = new SignalR.HubConnectionBuilder()
  .withUrl("https://tradep.clustersofttech.com/signalRHub", {                
    // accessTokenFac tory: () => token,
    accessTokenFactory: async () => {
      const token = await getUserDetails();
      if (!token) {
        // console.error("Failed to retrieve token. Connection may fail.");
      }
      return token?.accessToken || "";
    },
    // skipNegotiation: true,
    transport: SignalR.HttpTransportType.WebSockets,
  })
  
  .withHubProtocol(new signalRMsgPack.MessagePackHubProtocol())
  .withAutomaticReconnect()
  .configureLogging(SignalR.LogLevel.Information)

  .build();


  // Example of handling a specific event
ConnectSignalR.on("ReceiveMessage", (message) => {
  console.log("Received message:", message);
});

ConnectSignalR.onclose(() => {
  console.log("Connection closed. Attempting to reconnect...");
  // ConnectSignalR.start();
});

ConnectSignalR.onreconnecting(() => {
  console.log("signalr is recoonecting");
});
ConnectSignalR.onreconnected(() => {
  console.log("signalr is reconnected");
});

export default ConnectSignalR;
