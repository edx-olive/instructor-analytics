/**
 * Implementation of Tab for the enrollment tab
 * @returns {Tab}
 * @class old realisation
 */
function EnrollmentTab(button, content) {
  var enrollTab = new Tab(button, content);
  var timeFilter = new TimeFilter(content, updateEnrolls);

  /**
   * Send ajax to server side according selected date range and redraw plot
   */
  function updateEnrolls() {

    function onSuccess(response) {
      var totalTrace;
      var enrollTrace;
      var unenrollTrace;
      var data;


      function dataFixFunction(x) {
        var result = new Date(x);
        return result.getTime();
      }

      var x_template = {
        type: "date",
        margin: {t: 10}
      };
      if (response.customize_xticks) {
        x_template["tick0"] = response.dates_total[0];
        x_template["dtick"] = 86400000.0;
        x_template["tickformat"] = "%d %b %Y";
      }

      var y1_template = {
        side: 'right',
        overlaying: 'y2',
        title: django.gettext('Total'),
        titlefont: {color: '#568ecc'},
        tickfont: {color: '#568ecc'},
      };
      if (response.customize_y1ticks) {
        y1_template["nticks"] = response.nticks_y1+1
      }

      var y2_template = {
        title: django.gettext('Enrollments/Unenrollments'),
        gridcolor: '#cecece',
      };
      if (response.customize_y2ticks) {
        y2_template["nticks"] = response.nticks_y2+1
      }

      totalTrace = {
        x: response.dates_total.map(dataFixFunction),
        y: response.counts_total,
        name: django.gettext('Total')
      };

      enrollTrace = {
        x: response.dates_enroll.map(dataFixFunction),
        y: response.counts_enroll,
        name: django.gettext('Enrollments')
      };

      unenrollTrace = {
        x: response.dates_unenroll.map(dataFixFunction),
        y: response.counts_unenroll,
        name: django.gettext('Unenrollments')
      };

      data = [enrollTrace, unenrollTrace, totalTrace];

      var chartSetOptions = {
        colors: [
          '#5BB215',
          '#E37C67'
        ],
        chart: {
          type: 'areaspline',
          style: {
            fontFamily: "'Open Sans', sans-serif"
          }
        }
      };

      Highcharts.setOptions(chartSetOptions);

      function chartDatesAndValues(dates, values) {
        return dates.map(function(value, index) {
          return [dates[index], values[index]];
        });
      };

      var chart1 = [{
          name: enrollTrace.name,
          data: chartDatesAndValues(enrollTrace.x, enrollTrace.y)
      }, {
          name: unenrollTrace.name,
          data: chartDatesAndValues(unenrollTrace.x, unenrollTrace.y)
      }];

      var chart2 = [{
        name: totalTrace.name,
        data: chartDatesAndValues(totalTrace.x, totalTrace.y) 
      }];

      var chartOpt = {
        title: {
          text: ''
        },
        legend: {
          layout: 'horizontal',
          align: 'center',
          verticalAlign: 'top',
          x: 0,
          y: 0,
          floating: true,
          borderWidth: 0,
          backgroundColor:
              Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF'
        },
        xAxis: {
          dateTimeLabelFormats: {
            day: '%b %d'
          },
          type: 'datetime',
          allowDecimals: false,
          gridLineWidth: 1,
          labels: {
            enabled: true,
            style: {
              color: '#3F3F3F',
              fontSize: '12px'
            }
          }
        },
        yAxis: {
          title: {
            text: ''
          },
          allowDecimals: false
        },
        tooltip: {
          shared: true,
          valueSuffix: ' users'
        },
        credits: {
          enabled: false
        },
        plotOptions: {
          areaspline: {
            fillOpacity: 0.4
          },
          series: {
            marker: {
              enabled: true
            }
          }
        },
        series: chart1
      };

      var chartClass = 'enrollment-stats-plot';
      var checkedClass = 'is-checked';

      Highcharts.chart(chartClass, chartOpt);

      function drawChart(data) {
        Highcharts.setOptions(Object.assign(chartSetOptions, {
          colors: data.colors
        }));

        Highcharts.chart(chartClass, Object.assign(chartOpt, {
          series: data.name
        }));
      }

      function drawChartTotal() {
        drawChart({
          name: chart2,
          colors: [
            '#232323'
          ]
        });
      }

      if ( $('.chartTotal').hasClass(checkedClass) ) {
        drawChartTotal();
      }

      $('.enrollment-toggle-btns__label').on('click', function() {
        var el = $(this);
        var $input = el.find('input');

        $('input').removeClass(checkedClass);
        $input.addClass(checkedClass);

        if ($input.data('chart-name') == 'chart1') {
          drawChart({
            name: chart1,
            colors: [
              '#5BB215',
              '#E37C67'
            ]
          });
        } else {
          drawChartTotal();
        }
      });
    }

    function onError() {
      alert("Can't load data for selected period!");
    }

    $.ajax({
      type: "POST",
      url: "api/enroll_statics/",
      data: timeFilter.timestampRange,
      dataType: "json",
      traditional: true,
      success: onSuccess,
      error: onError,
      beforeSend: timeFilter.setLoader,
      complete: timeFilter.removeLoader,
    });
  }

  function loadTabData() {
    try {
      var enrollInfo = $('#enrollment-data').data('enroll')[enrollTab.tabHolder.course];
      var courseDatesInfo = $('.course-dates-data').data('course-dates')[enrollTab.tabHolder.course];
      var firstEnrollDate = null;
      var courseStartDate = moment();

      if (enrollInfo.enroll_start !== "null") {
        firstEnrollDate = moment(enrollInfo.enroll_start * 1000); // Date of 1st enrollment
      }
      if (courseDatesInfo.course_is_started) {
        courseStartDate = moment(courseDatesInfo.course_start * 1000)  // Date of course start
      }

      timeFilter.init(
          moment(Math.min(firstEnrollDate, courseStartDate)),
          firstEnrollDate
      );

    }
    catch (error) {
      console.error(error);
    }

    updateEnrolls();
  }

  enrollTab.loadTabData = loadTabData;

  return enrollTab;
}
