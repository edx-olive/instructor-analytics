import React, { useEffect } from "react";
import { Container, Grid } from "@material-ui/core";
import * as R from "ramda";
import Selector from "./Selector";
import Switch from "./Switch";
import { useDispatch, useSelector } from "react-redux";
import { scopesFetching } from "./data/actions";

export const ScopeSelector = () => {
  const dispatch = useDispatch();
  const { scopes, roles, scope, role, sites, courses } = useSelector(
    state => state.scopes
  );

  useEffect(
    () => {
      dispatch(scopesFetching());
    },
    [dispatch]
  );

  const getItems = scope => {
    switch (scope) {
      case scopes.site:
        return sites;
      case scopes.course:
        return courses;
      default:
        return [];
    }
  };

  return (
    <Container>
      <Grid container spacing={1}>
        <Grid item xs={4} />
        <Grid item xs={4}>
          {scope !== scopes.system && <Selector items={getItems(scope)} />}
        </Grid>
        <Grid item xs={4} align="right">
          {role === roles.admin &&
            (scope && (
              <Switch items={R.values(scopes).sort()} activeItem={scope} />
            ))}
        </Grid>
      </Grid>
    </Container>
  );
};

ScopeSelector.propTypes = {};

export default ScopeSelector;
