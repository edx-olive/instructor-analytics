function CohortTab(button, content) {
    var cohortTab = new Tab(button, content);
    var $loader = $('#cl-loader');
    var $tabBanner = content.find('.tab-banner');
    var $tabContent = content.find('.tab-content');
    var timerId;
    var isRtl = $('body').hasClass('rtl');

    cohortTab.cohortList = content.find('#cohort-check-list');
    cohortTab.emailBody = cohortTab.content.find('#email-body');

    //WYSIWYG init
    if (content.length) {
        $('#email-body').richText();
    }

    content.find('#cohort-send-email-btn').click(function () {
        var $subject = content.find('#email-subject');
        var $richTextEditor = content.find('.richText-editor');
        var $cohortCheckbox = content.find("input:checkbox[name=cohort-checkbox]:checked");
        var emails = '';
        var request;

        function isValid(data) {
            return !!data.users_emails && !!data.subject && !!data.body
        }

        function showInfoMsg(msg){
            msg.removeClass('hidden');
            clearTimeout(timerId);
            timerId = setTimeout(function () {
                msg.addClass('hidden');
            }, 3000);
        }

        $cohortCheckbox.each(function () {
            if (emails.length > 0) {
                emails += ',';
            }
            emails += $(this).val();
        });

        request = {
            users_emails: emails,
            subject: $subject.val(),
            body: $richTextEditor.html(),
        };

        if (!isValid(request)) {
            showInfoMsg(content.find('.send-email-message.validation-error-message'));
            return;
        }

        $.ajax({
            type: "POST",
            url: "api/cohort/send_email/",
            data: request,
            dataType: "json",
            success: function () {
                showInfoMsg(content.find('.send-email-message.success-message'));
                // clear fields
                $subject.val('');
                $richTextEditor.html('');
                $cohortCheckbox.prop('checked', false)
            },
            error: function () {
                showInfoMsg(content.find('.send-email-message.error-message'));
            },
        });
    });
    
    function toggleLoader() {
        $loader.toggleClass('hidden');
    }

    function showEmailList() {
      $('.emails-list-button').on('click', function (ev) {
        ev.preventDefault();
        $(ev.currentTarget).parents('.block-emails-list').find('.cohort-emails-list').toggleClass('hidden');
        $(ev.currentTarget).parents('.block-emails-list').next('.emails-list-holder').toggleClass('hidden');
      });
    }

    function updateCohort() {
        function onSuccess(response) {
            var plot = {
                y: response.values,
                x: response.labels,
                type: 'bar',
            };

            // Highcharts
            var chartData = plot.y.map(function(item, i) { 
                return Object.assign
                    (
                        {name: plot.x[i]}, 
                        {y: plot.y[i]},
                        {sliced: true}
                    )
            });
            
            var pieColors = [
                '#A0E13A',
                '#616CC1',
                '#8F55A5',
                '#459EDB',
                '#01CC9B'
            ];

            var chart = Highcharts.chart('cohort-plot', {
                chart: {
                    type: 'pie',
                    marginLeft: isRtl ? 380 : 100,
                    style: {
                        fontFamily: 'Exo 2.0, sans-serif'
                    },
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
                title: {
                    text: ''
                },
                tooltip: {
                    headerFormat: '',
                    pointFormat: '<span style="color:{point.color}">\u25CF</span> <b> {point.name}</b><br/>' +
                        django.gettext("Percent:") + ' <b>{point.y}</b>'
                },
                credits: {
                    enabled: false
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        colors: pieColors,
                        dataLabels: {
                            enabled: true,
                            color: '#3e3e3e',
                            style: {
                                fontSize: '12px',
                                fontWeight: 'normal'
                            },
                        },
                        showInLegend: true
                    }
                },
                legend: {
                    rtl: isRtl,
                    layout: 'vertical',
                    align: isRtl ? 'left' : 'right',
                    verticalAlign: 'middle',
                    x: isRtl ? 50 : -200,
                    y: 0,
                    itemMarginBottom: 20,
                    borderWidth: 0,
                    symbolRadius: 0,
                    itemStyle: {
                        color: '#232323'
                    },
                    backgroundColor:
                        Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF',

                },
                series: [{
                    innerSize: '23%',
                    slicedOffset: 3,
                    data: chartData
                }],
                responsive: {
                    rules: [{
                        condition: {
                            maxWidth: 900
                        },
                        chartOptions: {
                            chart: {
                                marginLeft: 10,
                            },
                            legend: {
                                layout: 'horizontal',
                                align: 'center',
                                verticalAlign: 'bottom',
                                x: 0,
                                itemMarginBottom: 0,
                                itemMarginTop: 15,
                            },
                            plotOptions: {
                                pie: {
                                    dataLabels: {
                                        enabled: false,
                                    }
                                }
                            },
                        },
                    }]
                }
            });

            if (isRtl) {
                chart.update({
                    tooltip: {
                        useHTML: true,
                        style: {
                            textAlign: 'right',
                            direction: 'rtl'
                        },
                        pointFormat: '<span style="color:{point.color}">\u25CF</span> <b> {point.name}</b><br/>' +
                        ' <b>{point.y}</b>' + ' :' + django.gettext("Percent")
                    },
                    plotOptions: {
                        pie: {
                            dataLabels: {
                                style: {
                                    textOutline: false,
                                    direction: "rtl"
                                },
                                x: 85
                            }
                        }
                    }
                });
            }

            cohortTab.cohortList.empty();
            for (var i = 0; i < response.cohorts.length; i++) {
                var item = 'cohort-checkbox' + i;
                var studentsEmails = response.cohorts[i].students_emails;
                var label  = response.labels[i];

                cohortTab.cohortList.append(
                    _.template(
                        '<li>' +
                            '<div>' +
                                '<input ' +
                                    'id="<%= item %>" ' +
                                    'name="cohort-checkbox" ' +
                                    'type="checkbox" ' +
                                    '<%if (studentsEmails.length == 0) {%> disabled <%}%>' +
                                    'value="<%= studentsEmails %>"' +
                                '>' +
                                '<label for="<%= item %>" class="emails-label">' +
                                    '<%= label %>' +
                                '</label>' +
                                '<%if (studentsEmails.length != 0) {%>' +
                                '<div class="block-emails-list">' +
                                    '<span class="cohort-emails-list">' +
                                      '<a class="emails-list-button"><%- gettext("Show emails...") %></a>' +
                                    '</span>' +
                                    '<span class="cohort-emails-list hidden">' +
                                      '<a class="emails-list-button"><%- gettext("Hide emails") %></a>' +
                                    '</span>' +
                                '</div>' +
                                '<div class="emails-list-holder hidden"><%= studentsEmails.join(", ") %></div>' +
                                '<%}%>' +
                            '</div>' +
                        '</li>'
                    )({
                        item: item,
                        studentsEmails: studentsEmails,
                        label: label,
                    })
                )
            }
            showEmailList();
        }

        function onError() {
            alert("Statistics for the select course cannot be loaded.");
        }

        $.ajax({
            type: "POST",
            url: "api/cohort/",
            dataType: "json",
            traditional: true,
            success: onSuccess,
            error: onError,
            beforeSend: toggleLoader,
            complete: toggleLoader,
        });

    }

    function loadTabData() {
        var courseDatesInfo = $('.course-dates-data').data('course-dates')[cohortTab.tabHolder.course];
        if (courseDatesInfo.course_is_started) {
            $tabBanner.prop('hidden', true);
            $tabContent.prop('hidden', false);
            updateCohort();
        } else {
            $tabBanner.prop('hidden', false);
            $tabContent.prop('hidden', true);
        }
    }

    cohortTab.loadTabData = loadTabData;

    return cohortTab;
}
