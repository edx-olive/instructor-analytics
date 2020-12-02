from abc import ABCMeta, abstractmethod
import calendar
from collections import Counter, OrderedDict
import csv
from datetime import datetime, timedelta
import json
import logging
import os
import six

from django.http.response import JsonResponse
from django.utils.translation import ugettext as _
import numpy as np

import pycountry

base_data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'datasets')

logger = logging.getLogger(__name__)


def _get_mocker_keys(mock_dataset):
    return [os.path.splitext(f)[0] for f in os.listdir(os.path.join(base_data_path, mock_dataset))]


class BaseDataMocker(object):
    __metaclass__ = ABCMeta
    _dtype = 'i4'  # use int32 as basic type for data loading, redefine if needed

    def __init__(self, func, *args, **kwargs):
        self.func = func
        self.args = args
        self.kwargs = kwargs

    @property
    def data_key(self):
        return self.kwargs['course_id']

    @property
    def data_file_without_extension(self):
        return os.path.join(base_data_path, self.mock_dataset, self.data_key)

    def _load_dataset_from_csv(self):
        return np.loadtxt(
            '{}.csv'.format(self.data_file_without_extension),
            delimiter=',', skiprows=1, dtype=self._dtype
        )

    def _load_headers_from_csv(self):
        with open('{}.csv'.format(self.data_file_without_extension), 'r') as f:
            reader = csv.reader(f)
            headers = next(reader)
        return headers

    def _load_dataset_from_json(self):
        with open('{}.json'.format(self.data_file_without_extension), 'r') as json_file:
            data = json.load(json_file)
            return data

    @staticmethod
    def _day_shift_to_timestamp(day_shift):
        return (datetime.now() + timedelta(days=day_shift)).date()

    @staticmethod
    def _format_day(fday):
        return calendar.timegm(fday.timetuple()) * 1000

    @staticmethod
    def _get_dates_indexes(dates, from_date, to_date):
        try:
            start_ind = dates.index(from_date)
        except ValueError as e:
            start_ind = 0
        try:
            end_ind = dates.index(to_date) + 1
        except ValueError as e:
            end_ind = len(dates) - 1
        return start_ind, end_ind

    @abstractmethod
    def get_mocked_data(self):
        pass

    def choose_mock_or_origin_data(self):
        if self.data_key in self._mocker_keys:
            return self.get_mocked_data()
        else:
            return self.func(*self.args, **self.kwargs)


class EnrollmentsDataMocker(BaseDataMocker):
    mock_dataset = 'enrolls'
    # load keys once when class is loaded
    _mocker_keys = _get_mocker_keys(mock_dataset)

    @property
    def data_key(self):
        # for CourseLocator, going as third parameter to origin function
        return str(self.args[2])

    def get_mocked_data(self):
        from_date = datetime.utcfromtimestamp(self.args[0]).date()
        to_date = datetime.utcfromtimestamp(self.args[1]).date()

        raw_data = self._load_dataset_from_csv()
        dates = [self._day_shift_to_timestamp(d) for d in raw_data[:, 0].tolist()]
        start_ind, end_ind = self._get_dates_indexes(dates, from_date, to_date)

        dates = dates[start_ind: end_ind]
        enrolls_vals = raw_data[:, 1].tolist()[start_ind: end_ind]
        unenrolls_vals = raw_data[:, 2].tolist()[start_ind: end_ind]
        totals_vals = raw_data[:, 3].tolist()[start_ind: end_ind]

        cnt = len(dates)
        return {
            'enrolls': [(self._format_day(dates[i]), enrolls_vals[i]) for i in range(cnt)],
            'unenrolls': [(self._format_day(dates[i]), unenrolls_vals[i]) for i in range(cnt)],
            'totals': [(self._format_day(dates[i]), totals_vals[i]) for i in range(cnt)]
        }


class ActivitiesDailyDataMocker(BaseDataMocker):
    # for function activity.get_daily_activity_for_course
    mock_dataset = os.path.join('activities', 'daily')
    _mocker_keys = _get_mocker_keys(mock_dataset)

    @property
    def data_key(self):
        return str(self.args[3])

    def get_mocked_data(self):
        from_date = self.args[1]
        to_date = self.args[2]

        raw_data = self._load_dataset_from_csv()
        dates = [self._day_shift_to_timestamp(d) for d in raw_data[:, 0].tolist()]
        start_ind, end_ind = self._get_dates_indexes(dates, from_date, to_date)

        dates = dates[start_ind: end_ind]
        video_views = raw_data[:, 1].tolist()[start_ind: end_ind]
        discussions = raw_data[:, 2].tolist()[start_ind: end_ind]
        course_activities = raw_data[:, 3].tolist()[start_ind: end_ind]

        cnt = len(dates)
        return {
            'video_views': [(self._format_day(dates[i]), video_views[i]) for i in range(cnt)],
            'discussion_activities': [(self._format_day(dates[i]), discussions[i]) for i in range(cnt)],
            'course_activities': [(self._format_day(dates[i]), course_activities[i]) for i in range(cnt)]
        }


class UnitVisitsDataMocker(BaseDataMocker):
    mock_dataset = os.path.join('activities', 'unit_visits')
    _mocker_keys = _get_mocker_keys(mock_dataset)
    _dtype = str

    @property
    def data_key(self):
        return str(self.args[3])

    def get_mocked_data(self):
        from_date = self.args[1]
        to_date = self.args[2]

        raw_data = self._load_dataset_from_csv()
        # fill empty cells with 0
        raw_data[raw_data == ''] = '0'
        raw_data = raw_data.astype('i4')

        dates = [self._day_shift_to_timestamp(d) for d in raw_data[:, 0].tolist()]
        start_ind, end_ind = self._get_dates_indexes(dates, from_date, to_date)

        unit_names = self._load_headers_from_csv()[3:]
        count_visits = [sum(raw_data[:, i + 3].tolist()[start_ind: end_ind]) for i in range(len(unit_names))]

        return {
            "ticktext": unit_names,
            "count_visits": count_visits,
            "tickvals": unit_names
        }


class ProblemsLvl1DataMocker(BaseDataMocker):
    mock_dataset = os.path.join('problems', 'lvl1')
    _mocker_keys = _get_mocker_keys(mock_dataset)

    @property
    def data_key(self):
        return str(self.args[1])

    def get_mocked_data(self):
        return self._load_dataset_from_json()


class ProblemsLvl2DataMocker(BaseDataMocker):
    mock_dataset = os.path.join('problems', 'lvl2')
    _mocker_keys = _get_mocker_keys(mock_dataset)
    _dtype = str

    def get_mocked_data(self):
        raw_data = self._load_dataset_from_csv()
        request = self.args[1]
        problems_ids = request.POST.getlist('problems')
        all_problems_ids = raw_data[:, 1].tolist()
        all_correct = raw_data[:, 3].tolist()
        all_incorrect = raw_data[:, 4].tolist()

        correct = []
        incorrect = []
        for block in problems_ids:
            index = all_problems_ids.index(block)
            correct.append(all_correct[index])
            incorrect.append(all_incorrect[index])

        return JsonResponse(data={'incorrect': incorrect, 'correct': correct, 'students_emails': []})


class ProblemsLvl3DataMocker(BaseDataMocker):
    mock_dataset = os.path.join('problems', 'lvl3')
    _mocker_keys = _get_mocker_keys(mock_dataset)

    def get_mocked_data(self):
        dataset = self._load_dataset_from_json()
        problem_id = self.args[1].POST.get('problemID')
        question_stats = dataset.get(problem_id)
        if not question_stats:
            return self.func(*self.args, **self.kwargs)
        return JsonResponse(data=question_stats)


class CohortsDataMocker(BaseDataMocker):
    mock_dataset = 'cohorts'
    _mocker_keys = _get_mocker_keys(mock_dataset)
    _dtype = str

    def get_mocked_data(self):
        raw_data = self._load_dataset_from_csv()
        obj = self.args[0]
        cohorts = obj.generate_cohort_by_mean_and_dispersion([
            {
                'email': grade[1],
                'grade': float(grade[2]) / 100
            } for grade in raw_data
        ])

        labels = []
        for i, cohort in enumerate(cohorts):
            prev_cohort = cohorts[i - 1]
            if cohort['max_progress'] == 0:
                labels.append(_('zero progress'))
            else:
                labels.append(
                    _('from {} % to {} %').format(prev_cohort['max_progress'], cohort['max_progress'])
                )
        values = [info['percent'] for info in cohorts]

        return JsonResponse(data={'labels': labels, 'values': values, 'cohorts': cohorts})


class FunnelsDataMocker(BaseDataMocker):
    mock_dataset = 'funnels'
    _mocker_keys = _get_mocker_keys(mock_dataset)
    _dtype = str

    def get_mocked_data(self):
        raw_data = self._load_dataset_from_csv()
        mock_funnels = OrderedDict()
        student_num = 1
        for section_name, subsection_name, unit_name, learners_in, learners_out, learners_stuck in raw_data:
            learners_in = int(learners_in)
            learners_out = int(learners_out)
            learners_stuck = int(learners_stuck)
            student_emails = ['learner{}@example.com'.format(i+student_num) for i in range(learners_stuck)]
            student_num += learners_stuck
            if section_name not in mock_funnels:
                mock_funnels[section_name] = {
                    'children': OrderedDict(),
                    'id': section_name,
                    'name': section_name,
                    'level': 0,
                    'student_count': 0,
                    'student_count_in': learners_in,  # should be the first children's value for section
                    'student_count_out': 0,
                    'student_emails': []
                }
            if subsection_name not in mock_funnels[section_name]['children']:
                mock_funnels[section_name]['children'][subsection_name] = {
                    'children': [],
                    'id': subsection_name,
                    'name': subsection_name,
                    'level': 1,
                    'student_count': 0,
                    'student_count_in': learners_in,   # should be the first children's value for subsection
                    'student_count_out': 0,
                    'student_emails': []
                }
            mock_funnels[section_name]['children'][subsection_name]['children'].append(
                {
                    'id': unit_name,
                    'name': unit_name,
                    'level': 2,
                    'student_count': learners_stuck,
                    'student_count_in': learners_in,
                    'student_count_out': learners_out,
                    'student_emails': student_emails,
                    'children': []
                }
            )
            mock_funnels[section_name]['children'][subsection_name]['student_emails'].extend(student_emails)
            mock_funnels[section_name]['children'][subsection_name]['student_count'] += learners_stuck
            # should become the last children's value for subsection
            mock_funnels[section_name]['children'][subsection_name]['student_count_out'] = learners_out

            mock_funnels[section_name]['student_emails'].extend(student_emails)
            mock_funnels[section_name]['student_count'] += learners_stuck
            # should become the last children's value for section
            mock_funnels[section_name]['student_count_out'] = learners_out

        for section in mock_funnels:
            mock_funnels[section]['children'] = [
                subsection for subsection in mock_funnels[section]['children'].values()
            ]

        data = mock_funnels.values() if six.PY2 else list(mock_funnels.values())
        return JsonResponse(data={"courses_structure": data})


class StudentsInfoGradebookDataMocker(BaseDataMocker):
    mock_dataset = os.path.join('students_info', 'gradebook')
    _mocker_keys = _get_mocker_keys(mock_dataset)
    _dtype = str

    def get_mocked_data(self):
        raw_data = self._load_dataset_from_csv()
        request = self.args[0]
        filter_string = request.POST.get('filter')

        student_exam_values = []
        exam_names = self._load_headers_from_csv()[2:-2]
        students_info = []

        for line in raw_data:
            if not filter_string or line[0].find(filter_string) > -1 or line[1].find(filter_string) > -1:
                students_info.append({'username': line[0], 'last_visit': line[-2], 'is_enrolled': True})
                user_exam = {}
                for i, exam in enumerate(exam_names):
                    user_exam[exam] = int(line[i + 2])
                student_exam_values.append(user_exam)

        return JsonResponse(data={
            'student_exam_values': student_exam_values, 'exam_names': exam_names, 'students_info': students_info
        })


class StudentsInfoVideoViewsDataMocker(BaseDataMocker):
    mock_dataset = os.path.join('students_info', 'video_views')
    _mocker_keys = _get_mocker_keys(mock_dataset)
    _dtype = str

    def get_mocked_data(self):
        raw_data = self._load_dataset_from_csv()
        headers = self._load_headers_from_csv()
        username = self.args[0].POST.get('username')
        learner_index = np.where(raw_data[:, 0] == username)
        videos_names = headers[1:]
        if len(learner_index[0]):
            # numpy search returns multi-dimensional array of indexes,
            # but we should have only one user with the username
            learner_index = learner_index[0][0]
            videos_time = [int(n) for n in raw_data[learner_index, 1:]]
        else:
            videos_time = [0] * len(videos_names)
        videos_completed = [True] * len(videos_names)
        return JsonResponse(
            data={
                'videos_names': videos_names,
                'videos_time': videos_time,
                'videos_completed': videos_completed,
            }
        )


class StudentsInfoDiscussionsDataMocker(BaseDataMocker):
    mock_dataset = os.path.join('students_info', 'discussions')
    _mocker_keys = _get_mocker_keys(mock_dataset)
    _dtype = str

    def get_mocked_data(self):
        raw_data = self._load_dataset_from_csv()
        headers = self._load_headers_from_csv()
        username = self.args[0].POST.get('username')
        learner_index = np.where(raw_data[:, 0] == username)
        thread_names = headers[1:]
        if len(learner_index[0]):
            learner_index = learner_index[0][0]
            activity_count = [int(n) for n in raw_data[learner_index, 1:]]
        else:
            activity_count = [0] * len(thread_names)
        return JsonResponse(
            data={
                'thread_names': thread_names,
                'activity_count': activity_count,
            }
        )


class StudentsInfoStudentStepDataMocker(BaseDataMocker):
    mock_dataset = os.path.join('students_info', 'student_step')
    _mocker_keys = _get_mocker_keys(mock_dataset)

    def get_mocked_data(self):
        raw_data = self._load_dataset_from_json()
        username = self.args[0].POST.get('username')
        usersteps = raw_data.get(username, [])
        units_list = raw_data['units']
        ticktext = units_list
        tickvals = units_list
        units = usersteps
        steps = [i for i in range(len(usersteps))]
        x_default = [None] * len(tickvals)
        return JsonResponse(
            data={
                'ticktext': ticktext,
                'tickvals': tickvals,
                'units': units,
                'steps': steps,
                'x_default': x_default
            }
        )


class AditionalInfoDataMocker(BaseDataMocker):
    mock_dataset = 'additional_information'
    _mocker_keys = _get_mocker_keys(mock_dataset)
    _dtype = str


class AdditionalInfoGeoDataMocker(AditionalInfoDataMocker):
    def get_mocked_data(self):
        raw_data = self._load_dataset_from_csv()
        countries = raw_data[:, 1]
        countries_counter = Counter(countries)
        total = countries.size

        countries = []
        for key in countries_counter:
            try:
                country = pycountry.countries.get(name=key)
                countries.append({
                    'id': country.alpha3 if hasattr(country, 'alpha3') else country.alpha_3,
                    'name': key,
                    'percent': int(round(countries_counter[key] * 100.0 / total)),
                    'value': countries_counter[key],
                })
            except:
                # pycountry.countries.get by name is Failed for 'South Korea' now;
                # it should be 'Korea, the Republic of' for correct getting data,
                # but that will broke csv file
                logger.info("Can't get code for country '{}' by name".format(key))

        geo_stats = {
            'total': total,
            'unknown': 0,
            'min': min(countries_counter.values()),
            'max': max(countries_counter.values()),
            'data': countries
        }
        return JsonResponse(data=geo_stats)


class AdditionalInfoGenderDataMocker(AditionalInfoDataMocker):
    def get_mocked_data(self):
        raw_data = self._load_dataset_from_csv()
        genders = raw_data[:, 2]
        genders_counter = Counter(genders)

        total = genders.size
        empty = 0
        gender_stats = {
            'total': total,
            'unknown': empty,
            'data': {
                key[0].lower(): {
                    "label": key,
                    "value": int(round(genders_counter[key] * 100.0 / total)),
                    "abs_value": genders_counter[key]
                } for key in genders_counter
            },
        }
        return JsonResponse(data=gender_stats)


class AdditionalInfoAgeDataMocker(AditionalInfoDataMocker):
    def get_mocked_data(self):
        raw_data = self._load_dataset_from_csv()
        years = raw_data[:, 3].astype(int)

        total = years.size
        z_count = years[(years >= 1995) & (years < 2012)].size
        m_count = years[(years >= 1980) & (years < 1995)].size
        x_count = years[(years >= 1965) & (years < 1980)].size
        b_count = years[(years >= 1942) & (years < 1965)].size
        ages_stats = {
            "unknown": 0,
            "total": years.size,
            "data": [
                {
                    "abs_value": years[(years >= 1995) & (years < 2012)].size,
                    "id": "z", "label": "Generation Z: 1995-2012",
                    "value": int(round(z_count * 100. / total)),
                },
                {
                    "abs_value": years[(years >= 1980) & (years < 1995)].size,
                    "id": "m", "label": "Millennials: 1980-1994",
                    "value": int(round(m_count * 100. / total)),
                },
                {
                    "abs_value": years[(years >= 1965) & (years < 1980)].size,
                    "id": "x", "label": "Generation X: 1965-1979",
                    "value": int(round(x_count * 100. / total)),
                },
                {
                    "abs_value": years[(years >= 1942) & (years < 1965)].size,
                    "id": "b", "label": "Baby boomers: 1942-1964",
                    "value": int(round(b_count * 100. / total)),
                }
            ]
        }
        return JsonResponse(data=ages_stats)


class AdditionalInfoEducationDataMocker(AditionalInfoDataMocker):
    def get_mocked_data(self):
        raw_data = self._load_dataset_from_csv()
        education = raw_data[:, 4]
        education_counter = Counter(raw_data[:, 4])

        total = education.size
        edu_stats = {
            'total': total,
            'empty': 0,
            'data': [{
                'id': key,
                'label': key,
                'value': int(round(education_counter[key] * 100. / total)),
                'abs_value': education_counter[key],
            } for key in education_counter]
        }
        return JsonResponse(data=edu_stats)
