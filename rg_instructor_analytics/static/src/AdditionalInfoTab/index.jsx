import React from "react";
import { Container, Grid, makeStyles } from "@material-ui/core";
import { gettext as _ } from "../setupAPI";
import GenderStats from "./gender";
import EducationStats from "./education";
import ResidenceStats from "./geo";
import AgeStats from "./age";
import Section from "./Section";
import ScopeSelector from "./scopes";

const useStyles = makeStyles(theme => ({
  item: {
    [theme.breakpoints.down('sm')]: {
      paddingRight: "0 !important",
      paddingLeft: "0 !important",
    },
  }
}));

export const AdditionalInfoTab = () => {
  const classes = useStyles();

  return (
  <Container>
    <Grid container spacing={4} justify="flex-end">
      <Grid item xs={12} className={classes.item}>
        <ScopeSelector />
      </Grid>
      <Grid item xs={12} className={classes.item}>
        <Section
          heading={_("Country or region of residence")}
          subheading={_(
            "Where the learners are based"
          )}
          text={_(
            "The learners are distributed on the virtual map according to their location." +
              " The countries are highlighted accordingly. By hovering over a location, one can see the detailed information"
          )}
        >
          <ResidenceStats />
        </Section>
      </Grid>
      <Grid item xs={12} md={6} className={classes.item}>
        <Section
          heading={_("Gender")}
          subheading={_(
            "The gender structure of the learners"
          )}
          text={_(
              "The graph shows the distribution of the learners by gender"
          )}
        >
          <GenderStats />
        </Section>
      </Grid>
      <Grid item xs={12} md={6} className={classes.item}>
        <Section
          heading={_("Year of birth")}
          subheading={_(
            "Distribution of the learners by generation"
          )}
          text={_(
              "This graph shows which share of the community is occupied by which generation"
          )}
        >
          <AgeStats />
        </Section>
      </Grid>
      <Grid item xs={12} className={classes.item}>
        <Section
          heading={_("Level of education")}
        >
          <EducationStats />
        </Section>
      </Grid>
    </Grid>
  </Container>
  )
};

AdditionalInfoTab.propTypes = {};

export default AdditionalInfoTab;
