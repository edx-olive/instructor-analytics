/**
 * Learners residence stats.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { residenceStatsFetching } from './data/actions';
import { Choropleth } from '@nivo/geo'
import config from './data/world_countries'
import * as R from 'ramda';

export class ResidenceStatsContainer extends React.Component {
  componentDidMount() {
    const { pullResidenceStats } = this.props;
    pullResidenceStats();
  }

  render() {
    const { residenceStats } = this.props;
    const makeValue = function (value) {
      return R.isNil(value) ? '-' : `${value}%`;
    };
    const makeTooltip = item => (
        R.isNil(item.feature.data)
        || R.isNil(item.feature.data.abs_value)
            ? '' : `${item.feature.label}: ${item.feature.data.abs_value} user(s)`
    );
    return (
        <Choropleth
            data={residenceStats}
            features={config}
            width={1200}
            height={600}
            margin={{ top: 0, right: 0, bottom: 0, left: 200 }}
            projectionScale={130}
            domain={[ -100, 100 ]}
            projectionTranslation={[0.3, 0.7]}
            borderWidth={0.5}
            borderColor={'#FFF'}
            unknownColor={'#91CF96'}
            colors={'blues'}
            label={item => item.properties.name}
            valueFormat={makeValue}
            tooltip={makeTooltip}
        />
    );
  }
}

ResidenceStatsContainer.propTypes = {
  residenceStats: PropTypes.array.isRequired,
  pullResidenceStats: PropTypes.func.isRequired,
};

ResidenceStatsContainer.defaultProps = {};

const stateToProps = ({ residenceStats }) => ({
  residenceStats,
});

const dispatchToProps = dispatch => ({
  pullResidenceStats: () => dispatch(residenceStatsFetching()),
});

const ConnectedResidenceStatsContainer = connect(
  stateToProps,
  dispatchToProps,
)(ResidenceStatsContainer);

export default ConnectedResidenceStatsContainer;
