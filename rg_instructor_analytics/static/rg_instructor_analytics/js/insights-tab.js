function InsightsTab(button, content) {
    'use strict';
    var InsightsTab = new Tab(button, content),
        $loader = $('#insights-loader'),
        instructorAnalyticsTasks = new PendingInstructorAnalyticsTasks($('#insights-content')),
        reportDownloads = new ReportDownloads($('#insights-content')),
        timerId,
        sitesSelector = InsightsTab.content.find('#insight-site-selector'),
        sortableColumns = $("#insights-content").find(".sortable"),
        selectedMicrositeId;

    function toggleLoader() {
        $loader.toggleClass('hidden');
    }

    function onInsightsLoadError() {
        showInfoMsg(content.find('.error-message'), "Can't load data.");
    }

    sitesSelector.off();

    sitesSelector.on('change', function () {
        var selectedMicrositeSelector = sitesSelector.children("option:selected");
        selectedMicrositeId = parseInt(selectedMicrositeSelector.val()) || undefined;
        InsightsTab.loadTabData(1, null, null, selectedMicrositeId);
    });

    function sortColumns(currentPage) {
        return function () {
            var el = $(this),
                sortKey = el.data('value');

            if (!el.hasClass("ascending") && !el.hasClass("descending")) {
                el.addClass("ascending");
            } else {
                el.toggleClass("ascending descending");
            }

            var ordering = el.hasClass("descending") ? "DESC" : "ASC";

            sortableColumns.not(el).removeClass("ascending descending");

            InsightsTab.loadTabData(currentPage, sortKey, ordering, selectedMicrositeId);
        }
    }

    function onInsightsLoad(response) {
        var analyticsContent = InsightsTab.content.find('#insights-tbody'),
            pagination = InsightsTab.content.find('#insights-pagination');

        pagination[0].innerHTML = renderPagination(response.count_pages, response.current_page);

        if (response.microsites.length) {
            $('.sites-selector-wrapper').removeClass('hidden');
            sitesSelector[0].innerHTML = renderSitesSelector(response.microsites, response.ms_selected);
        }

        $(".page-link").on("click", function (e) {
            e.preventDefault();
            InsightsTab.loadTabData(this.dataset.value, null, null, response.ms_selected);
        });

        if (response.courses.length > 0) {
            analyticsContent[0].innerHTML = JSON.parse(response.courses).map(renderCourse).join('\n');
            var totalMetrics = JSON.parse(response.total_metrics);

            $("#total-enrollment").html(totalMetrics.total_enrolled);
            $("#current-enrollment").html(totalMetrics.total_current_enrolled);
            $("#week-change").html(totalMetrics.total_diff_enrolled);
            $("#passed-enrollment").html(totalMetrics.certificates);

            sortableColumns.off();

            sortableColumns.on("click", sortColumns(response.current_page));

        } else {
            analyticsContent[0].innerHTML = '<div>' + django.gettext("No available statistics.") + '</div>';
        }
        analyticsContent.find('.go-to-item').click(function (evt) {
            InsightsTab.tabHolder.openLocation(JSON.parse(evt.target.dataset.location));
        })
    }

    function renderCourse(course) {
        return `
                <tr>
                <th><a href="${course.course_url}">${course.name}</a></th>
                <td>${course.start_date}</td>
                <td>${course.end_date}</td>
                <td>${course.total}</td>
                <td>${course.enrolled_max}</td>
                <td>${course.week_change}</td>
                <td>${course.certificates}</td>
                <td>${course.count_graded}</td>
                </tr>
            `
    }

    function renderSitesSelector(sites, selected) {
        let selector = "<option value=''>All courses</option>";
        for (let i = 0; i < sites.length; i++) {
            selector += `<option value=${sites[i]['id']} ${sites[i]['id'] === selected ? 'selected' : ''}>${sites[i]['name']}</option>`
        }
        return selector;
    }

    function renderPagination(count, current) {
        var pagination = '';
        if (current === 1) {
            pagination += ('<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">Prev</a></li>\n')
        } else {
            pagination += ('<li class="page-item"><a class="page-link" data-value="' + (current - 1) + '" href="#">Prev</a></li>\n')
        }

        pagination += '<li class="page-item disabled"><a class="page-link" href="#" data-value="' + current + '">' + current + ' (' + count + ')' + '</a></li>'

        if (current === count) {
            pagination += '<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">Next</a></li>'
        } else {
            pagination += '<li class="page-item"><a class="page-link" href="#" data-value="' + (current + 1) + '">Next</a></li>'
        }

        return pagination
    }

    function showInfoMsg($msg_section, msg_text) {
        $msg_section.fadeIn().text(msg_text);
        clearTimeout(timerId);
        timerId = setTimeout(function () {
            $msg_section.fadeOut(500);
        }, 3000);
    }

    InsightsTab.loadTabData = function (page, sortKey, ordering, microsite) {
        $.ajax({
            type: 'POST',
            url: 'api/insights/' + '?page=' + (page || 1),  // TODO(arsentur) remove hardcode
            data: {
                'microsite': microsite,
                'sortKey': (sortKey || 'course'),
                'ordering': (ordering || 'ASC'),
            },
            dataType: 'json',
            traditional: true,
            success: onInsightsLoad,
            error: onInsightsLoadError,
            beforeSend: toggleLoader,
            complete: toggleLoader,
        });
    };

    InsightsTab.onClickTitle = function () {
        instructorAnalyticsTasks.task_poller.start();
        reportDownloads.load_report_downloads();
    };

    InsightsTab.onExit = function () {
        instructorAnalyticsTasks.task_poller.stop();
        return instructorAnalyticsTasks.report_downloads.downloads_poller.stop();
    };

    $(".generate-reports").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var self = this,
            action = e.target.closest('a[href="#"]').dataset.action,
            laddaLoader = Ladda.create($(e.target).closest("a")[0]);

        laddaLoader.start();

        $.ajax({
            type: "POST",
            data: {
                action_name: action,
                microsite_id: selectedMicrositeId,
                microsite_name: sitesSelector.children("option:selected").text()
            },
            url: "api/insights/generate_report/",
            dataType: "json",
            success: function (data) {
                instructorAnalyticsTasks.task_poller.start();
                instructorAnalyticsTasks.subscribe(function (taskId, params) {
                    var runningTasks = params.tasks.filter(function (i) {
                        return i.task_id === taskId;
                    });
                    if (!runningTasks.length) {
                        laddaLoader.stop();
                        instructorAnalyticsTasks.unsubscribe(taskId);
                        reportDownloads.load_report_downloads().then(function (data) {
                            var requestedReport = data.downloads.find(function (item) {
                                return item.name.indexOf(action) !== -1;
                            });
                            if (requestedReport) {
                                return document.location.href = requestedReport.url;
                            } else {
                                showInfoMsg(content.find('.error-message'), 'No available report was found.');
                            }
                        });
                    }
                }, self, data.task_id)
            },
            error: function (err) {
                if (err.status !== 400) {
                    laddaLoader.stop();
                    showInfoMsg(content.find('.error-message'), 'During csv report generation we got a problem. ' + err.statusText);
                }
            },
        });

    });

    return InsightsTab;
}
