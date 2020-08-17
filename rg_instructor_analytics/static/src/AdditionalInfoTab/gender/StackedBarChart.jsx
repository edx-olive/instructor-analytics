import React from "react";
import PropTypes from "prop-types";
import * as R from "ramda";
import { Bar } from "@nivo/bar";
import { Box, makeStyles, useTheme } from "@material-ui/core";
import GenderTooltip from "./GenderTooltip";

const useStyles = makeStyles(theme => ({
  box: {
    display: "flex",
    justifyContent: "center",
    marginTop: theme.spacing(10)
  },
  wrapper: {
    borderLeft: `2px solid ${theme.palette.grey[500]}`,
    borderRight: `2px solid ${theme.palette.grey[500]}`,
    padding: 1,
    width: 400,
    minHeight: 80,
    display: "flex",
    alignItems: "center",
    
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
  }
}));

export const StackedBarChart = ({ data = {}, absData = {} }) => {
  const theme = useTheme();
  const classes = useStyles();

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
  const makeTooltip = ({ id, value }) => (
    <GenderTooltip id={id} value={value} data={absData} />
  );

  // NOTE: removing mandatory index key
  const cleanData = R.omit(["id"], data);

  return (
    <Box className={classes.box}>
      <div className={classes.wrapper}>
        <Bar
          data={[data]}
          keys={R.keys(cleanData)}
          width={400}
          height={50}
          padding={0.1}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          layout="horizontal"
          enableGridX={false}
          colors={[
            theme.palette.primary.main,
            theme.palette.grey[500],
            theme.palette.secondary.main
          ]}
          borderRadius={2}
          innerPadding={1}
          label={makeLabels}
          axisLeft={null}
          axisBottom={null}
          legends={[legendConf]}
          tooltip={makeTooltip}
        />
      </div>
    </Box>
  );
};

StackedBarChart.propTypes = {
  data: PropTypes.object,
  absData: PropTypes.object
};

export default StackedBarChart;
