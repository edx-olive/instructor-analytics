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

  var unitsBySequenceOrder = null;
  var unitsOrder = 'sequence_order';
  var unitsCount = 10;

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
            itemStyle: {
                color: '#3e3e3e'
            },
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
            labels: {
                style: {
                  color: '#3e3e3e'
                }
            },
            colors: ['#50c156', '#568ecc', '#8e28c1']
        },
        yAxis: {
            title: {
                text: ''
            },
            labels: {
                style: {
                  color: '#3e3e3e'
                }
            }
        },
        tooltip: {
            style: {
                color: '#3e3e3e'
            },
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

  function changeUnitsOrder(){
    unitsOrder = $(this).val();
    renderUnitVisits();
  }

  function changeUnitsCountLimit(event){
    event.preventDefault();
    var $limiter = $(this);
    if (! $limiter.hasClass("selected-limit")) {
        $(".count-limit-container>a.selected-limit").removeClass("selected-limit");
        $limiter.addClass("selected-limit");
        unitsCount = this.dataset.limit;
        renderUnitVisits();
    }
  }

  $(".count-limit-container").children().on('click', changeUnitsCountLimit);
  $("select.units-sort-order").on('change', changeUnitsOrder);

  function initUnitVisits(unitVisits){
    unitsBySequenceOrder = unitVisits;

    renderUnitVisits();
  }

  function getOrderedUnitVisits() {
    if(unitsOrder == 'sequence_order'){
      return unitsBySequenceOrder;
    }
    var exchangeCondition = unitsOrder == 'highest'? function (a, b) {return a < b}: function(a, b) {return b < a};

    var countVisits = unitsBySequenceOrder.count_visits.slice();
    var ticktext = unitsBySequenceOrder.ticktext.slice();

    var len = countVisits.length;
    var swapped;
    do {
        swapped = false;
        for (var i = 0; i < len; i++) {
            if (exchangeCondition(countVisits[i], countVisits[i + 1])) {
                var tmp = countVisits[i];
                countVisits[i] = countVisits[i + 1];
                countVisits[i + 1] = tmp;
                tmp = ticktext[i];
                ticktext[i] = ticktext[i + 1];
                ticktext[i + 1] = tmp;
                swapped = true;
            }
        }
    } while (swapped);

    return {count_visits: countVisits, ticktext: ticktext};
  }

  function getCountLimitedUnitVisits(orderedUnitVisits) {
    if (unitsCount == 'all') {
      return orderedUnitVisits;
    }
    return {
      count_visits: orderedUnitVisits.count_visits.slice(0, unitsCount),
      ticktext: orderedUnitVisits.ticktext.slice(0, unitsCount)
    }
  }

  function renderUnitVisits() {
    $loaderUnitVisits.addClass('hidden');
    $tabContentUnitVisits.removeClass('hidden');

    var unitVisits = getCountLimitedUnitVisits(getOrderedUnitVisits());

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
                    color: '#3e3e3e'
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
            },
            labels: {
                style: {
                  color: '#3e3e3e'
                }
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
            initUnitVisits(data);
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
