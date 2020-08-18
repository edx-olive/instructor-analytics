import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import { Box, Typography } from "@material-ui/core";
import { gettext as _ } from "../../setupAPI";

const useStyles = makeStyles({
  external: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  inner: {},
  text: {
    fontWeight: 300,
    fontSize: "1rem",
    textTransform: "uppercase"
  }
});

export const Empty = ({ text = _("no data available"), height = 300 }) => {
  const classes = useStyles();

  return (
    <Box height={height} className={classes.external}>
      <Box className={classes.inner}>
        <Typography variant="h6" color="secondary" className={classes.text}>
          {text}
        </Typography>
      </Box>
    </Box>
  );
};

Empty.propTypes = {
  height: PropTypes.number,
  text: PropTypes.string
};

export default Empty;
