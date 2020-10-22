import React from "react";
import PropTypes from "prop-types";
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

export const EducationTooltip = ({ label, value, abs_value }) => {
  const classes = useStyles();
  const formattedPercent = `${value}%`;

  return (
    <Box className={classes.box}>
      <div>
        <Typography className={classes.textBold}>{label}</Typography>
      </div>
      <div>
        <Typography component="span">{_("Users: ")}</Typography>
        <Typography component="span" className={classes.textBold}>
          {abs_value}
        </Typography>
        <Typography component="span">
          {" | "}
          {formattedPercent}
        </Typography>
      </div>
    </Box>
  );
};

EducationTooltip.propTypes = {
  id: PropTypes.string,
  value: PropTypes.number,
  data: PropTypes.object
};

export default EducationTooltip;
