import React from "react";
import PropTypes from "prop-types";
import { Choropleth } from "@nivo/geo";
import config from "./data/world_countries";
import * as R from "ramda";
import { useTheme } from "@material-ui/core";
import { MapTooltip } from "./MapTooltip";

export const WorldMapChart = ({
  data = [],
  min = 0,
  max = 100,
  width = 1200,
  height = 600,
  colors = "blues",
  borderColor,
  unknownColor,
  ...rest
}) => {
  const theme = useTheme();

  const makeTooltip = ({ feature }) => {
    if (R.isNil(feature) || R.isNil(feature.data)) {
      return null;
    }
    return <MapTooltip {...feature.data} />;
  };

  return (
    <Choropleth
      data={data}
      features={config}
      width={width}
      height={height}
      colors={colors}
      margin={{ top: 0, right: 0, bottom: 0, left: 200 }}
      projectionScale={130}
      domain={[min - 2 * (max - min), max + (max - min)]}
      projectionTranslation={[0.3, 0.7]}
      borderWidth={0.5}
      borderColor={borderColor || theme.palette.common.white}
      unknownColor={unknownColor || theme.customPalette.greeny}
      label={item => item.properties.name}
      tooltip={makeTooltip}
      {...rest}
    />
  );
};

WorldMapChart.propTypes = {
  data: PropTypes.array,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default WorldMapChart;
