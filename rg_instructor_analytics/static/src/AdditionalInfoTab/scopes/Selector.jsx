import React from "react";
import * as R from "ramda";
import { FormControl, Select } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import { useDispatch, useSelector } from "react-redux";
import { courseToggling, siteToggling } from "./data/actions";
import MuiMenuItem from "@material-ui/core/MenuItem";
import { withStyles } from "@material-ui/core/styles";
import { isRtl } from "../rtl";


const useStyles = makeStyles(theme => ({
  select: {
    border: `2px solid ${theme.palette.primary.main}`,
    padding: 12
  }
}));

const MenuItem = withStyles({
  root: {
    justifyContent: isRtl ? "flex-end" : "flex-start"
  }
})(MuiMenuItem);

const Selector = ({ items, label }) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { scopes, scope, course, site } = useSelector(state => state.scopes);

  return (
    <FormControl fullWidth variant="outlined">
      <Select
        labelId="items-selector-label"
        id="items-selector"
        value={scope === scopes.course ? course : site}
        onChange={evt =>
          dispatch(
            scope === scopes.course
              ? courseToggling(evt.target.value)
              : siteToggling(evt.target.value)
          )
        }
        label={label}
        autoFocus
        classes={{ outlined: classes.select }}
      >
        {R.map(
          item => (
            <MenuItem key={item.id} value={item.id}>
              {item.name}
            </MenuItem>
          ),
          items
        )}
      </Select>
    </FormControl>
  );
};

Selector.propTypes = {};

export default Selector;
