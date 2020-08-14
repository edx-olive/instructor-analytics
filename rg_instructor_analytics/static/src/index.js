import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./AdditionalInfoTab";
import { CssBaseline } from "@material-ui/core";
import store from "./AdditionalInfoTab/data/store";
import Provider from "react-redux/es/components/Provider";

ReactDOM.render(
  <Provider store={store}>
    <React.StrictMode>
      <CssBaseline />
      <App />
    </React.StrictMode>
  </Provider>,
  document.getElementById("add-info-tab")
);
