/**
 * Learners age stats.
 */

/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect } from "react";
import * as R from "ramda";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { ageStatsFetching } from "./data/actions";
import Empty from "./Empty";
import BarChart from "./BarChart";
import { usePrev } from "../utils";

export const AgeStatsContainer = () => {
  const { scopes, scope, course, site } = useSelector(state => state.scopes);
  const ageStats = useSelector(state => state.ageStats);
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
      !R.isNil(scope) && dispatch(ageStatsFetching(getScopeParams(scope)));
    },
    [scope]
  );

  useEffect(
    () => {
      !R.isNil(site) &&
        !R.isNil(prevSite) &&
        dispatch(ageStatsFetching({ site_id: site }));
    },
    [site]
  );

  useEffect(
    () => {
      !R.isNil(course) &&
        !R.isNil(prevCourse) &&
        dispatch(ageStatsFetching({ course_id: course }));
    },
    [course]
  );

  const dataAbsentOrEmpty = stats =>
    stats === "error" ||
    (R.isEmpty(stats) || R.isEmpty(stats.data)) ||
    R.equals(R.sum(R.pluck("value", stats.data)), 0);

  return dataAbsentOrEmpty(ageStats) ? (
    <Empty />
  ) : (
    <BarChart data={ageStats.data} />
  );
};

AgeStatsContainer.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default AgeStatsContainer;
