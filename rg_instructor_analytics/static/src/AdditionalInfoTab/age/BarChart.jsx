import React from "react";
import PropTypes from "prop-types";
import { Bar } from "@nivo/bar";
import { useTheme } from "@material-ui/core";
import AgeTooltip from "./AgeTooltip";

export const BarChart = ({
  data = [],
  width = 512,
  height = 300,
  colors,
  ...rest
}) => {
  const theme = useTheme();
  const makeTooltip = ({ id, value, data = [] }) => (
    <AgeTooltip id={id} value={value} data={data} />
  );
  
  return (
    <Bar
      data={data}
      width={width}
      height={height}
      colors={colors || theme.palette.primary.main}
      margin={{ top: 20, right: 10, bottom: 30, left: 150 }}
      layout="horizontal"
      indexBy="label"
      label={item => `${item.value}%`}
      enableGridX={true}
      gridXValues={[0, 20, 40, 60, 80, 100]}
      enableGridY={false}
      maxValue={100}
      axisBottom={{ tickSize: 5 }}
      axisLeft={{ tickSize: 5 }}
      tooltip={makeTooltip}
      {...rest}
    />
  );
};

BarChart.propTypes = {
  data: PropTypes.array,
  width: PropTypes.number,
  height: PropTypes.number,
  colors: PropTypes.string
};

export default BarChart;
