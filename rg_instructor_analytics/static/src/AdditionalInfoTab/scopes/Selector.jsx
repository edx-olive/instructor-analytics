import React from "react";
import * as R from "ramda";
import { FormControl, MenuItem, Select } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import { useDispatch, useSelector } from "react-redux";
import { courseToggling, siteToggling } from "./data/actions";

const useStyles = makeStyles(theme => ({
  formControl: {
    margin: 8
  }
}));

const Selector = ({ items, label }) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { scopes, scope, course, site } = useSelector(state => state.scopes);
  return (
    <FormControl fullWidth variant="outlined" className={classes.formControl}>
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
