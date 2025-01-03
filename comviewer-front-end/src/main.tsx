import App from "@/App.tsx";
import {persistor, store} from "@/redux/store.ts";
import React from "react";
import ReactDOM from "react-dom/client";
import {Provider} from "react-redux";
import {PersistGate} from "redux-persist/integration/react";
import "virtual:windi.css";
import "./index.scss";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Provider store={store}>
            <PersistGate persistor={persistor}>
                <App/>
            </PersistGate>
        </Provider>
    </React.StrictMode>,
);
