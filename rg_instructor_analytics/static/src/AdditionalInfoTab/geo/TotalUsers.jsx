import React from "react";
import PropTypes from "prop-types";
import * as R from "ramda";
import { makeStyles } from "@material-ui/core/styles";
import { Box, Typography } from "@material-ui/core";

// eslint-disable-next-line
const useStyles = makeStyles(theme => ({
  box: {},
  textBold: {
    fontWeight: 600
  }
}));

export const TotalUsers = ({ value }) => {
  const classes = useStyles();
  const formattedValue = value && value.toLocaleString("us-US");
  return R.isNil(formattedValue) ? null : (
    <Box className={classes.box}>
      <Typography component="span">{"Total Users: "}</Typography>
      <Typography component="span" className={classes.textBold}>
        {formattedValue}
      </Typography>
    </Box>
  );
};

TotalUsers.propTypes = {
  value: PropTypes.number
};

export default TotalUsers;
