'use strict';

function IntervalManager(ms, fn) {
    this.ms = ms;
    this.fn = fn;
    this.intervalID = null;

    this.start = function () {
        this.fn();
        if (this.intervalID === null) {
            this.intervalID = setInterval(this.fn, this.ms);
            return this.intervalID;
        }
        return this.intervalID;
    };

    this.stop = function () {
        clearInterval(this.intervalID);
        this.intervalID = null;
        return this.intervalID;
    };
}

function PendingInstructorAnalyticsTasks($section) {
    var TASK_LIST_POLL_INTERVAL = 4000,
        self = this;

    this.$section = $section;
    this.$running_tasks_section = this.$section.find('.running-tasks-section');
    this.$table_running_tasks = this.$section.find('.running-tasks-table');
    this.$no_tasks_message = this.$section.find('.no-pending-tasks-message');

    this.reload_running_tasks_list = function () {
        return $.ajax({
            type: 'POST',
            url: "api/general-metrics/list_instructor_tasks/",
            success: function (data) {
                self.publish(data);
                if (data.tasks.length) {
                    self.$table_running_tasks.empty().append(data.tasks.map(self.renderTaskItem).join('\n'));
                    self.$no_tasks_message.hide();
                    return self.$running_tasks_section.show();
                } else {
                    self.task_poller.stop();
                    self.$running_tasks_section.hide();
                    self.$no_tasks_message.empty();
                    self.$no_tasks_message.append($('<p>').text(gettext('No tasks currently running.')));
                    return self.$no_tasks_message.show();
                }
            }
        });
    };

    this.publish = function (params) {
        this.subscribed.forEach(function (item) {
            item.cb.call(item.context, item.taskId, params);
        });
    };

    this.subscribed = [];

    this.subscribe = function (cb, context, taskId) {
        this.subscribed.push({cb: cb, context: context, taskId: taskId});
    };

    this.unsubscribe = function (taskId) {
        this.subscribed = this.subscribed.filter(function (i) {
            return i.taskId !== taskId;
        });
    };

    this.task_poller = new IntervalManager(TASK_LIST_POLL_INTERVAL, function () {
        return self.reload_running_tasks_list();
    });

    this.renderTaskItem = function (taskItem) {
        return `<div class="running-tasks-table__item">
                <p>Report <span class="bold">${taskItem.task_type}</span> is being processing to be downloaded. Status: <span class="bold">${taskItem.task_state}</span></p>
                </div>
               `
    }
}

function ReportDownloads($section) {
    var POLL_INTERVAL = 20000,
        self = this;

    this.$section = $section;
    this.$report_downloads_table = this.$section.find('.report-downloads-table');
    this.downloads_poller = new IntervalManager(POLL_INTERVAL, function () {
        return self.load_report_downloads();
    });

    this.load_report_downloads = function () {
        var endpoint = "api/general-metrics/list_report_downloads/",
            linksList;
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: endpoint,
                success: function (data) {
                    if (self.$report_downloads_table.find("ul.download-reports").length) {
                        linksList = self.$report_downloads_table.find("ul.download-reports").empty();
                    } else {
                        linksList = self.$report_downloads_table.append("<ul class='download-reports'></ul>").find('ul');
                    }

                    linksList.append(data.downloads.map(self.renderReportItem).join('\n'));
                    resolve(data)
                },
                error: function (error) {
                    reject(error)
                },
            })
        });
    };

    this.renderReportItem = function (reportItem) {
        return `<li class="download-reports__item">
                <a href="${reportItem.url}">
                <i class="icon fa fa-file"></i>${reportItem.name}
                </a>
                </li>
                `
    }
}