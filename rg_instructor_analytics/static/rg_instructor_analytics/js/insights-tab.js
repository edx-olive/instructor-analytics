function InsightsTab(button, content) {
    'use strict';
    var InsightsTab = new Tab(button, content);
    var $loader = $('#insights-loader');

    function toggleLoader() {
        $loader.toggleClass('hidden');
    }

    function onInsightsLoadError() {
        alert("Can't load data!");
    }

    function onInsightsLoad(response) {
        var analyticsContent = InsightsTab.content.find('#insights-tbody'),
            pagination = InsightsTab.content.find('#insights-pagination');

        pagination[0].innerHTML = renderPagination(response.count_pages, response.current_page);

        $(".page-link").on("click", function (e) {
            e.preventDefault();
            InsightsTab.loadTabData(this.dataset.value);
        });

        if (response.courses.length > 0) {
            analyticsContent[0].innerHTML = JSON.parse(response.courses).map(renderCourse).join('\n');
            var totalMetrics = JSON.parse(response.total_metrics);

            $("#total-enrollment").html(totalMetrics.total_enrolled);
            $("#current-enrollment").html(totalMetrics.total_current_enrolled);
            $("#week-change").html(totalMetrics.total_diff_enrolled);
            $("#passed-enrollment").html(totalMetrics.certificates);

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

    InsightsTab.loadTabData = function (page) {
        $.ajax({
            type: 'POST',
            url: 'api/insights/?page=' + (page || 1),  // TODO(arsentur) remove hardcode
            data: {},
            dataType: 'json',
            traditional: true,
            success: onInsightsLoad,
            error: onInsightsLoadError,
            beforeSend: toggleLoader,
            complete: toggleLoader,
        });
    };

    return InsightsTab;
}
