/**
 * Implementation of Tab for the activity tab
 * @returns {Tab}
 * @class old realisation
 */
function ActivityTab(button, content) {
  var activityTab = new Tab(button, content);
  var timeFilter = new TimeFilter(content, updateActivity);
  var $tabBanner = content.find('.tab-banner');
  var $tabContent = content.find('.tab-content');
  var $tabContentItems = content.find('.item-content');
  var $loaderDailyActivities = content.find('.js-loader__activity_stats');
  var $tabContentDailyActivities = content.find('.js-item-content__activity_stats');
  var $loaderUnitVisits = content.find('.js-loader__unit-visits-stats');
  var $tabContentUnitVisits = content.find('.item-content__unit-visits-stats');
  var $videoCheckbox = content.find('#series-video');
  var $discussionCheckbox = content.find('#series-discussion');
  var $visitsCheckbox = content.find('#series-visits');

  function renderDailyActivities(dailyActivities) {
    $loaderDailyActivities.addClass('hidden');
    $tabContentDailyActivities.removeClass('hidden');

    var chartData = [{
        name: django.gettext('Video'),
        data: dailyActivities.video_views,
        visible: $videoCheckbox.is(":checked"),
        showInLegend: $videoCheckbox.is(":checked")
    },{
        name: django.gettext('Discussion'),
        data: dailyActivities.discussion_activities,
        visible: $discussionCheckbox.is(":checked"),
        showInLegend: $discussionCheckbox.is(":checked")
    },{
        name: django.gettext('Visit'),
        data: dailyActivities.course_activities,
        visible: $visitsCheckbox.is(":checked"),
        showInLegend: $visitsCheckbox.is(":checked")
    }];

    var chartSetOpt = {
        colors: [
          '#3CAADA',
          '#84C124',
          '#9C75D9'
        ],
        chart: {
            fontFamily: "'Exo 2.0', sans-serif"
        }
    };

    Highcharts.setOptions(chartSetOpt);

    var chart = Highcharts.chart('activity-stats-plot', {
        chart: {
            type: 'areaspline'
        },
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
            type: 'datetime',
            gridLineWidth: 1,
            allowDecimals: false,
            dateTimeLabelFormats: {
                day: '%b %Y'
            },
            colors: ['#50c156', '#568ecc', '#8e28c1']
        },
        yAxis: {
            title: {
                text: ''
            }
        },
        tooltip: {
            shared: true,
            valueSuffix: ' units'
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            areaspline: {
                fillOpacity: 0.5
            }
        },
        series: chartData,
        dashStyle: 'longdash'
    });

    function toggleSeriesCheckbox($checkbox, series_num) {
        chart.series[series_num].update({
            showInLegend: $checkbox.is(":checked"),
            visible: $checkbox.is(":checked"),
        });
    }
    $videoCheckbox.off('change');
    $discussionCheckbox.off('change');
    $visitsCheckbox.off('change');
    $videoCheckbox.on('change', function(){toggleSeriesCheckbox($videoCheckbox, 0)});
    $discussionCheckbox.on('change', function(){toggleSeriesCheckbox($discussionCheckbox, 1)});
    $visitsCheckbox.on('change', function(){toggleSeriesCheckbox($visitsCheckbox, 2)});
  }

  function renderUnitVisits(unitVisits) {
    $loaderUnitVisits.addClass('hidden');
    $tabContentUnitVisits.removeClass('hidden');

    // Highcharts
    var chartValues = unitVisits.count_visits;
    var chartText = unitVisits.ticktext;

    var chartData = chartText.map(function(value, index) {
        return [chartText[index], chartValues[index]];
    });

    Highcharts.chart('activity-unit-visits-stats-plot', {
        chart: {
            type: 'bar',
            events: {
                load: function() {
                    var categoryHeight = 22;
                    this.update({
                        chart: {
                            height: categoryHeight * this.pointCount + (this.chartHeight - this.plotHeight)
                        }
                    })
                }
            }
        },
        title: {
            text: ''
        },
        plotOptions: {
            bar: {
                pointWidth: 16,
                borderRadius: 4
            }
        }, 
        xAxis: {
            type: 'category',
            labels: {
                style: {
                    fontSize: '12px',
                    color: '#3F3F3F'
                }
            },
            lineColor: '#3CAADA',
            lineWidth: 1,
        },
        credits: {
            enabled: false
        },
        yAxis: {
            allowDecimals: false,
            endOnTick: false,
            title: {
                text: ''
            }
        },
        legend: {
            enabled: false
        },
        tooltip: {
            pointFormat: '<b>{point.y:.1f}</b>'
        },
        series: [{
            data: chartData,
            dataLabels: {
                enabled: false
            }
        }]
    });

  }

  function updateActivity() {
      $tabContentItems.addClass('hidden');
      $loaderDailyActivities.removeClass('hidden');
      $loaderUnitVisits.removeClass('hidden');

      function onError() {
          $loaderDailyActivities.addClass('hidden');
          $loaderUnitVisits.addClass('hidden');
          alert("Can't load data for selected period!");
      }

      $.ajax({
          type: "POST",
          url: "api/activity/daily/",
          data: timeFilter.timestampRange,
          dataType: "json",
          traditional: true,
          success: function (data) {
              renderDailyActivities(data);
          },
          error: onError,
      });

      $.ajax({
          type: "POST",
          url: "api/activity/unit_visits/",
          data: timeFilter.timestampRange,
          dataType: "json",
          traditional: true,
          success: function (data) {
            renderUnitVisits(data);
          },
          error: onError,
      });
  }

  function loadTabData() {
      try {
          var courseDatesInfo = $('.course-dates-data').data('course-dates')[activityTab.tabHolder.course];
          if (courseDatesInfo.course_is_started) {
              $tabBanner.prop('hidden', true);
              $tabContent.prop('hidden', false);
              timeFilter.init(moment(courseDatesInfo.course_start * 1000));
              updateActivity();
          } else {
              $tabBanner.prop('hidden', false);
              $tabContent.prop('hidden', true);
          }
      }
      catch (error) {
          console.error(error);
      }
  }

  activityTab.loadTabData = loadTabData;

  return activityTab;
}
