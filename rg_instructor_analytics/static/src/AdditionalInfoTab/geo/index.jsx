/**
 * Learners geo stats.
 */

/* eslint-disable react-hooks/exhaustive-deps */

import React, { Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { geoStatsFetching } from "./data/actions";
import * as R from "ramda";
import Empty from "./Empty";
import { usePrev } from "../utils";
import WorldMapChart from "./WorldMapChart";
import TotalUsers from "./TotalUsers";

export const GeoStatsContainer = () => {
  const { scopes, scope, course, site } = useSelector(state => state.scopes);
  const geoStats = useSelector(state => state.geoStats);
  const dispatch = useDispatch();

  const getScopeParams = scope => {
    switch (scope) {
      case scopes.course:
        return { course_id: course };
      case scopes.site:
        return { site_id: site };
      default:
        return {};
    }
  };

  // NOTE: avoiding firing redundant initial API requests:
  const prevSite = usePrev(site);
  const prevCourse = usePrev(course);

  useEffect(
    () => {
      !R.isNil(scope) && dispatch(geoStatsFetching(getScopeParams(scope)));
    },
    [scope]
  );

  useEffect(
    () => {
      !R.isNil(site) &&
        !R.isNil(prevSite) &&
        dispatch(geoStatsFetching({ site_id: site }));
    },
    [site]
  );

  useEffect(
    () => {
      !R.isNil(course) &&
        !R.isNil(prevCourse) &&
        dispatch(geoStatsFetching({ course_id: course }));
    },
    [course]
  );

  // eslint-disable-next-line
  const customTooltip = function(d) {
    return `${d.feature.properties.name}: ${
      R.isNil(d.data) ? "" : d.data.value
    }%`;
  };

  return (
    <Fragment>
      {<TotalUsers value={geoStats.total} />}
      {geoStats === "error" || R.isEmpty(geoStats.data) ? (
        <Empty height={600} />
      ) : (
        <WorldMapChart
          data={geoStats.data}
          min={geoStats.min}
          max={geoStats.max}
        />
      )}
    </Fragment>
  );
};

GeoStatsContainer.propTypes = {};

export default GeoStatsContainer;
