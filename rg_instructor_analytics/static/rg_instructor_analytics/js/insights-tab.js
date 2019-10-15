function InsightsTab(button, content) {
    'use strict';
    var InsightsTab = new Tab(button, content);
    var $loader = $('#insights-loader');
    var sitesSelector = InsightsTab.content.find('#insight-site-selector');
    var sortableColumns = $("#insights-content").find(".sortable");

    function toggleLoader() {
        $loader.toggleClass('hidden');
    }

    function onInsightsLoadError() {
        alert("Can't load data!");
    }

    sitesSelector.off();

    sitesSelector.on('change', function () {
        InsightsTab.loadTabData(1, null, null, $(this).children("option:selected").val());
    });

    function sortColumns(currentPage) {
        return function () {
            var el = $(this),
                sortKey = el.data('value'),
                selectedMicrosite = sitesSelector.children("option:selected").val();

            if (!el.hasClass("ascending") && !el.hasClass("descending")) {
                el.addClass("ascending");
            } else {
                el.toggleClass("ascending descending");
            }

            var ordering = el.hasClass("descending") ? "DESC" : "ASC";

            sortableColumns.not(el).removeClass("ascending descending");

            InsightsTab.loadTabData(currentPage, sortKey, ordering, selectedMicrosite);
        }
    }

    function onInsightsLoad(response) {
        var analyticsContent = InsightsTab.content.find('#insights-tbody'),
            pagination = InsightsTab.content.find('#insights-pagination');

        pagination[0].innerHTML = renderPagination(response.count_pages, response.current_page);

        if (response.microsites_names.length) {
            $('.sites-selector-wrapper').removeClass('hidden');
            sitesSelector[0].innerHTML = renderSitesSelector(response.microsites_names, response.ms_selected);
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
        let selector = "<option>All courses</option>";
        for (let i = 0; i < sites.length; i++) {
            selector += `<option ${sites[i] === selected ? 'selected' : ''}>${sites[i]}</option>`
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

    return InsightsTab;
}
