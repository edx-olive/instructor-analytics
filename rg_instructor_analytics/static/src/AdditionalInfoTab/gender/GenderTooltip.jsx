import React from "react";
import PropTypes from "prop-types";
import * as R from "ramda";
import { makeStyles } from "@material-ui/core/styles";
import { Box, Typography } from "@material-ui/core";
import { gettext as _ } from "../../setupAPI";

const useStyles = makeStyles(theme => ({
  box: {
    backgroundColor: theme.palette.common.white
  },
  textBold: {
    fontWeight: 600
  }
}));

export const GenderTooltip = ({ id, value, data = {}, abs_data = {} }) => {
  const classes = useStyles();
  const formattedPercent = `${value}%`;

  const targetValue = R.find(R.propEq("label", id))(R.values(abs_data));
  const absValue = targetValue.abs_value || "";

  return (
    <Box className={classes.box}>
      <div>
        <Typography className={classes.textBold}>{id}</Typography>
      </div>
      <div>
        <Typography component="span">{_("Users: ")}</Typography>
        <Typography component="span" className={classes.textBold}>
          {absValue}
        </Typography>
        <Typography component="span">
          {" | "}
          {formattedPercent}
        </Typography>
      </div>
    </Box>
  );
};

GenderTooltip.propTypes = {
  id: PropTypes.string,
  value: PropTypes.number,
  data: PropTypes.object,
  abs_data: PropTypes.object
};

export default GenderTooltip;
