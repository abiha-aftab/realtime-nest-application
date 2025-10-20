<h2> Real-Time Data Application (NestJS + React)</h2> 
<h3>📘 Overview</h3>

This project showcases real-time data streaming using NestJS (backend) and React (frontend) with Socket.IO.
The NestJS backend receives live data through a WebSocket connection, applies simple processing (for example, filtering out low values and tagging high ones as “high severity”), and emits the processed results to all connected clients.
The React frontend connects to this WebSocket, listens for updates, and displays the live processed data in an automatically updating list.

<h4>⚙️ Run Locally</h4>
<h5>Backend (NestJS)</h5>
cd backend<br>
npm install<br>
npm run start:dev<br>


<h5>Frontend (React)</h5>
cd frontend<br>
npm install<br>
npm start<br>

REACT_APP_SOCKET_URL=wss://livedatastreamr-b41f15833fef.herokuapp.com

<h4>🌍 Live Demo</h4>

<b> Runs on: https://livedatastreamr-b41f15833fef.herokuapp.com/ </b> <br>
Open the frontend to see real-time processed data streaming from the backend every few seconds — values above 50 are displayed with a timestamp and severity label.
