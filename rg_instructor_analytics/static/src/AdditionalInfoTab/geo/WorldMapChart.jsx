import React from "react";
import PropTypes from "prop-types";
import { Choropleth } from "@nivo/geo";
import config from "./data/world_countries";
import * as R from "ramda";
import { useTheme } from "@material-ui/core";
import { MapTooltip } from "./MapTooltip";
import { scaleQuantize } from 'd3-scale'

export const WorldMapChart = ({
  data = [],
  min = 0,
  max = 100,
  width = 1200,
  height = 600,
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

  const getDomain = function (data) {
    if (R.isEmpty(data)) {
      return [];
    }
    const values = data.map(i => i.value);
    if (Math.min(...values) === Math.max(...values)) {
      return [0, 2 * Math.max(...values)]
    }
    return [Math.min(...values), Math.max(...values)]
  };

  const colorDomain = getDomain(data);

  const mapPalette = scaleQuantize()
  .domain(colorDomain)
  .range(["#65BCE2", "#4fb3de", "#3CAADA", "#289FD2", "#248FBC"]);


  return (
    <Choropleth
      data={data}
      features={config}
      width={width}
      height={height}
      colors={mapPalette}
      margin={{ top: 0, right: 0, bottom: 0, left: 200 }}
      projectionScale={130}
      domain={colorDomain}
      projectionTranslation={[0.3, 0.7]}
      projectionRotation={[ -10, 0, 0 ]}
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
