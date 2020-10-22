import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import { Box, Typography } from "@material-ui/core";
import { gettext as _ } from "../../setupAPI";

const useStyles = makeStyles(theme => ({
  box: {
    background: "#FFFFFF 0% 0% no-repeat padding-box",
    padding: 4,
    boxShadow: "0px 0px 10px #00000033;",
    borderRadius: 5,
    opacity: 1,
  },
  textBold: {
    fontWeight: 600,
    fontSize: 14,
    fontFamily: "Exo",
    letterSpacing: 0,
    color: "#3F3F3F",
    opacity: 1
  },
  textNormal: {
    fontWeight: 300,
    fontSize: 14,
    fontFamily: "Exo",
    letterSpacing: 0,
    color: "#3F3F3F",
    opacity: 1
  }
}));

export const MapTooltip = ({ id, name, value, percent }) => {
  const classes = useStyles();
  const formattedValue = value && value.toLocaleString("us-US");
  const formattedPercent = `${percent}%`;
  return (
    <Box className={classes.box}>
      <div>
        <Typography className={classes.textBold}>{name || id}</Typography>
      </div>
      <div>
        <Typography component="span" className={classes.textNormal}>{_("Users: ")}</Typography>
        <Typography component="span" className={classes.textBold}>
          {formattedValue}
        </Typography>
      </div>
    </Box>
  );
};

MapTooltip.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.number,
  percent: PropTypes.number
};

export default MapTooltip;
