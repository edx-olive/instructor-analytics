/**
 * Learners age stats.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ageStatsFetching } from './data/actions';
import { Bar } from '@nivo/bar'
import * as R from 'ramda';


export class AgeStatsContainer extends React.Component {
  componentDidMount() {
    const { pullAgeStats } = this.props;
    pullAgeStats();
  }

  render() {
    const { ageStats } = this.props;
    //  Example: [ {'id': 'z', 'value': 20, 'abs_value': 1, 'label': 'Generation Z: 1995-2012'}, ]

    const makeTooltip = item => (R.isNil(item.data['abs_value']) ? '–' : `${item.data['abs_value']} user(s)`);
    return (
      <Bar
        data={ageStats}
        width={600}
        height={300}
        margin={{ top: 20, right: 10, bottom: 20, left: 150 }}
        layout={'horizontal'}
        colors={'#268FCB'}
        indexBy={'label'}
        enableGridX={true}
        gridXValues={[0, 20, 40, 60, 80, 100]}
        enableGridY={false}
        maxValue={100}
        label={item => `${item.value}%`}
        axisBottom={{tickSize: 5}}
        axisLeft={{tickSize: 5}}
        tooltip={makeTooltip}
      />
    )
  }
}

AgeStatsContainer.propTypes = {
  ageStats: PropTypes.array.isRequired,
  pullAgeStats: PropTypes.func.isRequired,
};

AgeStatsContainer.defaultProps = {};

const stateToProps = ({ ageStats }) => ({
  ageStats,
});

const dispatchToProps = dispatch => ({
  pullAgeStats: () => dispatch(ageStatsFetching()),
});

const ConnectedAgeStatsContainer = connect(
  stateToProps,
  dispatchToProps,
)(AgeStatsContainer);

export default ConnectedAgeStatsContainer;
