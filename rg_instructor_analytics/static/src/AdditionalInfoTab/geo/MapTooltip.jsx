import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import { Box, Typography } from "@material-ui/core";
import { gettext as _ } from "../../setupAPI";

const useStyles = makeStyles(theme => ({
  box: {
    backgroundColor: theme.palette.common.white,
    padding: 4,
    boxShadow: "1px 1px 1px 2px gray"
  },
  textBold: {
    fontWeight: 600
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
        <Typography component="span">{_("Users: ")}</Typography>
        <Typography component="span" className={classes.textBold}>
          {formattedValue}
        </Typography>
        <Typography component="span">
          {" | "}
          {formattedPercent}
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
