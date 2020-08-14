/**
 * Learners education stats.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { educationStatsFetching } from './data/actions';
import PieChart from './PieChart'

export class EducationStatsContainer extends React.Component {
  componentDidMount() {
    const { pullEducationStats } = this.props;
    pullEducationStats();
  }

  render() {
    const { educationStats } = this.props;
    return <PieChart data={educationStats}/>
  }
}

EducationStatsContainer.propTypes = {
  educationStats: PropTypes.array.isRequired,
  pullEducationStats: PropTypes.func.isRequired,
};

EducationStatsContainer.defaultProps = {};

const stateToProps = ({ educationStats }) => ({
  educationStats,
});

const dispatchToProps = dispatch => ({
  pullEducationStats: () => dispatch(educationStatsFetching()),
});

const ConnectedEducationStatsContainer = connect(
  stateToProps,
  dispatchToProps,
)(EducationStatsContainer);

export default ConnectedEducationStatsContainer;
