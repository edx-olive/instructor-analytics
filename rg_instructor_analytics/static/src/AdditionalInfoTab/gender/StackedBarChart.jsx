import React from "react";
import PropTypes from "prop-types";
import * as R from "ramda";
import { Bar } from "@nivo/bar";
import { Grid, Box, makeStyles, useTheme } from "@material-ui/core";
import GenderTooltip from "./GenderTooltip";
import maleImg from "./img/male.svg";
import femaleImg from "./img/female.svg";
import { isRtl } from "../rtl";


const useStyles = makeStyles(theme => ({
  box: {
    display: "flex",
    justifyContent: "center",
    marginTop: theme.spacing(10),
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
  },
  wrapper: {
    borderLeft: `2px solid ${theme.palette.grey[500]}`,
    borderRight: `2px solid ${theme.palette.grey[500]}`,
    width: theme.spacing(36),
    minHeight: 80,
    display: "flex",
    direction: "ltr",
    alignItems: "center",
    justifyContent: "center",

    // Chart legend:
    "& div svg": {
      overflow: "visible !important"
    },
    "& div svg g text": {
      textTransform: "capitalize !important",
      fontWeight: "600 !important",
      letterSpacing: "0px !important",
      fontFamily: "Exo !important",
      fontSize: "12px !important",
      color: "#3F3F3F",
      opacity: 1,
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
    itemWidth: theme.spacing(16),
    itemHeight: 40,
    itemDirection: isRtl ? "right-to-left" : "left-to-right",
    translateX: isRtl ? -30 : 30,
    translateY: 80,
  };

  const makeLabels = item => isRtl ? `%${item.value}` : `${item.value}%`;
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
        <Grid item xs={2} className={isRtl ? classes.female : classes.male} />
        <Grid item xs={8}>
          <div className={classes.wrapper}>
            <Bar
              data={[chartData]}
              keys={R.keys(chartData)}
              width={theme.spacing(36)}
              height={50}
              padding={0.1}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              layout="horizontal"
              enableGridX={false}
              colors={getColors(nonEmptyData)}
              borderRadius={4}
              innerPadding={1}
              label={makeLabels}
              labelFormat={d => <tspan y={ -15 }>{ d }</tspan>}
              axisLeft={null}
              axisBottom={null}
              legends={[legendConf]}
              tooltip={makeTooltip}
            />
          </div>
        </Grid>
        <Grid item xs={2} className={isRtl ? classes.male : classes.female} />
      </Grid>
    </Box>
  );
};

StackedBarChart.propTypes = {
  data: PropTypes.object
};

export default StackedBarChart;
