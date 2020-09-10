import React from "react";
import PropTypes from "prop-types";
import { Bar } from "@nivo/bar";
import {makeStyles, useTheme} from "@material-ui/core";
import AgeTooltip from "./AgeTooltip";

const useStyles = makeStyles(theme => ({
  wrapper: {
  },
  axisLabel: {
    fill: '#3F3F3F',
    fontSize: 12,
    fontFamily: "Exo",
    letterSpacing: "0px",
    textAlign: "right",
  },
  axisLabelBold: {
    fill: '#3F3F3F',
    fontSize: 12,
    fontFamily: "Exo",
    letterSpacing: "0px",
    fontWeight: "bold",
  }
}));


export const BarChart = ({
  data = [],
  width = 512,
  height = 300,
  colors,
  ...rest
}) => {
  const theme = useTheme();
  const classes = useStyles();
  const makeTooltip = ({ id, value, data = [] }) => (
    <AgeTooltip id={id} value={value} data={data} />
  );
  const makeXAxis = d => (d % 20 === 0) ? `${d}` : '';
  const makeLabel = d => <tspan x={ (d + 5) * ((width-160) / 100) }>{ `${d}%` }</tspan>;

  const CustomTick = tick => {

    return (
        <g>
        <g transform={`translate(${tick.x-35},${tick.y})`}>
            <text
                textAnchor="middle"
                dominantBaseline="middle"
                className={classes.axisLabelBold}
            >
                {tick.value.substring(tick.value.length - 9)}
            </text>
        </g>
        <g transform={`translate(${tick.x-110},${tick.y})`}>
            <text
                textAnchor="middle"
                dominantBaseline="middle"
                className={classes.axisLabel}
            >
                {tick.value.substring(0, tick.value.length - 9)}
            </text>
        </g>
        </g>
    )
  };

  return (
    <div className={classes.wrapper}>
    <Bar
      data={data}
      width={width}
      height={height}
      colors={colors || theme.palette.primary.main}
      margin={{ top: 20, right: 10, bottom: 30, left: 150 }}
      padding={0.3}
      layout="horizontal"
      borderRadius={4}
      indexBy="label"
      label={item => item.value}
      labelFormat={makeLabel}
      enableGridX={true}
      gridXValues={[0, 20, 40, 60, 80, 100]}
      enableGridY={false}
      maxValue={100}
      axisBottom={{ format: makeXAxis, tickSize: 0 }}
      axisLeft={{ renderTick: CustomTick, tickSize: 0 }}
      tooltip={makeTooltip}
      {...rest}
    />
    </div>
  );
};

BarChart.propTypes = {
  data: PropTypes.array,
  width: PropTypes.number,
  height: PropTypes.number,
  colors: PropTypes.string
};

export default BarChart;
