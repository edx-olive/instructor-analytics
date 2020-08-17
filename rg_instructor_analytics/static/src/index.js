import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { ThemeProvider } from "@material-ui/core/styles";
import App from "./AdditionalInfoTab";

import store from "./AdditionalInfoTab/data/setupStore";
import "./index.css";
import theme from "./setupTheme";

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <Provider store={store}>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </Provider>
  </ThemeProvider>,
  document.getElementById("add-info-tab")
);
