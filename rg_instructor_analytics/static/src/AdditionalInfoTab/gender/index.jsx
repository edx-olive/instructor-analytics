/**
 * Learners gender stats.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { genderStatsFetching } from './data/actions';
import { Bar } from '@nivo/bar'
import * as R from 'ramda';

export class GenderStatsContainer extends React.Component {
  componentDidMount() {
    const { pullGenderStats } = this.props;
    pullGenderStats();
  }

  render() {
    const { genderStats } = this.props;
    const makeTooltip = item => (`${item.id}: ${(item.data.total - item.data.empty) * item.value / 100} user(s)`);
    return (
        <Bar
          data={genderStats}  // [OrderedDict([(u'Male', 70), (u'Other', 10), (u'Female', 20), ('id', 'gender')])]
          keys={R.isNil(genderStats[0]) ? [] : Object.keys(genderStats[0]).slice(0,3)}
          width={500}
          height={120}
          padding={0.5}
          margin={{ top: 0, right: 70, bottom: 0, left: 100 }}
          indexBy={'id'}
          layout={'horizontal'}
          enableGridX={true}
          gridXValues={[0, 100]}
          colors={['#5B9ED6', '#A2A2A2', '#EF7974']}
          borderRadius={4}
          innerPadding={2}
          label={item => `${item.value}%`}
          axisLeft={null}
          axisBottom={null}
          tooltip={makeTooltip}
          legends={[
            {
              dataFrom: 'keys',
              anchor: 'bottom',
              direction: 'row',
              itemWidth: 80,
              itemHeight: 40,
              itemDirection: 'left-to-right',
              translateX: 20,
              translateY: 10,
            }
          ]}
        />
    )
  }
}

GenderStatsContainer.propTypes = {
  genderStats: PropTypes.array.isRequired,
  pullGenderStats: PropTypes.func.isRequired,
};

GenderStatsContainer.defaultProps = {};

const stateToProps = ({ genderStats }) => ({
  genderStats,
});

const dispatchToProps = dispatch => ({
  pullGenderStats: () => dispatch(genderStatsFetching()),
});

const ConnectedGenderStatsContainer = connect(
  stateToProps,
  dispatchToProps,
)(GenderStatsContainer);

export default ConnectedGenderStatsContainer;
