import React from "react";
import { Container, Grid } from "@material-ui/core";
import { gettext as _ } from "../setupAPI";
import GenderStats from "./gender";
import EducationStats from "./education";
import ResidenceStats from "./geo";
import AgeStats from "./age";
import Section from "./Section";
import ScopeSelector from "./scopes";

export const AdditionalInfoTab = () => (
  <Container>
    <Grid container spacing={4} justify="flex-end">
      <Grid item xs={12}>
        <ScopeSelector />
      </Grid>
      <Grid item xs={12}>
        <Section
          heading={_("Country or region of residence")}
          subheading={_(
            "Saepe possimus voluptatum aspernatur temporibus porro alias"
          )}
          text={_(
            "Illum at dolorum amet reiciendis in, et adipisci assumenda deserunt quos deleniti quasi vero," +
              " perferendis dolorem modi ullam accusantium inventore amet, commodi illum perferendis ea tenetur iusto animi atque dicta rem ut?"
          )}
        >
          <ResidenceStats />
        </Section>
      </Grid>
      <Grid item xs={6}>
        <Section
          heading={_("Gender")}
          subheading={_(
            "Saepe possimus voluptatum aspernatur temporibus porro alias"
          )}
          text={_(
            "Illum at dolorum amet reiciendis in, et adipisci assumenda deserunt quos deleniti quasi vero," +
              " perferendis dolorem modi ullam accusantium inventore amet, commodi illum perferendis ea tenetur iusto animi atque dicta rem ut?"
          )}
        >
          <GenderStats />
        </Section>
      </Grid>
      <Grid item xs={6}>
        <Section
          heading={_("Year of birth")}
          subheading={_(
            "Saepe possimus voluptatum aspernatur temporibus porro alias"
          )}
          text={_(
            "Illum at dolorum amet reiciendis in, et adipisci assumenda deserunt quos deleniti quasi vero," +
              " perferendis dolorem modi ullam accusantium inventore amet, commodi illum perferendis ea tenetur iusto animi atque dicta rem ut?"
          )}
        >
          <AgeStats />
        </Section>
      </Grid>
      <Grid item xs={12}>
        <Section
          heading={_("Level of education")}
          subheading={_(
            "Saepe possimus voluptatum aspernatur temporibus porro alias"
          )}
          text={_(
            "Illum at dolorum amet reiciendis in, et adipisci assumenda deserunt quos deleniti quasi vero," +
              " perferendis dolorem modi ullam accusantium inventore amet, commodi illum perferendis ea tenetur iusto animi atque dicta rem ut?"
          )}
        >
          <EducationStats />
        </Section>
      </Grid>
    </Grid>
  </Container>
);

AdditionalInfoTab.propTypes = {};

export default AdditionalInfoTab;
