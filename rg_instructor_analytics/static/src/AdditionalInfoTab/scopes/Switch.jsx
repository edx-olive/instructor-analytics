import React from "react";
import { Button, ButtonGroup, makeStyles } from "@material-ui/core";
import * as R from "ramda";
import { useDispatch } from "react-redux";
import { scopeToggling } from "./data/actions";
import * as PropTypes from "prop-types";

// eslint-disable-next-line
const useStyles = makeStyles(theme => ({
  activeBtn: {
    backgroundColor: "#0075b4 !important",
    color: "#fff !important",
    transition: "0.2s",
    boxShadow: "none !important",
    textShadow: "none !important"
  }
}));

const Switch = ({ items, activeItem, size }) => {
  const dispatch = useDispatch();
  const getVariant = item => (item === activeItem ? "contained" : "outlined");

  return (
    <ButtonGroup
      size={size}
      color="primary"
      aria-label="large outlined primary button group"
    >
      {R.map(
        item => (
          <Button
            key={item}
            variant={getVariant(item)}
            component="span"
            onClick={() => dispatch(scopeToggling(item))}
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
