import React from "react";
import { Button, makeStyles } from "@material-ui/core";
import MuiButtonGroup from "@material-ui/core/ButtonGroup";
import { withStyles } from "@material-ui/core/styles";
import * as R from "ramda";
import { useDispatch } from "react-redux";
import { scopeToggling } from "./data/actions";
import * as PropTypes from "prop-types";
import { isRtl } from "../rtl";


// eslint-disable-next-line
const useStyles = makeStyles(theme => ({
  activeBtn: {
    color: theme.palette.common.white
  }
}));

const ButtonGroup = withStyles({
  root: {
    flexDirection: isRtl ? "row-reverse" : "row"
  }
})(MuiButtonGroup);

const Switch = ({ items, activeItem, size }) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const getVariant = item => (item === activeItem ? "contained" : "outlined");

  return (
    <ButtonGroup
      size={size}
      color="primary"
      aria-label="large outlined primary button group"
      disableElevation
    >
      {R.map(
        item => (
          <Button
            key={item}
            variant={getVariant(item)}
            component="span"
            onClick={() => dispatch(scopeToggling(item))}
            classes={{ containedPrimary: classes.activeBtn }}
          >
            {item}
          </Button>
        ),
        items
      )}
    </ButtonGroup>
  );
};

Switch.propTypes = {
  items: PropTypes.array.isRequired,
  activeItem: PropTypes.string,
  size: PropTypes.string
};

export default Switch;
