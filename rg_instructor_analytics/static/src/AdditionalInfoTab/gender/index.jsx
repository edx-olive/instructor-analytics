/**
 * Learners gender stats.
 */

/* eslint-disable react-hooks/exhaustive-deps */

import React, { Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { genderStatsFetching } from "./data/actions";
import * as R from "ramda";
import Empty from "./Empty";
import StackedBarChart from "./StackedBarChart";
import { usePrev } from "../utils";

export const GenderStatsContainer = () => {
  const { scopes, scope, course, site } = useSelector(state => state.scopes);
  const genderStats = useSelector(state => state.genderStats);
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
      !R.isNil(scope) && dispatch(genderStatsFetching(getScopeParams(scope)));
    },
    [scope]
  );

  useEffect(
    () => {
      !R.isNil(site) &&
        !R.isNil(prevSite) &&
        dispatch(genderStatsFetching({ site_id: site }));
    },
    [site]
  );

  useEffect(
    () => {
      !R.isNil(course) &&
        !R.isNil(prevCourse) &&
        dispatch(genderStatsFetching({ course_id: course }));
    },
    [course]
  );

  return (
    <Fragment>
      {genderStats === "error" || R.isEmpty(genderStats.rel_data) ? (
        <Empty />
      ) : (
        <StackedBarChart data={genderStats.rel_data} absData={genderStats.abs_data} />
      )}
    </Fragment>
  );
};

GenderStatsContainer.propTypes = {};

export default GenderStatsContainer;
