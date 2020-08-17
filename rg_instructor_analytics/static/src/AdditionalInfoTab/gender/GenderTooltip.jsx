import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import { Box, Typography } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  box: {
    backgroundColor: theme.palette.common.white
  },
  textBold: {
    fontWeight: 600
  }
}));

export const GenderTooltip = ({ id, value, data = {} }) => {
  const classes = useStyles();
  const formattedPercent = `${value}%`;

  return (
    <Box className={classes.box}>
      <div>
        <Typography className={classes.textBold}>{id}</Typography>
      </div>
      <div>
        <Typography component="span">{"Users: "}</Typography>
        <Typography component="span" className={classes.textBold}>
          {data[id]}
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
  data: PropTypes.object
};

export default GenderTooltip;
