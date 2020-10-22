/**
 * Learners education stats.
 */

/* eslint-disable react-hooks/exhaustive-deps */

import React, { Fragment, useEffect } from "react";
import * as R from "ramda";
import { useDispatch, useSelector } from "react-redux";
import { educationStatsFetching } from "./data/actions";
import PieChart from "./PieChart";
import Empty from "./Empty";
import { usePrev } from "../utils";

export const EducationStatsContainer = () => {
  const { scopes, scope, course, site } = useSelector(state => state.scopes);
  const educationStats = useSelector(state => state.educationStats);
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
      !R.isNil(scope) &&
        dispatch(educationStatsFetching(getScopeParams(scope)));
    },
    [scope]
  );

  useEffect(
    () => {
      !R.isNil(site) &&
        !R.isNil(prevSite) &&
        dispatch(educationStatsFetching({ site_id: site }));
    },
    [site]
  );

  useEffect(
    () => {
      !R.isNil(course) &&
        !R.isNil(prevCourse) &&
        dispatch(educationStatsFetching({ course_id: course }));
    },
    [course]
  );

  return (
    <Fragment>
      {educationStats === "error" || R.isEmpty(educationStats.data) ? (
        <Empty />
      ) : (
        <PieChart data={educationStats.data} />
      )}
    </Fragment>
  );
};

EducationStatsContainer.propTypes = {};

export default EducationStatsContainer;
