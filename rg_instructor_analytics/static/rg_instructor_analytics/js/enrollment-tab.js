/**
 * Implementation of Tab for the enrollment tab
 * @returns {Tab}
 * @class old realisation
 */
function EnrollmentTab(button, content) {
  var enrollTab = new Tab(button, content);
  var timeFilter = new TimeFilter(content, updateEnrolls);
  var defaultColor = '#3e3e3e';
  var defaultFontSize = '12px';

  /**
   * Send ajax to server side according selected date range and redraw plot
   */
  function updateEnrolls() {

    function onSuccess(response) {

      var chart1 = [{
          name: django.gettext('Enrollments'),
          data: response.enrolls
      }, {
          name: django.gettext('Unenrollments'),
          data: response.unenrolls
      }];

      var chart2 = [{
        name: django.gettext('Total'),
        data: response.totals
      }];

      var chartClass = 'enrollment-stats-plot';
      var checkedClass = 'is-checked';
      var isRtl = $('body').hasClass('rtl');

      function drawChart(series, colors) {
        Highcharts.setOptions({
          colors: colors,
          chart: {
            type: 'areaspline',
            style: {
              fontFamily: "'Open Sans', sans-serif"
            },
            marginTop: 40,
            events: {
              load: function() {
                this.update({
                    chart: {
                        height: 400
                    }
                })
              }
            },
          },
          lang: {
            months: moment.months(),
            weekdays: moment.weekdays(),
            shortMonths: moment.monthsShort()
          }
        });

        var chart = Highcharts.chart(chartClass,
          {
            title: {
              text: ''
            },
            legend: {
              rtl: isRtl,
              layout: 'horizontal',
              align: 'center',
              verticalAlign: 'top',
              x: 0,
              y: 0,
              floating: true,
              borderWidth: 0,
              itemStyle: {
                color: defaultColor
              },
              backgroundColor:
                  Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF'
            },
            xAxis: {
              reversed: isRtl,
              dateTimeLabelFormats: {
                day: '%b %d'
              },
              type: 'datetime',
              allowDecimals: false,
              gridLineWidth: 1,
              labels: {
                enabled: true,
                style: {
                  color: defaultColor,
                  fontSize: defaultFontSize
                }
              }
            },
            yAxis: {
              opposite: isRtl,
              title: {
                text: ''
              },
              allowDecimals: false,
              labels: {
                style: {
                  color: defaultColor,
                  fontSize: defaultFontSize
                }
              }
            },
            tooltip: {
              shared: true,
              valueSuffix: ' ' + django.gettext("Users") + ' ',
              style: {
                color: defaultColor,
                textAlign: isRtl ? 'right' : 'left',
                direction: isRtl ? 'rtl' : 'ltr',
              }
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
            series: series
          });

          if (isRtl) {
            chart.update({
              tooltip: {
                useHTML: true,
                style: {
                  textAlign: 'right'
                }
              }
            });
          }
      }

      function drawChartTotal() {
        drawChart(chart2, ['#232323']);
      }
      function drawChartEnrollUnenroll() {
        drawChart(chart1,['#5BB215', '#E37C67']);
      }

      if ( $('.chartTotal').hasClass(checkedClass) ) {
        drawChartTotal();
      }
      else {
        drawChartEnrollUnenroll();
      }

      $('.enrollment-toggle-btns__label').on('click', function() {
        var el = $(this);
        var $input = el.find('input');

        $('input').removeClass(checkedClass);
        $input.addClass(checkedClass);

        if ($input.data('chart-name') == 'chart1') {
          drawChartEnrollUnenroll();
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
