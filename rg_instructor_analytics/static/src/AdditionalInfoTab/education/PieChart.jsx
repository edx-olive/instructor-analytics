import React from "react";
import PropTypes from "prop-types";
import { ResponsivePie } from "@nivo/pie";
import { Box, makeStyles } from "@material-ui/core";
import EducationTooltip from "./EducationTooltip";
import { isRtl } from "../rtl";
import useWindowSize, { TABLET_VIEW } from "../useWindowSize";

const useStyles = makeStyles(theme => ({
  box: {
    display: "flex",
    flexDirection: isRtl ? "row-reverse": "row",
    direction: "ltr",
    // Chart legend:
    "& div svg": {
      overflow: "visible !important"
    },
    "& div svg g text": {
      textTransform: "uppercase !important",
      fontWeight: "600 !important",
      letterSpacing: "0px !important"
    }
  }
}));

const PieChart = ({ data = [], width = 800, height = 300, ...rest }) => {
  const classes = useStyles();
  const { useWidth } = useWindowSize();
  const isTabletView = useWidth > TABLET_VIEW;
  const colors = [
    "#8EDC43",
    "#5361B6",
    "#874B97",
    "#15D375",
    "#FF6567",
    "#989898",
    "#5B9ED6",
    "#6CC9C3",
    "#EDA646"
  ];

  const legendConfig = {
    anchor: "right",
    direction: "column",
    translateX: isRtl ? -650 : 550,
    itemWidth: 700,
    itemHeight: 30,
    legendFormat: "value",
    itemDirection: isRtl ? "right-to-left" : "left-to-right"
  };

  const makeTooltip = item => <EducationTooltip {...item} />;

  return (
    <Box className={classes.box} style={{maxWidth: `${width}px`, height: `${height}px`, padding: isTabletView ? '4px' : '4px 40px'}}>
      <ResponsivePie
        data={data}
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
        radialLabel={item => isRtl ? `%${item.value}` : `${item.value}%`}
        legends={isTabletView ? [legendConfig] : undefined}
        tooltip={makeTooltip}
        {...rest}
      />
    </Box>
  );
};

PieChart.propTypes = {
  data: PropTypes.array,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default PieChart;
