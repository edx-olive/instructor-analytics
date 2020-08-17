import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Typography } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  heading: {
    fontSize: "1rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "-1px",
    marginBottom: "-8px"
  },
  subheading: {
    fontWeight: 600
  },
  text: {
    fontWeight: 300
  },
  chart: {
    marginTop: theme.spacing(4)
  }
}));

export const Section = ({ heading, subheading, text, children }) => {
  const classes = useStyles();

  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <Typography variant="h6" className={classes.heading}>
          {heading}
        </Typography>
        <hr />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle2" className={classes.subheading}>
          {subheading}
        </Typography>
        <Typography variant="body2" className={classes.text}>
          {text}
        </Typography>
      </Grid>
      <Grid item xs={12} className={classes.chart}>
        {children}
      </Grid>
    </Grid>
  );
};

Section.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  text: PropTypes.string
};

export default Section;
