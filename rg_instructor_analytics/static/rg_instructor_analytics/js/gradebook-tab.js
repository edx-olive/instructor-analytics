/**
 * Implementation of Tab for the gradebook tab
 * @returns {Tab}
 * @class old realisation
 */
function GradebookTab(button, content) {
    var greadebookTab = new Tab(button, content);
    var $tabBanner = content.find('.tab-banner');
    var $tabContent = content.find('.tab-content');
    var $tabSubtitle = content.find('.js-analytics-subtitle');
    var $tabSubtitleText = content.find('.js-analytics-subtitle-text');

    var $tbody = $('#gradebook_table_body');
    var $loader = $('#gb-loader');
    var $statsPlot = $('#gradebook-stats-plot');
    var $loaderDiscussion = $('.gradebook-discussion-plot .loader');
    var $discussionPlot = $('#gradebook-discussion-stats-plot');
    var $loaderVideo = $('.gradebook-video-plot .loader');
    var $videoPlot = $('#gradebook-video-stats-plot');
    var $loaderStudentStep = $('.gradebook-student-step-plot .loader');
    var $studentStepPlot = $('#gradebook-student-step-stats-plot');
    var $lastVisitInfo = $('.js-last-student-visit');
    var plotContainerClass = '.js-plot-container';
    var chartsClass = '.js-highchart-figure';
    var defaultColor = '#3e3e3e';
    var defaultFontSize = '12px';
    var isRtl = $('body').hasClass('rtl');
    var MAX_UNIT_TEXT_LENGTH = 50;

    greadebookTab.studentsTable = content.find('#student_table_body');
    greadebookTab.gradebookTableHeader = content.find('#gradebook_table_header');
    greadebookTab.gradebookTableBody = content.find('#gradebook_table_body');
    
    greadebookTab.filterString = '';

    function loadTabData() {
        var courseDatesInfo = $('.course-dates-data').data('course-dates')[greadebookTab.tabHolder.course];
        if (courseDatesInfo.course_is_started) {
            $tabBanner.prop('hidden', true);
            $tabContent.prop('hidden', false);
            $tabSubtitle.addClass('hidden');
            $tabSubtitleText.addClass('hidden').parent(plotContainerClass).prop('hidden', true);
            updateData();
        } else {
            $tabBanner.prop('hidden', false);
            $tabContent.prop('hidden', true);
        }
    }

    greadebookTab.loadTabData = loadTabData;

    function toggleLoader() {
        $loader.toggleClass('hidden');
    }

    function onError() {
        alert("Can't load data for selected course!");
    }
    
    function updateData(filter) {
        var filterString = filter || '';
        greadebookTab.gradebookTableHeader.empty();
        greadebookTab.gradebookTableBody.empty();
        $statsPlot.addClass('hidden');
        $discussionPlot.empty();
        $videoPlot.empty();
        $studentStepPlot.empty();
        $lastVisitInfo.prop('hidden', true).empty();

        function onSuccess(response) {
            greadebookTab.studentExamValues = response.student_exam_values;
            greadebookTab.examNames = response.exam_names;
            greadebookTab.studentInfo = response.students_info;
            updateTables(filterString);
        }
        
        $.ajax({
            type: "POST",
            url: "api/gradebook/",
            data: {filter: filterString},
            dataType: "json",
            traditional: true,
            success: onSuccess,
            error: onError,
            beforeSend: toggleLoader,
            complete: toggleLoader,
        });
    }

    function chartMaxLabelsLength(arr, value) {
        var letterWidth = value;
        var maxLabelLength = Math.max.apply(null, arr.map(function(label) {
            return label.length;
        }));

        return maxLabelLength * letterWidth;
    }

    function renderDiscussionActivity(data, userName) {
        var chartNames = data.thread_names;
        var chartValues = data.activity_count;
        var y_template = {
            side: isRtl ? "right" : "left"
        };
        var chartData = chartNames.map(function(value, index) {
            return [chartNames[index], chartValues[index]];
        });

        if (Math.max(...data.activity_count) <= 5) {
            y_template["nticks"] = Math.max(...data.activity_count)+1
        }        

        Highcharts.setOptions({
            colors: ['#3caada'],
            chart: {
                type: 'bar',
                events: {
                    load: function() {
                        var categoryHeight = 56;
                        this.update({
                            chart: {
                                height: categoryHeight * this.pointCount + (this.chartHeight - this.plotHeight)
                            }
                        })
                    }
                }
            }
        });

        Highcharts.chart('gradebook-discussion-stats-plot', {
            data: {
                table: 'datatable'
            },
            title: {
                text: ''
            },
            credits: {
                enabled: false
            },
            xAxis: {
                opposite: isRtl,
                type: 'category',
                labels: {
                    style: {
                        fontSize: defaultFontSize,
                        color: defaultColor
                    }
                },
                lineColor: '#959595',
                lineWidth: 2,
                angle: -90,
            },
            yAxis: {
                reversed: isRtl,
                allowDecimals: false,
                title: {
                    text: ''
                },
                labels: {
                    style: {
                        fontSize: defaultFontSize,
                        color: defaultColor
                    }
                },
            },
            plotOptions: {
                bar: {
                    pointWidth: 35,
                    borderRadius: 2
                }
            },
            legend: {
                enabled: false
            },
            tooltip: {
                pointFormat: '<b>{point.y:.1f}</b>',
                useHTML: isRtl,
                style: {
                    textAlign: isRtl ? 'right' : 'left'
                }
            },
            series: [{
                data: chartData,
                dataLabels: {
                    enabled: false
                }
            }]
        });

        $loaderDiscussion.addClass('hidden');
        $(plotContainerClass).find(chartsClass).prop('hidden', false);
    }

    function renderVideoActivity(data, userName) {
        var colorVideoArray = data.videos_completed.map(function (isCompleted) {
            return isCompleted ? '#01cc9b' : '#8f55a5';
        });
        var chartNames = data.videos_names;
        var chartValues = data.videos_time;
        var y_template = {};
        var chartData = chartNames.map(function(value, index) {
            return [chartNames[index], chartValues[index]];
        });

        if (Math.max(...data.videos_time) <= 5) {
            y_template["nticks"] = Math.max(...data.videos_time)+1
        }

        Highcharts.setOptions({
            colors: colorVideoArray,
            chart: {
                type: 'bar',
                events: {
                    load: function() {
                        var categoryHeight = 56;
                        this.update({
                            chart: {
                                height: categoryHeight * this.pointCount + (this.chartHeight - this.plotHeight)
                            }
                        })
                    }
                }
            }
        });

        Highcharts.chart('gradebook-video-stats-plot', {
            data: {
                table: 'datatable'
            },
            title: {
                text: ''
            },
            credits: {
                enabled: false
            },
            xAxis: {
                opposite: isRtl,
                type: 'category',
                labels: {
                    style: {
                        fontSize: defaultFontSize,
                        color: defaultColor
                    }
                },
                lineColor: '#959595',
                lineWidth: 2,
                angle: -90,
            },
            yAxis: {
                reversed: isRtl,
                title: {
                    text: ''
                },
                labels: {
                    style: {
                        fontSize: defaultFontSize,
                        color: defaultColor
                    }
                },
            },
            plotOptions: {
                bar: {
                    pointWidth: 35,
                    borderRadius: 2,
                    colorByPoint: true
                }
            },
            legend: {
                enabled: false
            },
            tooltip: {
                pointFormat: '<b>{point.y:.1f}</b>',
                useHTML: isRtl,
                style: {
                    textAlign: isRtl ? 'right' : 'left'
                }
            },
            series: [{
                data: chartData,
                dataLabels: {
                    enabled: false
                }
            }]
        });

        $loaderVideo.addClass('hidden');
        $(plotContainerClass).find(chartsClass).prop('hidden', false);
    }

    function getDiscussionActivity(studentPosition) {
        var userName = greadebookTab.studentInfo[studentPosition]['username'];

        $discussionPlot.empty();
        $loaderDiscussion.removeClass('hidden');

        $.ajax({
            type: "POST",
            url: "api/gradebook/discussion/",
            data: {username: userName},
            dataType: "json",
            traditional: true,
            success: function (response) {
              renderDiscussionActivity(response, userName);
            },
            error: onError,
        });
    }

    function getVideoActivity(studentPosition) {
        var userName = greadebookTab.studentInfo[studentPosition]['username'];

        $videoPlot.empty();
        $loaderVideo.removeClass('hidden');

        $.ajax({
            type: "POST",
            url: "api/gradebook/video_views/",
            data: {username: userName},
            dataType: "json",
            traditional: true,
            success: function (response) {
              renderVideoActivity(response, userName);
            },
            error: onError,
        });
    }

    function renderStudentStep(data, userName) {
        var heightLayout = data.tickvals.length * 20;
        var defaultStat = {
            x: data.x_default,
            y: data.tickvals
        };

        function truncateLongUnitText(array) {
            var result = array.map(function(item) {
                var truncate = item.substring(0, MAX_UNIT_TEXT_LENGTH);
                if (item.length > MAX_UNIT_TEXT_LENGTH) {
                    item = isRtl ? '...' + truncate : truncate + '...';
                }
                return item;
            });

            return result;
        };

        var stat = {
            x: data.steps,
            y: data.units,
            mode: 'lines+markers',
            name: '',
            marker: {
                size: 8,
                color: '#01cc9b'
            },
            line: {
                dash: 'solid',
                width: 1
            }
        };


        var x_template = {
            autorange: isRtl ? "reversed" : true,
        };

        if (Math.max(...data.steps) <= 5) {
            x_template["nticks"] = Math.max(...data.steps)+1
        }

        var layout = {
            title: {
                text: django.gettext("Student:") + ' <b>' + userName + '</b>',
                x: 0,
                font: {
                    size: '16px',
                    color: defaultColor
                }
            },
            showlegend: false,
            height: heightLayout > 900 && heightLayout || 900,
            width: 940,
            xaxis: x_template,
            yaxis: {
                ticktext: truncateLongUnitText(data.ticktext),
                tickvals: data.tickvals,
                tickmode: 'array',
                automargin: true,
                autorange: true,
                side: isRtl ? 'right' : 'left'
            },
        };

        var data = [stat];

        Plotly.newPlot('gradebook-student-step-stats-plot', [defaultStat, stat], layout, {displayModeBar: false});
        $loaderStudentStep.addClass('hidden');
        $(plotContainerClass).find(chartsClass).prop('hidden', false);
    }

    function getStudentStep(studentPosition) {
        var userName = greadebookTab.studentInfo[studentPosition]['username'];
        $studentStepPlot.empty();
        $loaderStudentStep.removeClass('hidden');

        $.ajax({
            type: "POST",
            url: "api/gradebook/student_step/",
            data: {username: userName},
            dataType: "json",
            traditional: true,
            success: function (response) {
              renderStudentStep(response, userName);
            },
            error: onError,
        });
    }

    function updateTables(filterString) {
        var htmlStringStudents = '';
        var htmlStringStudentsUnenroll = '';
        var value = filterString;
        var $searchInput;
        var htmlTemp;
        
        var htmlTemplate = (
            '<div class="gradebook-table-cell">' +
            '<form class="student-search">' +
            '<input ' +
            'value="<%= value %>" ' +
            'type="search" ' +
            'class="student-search-field" ' +
            'placeholder="<%= placeholder %>" ' +
            '/>' +
            '</form>' +
            '</div>'
        );

        for (var i = 0; i < greadebookTab.examNames.length; i++) {
            htmlTemplate += (
                '<div class="gradebook-table-cell">' +
                '<div class="assignment-label">' +
                gettext(greadebookTab.examNames[i]) +
                '</div>' +
                '</div>'
            );
        }
        
        htmlTemp = _.template(htmlTemplate)({
            value: value,
            placeholder: django.gettext("Search students"),
        });
        
        greadebookTab.gradebookTableHeader.append(htmlTemp);
        
        $searchInput = $('.student-search-field');
        $searchInput[0].addEventListener('keyup', function(e) {
            if (e.keyCode == 13) {
                e.preventDefault();
                this.blur();
            }
        });
        
        $(".student-search").submit(function(e) {
            e.preventDefault();
        });
        
        $searchInput.on('change', function(evt) {
            var filterValue = evt.target.value;
            updateData(filterValue);
        });
        greadebookTab.studentsTable.empty();
        
        for (var j = 0; j < greadebookTab.studentExamValues.length; j++) {
            var htmlStringResults = '';
            var studentName = greadebookTab.studentInfo[j]['username'];
            var isEnrolled =  greadebookTab.studentInfo[j]['is_enrolled'];
            
            for (var nameIndex = 0; nameIndex < greadebookTab.examNames.length; nameIndex++) {
                var exName = greadebookTab.studentExamValues[j][greadebookTab.examNames[nameIndex]];
                htmlStringResults += '<div class="gradebook-table-cell">' + exName + '</div>';
            }

            if (isEnrolled) {
                htmlStringStudents += _.template(
                    '<div class="gradebook-table-row">' +
                        '<div class="gradebook-table-cell">' +
                            '<a data-position="<%= dataPosition %>" title="<%= studentName %>"><%= studentName %></a>' +
                        '</div>' +
                        htmlStringResults +
                    '</div>'
                )({
                    studentName: studentName,
                    dataPosition: j,
                });
            } else {
                htmlStringStudentsUnenroll += _.template(
                    '<div class="gradebook-table-row">' +
                        '<div class="gradebook-table-cell">' +
                            '<a data-position="<%= dataPosition %>" title="<%= studentName %> (unenroll)"><%= studentName %> (<%=gettext(\'Unenroll\')%>)</a>' +
                        '</div>' +
                        htmlStringResults +
                    '</div>'
                )({
                    studentName: studentName,
                    dataPosition: j,
                });
            }
        }
        
        greadebookTab.gradebookTableBody.append(htmlStringStudents);
        greadebookTab.gradebookTableBody.append(htmlStringStudentsUnenroll);
        
        //Make cells width equal to biggest cell
        var maxLength = 0;
        var $tableCells = $('.gradebook-table-cell:not(:first-child)');
        $tableCells.each(function (item) {
            var width = $tableCells[item].clientWidth;
            if (maxLength < width) {
                maxLength = width;
            }
        });
        
        $tableCells.each(function (item) {
            $tableCells[item].style.flex = '0 0 ' + maxLength + 'px';
        });

        greadebookTab.gradebookTableBody.css('padding-top', greadebookTab.gradebookTableHeader.height() + 1);

        $(greadebookTab.gradebookTableBody).off('click');
        $(greadebookTab.gradebookTableBody).on('click', function (evt) {
            var colorArray = greadebookTab.examNames.map(function (item, idx, arr) {
                if (idx === arr.length - 1) {
                    return '#8f55a5';
                }
                return '#01cc9b';
            });

            $(chartsClass).prop('hidden', true);

            var studentsGrades = [];
            var studentPosition = evt.target.dataset['position'];
            var stat;
            var lastVisit = greadebookTab.studentInfo[studentPosition]['last_visit'];
            $lastVisitInfo.prop('hidden', false).html(gettext('Date of the last Course visit:') + ' <b>' + lastVisit + '</b>');

            getDiscussionActivity(studentPosition);
            getVideoActivity(studentPosition);
            getStudentStep(studentPosition);

            $statsPlot.removeClass('hidden');
            for (var nameIndex = 0; nameIndex < greadebookTab.examNames.length; nameIndex++) {
                studentsGrades.push(
                  greadebookTab.studentExamValues[studentPosition][greadebookTab.examNames[nameIndex]]
                );
            }

            stat = {
                x: greadebookTab.examNames,
                y: studentsGrades,
            };
            
            var chartNames = stat.x;
            var chartValues = stat.y;
            var CHART_HEIGHT = 271;

            var chartData = chartNames.map(function(value, index) {
                return [chartNames[index], chartValues[index]];
            });

            Highcharts.setOptions({
                colors: colorArray,
                chart: {
                    type: 'column',
                    height: CHART_HEIGHT,
                    events: {
                        load: function() {
                            this.update({
                                chart: {
                                    height: CHART_HEIGHT
                                }
                            })
                        }
                    }
                }
            });

            Highcharts.chart('gradebook-stats-plot', {
                data: {
                    table: 'datatable'
                },
                title: {
                    text: ''
                },
                credits: {
                    enabled: false
                },
                xAxis: {
                    reversed: isRtl,
                    type: 'category',
                    labels: {
                        style: {
                            fontSize: defaultFontSize,
                            color: defaultColor
                        }
                    },
                    lineColor: '#959595',
                    lineWidth: 2,
                },
                yAxis: {
                    opposite: isRtl,
                    title: {
                        text: ''
                    },
                    labels: {
                        style: {
                            fontSize: defaultFontSize,
                            color: defaultColor
                        }
                    },
                },
                legend: {
                    enabled: false
                },
                tooltip: {
                    pointFormat: '<b>{point.y:.1f}</b>',
                    useHTML: isRtl,
                    style: {
                        textAlign: isRtl ? 'right' : 'left'
                    }

                },
                series: [{
                    data: chartData,
                    dataLabels: {
                        enabled: false
                    },
                    borderRadius: 2,
                }]
            });

            $('.gradebook-table-row').removeClass('active');
            $(evt.target).closest('.gradebook-table-row').toggleClass('active');
            $tabSubtitle.removeClass('hidden');
            $tabSubtitleText.removeClass('hidden').parent(plotContainerClass).prop('hidden', false);

        })
    }

    $tbody.on('scroll', function() {
        var scrollLeft = $tbody.scrollLeft();
        
        $('#gradebook_table_header').css("left", -scrollLeft);
        $('.gradebook-table-cell:first-child').css("left", scrollLeft)
    });

    return greadebookTab;
}
