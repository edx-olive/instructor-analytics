import React, { useEffect } from "react";
import { Container, Grid, makeStyles } from "@material-ui/core";
import * as R from "ramda";
import Selector from "./Selector";
import Switch from "./Switch";
import { useDispatch, useSelector } from "react-redux";
import { scopesFetching } from "./data/actions";

const useStyles = makeStyles(theme => ({
  container: {
    minHeight: theme.spacing(10),
    [theme.breakpoints.only('xs')]: {
      paddingRight: 0,
      paddingLeft: 0,
    },
  }
}));

export const ScopeSelector = () => {
  const classes = useStyles();

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
    <Container className={classes.container}>
      <Grid container spacing={1}>
        <Grid item xs={12} md={5}>
          {role === roles.admin &&
            (scope && (
              <Switch items={R.values(scopes).sort()} activeItem={scope} />
            ))}
        </Grid>
        <Grid item xs={12} md={4}>
          {scope !== scopes.system && <Selector items={getItems(scope)} />}
        </Grid>
        <Grid item xs={12} md={2} />
      </Grid>
    </Container>
  );
};

ScopeSelector.propTypes = {};

export default ScopeSelector;
