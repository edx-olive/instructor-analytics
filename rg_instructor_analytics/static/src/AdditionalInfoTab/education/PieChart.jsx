import React from 'react';
import { Pie } from '@nivo/pie';
import * as PropTypes from 'prop-types';
import * as R from "ramda";


const PieChart = ({ data }) => {

  const colors = [
      '#8EDC43', '#5361B6', '#874B97',
      '#15D375', '#FF6567', '#989898',
      '#5B9ED6', '#6CC9C3', '#EDA646'
  ];

  const legendConfig = {
    anchor: 'right',
    direction: 'column',
    translateX: 350,
    itemWidth: 550,
    itemHeight: 30,
    legendFormat: 'value',
  };

  const makeTooltip = item => (R.isNil(item.abs_value) ? '–' : `${item.abs_value} user(s)`);

  return (
    <Pie
      data={data}
      height={300}
      width={800}
      margin={{ top: 20, right: 10, bottom: 20, left: 10 }}
      colors={colors}
      innerRadius={0.25}
      padAngle={2.5}
      cornerRadius={0}
      borderWidth={0}
      sortById
      enableSlicesLabels={false}
      radialLabelsSkipAngle={5}
      radialLabelsLinkDiagonalLength={10}
      radialLabelsLinkHorizontalLength={0}
      radialLabelsLinkOffset={10}
      radialLabel={item => `${item.value}%`}
      legends={[legendConfig]}
      tooltip={makeTooltip}
    />
  );
};

PieChart.propTypes = {
  data: PropTypes.array.isRequired,
};

export default PieChart;
