import React from "react";
import PropTypes from "prop-types";
import * as R from "ramda";
import { Bar } from "@nivo/bar";
import { Grid, Box, makeStyles, useTheme } from "@material-ui/core";
import GenderTooltip from "./GenderTooltip";
import maleImg from "./img/male.svg";
import femaleImg from "./img/female.svg";

const useStyles = makeStyles(theme => ({
  box: {
    display: "flex",
    justifyContent: "center",
    marginTop: theme.spacing(10)
  },
  wrapper: {
    borderLeft: `2px solid ${theme.palette.grey[500]}`,
    borderRight: `2px solid ${theme.palette.grey[500]}`,
    width: "100%",
    minHeight: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    // Chart legend:
    "& div svg": {
      overflow: "visible !important"
    },
    "& div svg g text": {
      textTransform: "uppercase !important",
      fontWeight: "600 !important",
      letterSpacing: "0px !important"
    }
  },
  labels: {
    fontWeight: 600
  },
  male: {
    backgroundImage: `url(${maleImg})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center"
  },
  female: {
    backgroundImage: `url(${femaleImg})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center"
  }
}));

export const StackedBarChart = ({ data = {} }) => {
  const theme = useTheme();
  const classes = useStyles();

  // Remove meta info & empty values
  const cleanData = R.omit(["total", "unknown"], data);
  const nonEmptyData = R.pickBy((v, k) => !R.equals(v.abs_value, 0), cleanData);

  // Prepare data for chart:
  const chartData = { id: "gender" };
  R.forEach(key => {
    chartData[nonEmptyData[key].label] = nonEmptyData[key].value;
  }, R.keys(nonEmptyData));

  const legendConf = {
    dataFrom: "keys",
    anchor: "bottom",
    direction: "row",
    itemWidth: 150,
    itemHeight: 40,
    itemDirection: "left-to-right",
    translateX: 40,
    translateY: 80
  };

  const makeLabels = item => `${item.value}%`;
  const makeTooltip = ({ id, value, data }) => (
    <GenderTooltip id={id} value={value} data={data} abs_data={nonEmptyData} />
  );

  // Pin colors according to categories:
  const colors = {
    m: theme.palette.primary.main,
    f: theme.palette.secondary.main,
    o: theme.palette.grey[500]
  };
  const getColors = cleanData => R.values(R.pick(R.keys(cleanData), colors));

  return (
    <Box className={classes.box}>
      <Grid container spacing={1}>
        <Grid item xs={1} className={classes.male} />
        <Grid item xs={10}>
          <div className={classes.wrapper}>
            <Bar
              data={[chartData]}
              keys={R.keys(chartData)}
              width={400}
              height={50}
              padding={0.1}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              layout="horizontal"
              enableGridX={false}
              colors={getColors(nonEmptyData)}
              borderRadius={2}
              innerPadding={1}
              label={makeLabels}
              axisLeft={null}
              axisBottom={null}
              legends={[legendConf]}
              tooltip={makeTooltip}
            />
          </div>
        </Grid>
        <Grid item xs={1} className={classes.female} />
      </Grid>
    </Box>
  );
};

StackedBarChart.propTypes = {
  data: PropTypes.object
};

export default StackedBarChart;
